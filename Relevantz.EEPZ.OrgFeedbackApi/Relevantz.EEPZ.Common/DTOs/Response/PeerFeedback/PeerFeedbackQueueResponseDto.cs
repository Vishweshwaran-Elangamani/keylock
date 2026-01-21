namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class PeerFeedbackQueueResponseDto
    {
        public int QueueId { get; set; }

        public int SubmittedByEmployeeId { get; set; }
        public string? SubmitterName { get; set; }

        public int RecipientEmployeeId { get; set; }
        public string? RecipientName { get; set; }

        public string? FeedbackContent { get; set; }
        public bool IsAnonymous { get; set; }

        public bool? IsProfessional { get; set; }
        public bool? IsRelevant { get; set; }

        public int? ApprovedByHRId { get; set; }
        public string? ApprovedByHRName { get; set; }

        public string? Status { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
    }
}
