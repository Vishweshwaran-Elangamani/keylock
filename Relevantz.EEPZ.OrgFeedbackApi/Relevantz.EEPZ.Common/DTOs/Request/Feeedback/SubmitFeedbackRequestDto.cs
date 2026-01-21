namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request DTO for submitting feedback for a specific employee/project/goal.
    /// </summary>
    public class SubmitFeedbackRequestDto
    {
        public int EmployeeId { get; set; }

        public int ProjectId { get; set; }

        public int GoalId { get; set; }

        public string FeedbackText { get; set; } = string.Empty;

        public int Rating { get; set; }
    }
}
