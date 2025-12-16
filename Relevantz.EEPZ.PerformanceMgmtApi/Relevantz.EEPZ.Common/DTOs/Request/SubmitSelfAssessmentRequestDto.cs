namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class SubmitSelfAssessmentRequestDto
    {
        public int FormId { get; set; }
        public int UserId { get; set; }
        public string Status { get; set; } = null!;
        public List<AssessmentDetailRequestDto> AssessmentDetails { get; set; } = new();

        public List<AttachmentRequestDto>? Attachments { get; set; }
    }

    public class AssessmentDetailRequestDto
    {
        public int CompetencyId { get; set; }
        public int? EmployeeRating { get; set; }
        public string? EmployeeComments { get; set; }
    }

    public class AttachmentRequestDto
    {
        public string FileName { get; set; } = null!;
        public string? AttachmentNote { get; set; }
        public string? FilePath { get; set; }
        public string? FileType { get; set; }
        public long? FileSize { get; set; }
        public int? DisplayOrder { get; set; }
        public string? Base64Content { get; set; } 
    }
}
