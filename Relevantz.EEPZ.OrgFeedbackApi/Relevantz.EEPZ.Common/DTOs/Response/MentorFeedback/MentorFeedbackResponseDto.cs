namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class MentorFeedbackResponseDto
    {
        public int TrackingId { get; set; }
        public int SmeId { get; set; }

        public int MentorEmployeeId { get; set; }
        public string? MentorName { get; set; }

        public int MenteeEmployeeId { get; set; }
        public string? MenteeName { get; set; }

        public int SkillIdReference { get; set; }
        public string? SkillName { get; set; }

        public int Rating { get; set; }
        public string? FeedbackComments { get; set; }
        public string? FeedbackFrom { get; set; }

        public bool IsAnonymous { get; set; }
        public string? Status { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
    }
}
