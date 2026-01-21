namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class OrgGoalFeedbackResponseDto
    {
        public int OrgGoalFeedbackId { get; set; }
        public int GoalId { get; set; }

        public string? OrganizationGoalName { get; set; }
        public string? GoalDescription { get; set; }
        public string? GoalType { get; set; }

        public int SubmittedByEmployeeId { get; set; }
        public string? SubmitterName { get; set; }

        public int RecipientEmployeeId { get; set; }
        public string? RecipientName { get; set; }

        public int Rating { get; set; }
        public string? FeedbackComments { get; set; }

        public bool IsAnonymous { get; set; }
        public string? Status { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? SubmittedAt { get; set; }
    }
}
