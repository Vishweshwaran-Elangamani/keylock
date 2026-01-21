namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class HrFeedbackFormResponseResponseDto
    {
        public int ResponseId { get; set; }
        public int FormId { get; set; }

        public string? FormName { get; set; }

        public int SubmittedByEmployeeId { get; set; }
        public string? SubmitterName { get; set; }

        public Dictionary<string, object> FormResponse { get; set; } = new();

        public string? Status { get; set; }

        public string? HRReviewComments { get; set; }

        public int? ReviewedByHRId { get; set; }
        public string? ReviewedByHRName { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
    }
}
