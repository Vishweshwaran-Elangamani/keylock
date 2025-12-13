using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Nominationreviewmetric
{
    public int MetricId { get; set; }

    public int NominationId { get; set; }

    public int ReviewedByUserId { get; set; }

    public decimal? MeritScore { get; set; }

    public decimal? DiversityScore { get; set; }

    public bool? ConflictOfInterest { get; set; }

    public string? ReviewNotes { get; set; }

    public DateTime ReviewedAt { get; set; }

    public virtual Nomination Nomination { get; set; } = null!;

    public virtual Userauthentication ReviewedByUser { get; set; } = null!;
}
