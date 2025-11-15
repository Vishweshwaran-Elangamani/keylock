using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Assessmentform
{
    public int FormId { get; set; }

    /// <summary>
    /// Self Assessment, etc
    /// </summary>
    public string? Name { get; set; }

    public string? Type { get; set; }

    public int? CreatedBy { get; set; }

    public string? DeliveryEnablement { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();

    public virtual ICollection<Competency> Competencies { get; set; } = new List<Competency>();

    public virtual Userauthentication? CreatedByNavigation { get; set; }

    public virtual ICollection<Selfassessment> Selfassessments { get; set; } = new List<Selfassessment>();
}
