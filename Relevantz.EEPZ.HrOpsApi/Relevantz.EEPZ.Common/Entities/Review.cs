using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Review
{
    public int ReviewId { get; set; }
    public int? GoalId { get; set; }
    public string? GoalName { get; set; }
    public string Comments { get; set; } = null!;
    public int SubmittedBy { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public virtual Goal? Goal { get; set; }
    public virtual Employee SubmittedByNavigation { get; set; } = null!;
}
