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

    public string Status { get; set; } = null!;

    public int CurrentApprovalLevel { get; set; }

    public int? L1ManagerUserId { get; set; }

    public string? L1ReviewRemarks { get; set; }

    public DateTime? L1ReviewedAt { get; set; }

    public string? L1Status { get; set; }

    public int? L2ManagerUserId { get; set; }

    public string? L2ReviewRemarks { get; set; }

    public DateTime? L2ReviewedAt { get; set; }

    public string? L2Status { get; set; }

    public int? DeptHeadUserId { get; set; }

    public string? DeptHeadReviewRemarks { get; set; }

    public DateTime? DeptHeadReviewedAt { get; set; }

    public string? DeptHeadStatus { get; set; }

    public int? ReviewedByUserId { get; set; }

    public string? ReviewRemarks { get; set; }

    public DateTime SubmittedAt { get; set; }

    public DateTime? ReviewedAt { get; set; }

    public virtual ICollection<Managernominationtracking> Managernominationtrackings { get; set; } = new List<Managernominationtracking>();

    public virtual Userauthentication NominatedByUser { get; set; } = null!;

    public virtual ICollection<Nominationreviewmetric> Nominationreviewmetrics { get; set; } = new List<Nominationreviewmetric>();

    public virtual Userauthentication NomineeUser { get; set; } = null!;

    public virtual Internalopportunity Opportunity { get; set; } = null!;

    public virtual Userauthentication? ReviewedByUser { get; set; }

    public virtual Userauthentication? L1ManagerUser { get; set; }

    public virtual Userauthentication? L2ManagerUser { get; set; }

    public virtual Userauthentication? DeptHeadUser { get; set; }
}
