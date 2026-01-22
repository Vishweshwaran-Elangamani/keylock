using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Data.IRepository;

namespace Relevantz.EEPZ.Data.Repository
{
    public class ProfileImageRepository : IProfileImageRepository
    {
        private readonly IMongoCollection<ProfileImageDocument> _profileImagesCollection;

        public ProfileImageRepository(IOptions<MongoDbSettings> mongoDbSettings)
        {
            var mongoClient = new MongoClient(mongoDbSettings.Value.ConnectionString);
            var mongoDatabase = mongoClient.GetDatabase(mongoDbSettings.Value.DatabaseName);

            _profileImagesCollection = mongoDatabase.GetCollection<ProfileImageDocument>(
                mongoDbSettings.Value.ProfileImagesCollectionName);

            // Create unique index on EmployeeId for faster lookups and prevent duplicates
            CreateIndexes();

            EEPZBusinessLog.Information("MongoDB ProfileImageRepository initialized successfully");
        }

        private void CreateIndexes()
        {
            var indexKeysDefinition = Builders<ProfileImageDocument>
                .IndexKeys
                .Ascending(x => x.EmployeeId);

            var indexOptions = new CreateIndexOptions { Unique = true };
            var indexModel = new CreateIndexModel<ProfileImageDocument>(indexKeysDefinition, indexOptions);

            // If index already exists, MongoDB will ignore it
            _profileImagesCollection.Indexes.CreateOne(indexModel);
        }

        public async Task<string> UploadImageAsync(
            int employeeId,
            byte[] imageData,
            string fileName,
            string contentType)
        {
            var existingImage = await GetImageAsync(employeeId);

            if (existingImage != null)
            {
                await UpdateImageAsync(employeeId, imageData, fileName, contentType);

                EEPZBusinessLog.Information(
                    $"Profile image updated for EmployeeId: {employeeId}, DocumentId: {existingImage.Id}");

                return existingImage.Id;
            }

            var profileImage = new ProfileImageDocument
            {
                EmployeeId = employeeId,
                ImageData = imageData,
                FileName = fileName,
                ContentType = contentType,
                FileSize = imageData.Length,
                UploadedAt = DateTime.UtcNow
            };

            await _profileImagesCollection.InsertOneAsync(profileImage);

            EEPZBusinessLog.Information(
                $"Profile image uploaded to MongoDB for EmployeeId: {employeeId}, DocumentId: {profileImage.Id}");

            return profileImage.Id;
        }

        public async Task<ProfileImageDocument?> GetImageAsync(int employeeId)
        {
            var filter = Builders<ProfileImageDocument>
                .Filter
                .Eq(x => x.EmployeeId, employeeId);

            var result = await _profileImagesCollection
                .Find(filter)
                .FirstOrDefaultAsync();

            if (result != null)
            {
                EEPZBusinessLog.Information(
                    $"Profile image retrieved from MongoDB for EmployeeId: {employeeId}");
            }

            return result;
        }

        public async Task<bool> DeleteImageAsync(int employeeId)
        {
            var filter = Builders<ProfileImageDocument>
                .Filter
                .Eq(x => x.EmployeeId, employeeId);

            var result = await _profileImagesCollection.DeleteOneAsync(filter);

            if (result.DeletedCount > 0)
            {
                EEPZBusinessLog.Information(
                    $"Profile image deleted from MongoDB for EmployeeId: {employeeId}");
                return true;
            }

            EEPZBusinessLog.Information(
                $"No profile image found to delete for EmployeeId: {employeeId}");

            return false;
        }

        public async Task<bool> UpdateImageAsync(
            int employeeId,
            byte[] imageData,
            string fileName,
            string contentType)
        {
            var filter = Builders<ProfileImageDocument>
                .Filter
                .Eq(x => x.EmployeeId, employeeId);

            var update = Builders<ProfileImageDocument>.Update
                .Set(x => x.ImageData, imageData)
                .Set(x => x.FileName, fileName)
                .Set(x => x.ContentType, contentType)
                .Set(x => x.FileSize, imageData.Length)
                .Set(x => x.UpdatedAt, DateTime.UtcNow);

            var result = await _profileImagesCollection.UpdateOneAsync(filter, update);

            if (result.ModifiedCount > 0)
            {
                EEPZBusinessLog.Information(
                    $"Profile image updated in MongoDB for EmployeeId: {employeeId}");
                return true;
            }

            EEPZBusinessLog.Information(
                $"No profile image found to update for EmployeeId: {employeeId}");

            return false;
        }

        public async Task<bool> ImageExistsAsync(int employeeId)
        {
            var filter = Builders<ProfileImageDocument>
                .Filter
                .Eq(x => x.EmployeeId, employeeId);

            var count = await _profileImagesCollection.CountDocumentsAsync(filter);

            return count > 0;
        }
    }
}
