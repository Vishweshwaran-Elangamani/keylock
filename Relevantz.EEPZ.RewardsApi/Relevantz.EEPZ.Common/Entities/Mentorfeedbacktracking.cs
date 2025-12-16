using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Mentorfeedbacktracking
{
    public int TrackingId { get; set; }

    public int SmeId { get; set; }

    public int MentorEmployeeId { get; set; }

    public int MenteeEmployeeId { get; set; }

    public int SkillIdReference { get; set; }

    public int Rating { get; set; }

    public string? FeedbackComments { get; set; }

    public int SubmittedByEmployeeId { get; set; }

    public string FeedbackFrom { get; set; } = null!;

    public bool IsAnonymous { get; set; }

    public string Status { get; set; } = null!;

    public int? ReviewedByHrid { get; set; }

    public string? HrreviewComments { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? ReviewedAt { get; set; }

    public virtual Employee MenteeEmployee { get; set; } = null!;

    public virtual Employee MentorEmployee { get; set; } = null!;

    public virtual Userauthentication? ReviewedByHr { get; set; }

    public virtual MasterSkill SkillIdReferenceNavigation { get; set; } = null!;

    public virtual Lndsme Sme { get; set; } = null!;

    public virtual Employee SubmittedByEmployee { get; set; } = null!;
}
