using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.GridFS;
using Relevantz.EEPZ.Common.Configuration;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Core.Services.Interface;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    /// <summary>
    /// Service implementation for handling file storage operations using MongoDB GridFS.
    /// Provides methods to save, retrieve, delete, preview, and fetch metadata of files.
    /// </summary>
    public class FileStorageService : IFileStorageService
    {
        private readonly GridFSBucket _gridFSBucket;
        private readonly MongoDbSettings _mongoSettings;

        /// <summary>
        /// Initializes a new instance of the <see cref="FileStorageService"/> class with MongoDB settings.
        /// </summary>
        public FileStorageService(IOptions<MongoDbSettings> mongoSettings)
        {
            _mongoSettings = mongoSettings.Value;

            var client = new MongoClient(_mongoSettings.ConnectionString);
            var database = client.GetDatabase(_mongoSettings.DatabaseName);

            var bucketOptions = new GridFSBucketOptions
            {
                BucketName = _mongoSettings.GridFSBucketName,
                ChunkSizeBytes = 1048576,
                WriteConcern = WriteConcern.WMajority,
                ReadPreference = ReadPreference.Primary
            };

            _gridFSBucket = new GridFSBucket(database, bucketOptions);
        }

        /// <summary>
        /// Saves a file to GridFS with metadata and returns its unique identifier.
        /// </summary>
        public async Task<string> SaveFileAsync(IFormFile file, string subFolder)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty");

            var fileName = file.FileName;
            var contentType = file.ContentType;

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

            using (var stream = file.OpenReadStream())
            {
                var objectId = await _gridFSBucket.UploadFromStreamAsync(
                    fileName,
                    stream,
                    options
                );

                return objectId.ToString();
            }
        }

        /// <summary>
        /// Retrieves a file from GridFS as a byte array using its identifier.
        /// </summary>
        public async Task<byte[]> GetFileAsync(string fileId)
        {
            if (string.IsNullOrEmpty(fileId))
                throw new ArgumentException("File ID cannot be empty");

            if (!ObjectId.TryParse(fileId, out var objectId))
                throw new ArgumentException("Invalid file ID format");

            try
            {
                var bytes = await _gridFSBucket.DownloadAsBytesAsync(objectId);
                return bytes;
            }
            catch (GridFSFileNotFoundException)
            {
                throw new FileNotFoundException($"File with ID {fileId} not found in GridFS");
            }
        }

        /// <summary>
        /// Deletes a file from GridFS using its identifier.
        /// </summary>
        public async Task<bool> DeleteFileAsync(string fileId)
        {
            if (string.IsNullOrEmpty(fileId))
                return false;

            if (!ObjectId.TryParse(fileId, out var objectId))
                return false;

            try
            {
                await _gridFSBucket.DeleteAsync(objectId);
                return true;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Retrieves a file for preview including its bytes, content type, and file name.
        /// </summary>
        public async Task<(byte[] fileBytes, string contentType, string fileName)> GetFileForPreviewAsync(string fileId)
        {
            if (string.IsNullOrEmpty(fileId))
                throw new ArgumentException("File ID cannot be empty");

            if (!ObjectId.TryParse(fileId, out var objectId))
                throw new ArgumentException("Invalid file ID format");

            try
            {
                var filter = Builders<GridFSFileInfo>.Filter.Eq(x => x.Id, objectId);
                var cursor = await _gridFSBucket.FindAsync(filter);
                var fileInfo = await cursor.FirstOrDefaultAsync();

                if (fileInfo == null)
                    throw new FileNotFoundException($"File with ID {fileId} not found");

                var bytes = await _gridFSBucket.DownloadAsBytesAsync(objectId);

                var contentType = fileInfo.Metadata?.Contains("contentType") == true
                    ? fileInfo.Metadata["contentType"].AsString
                    : GetContentType(fileInfo.Filename);

                var fileName = fileInfo.Filename;

                return (bytes, contentType, fileName);
            }
            catch (GridFSFileNotFoundException)
            {
                throw new FileNotFoundException($"File with ID {fileId} not found in GridFS");
            }
        }

        /// <summary>
        /// Retrieves metadata of a file stored in GridFS.
        /// </summary>
        public async Task<FileMetadata?> GetFileMetadataAsync(string fileId)
        {
            if (string.IsNullOrEmpty(fileId))
                return null;

            if (!ObjectId.TryParse(fileId, out var objectId))
                return null;

            try
            {
                var filter = Builders<GridFSFileInfo>.Filter.Eq(x => x.Id, objectId);
                var cursor = await _gridFSBucket.FindAsync(filter);
                var fileInfo = await cursor.FirstOrDefaultAsync();

                if (fileInfo == null)
                    return null;

                return new FileMetadata
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
                        : ""
                };
            }
            catch
            {
                return null;
            }
        }

        /// <summary>
        /// Determines the MIME content type based on the file extension.
        /// </summary>
        public string GetContentType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();

            return extension switch
            {
                ".pdf" => "application/pdf",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xls" => "application/vnd.ms-excel",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".gif" => "image/gif",
                ".txt" => "text/plain",
                ".zip" => "application/zip",
                _ => "application/octet-stream",
            };
        }
    }
}
