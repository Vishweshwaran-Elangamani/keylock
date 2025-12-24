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

    public virtual ICollection<Department> Departments { get; set; } = new List<Department>();

    public virtual ICollection<Employeedetailsmaster> Employeedetailsmasters { get; set; } = new List<Employeedetailsmaster>();

    public virtual ICollection<Feedback> FeedbackRecipientEmployees { get; set; } = new List<Feedback>();

    public virtual ICollection<Feedback> FeedbackRelatedMentors { get; set; } = new List<Feedback>();

    public virtual ICollection<Feedback> FeedbackSubmittedByEmployees { get; set; } = new List<Feedback>();

    public virtual ICollection<Feedbackedithistory> Feedbackedithistories { get; set; } = new List<Feedbackedithistory>();

    public virtual ICollection<Hrfeedbackformresponse> Hrfeedbackformresponses { get; set; } = new List<Hrfeedbackformresponse>();

    public virtual ICollection<Employee> InverseReportingManagerEmployee { get; set; } = new List<Employee>();

    public virtual ICollection<Lndapproval> LndapprovalApproverEmployees { get; set; } = new List<Lndapproval>();

    public virtual ICollection<Lndapproval> LndapprovalRequesterEmployees { get; set; } = new List<Lndapproval>();

    public virtual ICollection<Lndassignment> LndassignmentCreatedByEmployees { get; set; } = new List<Lndassignment>();

    public virtual ICollection<Lndassignment> LndassignmentMenteeEmployees { get; set; } = new List<Lndassignment>();

    public virtual ICollection<Lndassignment> LndassignmentUpdatedByEmployees { get; set; } = new List<Lndassignment>();

    public virtual ICollection<Lndattachment> Lndattachments { get; set; } = new List<Lndattachment>();

    public virtual ICollection<Lndemployeeskillmapper> LndemployeeskillmapperCreatedByEmployees { get; set; } = new List<Lndemployeeskillmapper>();

    public virtual ICollection<Lndemployeeskillmapper> LndemployeeskillmapperEmployees { get; set; } = new List<Lndemployeeskillmapper>();

    public virtual ICollection<Lndemployeeskillmapper> LndemployeeskillmapperUpdatedByEmployees { get; set; } = new List<Lndemployeeskillmapper>();

    public virtual ICollection<Lndsme> LndsmeApprovedByEmployees { get; set; } = new List<Lndsme>();

    public virtual ICollection<Lndsme> LndsmeEmployees { get; set; } = new List<Lndsme>();

    public virtual ICollection<Managerreviewcomment> ManagerreviewcommentManagerEmployees { get; set; } = new List<Managerreviewcomment>();

    public virtual ICollection<Managerreviewcomment> ManagerreviewcommentTargetEmployees { get; set; } = new List<Managerreviewcomment>();

    public virtual ICollection<Meetingmom> Meetingmoms { get; set; } = new List<Meetingmom>();

    public virtual ICollection<Meetingparticipant> Meetingparticipants { get; set; } = new List<Meetingparticipant>();

    public virtual ICollection<Meeting> Meetings { get; set; } = new List<Meeting>();

    public virtual ICollection<Mentorfeedback> Mentorfeedbacks { get; set; } = new List<Mentorfeedback>();

    public virtual ICollection<Mentorfeedbacktracking> MentorfeedbacktrackingMenteeEmployees { get; set; } = new List<Mentorfeedbacktracking>();

    public virtual ICollection<Mentorfeedbacktracking> MentorfeedbacktrackingMentorEmployees { get; set; } = new List<Mentorfeedbacktracking>();

    public virtual ICollection<Mentorfeedbacktracking> MentorfeedbacktrackingSubmittedByEmployees { get; set; } = new List<Mentorfeedbacktracking>();

    public virtual ICollection<Momactionitem> Momactionitems { get; set; } = new List<Momactionitem>();

    public virtual ICollection<Mom> Moms { get; set; } = new List<Mom>();

    public virtual ICollection<Momsharing> MomsharingSharedByEmployees { get; set; } = new List<Momsharing>();

    public virtual ICollection<Momsharing> MomsharingSharedWithEmployees { get; set; } = new List<Momsharing>();

    public virtual ICollection<Nominationvisibilitytracking> Nominationvisibilitytrackings { get; set; } = new List<Nominationvisibilitytracking>();

    public virtual ICollection<Organizationgoalfeedback> OrganizationgoalfeedbackManagerEmployees { get; set; } = new List<Organizationgoalfeedback>();

    public virtual ICollection<Organizationgoalfeedback> OrganizationgoalfeedbackSubmittedByEmployees { get; set; } = new List<Organizationgoalfeedback>();

    public virtual ICollection<Peerfeedbackqueue> PeerfeedbackqueueRecipientEmployees { get; set; } = new List<Peerfeedbackqueue>();

    public virtual ICollection<Peerfeedbackqueue> PeerfeedbackqueueSubmittedByEmployees { get; set; } = new List<Peerfeedbackqueue>();

    public virtual ICollection<Recognitionstatus> RecognitionstatusNominatedByEmployees { get; set; } = new List<Recognitionstatus>();

    public virtual ICollection<Recognitionstatus> RecognitionstatusNomineeEmployees { get; set; } = new List<Recognitionstatus>();

    public virtual ICollection<Recognitionstatus> RecognitionstatusReviewedByEmployees { get; set; } = new List<Recognitionstatus>();

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

    public virtual Userauthentication? Userauthentication { get; set; }

    public virtual Userprofile? Userprofile { get; set; }
}
