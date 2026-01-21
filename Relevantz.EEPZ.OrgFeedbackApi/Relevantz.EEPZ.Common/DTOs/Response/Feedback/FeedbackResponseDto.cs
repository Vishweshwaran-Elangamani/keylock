namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class FeedbackResponseDto
    {
        public int FeedbackId { get; set; }
        public string FeedbackType { get; set; } = string.Empty;
        public int? SubmittedByEmployeeId { get; set; }
        public string? SubmitterName { get; set; }

        public int RecipientEmployeeId { get; set; }
        public string? RecipientName { get; set; }

        public int? Rating { get; set; }
        public string? Comments { get; set; }

        public bool IsAnonymous { get; set; }
        public bool BiasFlag { get; set; }
        public bool FairnessFlag { get; set; }
        public bool IsApprovedForPeerReview { get; set; }

        public string? Status { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public int? ReviewedByHRId { get; set; }
        public string? HRReviewComments { get; set; }

        public List<FeedbackQuestionResponseDto> QuestionResponses { get; set; } = new();
    }
}
