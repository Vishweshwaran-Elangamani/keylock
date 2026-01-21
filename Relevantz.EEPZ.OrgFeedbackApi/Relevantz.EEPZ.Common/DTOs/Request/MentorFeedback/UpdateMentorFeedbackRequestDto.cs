namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request DTO for updating Mentor Feedback.
    /// </summary>
    public class UpdateMentorFeedbackRequestDto
    {
        public int? Rating { get; set; }

        public string? FeedbackComments { get; set; }
    }
}
