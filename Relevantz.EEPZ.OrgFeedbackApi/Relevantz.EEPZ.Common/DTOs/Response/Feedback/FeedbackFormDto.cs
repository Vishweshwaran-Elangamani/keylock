namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class FeedbackFormDto
    {
        public string FeedbackType { get; set; } = string.Empty;
        public string? FormTitle { get; set; }
        public string? FormDescription { get; set; }

        public List<FeedbackQuestionDto> Questions { get; set; } = new();
    }
}
