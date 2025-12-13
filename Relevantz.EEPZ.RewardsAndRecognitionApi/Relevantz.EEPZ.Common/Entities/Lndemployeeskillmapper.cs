using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Lndemployeeskillmapper
{
    public int MapperId { get; set; }

    public int EmployeeId { get; set; }

    public int SkillId { get; set; }

    public int Rating { get; set; }

    public int UpdatedByEmployeeId { get; set; }

    public int CreatedByEmployeeId { get; set; }

    public DateOnly? CreatedOn { get; set; }

    public DateOnly? UpdatedOn { get; set; }

    public virtual Employee CreatedByEmployee { get; set; } = null!;

    public virtual Employee Employee { get; set; } = null!;

    public virtual MasterSkill Skill { get; set; } = null!;

    public virtual Employee UpdatedByEmployee { get; set; } = null!;
}
