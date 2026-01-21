namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request DTO for HR Feedback Form Creation.
    /// </summary>
    public class CreateHRFeedbackFormRequestDto
    {
        public string FormName { get; set; } = string.Empty;

        public string? FormDescription { get; set; }

        public string FormType { get; set; } = string.Empty;

        public int CreatedByHRId { get; set; }

        public List<int> DistributedToEmployeeIds { get; set; } = new();

        public DateTime? Deadline { get; set; }
    }
}
