using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Userauthentication
{
    public int UserId { get; set; }

    public int EmployeeId { get; set; }

    public string Email { get; set; } = null!;

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

    public virtual ICollection<Budgetperiodallocation> Budgetperiodallocations { get; set; } = new List<Budgetperiodallocation>();

    public virtual ICollection<Bulkoperationlog> Bulkoperationlogs { get; set; } = new List<Bulkoperationlog>();

    public virtual ICollection<Departmentheadapproval> Departmentheadapprovals { get; set; } = new List<Departmentheadapproval>();

    public virtual Employee Employee { get; set; } = null!;

    public virtual ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();

    public virtual ICollection<Hrfeedbackformresponse> Hrfeedbackformresponses { get; set; } = new List<Hrfeedbackformresponse>();

    public virtual ICollection<Hrfeedbackform> Hrfeedbackforms { get; set; } = new List<Hrfeedbackform>();

    public virtual ICollection<Internalopportunity> Internalopportunities { get; set; } = new List<Internalopportunity>();

    public virtual ICollection<Leadershipauditlog> Leadershipauditlogs { get; set; } = new List<Leadershipauditlog>();

    public virtual ICollection<Loginattempt> Loginattempts { get; set; } = new List<Loginattempt>();

    public virtual ICollection<Managernominationtracking> Managernominationtrackings { get; set; } = new List<Managernominationtracking>();

    public virtual ICollection<Mentorfeedbacktracking> Mentorfeedbacktrackings { get; set; } = new List<Mentorfeedbacktracking>();

    public virtual ICollection<Nomination> NominationDeptHeadUsers { get; set; } = new List<Nomination>();

    public virtual ICollection<Nomination> NominationL1managerUsers { get; set; } = new List<Nomination>();

    public virtual ICollection<Nomination> NominationL2managerUsers { get; set; } = new List<Nomination>();

    public virtual ICollection<Nomination> NominationNominatedByUsers { get; set; } = new List<Nomination>();

    public virtual ICollection<Nomination> NominationNomineeUsers { get; set; } = new List<Nomination>();

    public virtual ICollection<Nomination> NominationReviewedByUsers { get; set; } = new List<Nomination>();

    public virtual ICollection<Nominationreviewmetric> Nominationreviewmetrics { get; set; } = new List<Nominationreviewmetric>();

    public virtual ICollection<Organizationalpolicy> OrganizationalpolicyCreatedByUsers { get; set; } = new List<Organizationalpolicy>();

    public virtual ICollection<Organizationalpolicy> OrganizationalpolicyPublishedByNavigations { get; set; } = new List<Organizationalpolicy>();

    public virtual ICollection<Organizationwideobjective> Organizationwideobjectives { get; set; } = new List<Organizationwideobjective>();

    public virtual ICollection<Payroll> PayrollApprovedByUsers { get; set; } = new List<Payroll>();

    public virtual ICollection<Payroll> PayrollEmployeeUsers { get; set; } = new List<Payroll>();

    public virtual ICollection<Peerfeedbackqueue> Peerfeedbackqueues { get; set; } = new List<Peerfeedbackqueue>();

    public virtual ICollection<Policyviolation> PolicyviolationEmployeeUsers { get; set; } = new List<Policyviolation>();

    public virtual ICollection<Policyviolation> PolicyviolationEscalatedToUsers { get; set; } = new List<Policyviolation>();

    public virtual ICollection<Policyviolation> PolicyviolationReportedByUsers { get; set; } = new List<Policyviolation>();

    public virtual ICollection<Profilechangerequest> ProfilechangerequestApprovedByUsers { get; set; } = new List<Profilechangerequest>();

    public virtual ICollection<Profilechangerequest> ProfilechangerequestUsers { get; set; } = new List<Profilechangerequest>();

    public virtual ICollection<Promotion> PromotionApprovedByUsers { get; set; } = new List<Promotion>();

    public virtual ICollection<Promotion> PromotionEmployeeUsers { get; set; } = new List<Promotion>();

    public virtual ICollection<Promotionhistory> Promotionhistories { get; set; } = new List<Promotionhistory>();

    public virtual ICollection<Recognitiondetail> Recognitiondetails { get; set; } = new List<Recognitiondetail>();

    public virtual ICollection<Recognitionreward> RecognitionrewardEmployees { get; set; } = new List<Recognitionreward>();

    public virtual ICollection<Recognitionreward> RecognitionrewardSubmittedByNavigations { get; set; } = new List<Recognitionreward>();

    public virtual ICollection<Refreshtoken> Refreshtokens { get; set; } = new List<Refreshtoken>();

    public virtual ICollection<Report> Reports { get; set; } = new List<Report>();

    public virtual ICollection<Rewardtype> Rewardtypes { get; set; } = new List<Rewardtype>();

    public virtual ICollection<Selfassessmentattachment> Selfassessmentattachments { get; set; } = new List<Selfassessmentattachment>();

    public virtual ICollection<Selfassessment> Selfassessments { get; set; } = new List<Selfassessment>();

    public virtual ICollection<Teamworkload> Teamworkloads { get; set; } = new List<Teamworkload>();
}
