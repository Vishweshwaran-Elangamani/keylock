using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Slaescalation
{
    public int EscalationId { get; set; }

    public int Slaid { get; set; }

    public string Reason { get; set; } = null!;

    public string? Description { get; set; }

    /// <summary>
    /// Legacy submitter id
    /// </summary>
    public int? SubmittedBy { get; set; }

    public int SubmittedByEmployeeId { get; set; }

    public DateTime? SubmittedAt { get; set; }

    public virtual Sla Sla { get; set; } = null!;

    public virtual ICollection<Slahistory> Slahistories { get; set; } = new List<Slahistory>();

    public virtual Employee SubmittedByEmployee { get; set; } = null!;
}
