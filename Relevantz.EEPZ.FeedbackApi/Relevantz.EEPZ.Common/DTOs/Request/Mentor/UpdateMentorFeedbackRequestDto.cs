using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class UpdateMentorFeedbackRequestDto
    {
        public int? Rating { get; set; }

        public string FeedbackComments { get; set; }
    }
}
