using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Core.IService;

namespace Relevantz.EEPZ.Core.Service
{
    public class MongoDbService : IMongoDbService
    {
        private readonly IMongoCollection<PolicyFileDocument> _filesCollection;
        private readonly ILogger<MongoDbService> _logger;

        public MongoDbService(IConfiguration configuration, ILogger<MongoDbService> logger)
        {
            _logger = logger;

            var connectionString = configuration.GetConnectionString("MongoDb") ?? "mongodb://localhost:27017";
            var databaseName = configuration["MongoDB:DatabaseName"] ?? "EEPZFileStorage";
            var collectionName = configuration["MongoDB:CollectionName"] ?? "PolicyUploads";

            var client = new MongoClient(connectionString);
            var database = client.GetDatabase(databaseName);
            _filesCollection = database.GetCollection<PolicyFileDocument>(collectionName);

            EEPZBusinessLog.LogServiceInformation("MongoDB connected: {Database}.{Collection}", databaseName, collectionName);
        }

        public async Task<string> UploadFileAsync(byte[] fileData, string fileName, string contentType, long fileSize, int userId)
        {
            try
            {
                EEPZBusinessLog.LogServiceInformation("Uploading file to MongoDB: {FileName}, Size: {FileSize} bytes, User: {UserId}",
                    fileName, fileSize, userId);

                var document = new PolicyFileDocument
                {
                    FileName = fileName,
                    OriginalFileName = fileName,
                    ContentType = contentType,
                    FileSize = fileSize,
                    FileData = fileData,
                    UploadedAt = DateTime.UtcNow,
                    UploadedByUserId = userId
                };

                await _filesCollection.InsertOneAsync(document);

                EEPZBusinessLog.LogServiceInformation("File uploaded to MongoDB successfully: {FileName} (ID: {FileId})",
                    fileName, document.Id);

                return document.Id;
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error uploading file {FileName} to MongoDB", ex, fileName);
                throw;
            }
        }

        public async Task<PolicyFileDocument> GetFileAsync(string fileId)
        {
            try
            {
                EEPZBusinessLog.LogServiceInformation("Retrieving file from MongoDB: {FileId}", fileId);

                var filter = Builders<PolicyFileDocument>.Filter.Eq(doc => doc.Id, fileId);
                var document = await _filesCollection.Find(filter).FirstOrDefaultAsync();

                if (document == null)
                {
                    EEPZBusinessLog.LogServiceWarning("File not found in MongoDB: {FileId}", fileId);
                }
                else
                {
                    EEPZBusinessLog.LogServiceInformation("File retrieved from MongoDB: {FileId}, Name: {FileName}",
                        fileId, document.OriginalFileName);
                }

                return document;
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error retrieving file {FileId} from MongoDB", ex, fileId);
                throw;
            }
        }

        public async Task<bool> DeleteFileAsync(string fileId)
        {
            try
            {
                EEPZBusinessLog.LogServiceInformation("Deleting file from MongoDB: {FileId}", fileId);

                var filter = Builders<PolicyFileDocument>.Filter.Eq(doc => doc.Id, fileId);
                var result = await _filesCollection.DeleteOneAsync(filter);

                if (result.DeletedCount > 0)
                {
                    EEPZBusinessLog.LogServiceInformation("File deleted from MongoDB: {FileId}", fileId);
                    return true;
                }

                EEPZBusinessLog.LogServiceWarning("File not found for deletion: {FileId}", fileId);
                return false;
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error deleting file {FileId} from MongoDB", ex, fileId);
                throw;
            }
        }
    }
}
