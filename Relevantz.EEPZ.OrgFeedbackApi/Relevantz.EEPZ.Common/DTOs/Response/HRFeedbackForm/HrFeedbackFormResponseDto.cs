namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class HrFeedbackFormResponseDto
    {
        public int FormId { get; set; }
        public string FormName { get; set; } = string.Empty;
        public string? FormDescription { get; set; }
        public string? FormType { get; set; }

        public int CreatedByHRId { get; set; }
        public string? CreatedByHRName { get; set; }

        public string? Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? Deadline { get; set; }

        public int TotalResponsesCount { get; set; }
        public int SubmittedResponsesCount { get; set; }
    }
}
