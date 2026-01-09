namespace Relevantz.EEPZ.Common.Models
{
    public class FileMetadata
    {
        public string FileId { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string ContentType { get; set; } = string.Empty;
        public DateTime UploadDate { get; set; }
        public string SubFolder { get; set; } = string.Empty;
    }
}
