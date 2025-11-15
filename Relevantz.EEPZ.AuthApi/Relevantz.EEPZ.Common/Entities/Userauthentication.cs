using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Userauthentication
{
    public int UserId { get; set; }

    public int EmployeeId { get; set; }

    public string Email { get; set; } = null!;

    /// <summary>
    /// Hashed password (bcrypt/Argon2)
    /// </summary>
    public string PasswordHash { get; set; } = null!;

    public string Status { get; set; } = null!;

    public bool? IsFirstLogin { get; set; }

    public DateTime? LastLoginAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<Assessmentform> Assessmentforms { get; set; } = new List<Assessmentform>();

    public virtual ICollection<Assessmentreview> Assessmentreviews { get; set; } = new List<Assessmentreview>();

    public virtual ICollection<Assignment> AssignmentAssignedByNavigations { get; set; } = new List<Assignment>();

    public virtual ICollection<Assignment> AssignmentEmployees { get; set; } = new List<Assignment>();

    public virtual ICollection<Auditlog> Auditlogs { get; set; } = new List<Auditlog>();

    public virtual ICollection<Budgetallocation> BudgetallocationAllocatedByUsers { get; set; } = new List<Budgetallocation>();

    public virtual ICollection<Budgetallocation> BudgetallocationEmployeeUsers { get; set; } = new List<Budgetallocation>();

    public virtual ICollection<Bulkoperationlog> Bulkoperationlogs { get; set; } = new List<Bulkoperationlog>();

    public virtual Employee Employee { get; set; } = null!;

    public virtual ICollection<Internalopportunity> Internalopportunities { get; set; } = new List<Internalopportunity>();

    public virtual ICollection<Loginattempt> Loginattempts { get; set; } = new List<Loginattempt>();

    public virtual ICollection<Managernominationtracking> Managernominationtrackings { get; set; } = new List<Managernominationtracking>();

    public virtual ICollection<Nomination> NominationNominatedByUsers { get; set; } = new List<Nomination>();

    public virtual ICollection<Nomination> NominationNomineeUsers { get; set; } = new List<Nomination>();

    public virtual ICollection<Nomination> NominationReviewedByUsers { get; set; } = new List<Nomination>();

    public virtual ICollection<Nominationreviewmetric> Nominationreviewmetrics { get; set; } = new List<Nominationreviewmetric>();

    public virtual ICollection<Organizationalpolicy> Organizationalpolicies { get; set; } = new List<Organizationalpolicy>();

    public virtual ICollection<Payroll> PayrollApprovedByUsers { get; set; } = new List<Payroll>();

    public virtual ICollection<Payroll> PayrollEmployeeUsers { get; set; } = new List<Payroll>();

    public virtual ICollection<Policyviolation> PolicyviolationEmployeeUsers { get; set; } = new List<Policyviolation>();

    public virtual ICollection<Policyviolation> PolicyviolationEscalatedToUsers { get; set; } = new List<Policyviolation>();

    public virtual ICollection<Policyviolation> PolicyviolationReportedByUsers { get; set; } = new List<Policyviolation>();

    public virtual ICollection<Profilechangerequest> ProfilechangerequestApprovedByUsers { get; set; } = new List<Profilechangerequest>();

    public virtual ICollection<Profilechangerequest> ProfilechangerequestUsers { get; set; } = new List<Profilechangerequest>();

    public virtual ICollection<Promotion> PromotionApprovedByUsers { get; set; } = new List<Promotion>();

    public virtual ICollection<Promotion> PromotionEmployeeUsers { get; set; } = new List<Promotion>();

    public virtual ICollection<Promotionhistory> Promotionhistories { get; set; } = new List<Promotionhistory>();

    public virtual ICollection<Refreshtoken> Refreshtokens { get; set; } = new List<Refreshtoken>();

    public virtual ICollection<Selfassessment> Selfassessments { get; set; } = new List<Selfassessment>();

    public virtual ICollection<Teamworkload> Teamworkloads { get; set; } = new List<Teamworkload>();
}
