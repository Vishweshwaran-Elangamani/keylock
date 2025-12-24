using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using Relevantz.EEPZ.Common.Models;
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

            var connectionString = configuration.GetConnectionString("MongoDb") 
                ?? "mongodb://localhost:27017";
            var databaseName = configuration["MongoDB:DatabaseName"] ?? "EEPZFileStorage";
            var collectionName = configuration["MongoDB:CollectionName"] ?? "PolicyUploads";

            var client = new MongoClient(connectionString);
            var database = client.GetDatabase(databaseName);
            _filesCollection = database.GetCollection<PolicyFileDocument>(collectionName);

            _logger.LogInformation($"MongoDB connected: {databaseName}.{collectionName}");
        }

        public async Task<string> UploadFileAsync(byte[] fileData, string fileName, string contentType, long fileSize, int userId)
        {
            try
            {
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

                _logger.LogInformation($"File uploaded to MongoDB: {fileName} (ID: {document.Id})");
                return document.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error uploading file to MongoDB: {ex.Message}");
                throw;
            }
        }

        public async Task<PolicyFileDocument> GetFileAsync(string fileId)
        {
            try
            {
                var filter = Builders<PolicyFileDocument>.Filter.Eq(doc => doc.Id, fileId);
                var document = await _filesCollection.Find(filter).FirstOrDefaultAsync();

                if (document == null)
                {
                    _logger.LogWarning($"File not found in MongoDB: {fileId}");
                }

                return document;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving file from MongoDB: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> DeleteFileAsync(string fileId)
        {
            try
            {
                var filter = Builders<PolicyFileDocument>.Filter.Eq(doc => doc.Id, fileId);
                var result = await _filesCollection.DeleteOneAsync(filter);

                if (result.DeletedCount > 0)
                {
                    _logger.LogInformation($"File deleted from MongoDB: {fileId}");
                    return true;
                }

                _logger.LogWarning($"File not found for deletion: {fileId}");
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting file from MongoDB: {ex.Message}");
                throw;
            }
        }
    }
}
