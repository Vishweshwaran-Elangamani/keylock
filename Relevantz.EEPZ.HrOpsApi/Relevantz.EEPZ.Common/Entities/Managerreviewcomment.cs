using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Managerreviewcomment
{
    public int ReviewCommentId { get; set; }
    public int ManagerEmployeeId { get; set; }
    public int TargetEmployeeId { get; set; }
    public int? TargetGoalId { get; set; }
    public int? TargetOrganizationGoalId { get; set; }
    public int Rating { get; set; }
    public string? ReviewComment { get; set; }
    public string Status { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public virtual Employee ManagerEmployee { get; set; } = null!;
    public virtual Employee TargetEmployee { get; set; } = null!;
    public virtual Goal? TargetGoal { get; set; }
}
