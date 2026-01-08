using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
namespace Relevantz.EEPZ.Common.Models
{
    public class PolicyFileDocument
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }
        [BsonElement("fileName")]
        public string FileName { get; set; }
        [BsonElement("originalFileName")]
        public string OriginalFileName { get; set; }
        [BsonElement("contentType")]
        public string ContentType { get; set; }
        [BsonElement("fileSize")]
        public long FileSize { get; set; }
        [BsonElement("fileData")]
        public byte[] FileData { get; set; }
        [BsonElement("uploadedAt")]
        public DateTime UploadedAt { get; set; }
        [BsonElement("uploadedByUserId")]
        public int UploadedByUserId { get; set; }
    }
}
