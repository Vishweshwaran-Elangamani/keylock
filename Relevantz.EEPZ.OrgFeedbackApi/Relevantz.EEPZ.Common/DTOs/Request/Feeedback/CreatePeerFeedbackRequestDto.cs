namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request DTO for Peer Feedback.
    /// </summary>
    public class CreatePeerFeedbackRequestDto
    {
        public int SubmittedByEmployeeId { get; set; }

        public int RecipientEmployeeId { get; set; }

        public string FeedbackContent { get; set; } = string.Empty;

        public bool IsAnonymous { get; set; } = false;
    }
}
