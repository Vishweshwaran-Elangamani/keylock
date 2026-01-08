using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Feedbackquestionresponse
{
    public int ResponseId { get; set; }
    public int FeedbackId { get; set; }
    public int QuestionId { get; set; }
    public int? RatingValue { get; set; }
    public bool? BooleanValue { get; set; }
    public string? TextValue { get; set; }
    public string? SelectedOptions { get; set; }
    public DateTime CreatedAt { get; set; }
    public virtual Feedback Feedback { get; set; } = null!;
    public virtual Feedbackquestion Question { get; set; } = null!;
}
