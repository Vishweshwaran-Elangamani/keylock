using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class UpdateFeedbackRequestDto
    {

        public int? Rating { get; set; }


        public string Comments { get; set; }

        public List<FeedbackQuestionResponseRequestDto> QuestionResponses { get; set; }
    }
}
