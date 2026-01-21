namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request DTO for creating Organization Goal Feedback.
    /// </summary>
    public class CreateOrgGoalFeedbackRequestDto
    {
        public int GoalId { get; set; }

        public int SubmittedByEmployeeId { get; set; }

        public int RecipientEmployeeId { get; set; }

        public int Rating { get; set; }

        public string? FeedbackComments { get; set; }

        public bool IsAnonymous { get; set; } = false;
    }
}
