namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request DTO for individual question response.
    /// </summary>
    public class FeedbackQuestionResponseRequestDto
    {
        public int QuestionId { get; set; }

        public int? RatingValue { get; set; }

        public bool? BooleanValue { get; set; }

        public string? TextValue { get; set; }

        public List<int> SelectedOptions { get; set; } = new();
    }
}
