using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Managernominationtracking
{
    public int TrackingId { get; set; }

    public int NominationId { get; set; }

    public int ViewedByUserId { get; set; }

    public DateTime ViewedAt { get; set; }

    public string? ActionTaken { get; set; }

    public virtual Nomination Nomination { get; set; } = null!;

    public virtual Userauthentication ViewedByUser { get; set; } = null!;
}
