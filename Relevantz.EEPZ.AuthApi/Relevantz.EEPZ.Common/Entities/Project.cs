using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Project
{
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = null!;
    public string? Description { get; set; }
    public string? ClientName { get; set; }
    public string? BusinessUnit { get; set; }
    public string? Department { get; set; }
    public string? EngagementModel { get; set; }
    public string? Status { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public int? ResourceOwnerId { get; set; }
    public int? ResourceOwnerEmployeeId { get; set; }
    public int? L1approverId { get; set; }
    public int? L1approverEmployeeId { get; set; }
    public int? L2approverId { get; set; }
    public int? L2approverEmployeeId { get; set; }
    public bool? IsDeletable { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public virtual ICollection<Departmentheadapproval> Departmentheadapprovals { get; set; } = new List<Departmentheadapproval>();
    public virtual ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();
    public virtual ICollection<Goal> Goals { get; set; } = new List<Goal>();
    public virtual Employeedetailsmaster? L1approverEmployee { get; set; }
    public virtual Employeedetailsmaster? L2approverEmployee { get; set; }
    public virtual ICollection<Projectemployee> Projectemployees { get; set; } = new List<Projectemployee>();
    public virtual ICollection<Projectgoalfeedback> Projectgoalfeedbacks { get; set; } = new List<Projectgoalfeedback>();
    public virtual Employeedetailsmaster? ResourceOwnerEmployee { get; set; }
}
