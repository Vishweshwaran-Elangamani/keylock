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

namespace Relevantz.EEPZ.Core.Service
{
    public class FileStorageService : IFileStorageService
    {
        private readonly GridFSBucket _gridFSBucket;
        private readonly MongoDbSettings _mongoSettings;

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
                ReadPreference = ReadPreference.Primary,
            };

            _gridFSBucket = new GridFSBucket(database, bucketOptions);
        }

        public async Task<string> SaveFile(IFormFile file, string subFolder)
        {
            if (file == null || file.Length == 0)
                throw new BadRequestException(ResponseMessages.Codes.BadRequest, "File is empty");

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

                return objectId.ToString();
            }
        }

        public async Task<byte[]> GetFile(string fileId)
        {
            if (string.IsNullOrEmpty(fileId))
                throw new BadRequestException(
                    ResponseMessages.Codes.BadRequest,
                    "File ID cannot be empty"
                );

            if (!ObjectId.TryParse(fileId, out var objectId))
                throw new BadRequestException(
                    ResponseMessages.Codes.BadRequest,
                    "Invalid file ID format"
                );

            try
            {
                var bytes = await _gridFSBucket.DownloadAsBytesAsync(objectId);
                return bytes;
            }
            catch (GridFSFileNotFoundException)
            {
                throw new NotFoundException(
                    ResponseMessages.Codes.FILE_NOT_FOUND,
                    $"File with ID {fileId} not found"
                );
            }
        }

        public async Task<bool> DeleteFile(string fileId)
        {
            if (string.IsNullOrEmpty(fileId))
                throw new BadRequestException(
                    ResponseMessages.Codes.BadRequest,
                    "File ID cannot be empty"
                );

            if (!ObjectId.TryParse(fileId, out var objectId))
                throw new BadRequestException(
                    ResponseMessages.Codes.BadRequest,
                    "Invalid file ID format"
                );

            try
            {
                await _gridFSBucket.DeleteAsync(objectId);
                return true;
            }
            catch (GridFSFileNotFoundException)
            {
                throw new NotFoundException(
                    ResponseMessages.Codes.FILE_NOT_FOUND,
                    $"File with ID {fileId} not found"
                );
            }
        }

        public async Task<(
            byte[] fileBytes,
            string contentType,
            string fileName
        )> GetFileForPreview(string fileId)
        {
            if (string.IsNullOrEmpty(fileId))
                throw new BadRequestException(
                    ResponseMessages.Codes.BadRequest,
                    "File ID cannot be empty"
                );

            if (!ObjectId.TryParse(fileId, out var objectId))
                throw new BadRequestException(
                    ResponseMessages.Codes.BadRequest,
                    "Invalid file ID format"
                );

            try
            {
                var filter = Builders<GridFSFileInfo>.Filter.Eq(x => x.Id, objectId);
                var cursor = await _gridFSBucket.FindAsync(filter);
                var fileInfo = await cursor.FirstOrDefaultAsync();

                if (fileInfo == null)
                    throw new NotFoundException(
                        ResponseMessages.Codes.FILE_NOT_FOUND,
                        $"File with ID {fileId} not found"
                    );

                var bytes = await _gridFSBucket.DownloadAsBytesAsync(objectId);

                var contentType =
                    fileInfo.Metadata?.Contains("contentType") == true
                        ? fileInfo.Metadata["contentType"].AsString
                        : GetContentType(fileInfo.Filename);

                var fileName = fileInfo.Filename;

                return (bytes, contentType, fileName);
            }
            catch (GridFSFileNotFoundException)
            {
                throw new NotFoundException(
                    ResponseMessages.Codes.FILE_NOT_FOUND,
                    $"File with ID {fileId} not found"
                );
            }
        }

        public async Task<FileMetadata?> GetFileMetadata(string fileId)
        {
            if (string.IsNullOrEmpty(fileId))
                throw new BadRequestException(
                    ResponseMessages.Codes.BadRequest,
                    "File ID cannot be empty"
                );

            if (!ObjectId.TryParse(fileId, out var objectId))
                throw new BadRequestException(
                    ResponseMessages.Codes.BadRequest,
                    "Invalid file ID format"
                );

            var filter = Builders<GridFSFileInfo>.Filter.Eq(x => x.Id, objectId);
            var cursor = await _gridFSBucket.FindAsync(filter);
            var fileInfo = await cursor.FirstOrDefaultAsync();

            if (fileInfo == null)
                throw new NotFoundException(
                    ResponseMessages.Codes.FILE_NOT_FOUND,
                    $"File with ID {fileId} not found"
                );

            return new FileMetadata
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
        }

        private string GetContentType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();

            return extension switch
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
        }
    }
}
