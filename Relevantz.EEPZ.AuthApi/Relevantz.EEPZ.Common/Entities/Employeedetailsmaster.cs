using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Employeedetailsmaster
{
    public int EmployeeMasterId { get; set; }
    public int EmployeeId { get; set; }
    public int RoleId { get; set; }
    public int DepartmentId { get; set; }
    public virtual Department Department { get; set; } = null!;
    public virtual ICollection<Departmentheadapproval> Departmentheadapprovals { get; set; } = new List<Departmentheadapproval>();
    public virtual Employee Employee { get; set; } = null!;
    public virtual ICollection<GoalApproval> GoalApprovalApprovedByNavigations { get; set; } = new List<GoalApproval>();
    public virtual ICollection<GoalApproval> GoalApprovalRequestedByNavigations { get; set; } = new List<GoalApproval>();
    public virtual ICollection<GoalAssignment> GoalAssignmentAcknowledgedByNavigations { get; set; } = new List<GoalAssignment>();
    public virtual ICollection<GoalAssignment> GoalAssignmentAssignedByNavigations { get; set; } = new List<GoalAssignment>();
    public virtual ICollection<GoalAssignment> GoalAssignmentAssignedToNavigations { get; set; } = new List<GoalAssignment>();
    public virtual ICollection<GoalAttachment> GoalAttachments { get; set; } = new List<GoalAttachment>();
    public virtual ICollection<GoalChecklist> GoalChecklistAddedByNavigations { get; set; } = new List<GoalChecklist>();
    public virtual ICollection<GoalChecklist> GoalChecklistAddedForNavigations { get; set; } = new List<GoalChecklist>();
    public virtual ICollection<Goal> GoalClosedByNavigations { get; set; } = new List<Goal>();
    public virtual ICollection<GoalComment> GoalComments { get; set; } = new List<GoalComment>();
    public virtual ICollection<Goal> GoalCreatedByNavigations { get; set; } = new List<Goal>();
    public virtual ICollection<Goal> GoalReopenedByNavigations { get; set; } = new List<Goal>();
    public virtual ICollection<Goalchecklistprogress> Goalchecklistprogresses { get; set; } = new List<Goalchecklistprogress>();
    public virtual ICollection<Goalprogresslog> Goalprogresslogs { get; set; } = new List<Goalprogresslog>();
    public virtual ICollection<Oneononediscussion> OneononediscussionCreatedByNavigations { get; set; } = new List<Oneononediscussion>();
    public virtual ICollection<Oneononediscussion> OneononediscussionHostEmployees { get; set; } = new List<Oneononediscussion>();
    public virtual ICollection<Oneononediscussion> OneononediscussionParticipantEmployees { get; set; } = new List<Oneononediscussion>();
    public virtual ICollection<Peerfeedback> PeerfeedbackPeerEmployees { get; set; } = new List<Peerfeedback>();
    public virtual ICollection<Peerfeedback> PeerfeedbackSubmittedByEmployees { get; set; } = new List<Peerfeedback>();
    public virtual ICollection<Project> ProjectL1approverEmployees { get; set; } = new List<Project>();
    public virtual ICollection<Project> ProjectL2approverEmployees { get; set; } = new List<Project>();
    public virtual ICollection<Project> ProjectResourceOwnerEmployees { get; set; } = new List<Project>();
    public virtual ICollection<Projectemployee> Projectemployees { get; set; } = new List<Projectemployee>();
    public virtual ICollection<Projectgoalfeedback> Projectgoalfeedbacks { get; set; } = new List<Projectgoalfeedback>();
    public virtual Role Role { get; set; } = null!;
}
