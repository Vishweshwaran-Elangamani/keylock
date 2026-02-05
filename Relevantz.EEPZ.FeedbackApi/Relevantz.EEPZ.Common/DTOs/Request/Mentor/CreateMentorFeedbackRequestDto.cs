using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class CreateMentorFeedbackRequestDto
    {
        public int SmeId { get; set; }
        public int MentorEmployeeId { get; set; }
        public int MenteeEmployeeId { get; set; }
        public int SkillIdReference { get; set; }
        public int Rating { get; set; }
        public string FeedbackComments { get; set; }

        public int SubmittedByEmployeeId { get; set; }
        public string FeedbackFrom { get; set; }

        public bool IsAnonymous { get; set; } = false;
    }
}
