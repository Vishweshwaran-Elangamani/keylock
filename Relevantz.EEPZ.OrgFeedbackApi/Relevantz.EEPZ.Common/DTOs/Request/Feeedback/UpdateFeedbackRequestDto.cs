namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Request DTO for updating feedback.
    /// </summary>
    public class UpdateFeedbackRequestDto
    {
        public int? Rating { get; set; }

        public string? Comments { get; set; }

        public List<FeedbackQuestionResponseRequestDto> Responses { get; set; } = new();

    }
}
