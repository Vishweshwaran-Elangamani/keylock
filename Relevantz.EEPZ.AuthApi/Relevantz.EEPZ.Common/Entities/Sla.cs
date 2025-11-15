using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Sla
{
    public int Slaid { get; set; }

    public string Slatype { get; set; } = null!;

    public string Status { get; set; } = null!;

    /// <summary>
    /// Legacy creator id
    /// </summary>
    public int? CreatedBy { get; set; }

    public int CreatedByEmployeeId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Employeedetailsmaster CreatedByEmployee { get; set; } = null!;

    public virtual ICollection<Slaescalation> Slaescalations { get; set; } = new List<Slaescalation>();

    public virtual ICollection<Slahistory> Slahistories { get; set; } = new List<Slahistory>();
}
