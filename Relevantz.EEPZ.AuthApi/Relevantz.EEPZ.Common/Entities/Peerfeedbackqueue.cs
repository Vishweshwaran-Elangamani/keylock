using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Peerfeedbackqueue
{
    public int QueueId { get; set; }
    public int SubmittedByEmployeeId { get; set; }
    public int RecipientEmployeeId { get; set; }
    public string FeedbackContent { get; set; } = null!;
    public bool IsAnonymous { get; set; }
    public bool? IsProfessional { get; set; }
    public bool? IsRelevant { get; set; }
    public int? ApprovedByHrid { get; set; }
    public string Status { get; set; } = null!;
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public virtual Userauthentication? ApprovedByHr { get; set; }
    public virtual Employee RecipientEmployee { get; set; } = null!;
    public virtual Employee SubmittedByEmployee { get; set; } = null!;
}
