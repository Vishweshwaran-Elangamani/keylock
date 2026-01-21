namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request DTO for creating Goal Feedback.
    /// </summary>
    public class CreateGoalFeedbackRequestDto
    {
        public int GoalId { get; set; }

        public int SubmittedByEmployeeId { get; set; }

        public int? ManagerEmployeeId { get; set; }

        public int Rating { get; set; }

        public string? FeedbackComments { get; set; }

        public string FeedbackFrom { get; set; } = string.Empty;

        public bool IsAnonymous { get; set; } = false;
    }
}
