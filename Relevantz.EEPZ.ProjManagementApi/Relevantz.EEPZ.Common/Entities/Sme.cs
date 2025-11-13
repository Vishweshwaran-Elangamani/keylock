using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Sme
{
    public int SmeId { get; set; }

    public int EmployeeId { get; set; }

    public int SkillId { get; set; }

    public int? AttachmentId { get; set; }

    public int? ApprovedByEmployeeId { get; set; }

    public DateTime? ApprovedOn { get; set; }

    public int CreatedByEmployeeId { get; set; }

    public DateTime? CreatedOn { get; set; }

    public int? UpdatedByEmployeeId { get; set; }

    public DateTime? UpdatedOn { get; set; }

    public virtual Employee? ApprovedByEmployee { get; set; }

    public virtual Lndattachment? Attachment { get; set; }

    public virtual Employee CreatedByEmployee { get; set; } = null!;

    public virtual Employee Employee { get; set; } = null!;

    public virtual ICollection<Lndassignment> Lndassignments { get; set; } = new List<Lndassignment>();

    public virtual Skillmaster Skill { get; set; } = null!;

    public virtual Employee? UpdatedByEmployee { get; set; }
}
