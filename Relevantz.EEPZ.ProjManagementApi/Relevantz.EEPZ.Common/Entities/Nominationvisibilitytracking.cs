using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Nominationvisibilitytracking
{
    public int TrackingId { get; set; }

    public int NominationId { get; set; }

    public int ViewedByEmployeeId { get; set; }

    public DateTime ViewedAt { get; set; }

    /// <summary>
    /// E.g. &quot;Opened&quot;, &quot;Downloaded&quot;, &quot;Approved&quot;
    /// </summary>
    public string? ActionTaken { get; set; }

    public virtual Nomination Nomination { get; set; } = null!;

    public virtual Employee ViewedByEmployee { get; set; } = null!;
}
