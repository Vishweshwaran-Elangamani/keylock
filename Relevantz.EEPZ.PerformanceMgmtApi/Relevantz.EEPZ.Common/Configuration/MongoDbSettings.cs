namespace Relevantz.EEPZ.Common.Configuration
{
    /// <summary>
    /// Configuration settings for MongoDB GridFS file storage
    /// </summary>
    public class MongoDbSettings
    {
        /// <summary>
        /// MongoDB connection string
        /// Example: "mongodb://localhost:27017" or "mongodb://user:pass@host:27017"
        /// </summary>
        public string ConnectionString { get; set; } = string.Empty;

        /// <summary>
        /// Database name where files will be stored
        /// Example: "EEPZFileStorage"
        /// </summary>
        public string DatabaseName { get; set; } = string.Empty;

        /// <summary>
        /// GridFS bucket name (prefix for collections)
        /// Default: "uploads"
        /// Creates collections: {BucketName}.files and {BucketName}.chunks
        /// </summary>
        public string GridFSBucketName { get; set; } = "Performanceuploads";

        /// <summary>
        /// Chunk size for GridFS in bytes
        /// Default: 1048576 (1MB)
        /// </summary>
        public int ChunkSizeBytes { get; set; } = 1048576;

        /// <summary>
        /// Maximum file size allowed in bytes
        /// Default: 104857600 (100MB)
        /// </summary>
        public long MaxFileSizeBytes { get; set; } = 104857600;
    }
}
