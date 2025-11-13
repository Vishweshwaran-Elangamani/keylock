using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Employeeskillmapper
{
    public int MapperId { get; set; }

    public int EmployeeId { get; set; }

    public int SkillId { get; set; }

    public int Rating { get; set; }

    public int UpdatedByEmployeeId { get; set; }

    public int CreatedByEmployeeId { get; set; }

    public DateTime? CreatedOn { get; set; }

    public DateTime? UpdatedOn { get; set; }

    public virtual Employee CreatedByEmployee { get; set; } = null!;

    public virtual Employee Employee { get; set; } = null!;

    public virtual Skillmaster Skill { get; set; } = null!;

    public virtual Employee UpdatedByEmployee { get; set; } = null!;
}
