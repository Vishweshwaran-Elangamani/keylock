using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.GridFS;
using Relevantz.EEPZ.Common.Configuration;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Exceptions;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Core.IService;
using Serilog;

namespace Relevantz.EEPZ.Core.Service
{
    public class FileStorageService : IFileStorageService
    {
        private readonly GridFSBucket _gridFSBucket;
        private readonly MongoDbSettings _mongoSettings;

        public FileStorageService(IOptions<MongoDbSettings> mongoSettings)
        {
            _mongoSettings = mongoSettings.Value;

            Log.Debug(
                "FileStorageService initializing | Database={Database} | Bucket={Bucket} | ConnLength={ConnLen}",
                _mongoSettings.DatabaseName,
                _mongoSettings.GridFSBucketName,
                _mongoSettings.ConnectionString?.Length ?? 0
            );

            var client = new MongoClient(_mongoSettings.ConnectionString);
            var database = client.GetDatabase(_mongoSettings.DatabaseName);

            var bucketOptions = new GridFSBucketOptions
            {
                BucketName = _mongoSettings.GridFSBucketName,
                ChunkSizeBytes = 1048576,
                WriteConcern = WriteConcern.WMajority,
                ReadPreference = ReadPreference.Primary,
            };

            _gridFSBucket = new GridFSBucket(database, bucketOptions);

            Log.Information(
                "FileStorageService initialized | Database={Database} | Bucket={Bucket}",
                _mongoSettings.DatabaseName,
                _mongoSettings.GridFSBucketName
            );
        }

        public async Task<string> SaveFile(IFormFile file, string subFolder)
        {
            Log.Information(
                "SaveFile START | SubFolder={SubFolder} | FileName={FileName} | ContentType={ContentType} | Size={Size}",
                subFolder,
                file?.FileName,
                file?.ContentType,
                file?.Length
            );

            if (file == null || file.Length == 0)
            {
                Log.Warning("SaveFile FAILED | Reason=Empty file");
                throw new BadRequestException(ResponseMessages.Codes.BadRequest, "File is empty");
            }

            var fileName = file.FileName;
            var contentType = file.ContentType;

            var metadata = new BsonDocument
            {
                { "subfolder", subFolder },
                { "contentType", contentType },
                { "originalFileName", fileName },
                { "uploadDate", DateTime.UtcNow },
                { "fileSize", file.Length },
            };

            var options = new GridFSUploadOptions { Metadata = metadata };

            using (var stream = file.OpenReadStream())
            {
                var objectId = await _gridFSBucket.UploadFromStreamAsync(fileName, stream, options);

                Log.Information(
                    "SaveFile END | StoredObjectId={ObjectId} | FileName={FileName} | SubFolder={SubFolder}",
                    objectId,
                    fileName,
                    subFolder
                );

                return objectId.ToString();
            }
        }

        public async Task<byte[]> GetFile(string fileId)
        {
            Log.Information("GetFile START | FileId={FileId}", fileId);

            if (string.IsNullOrEmpty(fileId))
            {
                Log.Warning("GetFile FAILED | Reason=Empty fileId");
                throw new BadRequestException(
                    ResponseMessages.Codes.BadRequest,
                    "File ID cannot be empty"
                );
            }

            if (!ObjectId.TryParse(fileId, out var objectId))
            {
                Log.Warning("GetFile FAILED | Reason=Invalid ObjectId format | FileId={FileId}", fileId);
                throw new BadRequestException(
                    ResponseMessages.Codes.BadRequest,
                    "Invalid file ID format"
                );
            }

            try
            {
                var bytes = await _gridFSBucket.DownloadAsBytesAsync(objectId);

                Log.Information(
                    "GetFile END | FileId={FileId} | Size={Size}",
                    fileId,
                    bytes?.Length
                );

                return bytes;
            }
            catch (GridFSFileNotFoundException)
            {
                Log.Warning("GetFile NOT FOUND | FileId={FileId}", fileId);
                throw new NotFoundException(
                    ResponseMessages.Codes.FILE_NOT_FOUND,
                    $"File with ID {fileId} not found"
                );
            }
        }

        public async Task<bool> DeleteFile(string fileId)
        {
            Log.Information("DeleteFile START | FileId={FileId}", fileId);

            if (string.IsNullOrEmpty(fileId))
            {
                Log.Warning("DeleteFile FAILED | Reason=Empty fileId");
                throw new BadRequestException(
                    ResponseMessages.Codes.BadRequest,
                    "File ID cannot be empty"
                );
            }

            if (!ObjectId.TryParse(fileId, out var objectId))
            {
                Log.Warning("DeleteFile FAILED | Reason=Invalid ObjectId format | FileId={FileId}", fileId);
                throw new BadRequestException(
                    ResponseMessages.Codes.BadRequest,
                    "Invalid file ID format"
                );
            }

            try
            {
                await _gridFSBucket.DeleteAsync(objectId);

                Log.Information("DeleteFile END | FileId={FileId} | Deleted=true", fileId);

                return true;
            }
            catch (GridFSFileNotFoundException)
            {
                Log.Warning("DeleteFile NOT FOUND | FileId={FileId}", fileId);
                throw new NotFoundException(
                    ResponseMessages.Codes.FILE_NOT_FOUND,
                    $"File with ID {fileId} not found"
                );
            }
        }

