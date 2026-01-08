using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Slahistory
{
    public int SlahistoryId { get; set; }
    public int Slaid { get; set; }
    public string ChangeType { get; set; } = null!;
    public string? ChangedFrom { get; set; }
    public string? ChangedTo { get; set; }
    public int? ChangedByEmployeeId { get; set; }
    public int? ReferenceEscalationId { get; set; }
    public string? Reason { get; set; }
    public string? Metadata { get; set; }
    public DateTime CreatedAt { get; set; }
    public virtual Employee? ChangedByEmployee { get; set; }
    public virtual Slaescalation? ReferenceEscalation { get; set; }
    public virtual Sla Sla { get; set; } = null!;
}
