using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Goal
{
    public int GoalId { get; set; }

    public string? GoalType { get; set; }

    public int? ProjectId { get; set; }

    public string? GoalTitle { get; set; }

    public string? GoalDescription { get; set; }

    public DateTime? Goalcreatedat { get; set; }

    public DateTime? Goalendat { get; set; }

    public int? CreatedBy { get; set; }

    public string? Goalstatus { get; set; }

    public int? ReopenedBy { get; set; }

    public DateTime? ReopenedOn { get; set; }

    public DateTime? ReopenUntil { get; set; }

    public int? ClosedBy { get; set; }

    public DateTime? ClosedOn { get; set; }

    public string? ClosureReason { get; set; }

    public virtual Employeedetailsmaster? ClosedByNavigation { get; set; }

    public virtual Employeedetailsmaster? CreatedByNavigation { get; set; }

    public virtual ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();

    public virtual ICollection<GoalApproval> GoalApprovals { get; set; } = new List<GoalApproval>();

    public virtual ICollection<GoalAssignment> GoalAssignments { get; set; } = new List<GoalAssignment>();

    public virtual ICollection<GoalAttachment> GoalAttachments { get; set; } = new List<GoalAttachment>();

    public virtual ICollection<GoalChecklist> GoalChecklists { get; set; } = new List<GoalChecklist>();

    public virtual ICollection<GoalComment> GoalComments { get; set; } = new List<GoalComment>();

    public virtual ICollection<Goalprogresslog> Goalprogresslogs { get; set; } = new List<Goalprogresslog>();

    public virtual ICollection<Managerreviewcomment> Managerreviewcomments { get; set; } = new List<Managerreviewcomment>();

    public virtual Project? Project { get; set; }

    public virtual ICollection<Projectgoalfeedback> Projectgoalfeedbacks { get; set; } = new List<Projectgoalfeedback>();

    public virtual Employeedetailsmaster? ReopenedByNavigation { get; set; }

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
}
