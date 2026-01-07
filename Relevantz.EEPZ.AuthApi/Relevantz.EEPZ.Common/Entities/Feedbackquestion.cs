using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Feedbackquestion
{
    public int QuestionId { get; set; }
    public string QuestionCode { get; set; } = null!;
    public string QuestionText { get; set; } = null!;
    public string? QuestionDescription { get; set; }
    public string FeedbackType { get; set; } = null!;
    public string ResponseType { get; set; } = null!;
    public int? RatingScaleMin { get; set; }
    public int? RatingScaleMax { get; set; }
    public string? RatingScaleLabels { get; set; }
    public string? ChoiceOptions { get; set; }
    public int DisplayOrder { get; set; }
    public bool? IsRequired { get; set; }
    public bool? IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public virtual ICollection<Feedbackquestionresponse> Feedbackquestionresponses { get; set; } = new List<Feedbackquestionresponse>();
}
