using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class GoalApproval
{
    public int ApprovalId { get; set; }
    public int GoalId { get; set; }
    public string? ApprovalType { get; set; }
    public int? RequestedBy { get; set; }
    public DateTime? RequestedOn { get; set; }
    public int? ApprovedBy { get; set; }
    public DateTime? ApprovedOn { get; set; }
    public string? ApprovalStatus { get; set; }
    public virtual Employeedetailsmaster? ApprovedByNavigation { get; set; }
    public virtual Goal Goal { get; set; } = null!;
    public virtual ICollection<GoalAttachment> GoalAttachments { get; set; } = new List<GoalAttachment>();
    public virtual Employeedetailsmaster? RequestedByNavigation { get; set; }
}
