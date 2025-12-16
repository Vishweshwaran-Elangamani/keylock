using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Nominationvisibilitytracking
{
    public int TrackingId { get; set; }

    public int NominationId { get; set; }

    public int ViewedByEmployeeId { get; set; }

    public DateTime ViewedAt { get; set; }

    public string? ActionTaken { get; set; }

    public virtual Recognitionstatus Nomination { get; set; } = null!;

    public virtual Employee ViewedByEmployee { get; set; } = null!;
}
