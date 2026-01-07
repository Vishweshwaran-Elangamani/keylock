using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Organizationgoalfeedback
{
    public int OrgGoalFeedbackId { get; set; }
    public int OrganizationObjectiveId { get; set; }
    public int SubmittedByEmployeeId { get; set; }
    public int? ManagerEmployeeId { get; set; }
    public int Rating { get; set; }
    public string? FeedbackComments { get; set; }
    public string FeedbackFrom { get; set; } = null!;
    public bool IsAnonymous { get; set; }
    public string Status { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public virtual Employee? ManagerEmployee { get; set; }
    public virtual Organizationwideobjective OrganizationObjective { get; set; } = null!;
    public virtual Employee SubmittedByEmployee { get; set; } = null!;
}
