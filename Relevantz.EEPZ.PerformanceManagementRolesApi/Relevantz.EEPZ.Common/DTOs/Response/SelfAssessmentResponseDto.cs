namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class SelfAssessmentResponseDto
    {
        public int AssessmentId { get; set; }
        public int FormId { get; set; }
        public string FormName { get; set; } = null!;
        public int UserId { get; set; }
        public string UserName { get; set; } = null!;
        public string Status { get; set; } = null!;
        public DateTime? SubmittedAt { get; set; }
        public List<AssessmentDetailResponseDto> Details { get; set; } = new();

        public List<AttachmentResponseDto>? Attachments { get; set; }
    }

    public class AssessmentDetailResponseDto
    {
        public int DetailId { get; set; }
        public int CompetencyId { get; set; }
        public string CompetencyName { get; set; } = null!;
        public string? CompetencyDescription { get; set; }
        public int? EmployeeRating { get; set; }
        public string? EmployeeComments { get; set; }
    }

    public class AttachmentResponseDto
    {
        public int AttachmentId { get; set; }
        public string FileName { get; set; } = null!;
        public string FilePath { get; set; } = null!;
        public string? FileType { get; set; }
        public long? FileSize { get; set; }
        public string? AttachmentNote { get; set; }
        public int? DisplayOrder { get; set; }
        public DateTime? UploadedAt { get; set; }
        public int? UploadedBy { get; set; }
    }
}
