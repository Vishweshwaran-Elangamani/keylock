namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class GoalFeedbackResponseDto
    {
        public int FeedbackId { get; set; }

        public int GoalId { get; set; }

        public string GoalTitle { get; set; } = string.Empty;

        public string GoalType { get; set; } = string.Empty;

        public int SubmittedByEmployeeId { get; set; }

        public string SubmitterName { get; set; } = string.Empty;

        public int? ManagerEmployeeId { get; set; }

        public string? ManagerName { get; set; }

        public int Rating { get; set; }

        public string? FeedbackComments { get; set; }

        public string FeedbackFrom { get; set; } = string.Empty;

        public bool IsAnonymous { get; set; }

        public string Status { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }
    }
}
