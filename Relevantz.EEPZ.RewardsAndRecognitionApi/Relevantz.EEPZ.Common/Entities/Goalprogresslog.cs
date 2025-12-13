using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Goalprogresslog
{
    public int ProgressId { get; set; }

    public int GoalId { get; set; }

    public int? UpdatedBy { get; set; }

    public DateTime? UpdatedOn { get; set; }

    public int? ProgressPercent { get; set; }

    public string? Source { get; set; }

    public virtual Goal Goal { get; set; } = null!;

    public virtual Employeedetailsmaster? UpdatedByNavigation { get; set; }
}
