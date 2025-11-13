using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Skillmaster
{
    public int SkillId { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public string? Category { get; set; }

    public DateTime? CreatedOn { get; set; }

    public virtual ICollection<Employeeskillmapper> Employeeskillmappers { get; set; } = new List<Employeeskillmapper>();

    public virtual ICollection<Lndapproval> Lndapprovals { get; set; } = new List<Lndapproval>();

    public virtual ICollection<Lndassignment> Lndassignments { get; set; } = new List<Lndassignment>();

    public virtual ICollection<Mentorfeedbacktracking> Mentorfeedbacktrackings { get; set; } = new List<Mentorfeedbacktracking>();

    public virtual ICollection<Sme> Smes { get; set; } = new List<Sme>();
}
