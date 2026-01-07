using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
namespace Relevantz.EEPZ.Common.Entities
{
    public class ProfileImageDocument
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }
        [BsonElement("employee_id")]
        public int EmployeeId { get; set; }
        [BsonElement("image_data")]
        public byte[] ImageData { get; set; }
        [BsonElement("content_type")]
        public string ContentType { get; set; }
        [BsonElement("file_name")]
        public string FileName { get; set; }
        [BsonElement("file_size")]
        public long FileSize { get; set; }
        [BsonElement("uploaded_at")]
        public DateTime UploadedAt { get; set; }
        [BsonElement("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}
