using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Sla
{
    public int Slaid { get; set; }
    public string Slatype { get; set; } = null!;
    public string Status { get; set; } = null!;
    public int EmployeeId { get; set; }
    public int DepartmentId { get; set; }
    public int? AssignedToEmployeeId { get; set; }
    public DateTime Deadline { get; set; }
    public DateTime? ClosedAt { get; set; }
    public string ComplianceStatus { get; set; } = null!;
    public DateTime? ReopenedAt { get; set; }
    public int? ReopenedByEmployeeId { get; set; }
    public int? ReopenExtensionDays { get; set; }
    public string? ReopenReason { get; set; }
    public string? RelatedEntityType { get; set; }
    public int? RelatedEntityId { get; set; }
    public int? CreatedBy { get; set; }
    public int CreatedByEmployeeId { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int ReopenCount { get; set; }
    public bool IsAutoClosed { get; set; }
    public DateTime? LastNotificationSent { get; set; }
    public virtual Employee? AssignedToEmployee { get; set; }
    public virtual Department Department { get; set; } = null!;
    public virtual Employee Employee { get; set; } = null!;
    public virtual Employee? ReopenedByEmployee { get; set; }
    public virtual ICollection<Slaescalation> Slaescalations { get; set; } = new List<Slaescalation>();
    public virtual ICollection<Slahistory> Slahistories { get; set; } = new List<Slahistory>();
    public virtual ICollection<Slanotification> Slanotifications { get; set; } = new List<Slanotification>();
    public virtual ICollection<Slareviewtracking> Slareviewtrackings { get; set; } = new List<Slareviewtracking>();
}
