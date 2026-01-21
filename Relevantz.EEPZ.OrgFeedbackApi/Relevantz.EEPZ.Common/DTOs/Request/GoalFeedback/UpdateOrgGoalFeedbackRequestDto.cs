namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request DTO for updating Organization Goal Feedback.
    /// </summary>
    public class UpdateOrgGoalFeedbackRequestDto
    {
        public int? Rating { get; set; }

        public string? FeedbackComments { get; set; }
    }
}
