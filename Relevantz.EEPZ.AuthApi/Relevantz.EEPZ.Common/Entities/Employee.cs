using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Employee
{
    public int EmployeeId { get; set; }

    /// <summary>
    /// Company-assigned employee ID (e.g., EMP001)
    /// </summary>
    public string EmployeeCompanyId { get; set; } = null!;

    public string EmploymentType { get; set; } = null!;

    public string EmploymentStatus { get; set; } = null!;

    public DateOnly JoiningDate { get; set; }

    /// <summary>
    /// Date of confirmation after probation
    /// </summary>
    public DateOnly? ConfirmationDate { get; set; }

    /// <summary>
    /// Last working day
    /// </summary>
    public DateOnly? ExitDate { get; set; }

    /// <summary>
    /// Self-referencing FK to Employee
    /// </summary>
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

    public virtual ICollection<Feedback> FeedbackEmployees { get; set; } = new List<Feedback>();

    public virtual ICollection<Feedback> FeedbackManagerEmployees { get; set; } = new List<Feedback>();

    public virtual ICollection<Employee> InverseReportingManagerEmployee { get; set; } = new List<Employee>();

    public virtual ICollection<Meetingmom> Meetingmoms { get; set; } = new List<Meetingmom>();

    public virtual ICollection<Mentorfeedback> Mentorfeedbacks { get; set; } = new List<Mentorfeedback>();

    public virtual Employee? ReportingManagerEmployee { get; set; }

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    public virtual ICollection<Slaescalation> Slaescalations { get; set; } = new List<Slaescalation>();

    public virtual ICollection<Slahistory> Slahistories { get; set; } = new List<Slahistory>();

    public virtual Userauthentication? Userauthentication { get; set; }

    public virtual Userprofile? Userprofile { get; set; }
}
