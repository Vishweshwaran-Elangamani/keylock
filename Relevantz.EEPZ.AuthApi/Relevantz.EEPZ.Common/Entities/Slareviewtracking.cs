using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Slareviewtracking
{
    public int ReviewTrackingId { get; set; }
    public int Slaid { get; set; }
    public int EmployeeId { get; set; }
    public int ReviewerId { get; set; }
    public string ReviewType { get; set; } = null!;
    public string ReviewCycle { get; set; } = null!;
    public DateTime Deadline { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public string Status { get; set; } = null!;
    public string ComplianceStatus { get; set; } = null!;
    public int? FormId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? ReviewerRole { get; set; }
    public ulong? IsManagerSelfReview { get; set; }
    public int? ManagerReviewerId { get; set; }
    public virtual Employee Employee { get; set; } = null!;
    public virtual Assessmentform? Form { get; set; }
    public virtual Employee Reviewer { get; set; } = null!;
    public virtual Sla Sla { get; set; } = null!;
}
