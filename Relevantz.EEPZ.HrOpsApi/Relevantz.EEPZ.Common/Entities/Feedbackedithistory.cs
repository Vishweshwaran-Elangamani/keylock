using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Feedbackedithistory
{
    public int HistoryId { get; set; }
    public int FeedbackId { get; set; }
    public int EditedByEmployeeId { get; set; }
    public string OriginalContent { get; set; } = null!;
    public string UpdatedContent { get; set; } = null!;
    public string? ChangeReason { get; set; }
    public DateTime EditedAt { get; set; }
    public virtual Employee EditedByEmployee { get; set; } = null!;
    public virtual Feedback Feedback { get; set; } = null!;
}
