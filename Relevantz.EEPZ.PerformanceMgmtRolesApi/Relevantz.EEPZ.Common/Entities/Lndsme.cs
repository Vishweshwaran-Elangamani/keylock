using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Lndsme
{
    public int SmeId { get; set; }

    public int EmployeeId { get; set; }

    public int SkillId { get; set; }

    public int? AttachmentId { get; set; }

    public int? ApprovedByEmployeeId { get; set; }

    public DateOnly? ApprovedOn { get; set; }

    public DateOnly? CreatedOn { get; set; }

    public bool? IsActive { get; set; }

    public virtual Employee? ApprovedByEmployee { get; set; }

    public virtual Lndattachment? Attachment { get; set; }

    public virtual Employee Employee { get; set; } = null!;

    public virtual ICollection<Lndassignment> Lndassignments { get; set; } = new List<Lndassignment>();

    public virtual ICollection<Mentorfeedbacktracking> Mentorfeedbacktrackings { get; set; } = new List<Mentorfeedbacktracking>();

    public virtual MasterSkill Skill { get; set; } = null!;
}
