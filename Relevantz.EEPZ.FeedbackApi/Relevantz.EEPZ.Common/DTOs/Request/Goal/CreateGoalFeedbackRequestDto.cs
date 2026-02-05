using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class CreateGoalFeedbackRequestDto
    {
        public int GoalId { get; set; }
        public int SubmittedByEmployeeId { get; set; }
        public int? ManagerEmployeeId { get; set; }
        public int Rating { get; set; }
        public string FeedbackComments { get; set; }
        public string FeedbackFrom { get; set; }
        public bool IsAnonymous { get; set; } = false;
    }
}
