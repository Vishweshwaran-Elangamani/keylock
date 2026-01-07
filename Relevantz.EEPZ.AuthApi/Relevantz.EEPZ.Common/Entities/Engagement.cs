using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Engagement
{
    public int EngagementId { get; set; }
    public int? DepartmentId { get; set; }
    public decimal? EngagementScore { get; set; }
    public DateTime? PeriodStart { get; set; }
    public DateTime? PeriodEnd { get; set; }
    public decimal? TrendScore { get; set; }
    public DateTime? CreatedAt { get; set; }
    public virtual Department? Department { get; set; }
}
