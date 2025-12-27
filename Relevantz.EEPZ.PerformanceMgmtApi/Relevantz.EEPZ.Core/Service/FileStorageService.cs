using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.GridFS;
using Relevantz.EEPZ.Common.Configuration;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.IService;

namespace Relevantz.EEPZ.Core.Service
{
    /// <summary>
    /// Implementation of file storage service using MongoDB GridFS
    /// </summary>
    public class FileStorageService : IFileStorageService
    {
        private readonly GridFSBucket _gridFSBucket;
        private readonly MongoDbSettings _mongoSettings;
        private readonly ILogger<FileStorageService> _logger;

        public FileStorageService(
            IOptions<MongoDbSettings> mongoSettings,
            ILogger<FileStorageService> logger)
        {
            _mongoSettings = mongoSettings.Value;
            _logger = logger;

            // Validate configuration
            if (string.IsNullOrEmpty(_mongoSettings.ConnectionString))
                throw new ArgumentException("MongoDB ConnectionString is not configured");

            if (string.IsNullOrEmpty(_mongoSettings.DatabaseName))
                throw new ArgumentException("MongoDB DatabaseName is not configured");

            try
            {
                // Initialize MongoDB client
                var client = new MongoClient(_mongoSettings.ConnectionString);
                var database = client.GetDatabase(_mongoSettings.DatabaseName);

                // Configure GridFS bucket options
                var bucketOptions = new GridFSBucketOptions
                {
                    BucketName = _mongoSettings.GridFSBucketName,
                    ChunkSizeBytes = _mongoSettings.ChunkSizeBytes,
                    WriteConcern = WriteConcern.WMajority,
                    ReadPreference = ReadPreference.Primary
                };

                _gridFSBucket = new GridFSBucket(database, bucketOptions);

                _logger.LogInformation(
                    "FileStorageService initialized with MongoDB: {Database}, Bucket: {Bucket}",
                    _mongoSettings.DatabaseName,
                    _mongoSettings.GridFSBucketName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize MongoDB GridFS connection");
                throw;
            }
        }

        public async Task<string> SaveFileAsync(IFormFile file, string subFolder)
        {
            if (file == null || file.Length == 0)
            {
                _logger.LogWarning("Attempted to save null or empty file");
                throw new ArgumentException("File is empty or null");
            }

            // Validate file size
            if (file.Length > _mongoSettings.MaxFileSizeBytes)
            {
                var maxSizeMB = _mongoSettings.MaxFileSizeBytes / (1024 * 1024);
                _logger.LogWarning(
                    "File {FileName} exceeds maximum size limit of {MaxSize}MB",
                    file.FileName,
                    maxSizeMB);
                throw new ArgumentException($"File size exceeds maximum limit of {maxSizeMB}MB");
            }

            var fileName = file.FileName;
            var contentType = file.ContentType;

            // Create metadata document
            var metadata = new BsonDocument
            {
                { "subfolder", subFolder },
                { "contentType", contentType },
                { "originalFileName", fileName },
                { "uploadDate", DateTime.UtcNow },
                { "fileSize", file.Length }
            };

            var options = new GridFSUploadOptions
            {
                Metadata = metadata
            };

            try
            {
                using (var stream = file.OpenReadStream())
                {
                    var objectId = await _gridFSBucket.UploadFromStreamAsync(
                        fileName,
                        stream,
                        options
                    );

                    var fileId = objectId.ToString();

                    _logger.LogInformation(
                        "File uploaded successfully: {FileName} ({FileSize} bytes) -> GridFS ID: {FileId}, SubFolder: {SubFolder}",
                        fileName,
                        file.Length,
                        fileId,
                        subFolder);

                    return fileId;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file {FileName} to GridFS", fileName);
                throw new Exception($"Failed to upload file: {ex.Message}", ex);
            }
        }

        public async Task<byte[]> GetFileAsync(string fileId)
        {
            if (string.IsNullOrEmpty(fileId))
            {
                _logger.LogWarning("Attempted to get file with empty ID");
                throw new ArgumentException("File ID cannot be empty");
            }

            if (!ObjectId.TryParse(fileId, out var objectId))
            {
                _logger.LogWarning("Invalid file ID format: {FileId}", fileId);
                throw new ArgumentException($"Invalid file ID format: {fileId}");
            }

            try
            {
                var bytes = await _gridFSBucket.DownloadAsBytesAsync(objectId);

                _logger.LogInformation("File downloaded: {FileId} ({Size} bytes)", fileId, bytes.Length);
                return bytes;
            }
            catch (GridFSFileNotFoundException)
            {
                _logger.LogWarning("File not found in GridFS: {FileId}", fileId);
                throw new FileNotFoundException($"File with ID {fileId} not found in GridFS");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading file {FileId} from GridFS", fileId);
                throw new Exception($"Failed to download file: {ex.Message}", ex);
            }
        }

        public async Task<bool> DeleteFileAsync(string fileId)
        {
            if (string.IsNullOrEmpty(fileId))
            {
                _logger.LogWarning("Attempted to delete file with empty ID");
                return false;
            }

            if (!ObjectId.TryParse(fileId, out var objectId))
            {
                _logger.LogWarning("Invalid file ID format for deletion: {FileId}", fileId);
                return false;
            }

            try
            {
                await _gridFSBucket.DeleteAsync(objectId);
                _logger.LogInformation("File deleted successfully: {FileId}", fileId);
                return true;
            }
            catch (GridFSFileNotFoundException)
            {
                _logger.LogWarning("File not found for deletion: {FileId}", fileId);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file {FileId} from GridFS", fileId);
                throw new Exception($"Failed to delete file: {ex.Message}", ex);
            }
        }

        public async Task<(byte[] fileBytes, string contentType, string fileName)> GetFileForPreviewAsync(string fileId)
        {
            if (string.IsNullOrEmpty(fileId))
            {
                _logger.LogWarning("Attempted to preview file with empty ID");
                throw new ArgumentException("File ID cannot be empty");
            }

            if (!ObjectId.TryParse(fileId, out var objectId))
            {
                _logger.LogWarning("Invalid file ID format: {FileId}", fileId);
                throw new ArgumentException($"Invalid file ID format: {fileId}");
            }

            try
            {
                //  FIX: Use field name "_id" directly instead of x => x.Id
                var filter = Builders<GridFSFileInfo>.Filter.Eq("_id", objectId);
                var cursor = await _gridFSBucket.FindAsync(filter);
                var fileInfo = await cursor.FirstOrDefaultAsync();

                if (fileInfo == null)
                {
                    _logger.LogWarning("File not found for preview: {FileId}", fileId);
                    throw new FileNotFoundException($"File with ID {fileId} not found");
                }

                // Download file bytes
                var bytes = await _gridFSBucket.DownloadAsBytesAsync(objectId);

                // Extract content type from metadata
                var contentType = fileInfo.Metadata?.Contains("contentType") == true
                    ? fileInfo.Metadata["contentType"].AsString
                    : GetContentTypeFromFileName(fileInfo.Filename);

                var fileName = fileInfo.Filename;

                _logger.LogInformation(
                    "File retrieved for preview: {FileId}, {FileName} ({Size} bytes)",
                    fileId,
                    fileName,
                    bytes.Length);

                return (bytes, contentType, fileName);
            }
            catch (GridFSFileNotFoundException)
            {
                _logger.LogWarning("File not found in GridFS: {FileId}", fileId);
                throw new FileNotFoundException($"File with ID {fileId} not found in GridFS");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving file {FileId} for preview", fileId);
                throw new Exception($"Failed to retrieve file: {ex.Message}", ex);
            }
        }

        public async Task<FileMetadata?> GetFileMetadataAsync(string fileId)
        {
            if (string.IsNullOrEmpty(fileId))
            {
                _logger.LogWarning("Attempted to get metadata with empty file ID");
                return null;
            }

            if (!ObjectId.TryParse(fileId, out var objectId))
            {
                _logger.LogWarning("Invalid file ID format: {FileId}", fileId);
                return null;
            }

            try
            {
                //  FIX: Use field name "_id" directly instead of x => x.Id
                var filter = Builders<GridFSFileInfo>.Filter.Eq("_id", objectId);
                var cursor = await _gridFSBucket.FindAsync(filter);
                var fileInfo = await cursor.FirstOrDefaultAsync();

                if (fileInfo == null)
                {
                    _logger.LogWarning("File metadata not found: {FileId}", fileId);
                    return null;
                }

                var metadata = new FileMetadata
                {
                    FileId = fileInfo.Id.ToString(),
                    FileName = fileInfo.Filename,
                    FileSize = fileInfo.Length,
                    ContentType = fileInfo.Metadata?.Contains("contentType") == true
                        ? fileInfo.Metadata["contentType"].AsString
                        : "application/octet-stream",
                    UploadDate = fileInfo.UploadDateTime,
                    SubFolder = fileInfo.Metadata?.Contains("subfolder") == true
                        ? fileInfo.Metadata["subfolder"].AsString
                        : "",
                    MD5Hash = fileInfo.MD5,
                    ChunkSize = fileInfo.ChunkSizeBytes,
                    ChunkCount = (int)Math.Ceiling((double)fileInfo.Length / fileInfo.ChunkSizeBytes)
                };

                _logger.LogDebug("File metadata retrieved: {FileId}", fileId);
                return metadata;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving file metadata: {FileId}", fileId);
                return null;
            }
        }

        public async Task<bool> FileExistsAsync(string fileId)
        {
            if (string.IsNullOrEmpty(fileId))
                return false;

            if (!ObjectId.TryParse(fileId, out var objectId))
                return false;

            try
            {
                //  FIX: Use field name "_id" directly instead of x => x.Id
                var filter = Builders<GridFSFileInfo>.Filter.Eq("_id", objectId);
                var cursor = await _gridFSBucket.FindAsync(filter);
                var fileInfo = await cursor.FirstOrDefaultAsync();

                return fileInfo != null;
            }
            catch
            {
                return false;
            }
        }

        public async Task<Dictionary<string, FileMetadata>> GetMultipleFileMetadataAsync(List<string> fileIds)
        {
            var result = new Dictionary<string, FileMetadata>();

            if (fileIds == null || !fileIds.Any())
                return result;

            var validObjectIds = fileIds
                .Where(id => ObjectId.TryParse(id, out _))
                .Select(id => ObjectId.Parse(id))
                .ToList();

            if (!validObjectIds.Any())
                return result;

            try
            {
                //  FIX: Use field name "_id" directly instead of x => x.Id
                var filter = Builders<GridFSFileInfo>.Filter.In("_id", validObjectIds);
                var cursor = await _gridFSBucket.FindAsync(filter);
                var fileInfos = await cursor.ToListAsync();

                foreach (var fileInfo in fileInfos)
                {
                    var metadata = new FileMetadata
                    {
                        FileId = fileInfo.Id.ToString(),
                        FileName = fileInfo.Filename,
                        FileSize = fileInfo.Length,
                        ContentType = fileInfo.Metadata?.Contains("contentType") == true
                            ? fileInfo.Metadata["contentType"].AsString
                            : "application/octet-stream",
                        UploadDate = fileInfo.UploadDateTime,
                        SubFolder = fileInfo.Metadata?.Contains("subfolder") == true
                            ? fileInfo.Metadata["subfolder"].AsString
                            : "",
                        MD5Hash = fileInfo.MD5,
                        ChunkSize = fileInfo.ChunkSizeBytes,
                        ChunkCount = (int)Math.Ceiling((double)fileInfo.Length / fileInfo.ChunkSizeBytes)
                    };

                    result[fileInfo.Id.ToString()] = metadata;
                }

                _logger.LogInformation("Retrieved metadata for {Count} files", result.Count);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving multiple file metadata");
                return result;
            }
        }

        /// <summary>
        /// Get MIME content type from file extension
        /// </summary>
        private string GetContentTypeFromFileName(string fileName)
        {
            if (string.IsNullOrEmpty(fileName))
                return "application/octet-stream";

            var extension = Path.GetExtension(fileName).ToLowerInvariant();

            return extension switch
            {
                ".pdf" => "application/pdf",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xls" => "application/vnd.ms-excel",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".ppt" => "application/vnd.ms-powerpoint",
                ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".gif" => "image/gif",
                ".bmp" => "image/bmp",
                ".svg" => "image/svg+xml",
                ".txt" => "text/plain",
                ".csv" => "text/csv",
                ".json" => "application/json",
                ".xml" => "application/xml",
                ".zip" => "application/zip",
                ".rar" => "application/x-rar-compressed",
                ".7z" => "application/x-7z-compressed",
                ".mp4" => "video/mp4",
                ".mp3" => "audio/mpeg",
                ".wav" => "audio/wav",
                _ => "application/octet-stream",
            };
        }
    }
}
