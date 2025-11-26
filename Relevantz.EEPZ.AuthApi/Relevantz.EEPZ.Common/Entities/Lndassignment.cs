using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Lndassignment
{
    public int AssignmentId { get; set; }

    public int MenteeEmployeeId { get; set; }

    public int SmeId { get; set; }

    public int SkillId { get; set; }

    public DateTime? Deadline { get; set; }

    public string Status { get; set; } = null!;

    public string? ProofFilePath { get; set; }

    public string? CompletionNotes { get; set; }

    public int? CompletionRating { get; set; }

    public int CreatedByEmployeeId { get; set; }

    public DateOnly? CreatedOn { get; set; }

    public int? UpdatedByEmployeeId { get; set; }

    public DateOnly? UpdatedOn { get; set; }

    public virtual Employee CreatedByEmployee { get; set; } = null!;

    public virtual ICollection<Lndapproval> Lndapprovals { get; set; } = new List<Lndapproval>();

    public virtual Employee MenteeEmployee { get; set; } = null!;

    public virtual MasterSkill Skill { get; set; } = null!;

    public virtual Lndsme Sme { get; set; } = null!;

    public virtual Employee? UpdatedByEmployee { get; set; }
}
