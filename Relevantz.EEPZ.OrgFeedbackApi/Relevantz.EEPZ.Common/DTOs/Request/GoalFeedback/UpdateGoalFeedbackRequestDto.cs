namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request DTO for updating Goal Feedback.
    /// </summary>
    public class UpdateGoalFeedbackRequestDto
    {
        public int? Rating { get; set; }

        public string? FeedbackComments { get; set; }

        public string? Status { get; set; }
    }
}
