namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request DTO for HR Peer Feedback Approval.
    /// </summary>
    public class ApprovePeerFeedbackRequestDto
    {
        public int QueueId { get; set; }

        public bool IsProfessional { get; set; }

        public bool IsRelevant { get; set; }

        public bool Approve { get; set; } = true;
    }
}
