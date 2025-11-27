using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Feedback
{
    public int FeedbackId { get; set; }

    public string FeedbackType { get; set; } = null!;

    public string Context { get; set; } = null!;

    public string Comments { get; set; } = null!;

    public int? Rating { get; set; }

    public bool IsAnonymous { get; set; }

    public int? EmployeeId { get; set; }

    public int? ManagerEmployeeId { get; set; }

    public DateTime SubmittedAt { get; set; }

    public DateTime? ManagerReviewedAt { get; set; }

    public virtual Employee? Employee { get; set; }

    public virtual Employee? ManagerEmployee { get; set; }
}
