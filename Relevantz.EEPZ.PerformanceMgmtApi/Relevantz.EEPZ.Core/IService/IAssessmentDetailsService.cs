namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface IAssessmentDetailsService
    {
        Task<object> GetAllDetailsAsync();

        Task<AssessmentDownloadResult> GetHrAttachmentAsync(int attachmentId);
    }

    public class AssessmentDownloadResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }

        public string? FileName { get; set; }
        public string? ContentType { get; set; }
        public byte[]? FileBytes { get; set; }
    }
}
