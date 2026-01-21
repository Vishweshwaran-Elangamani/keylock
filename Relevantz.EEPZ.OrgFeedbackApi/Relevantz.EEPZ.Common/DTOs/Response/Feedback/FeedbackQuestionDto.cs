namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class FeedbackQuestionDto
    {
        public int QuestionId { get; set; }
        public string? QuestionCode { get; set; }
        public string? QuestionText { get; set; }
        public string? QuestionDescription { get; set; }
        public string? ResponseType { get; set; }

        public int DisplayOrder { get; set; }
        public bool IsRequired { get; set; }
        public bool IsActive { get; set; }

        public int? RatingScaleMin { get; set; }
        public int? RatingScaleMax { get; set; }

        public Dictionary<string, string> RatingScaleLabels { get; set; } = new();
        public List<ChoiceOptionDto> ChoiceOptions { get; set; } = new();
    }
}
