using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Employee
{
    public int EmployeeId { get; set; }

    public string EmployeeCompanyId { get; set; } = null!;

    public string EmploymentType { get; set; } = null!;

    public string EmploymentStatus { get; set; } = null!;

    public DateOnly JoiningDate { get; set; }

    public DateOnly? ConfirmationDate { get; set; }

    public DateOnly? ExitDate { get; set; }

    public int? ReportingManagerEmployeeId { get; set; }

    public string? WorkLocation { get; set; }

    public string EmployeeType { get; set; } = null!;

    public int? NoticePeriodDays { get; set; }

    public bool? IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? CreatedByUserId { get; set; }

    public int? UpdatedByUserId { get; set; }

    public virtual ICollection<Address> Addresses { get; set; } = new List<Address>();

    public virtual ICollection<Changerequest> Changerequests { get; set; } = new List<Changerequest>();

    public virtual ICollection<Employeedetailsmaster> Employeedetailsmasters { get; set; } = new List<Employeedetailsmaster>();

    public virtual ICollection<Employeeskillmapper> EmployeeskillmapperCreatedByEmployees { get; set; } = new List<Employeeskillmapper>();

    public virtual ICollection<Employeeskillmapper> EmployeeskillmapperEmployees { get; set; } = new List<Employeeskillmapper>();

    public virtual ICollection<Employeeskillmapper> EmployeeskillmapperUpdatedByEmployees { get; set; } = new List<Employeeskillmapper>();

    public virtual ICollection<Feedback> FeedbackEmployees { get; set; } = new List<Feedback>();

    public virtual ICollection<Feedback> FeedbackManagerEmployees { get; set; } = new List<Feedback>();

    public virtual ICollection<Employee> InverseReportingManagerEmployee { get; set; } = new List<Employee>();

    public virtual ICollection<Lndapproval> LndapprovalApproverEmployees { get; set; } = new List<Lndapproval>();

    public virtual ICollection<Lndapproval> LndapprovalCreatedByEmployees { get; set; } = new List<Lndapproval>();

    public virtual ICollection<Lndapproval> LndapprovalRequesterEmployees { get; set; } = new List<Lndapproval>();

    public virtual ICollection<Lndapproval> LndapprovalUpdatedByEmployees { get; set; } = new List<Lndapproval>();

    public virtual ICollection<Lndassignment> LndassignmentCreatedByEmployees { get; set; } = new List<Lndassignment>();

    public virtual ICollection<Lndassignment> LndassignmentMenteeEmployees { get; set; } = new List<Lndassignment>();

    public virtual ICollection<Lndassignment> LndassignmentUpdatedByEmployees { get; set; } = new List<Lndassignment>();

    public virtual ICollection<Lndattachment> Lndattachments { get; set; } = new List<Lndattachment>();

    public virtual ICollection<Lndcomment> Lndcomments { get; set; } = new List<Lndcomment>();

    public virtual ICollection<Meetingmom> Meetingmoms { get; set; } = new List<Meetingmom>();

    public virtual ICollection<Mentorfeedback> Mentorfeedbacks { get; set; } = new List<Mentorfeedback>();

    public virtual Employee? ReportingManagerEmployee { get; set; }

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    public virtual ICollection<Sla> SlaAssignedToEmployees { get; set; } = new List<Sla>();

    public virtual ICollection<Sla> SlaEmployees { get; set; } = new List<Sla>();

    public virtual ICollection<Sla> SlaReopenedByEmployees { get; set; } = new List<Sla>();

    public virtual ICollection<Slacompliance> Slacompliances { get; set; } = new List<Slacompliance>();

    public virtual ICollection<Slaescalation> SlaescalationEscalatedToEmployees { get; set; } = new List<Slaescalation>();

    public virtual ICollection<Slaescalation> SlaescalationResolvedByEmployees { get; set; } = new List<Slaescalation>();

    public virtual ICollection<Slaescalation> SlaescalationSubmittedByEmployees { get; set; } = new List<Slaescalation>();

    public virtual ICollection<Slahistory> Slahistories { get; set; } = new List<Slahistory>();

    public virtual ICollection<Slanotification> Slanotifications { get; set; } = new List<Slanotification>();

    public virtual ICollection<Slareviewtracking> SlareviewtrackingEmployees { get; set; } = new List<Slareviewtracking>();

    public virtual ICollection<Slareviewtracking> SlareviewtrackingReviewers { get; set; } = new List<Slareviewtracking>();

    public virtual ICollection<Sme> SmeApprovedByEmployees { get; set; } = new List<Sme>();

    public virtual ICollection<Sme> SmeCreatedByEmployees { get; set; } = new List<Sme>();

    public virtual Sme? SmeEmployee { get; set; }

    public virtual ICollection<Sme> SmeUpdatedByEmployees { get; set; } = new List<Sme>();

    public virtual Userauthentication? Userauthentication { get; set; }

    public virtual Userprofile? Userprofile { get; set; }
}
