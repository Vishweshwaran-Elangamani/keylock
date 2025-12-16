using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Assessmentreview
{
    public int ReviewId { get; set; }

    public int DetailId { get; set; }

    public int ReviewerId { get; set; }

    public string? ReviewerRole { get; set; }

    public int? Rating { get; set; }

    public string? Comments { get; set; }

    public DateTime? ReviewedAt { get; set; }

    public string? ReviewStatus { get; set; }

    public virtual Assessmentdetail Detail { get; set; } = null!;

    public virtual Userauthentication Reviewer { get; set; } = null!;
}
