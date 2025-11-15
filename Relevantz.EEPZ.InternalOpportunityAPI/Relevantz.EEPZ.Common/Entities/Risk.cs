using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Risk
{
    public int RiskId { get; set; }

    public int? DepartmentId { get; set; }

    /// <summary>
    /// Attrition, Burnout, etc
    /// </summary>
    public string? RiskType { get; set; }

    /// <summary>
    /// Encoded graph data
    /// </summary>
    public string? TrendGraph { get; set; }

    public DateTime? PeriodStart { get; set; }

    public DateTime? PeriodEnd { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Department? Department { get; set; }
}
