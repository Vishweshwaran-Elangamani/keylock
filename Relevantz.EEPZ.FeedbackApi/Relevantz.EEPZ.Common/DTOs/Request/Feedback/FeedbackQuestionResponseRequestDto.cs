using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class FeedbackQuestionResponseRequestDto
    {

        public int QuestionId { get; set; }

        public int? RatingValue { get; set; }
        public bool? BooleanValue { get; set; }
        public string TextValue { get; set; }
        public List<int> SelectedOptions { get; set; }
    }
}
