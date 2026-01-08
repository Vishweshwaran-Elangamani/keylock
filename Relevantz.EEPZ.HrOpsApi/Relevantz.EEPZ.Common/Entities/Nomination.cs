using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Nomination
{
    public int NominationId { get; set; }
    public int OpportunityId { get; set; }
    public int NomineeUserId { get; set; }
    public string NominationType { get; set; } = null!;
    public int NominatedByUserId { get; set; }
    public string? Justification { get; set; }
    public int CurrentApprovalLevel { get; set; }
    public string Status { get; set; } = null!;
    public int? L1managerUserId { get; set; }
    public string? L1reviewRemarks { get; set; }
    public DateTime? L1reviewedAt { get; set; }
    public string? L1status { get; set; }
    public int? L2managerUserId { get; set; }
    public string? L2reviewRemarks { get; set; }
    public DateTime? L2reviewedAt { get; set; }
    public string? L2status { get; set; }
    public int? DeptHeadUserId { get; set; }
    public string? DeptHeadReviewRemarks { get; set; }
    public DateTime? DeptHeadReviewedAt { get; set; }
    public string? DeptHeadStatus { get; set; }
    public int? ReviewedByUserId { get; set; }
    public string? ReviewRemarks { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime SubmittedAt { get; set; }
    public virtual Userauthentication? DeptHeadUser { get; set; }
    public virtual Userauthentication? L1managerUser { get; set; }
    public virtual Userauthentication? L2managerUser { get; set; }
    public virtual ICollection<Managernominationtracking> Managernominationtrackings { get; set; } = new List<Managernominationtracking>();
    public virtual Userauthentication NominatedByUser { get; set; } = null!;
    public virtual ICollection<Nominationreviewmetric> Nominationreviewmetrics { get; set; } = new List<Nominationreviewmetric>();
    public virtual Userauthentication NomineeUser { get; set; } = null!;
    public virtual Internalopportunity Opportunity { get; set; } = null!;
    public virtual ICollection<Promotion> Promotions { get; set; } = new List<Promotion>();
    public virtual Userauthentication? ReviewedByUser { get; set; }
}
