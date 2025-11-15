using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Lndapproval
{
    public int ApprovalId { get; set; }

    public string ApprovalType { get; set; } = null!;

    public int? AssignmentId { get; set; }

    public int? SkillId { get; set; }

    public int? AttachmentId { get; set; }

    public int RequesterEmployeeId { get; set; }

    public int? ApproverEmployeeId { get; set; }

    public string Status { get; set; } = null!;

    public string? Notes { get; set; }

    public DateOnly? RequestedOn { get; set; }

    public DateOnly? UpdatedOn { get; set; }

    public virtual Employee? ApproverEmployee { get; set; }

    public virtual Lndassignment? Assignment { get; set; }

    public virtual Lndattachment? Attachment { get; set; }

    public virtual Employee RequesterEmployee { get; set; } = null!;

    public virtual MasterSkill? Skill { get; set; }
}
