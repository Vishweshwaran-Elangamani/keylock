using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Organizationwideobjective
{
    public int ObjectiveId { get; set; }

    public string? Title { get; set; }

    public string? Description { get; set; }

    public int? DepartmentId { get; set; }

    public DateTime? TimelineStart { get; set; }

    public DateTime? TimelineEnd { get; set; }

    public int? CreatedBy { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Userauthentication? CreatedByNavigation { get; set; }

    public virtual Department? Department { get; set; }

    public virtual ICollection<Organizationgoalfeedback> Organizationgoalfeedbacks { get; set; } = new List<Organizationgoalfeedback>();
}
