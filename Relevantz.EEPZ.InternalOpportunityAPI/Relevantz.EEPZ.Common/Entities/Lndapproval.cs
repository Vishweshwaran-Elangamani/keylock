using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Lndapproval
{
    public int ApprovalId { get; set; }

    public string ApprovalType { get; set; } = null!;

    public int RelatedId { get; set; }

    public int? SkillId { get; set; }

    public int? AttachmentId { get; set; }

    public int RequesterEmployeeId { get; set; }

    public int? ApproverEmployeeId { get; set; }

    public string Status { get; set; } = null!;

    public string? Reason { get; set; }

    public DateTime? ApprovedOn { get; set; }

    public DateTime? RejectedOn { get; set; }

    public int CreatedByEmployeeId { get; set; }

    public DateTime? CreatedOn { get; set; }

    public int? UpdatedByEmployeeId { get; set; }

    public DateTime? UpdatedOn { get; set; }

    public virtual Employee? ApproverEmployee { get; set; }

    public virtual Lndattachment? Attachment { get; set; }

    public virtual Employee CreatedByEmployee { get; set; } = null!;

    public virtual Employee RequesterEmployee { get; set; } = null!;

    public virtual Skillmaster? Skill { get; set; }

    public virtual Employee? UpdatedByEmployee { get; set; }
}
