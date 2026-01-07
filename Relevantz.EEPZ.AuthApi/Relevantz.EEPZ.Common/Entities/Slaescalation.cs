using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Slaescalation
{
    public int EscalationId { get; set; }
    public int Slaid { get; set; }
    public string Reason { get; set; } = null!;
    public string? Description { get; set; }
    public string EscalationLevel { get; set; } = null!;
    public int EscalatedToEmployeeId { get; set; }
    public string EscalationStatus { get; set; } = null!;
    public DateTime? EscalationDeadline { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public int? ResolvedByEmployeeId { get; set; }
    public string? ResolutionComments { get; set; }
    public int? SubmittedBy { get; set; }
    public int SubmittedByEmployeeId { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public virtual Employee EscalatedToEmployee { get; set; } = null!;
    public virtual Employee? ResolvedByEmployee { get; set; }
    public virtual Sla Sla { get; set; } = null!;
    public virtual ICollection<Slahistory> Slahistories { get; set; } = new List<Slahistory>();
    public virtual Employee SubmittedByEmployee { get; set; } = null!;
}
