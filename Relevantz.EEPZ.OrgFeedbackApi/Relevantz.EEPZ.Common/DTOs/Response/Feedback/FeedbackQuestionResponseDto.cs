namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class FeedbackQuestionResponseDto
    {
        public int ResponseId { get; set; }
        public int QuestionId { get; set; }

        public string? QuestionText { get; set; }
        public string? ResponseType { get; set; }

        public int? RatingValue { get; set; }
        public bool? BooleanValue { get; set; }
        public string? TextValue { get; set; }

        public List<int> SelectedOptions { get; set; } = new();

        public DateTime CreatedAt { get; set; }
    }
}
