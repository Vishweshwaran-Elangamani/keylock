using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class MasterSkill
{
    public int SkillId { get; set; }
    public string SkillName { get; set; } = null!;
    public string? Description { get; set; }
    public string? Category { get; set; }
    public virtual ICollection<Lndapproval> Lndapprovals { get; set; } = new List<Lndapproval>();
    public virtual ICollection<Lndassignment> Lndassignments { get; set; } = new List<Lndassignment>();
    public virtual ICollection<Lndemployeeskillmapper> Lndemployeeskillmappers { get; set; } = new List<Lndemployeeskillmapper>();
    public virtual ICollection<Lndsme> Lndsmes { get; set; } = new List<Lndsme>();
    public virtual ICollection<Mentorfeedbacktracking> Mentorfeedbacktrackings { get; set; } = new List<Mentorfeedbacktracking>();
}
