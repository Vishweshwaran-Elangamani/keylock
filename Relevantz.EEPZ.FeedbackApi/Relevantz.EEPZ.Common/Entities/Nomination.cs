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

    public int? ReviewedByUserId { get; set; }

    public string? ReviewRemarks { get; set; }

    public DateTime SubmittedAt { get; set; }

    public DateTime? ReviewedAt { get; set; }

    public virtual ICollection<Managernominationtracking> Managernominationtrackings { get; set; } = new List<Managernominationtracking>();

    public virtual Userauthentication NominatedByUser { get; set; } = null!;

    public virtual ICollection<Nominationparametervalue> Nominationparametervalues { get; set; } = new List<Nominationparametervalue>();

    public virtual ICollection<Nominationreviewmetric> Nominationreviewmetrics { get; set; } = new List<Nominationreviewmetric>();

    public virtual ICollection<Nominationvisibilitytracking> Nominationvisibilitytrackings { get; set; } = new List<Nominationvisibilitytracking>();

    public virtual Userauthentication NomineeUser { get; set; } = null!;

    public virtual Internalopportunity Opportunity { get; set; } = null!;

    public virtual ICollection<Promotion> Promotions { get; set; } = new List<Promotion>();

    public virtual Userauthentication? ReviewedByUser { get; set; }
}
