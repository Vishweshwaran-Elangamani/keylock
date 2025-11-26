using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Slacompliance
{
    public int ComplianceId { get; set; }

    public int DepartmentId { get; set; }

    public int? TeamId { get; set; }

    public string Period { get; set; } = null!;

    public DateOnly PeriodStartDate { get; set; }

    public DateOnly PeriodEndDate { get; set; }

    public int TotalSlas { get; set; }

    public int OnTimeSlas { get; set; }

    public int BreachedSlas { get; set; }

    public int ExtendedSlas { get; set; }

    public int PendingSlas { get; set; }

    public decimal? CompliancePercentage { get; set; }

    public DateTime CalculatedAt { get; set; }

    public int? CalculatedBy { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Employee? CalculatedByNavigation { get; set; }

    public virtual Department Department { get; set; } = null!;
}