        public async Task<(byte[] fileBytes, string contentType, string fileName)> GetFileForPreview(string fileId)
        {
            Log.Information("GetFileForPreview START | FileId={FileId}", fileId);

            if (string.IsNullOrEmpty(fileId))
            {
                Log.Warning("GetFileForPreview FAILED | Reason=Empty fileId");
                throw new BadRequestException(
                    ResponseMessages.Codes.BadRequest,
                    "File ID cannot be empty"
                );
            }

            if (!ObjectId.TryParse(fileId, out var objectId))
            {
                Log.Warning("GetFileForPreview FAILED | Reason=Invalid ObjectId format | FileId={FileId}", fileId);
                throw new BadRequestException(
                    ResponseMessages.Codes.BadRequest,
                    "Invalid file ID format"
                );
            }

            try
            {
                var filter = Builders<GridFSFileInfo>.Filter.Eq(x => x.Id, objectId);
                var cursor = await _gridFSBucket.FindAsync(filter);
                var fileInfo = await cursor.FirstOrDefaultAsync();

                if (fileInfo == null)
                {
                    Log.Warning("GetFileForPreview NOT FOUND | FileId={FileId}", fileId);
                    throw new NotFoundException(
                        ResponseMessages.Codes.FILE_NOT_FOUND,
                        $"File with ID {fileId} not found"
                    );
                }

                var bytes = await _gridFSBucket.DownloadAsBytesAsync(objectId);

                var contentType =
                    fileInfo.Metadata?.Contains("contentType") == true
                        ? fileInfo.Metadata["contentType"].AsString
                        : GetContentType(fileInfo.Filename);

                var fileName = fileInfo.Filename;

                Log.Information(
                    "GetFileForPreview END | FileId={FileId} | FileName={FileName} | ContentType={ContentType} | Size={Size}",
                    fileId,
                    fileName,
                    contentType,
                    bytes?.Length
                );

                return (bytes, contentType, fileName);
            }
            catch (GridFSFileNotFoundException)
            {
                Log.Warning("GetFileForPreview NOT FOUND (catch) | FileId={FileId}", fileId);
                throw new NotFoundException(
                    ResponseMessages.Codes.FILE_NOT_FOUND,
                    $"File with ID {fileId} not found"
                );
            }
        }

        public async Task<FileMetadata?> GetFileMetadata(string fileId)
        {
            Log.Information("GetFileMetadata START | FileId={FileId}", fileId);

            if (string.IsNullOrEmpty(fileId))
            {
                Log.Warning("GetFileMetadata FAILED | Reason=Empty fileId");
                throw new BadRequestException(
                    ResponseMessages.Codes.BadRequest,
                    "File ID cannot be empty"
                );
            }

            if (!ObjectId.TryParse(fileId, out var objectId))
            {
                Log.Warning("GetFileMetadata FAILED | Reason=Invalid ObjectId format | FileId={FileId}", fileId);
                throw new BadRequestException(
                    ResponseMessages.Codes.BadRequest,
                    "Invalid file ID format"
                );
            }

            var filter = Builders<GridFSFileInfo>.Filter.Eq(x => x.Id, objectId);
            var cursor = await _gridFSBucket.FindAsync(filter);
            var fileInfo = await cursor.FirstOrDefaultAsync();

            if (fileInfo == null)
            {
                Log.Warning("GetFileMetadata NOT FOUND | FileId={FileId}", fileId);
                throw new NotFoundException(
                    ResponseMessages.Codes.FILE_NOT_FOUND,
                    $"File with ID {fileId} not found"
                );
            }

            var meta = new FileMetadata
            {
                FileId = fileInfo.Id.ToString(),
                FileName = fileInfo.Filename,
                FileSize = fileInfo.Length,
                ContentType =
                    fileInfo.Metadata?.Contains("contentType") == true
                        ? fileInfo.Metadata["contentType"].AsString
                        : "application/octet-stream",
                UploadDate = fileInfo.UploadDateTime,
                SubFolder =
                    fileInfo.Metadata?.Contains("subfolder") == true
                        ? fileInfo.Metadata["subfolder"].AsString
                        : "",
            };

            Log.Information(
                "GetFileMetadata END | FileId={FileId} | FileName={FileName} | Size={Size} | ContentType={ContentType}",
                meta.FileId,
                meta.FileName,
                meta.FileSize,
                meta.ContentType
            );

            return meta;
        }

        private string GetContentType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            var contentType = extension switch
            {
                ".pdf" => "application/pdf",
                ".doc" => "application/msword",
                ".docx" =>
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xls" => "application/vnd.ms-excel",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".gif" => "image/gif",
                ".txt" => "text/plain",
                ".zip" => "application/zip",
                _ => "application/octet-stream",
            };

            Log.Debug(
                "GetContentType | FileName={FileName} | Extension={Extension} | ResolvedContentType={ContentType}",
                fileName,
                extension,
                contentType
            );

            return contentType;
        }
    }
}