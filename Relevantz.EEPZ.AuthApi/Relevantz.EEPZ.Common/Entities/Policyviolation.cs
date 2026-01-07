using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Policyviolation
{
    public int ViolationId { get; set; }
    public int EmployeeUserId { get; set; }
    public int? PolicyId { get; set; }
    public string ViolationType { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string Severity { get; set; } = null!;
    public string Status { get; set; } = null!;
    public int ReportedByUserId { get; set; }
    public DateOnly ReportedDate { get; set; }
    public int? EscalatedToUserId { get; set; }
    public string? ResolutionNotes { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public virtual Userauthentication EmployeeUser { get; set; } = null!;
    public virtual Userauthentication? EscalatedToUser { get; set; }
    public virtual Organizationalpolicy? Policy { get; set; }
    public virtual Userauthentication ReportedByUser { get; set; } = null!;
}
