using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class UpdateGoalFeedbackRequestDto
    {
        public int? Rating { get; set; }

        public string FeedbackComments { get; set; }

        public string Status { get; set; }
    }
}
