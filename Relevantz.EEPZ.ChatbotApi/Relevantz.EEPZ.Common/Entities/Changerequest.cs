using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Changerequest
{
    public int RequestId { get; set; }

    public int EmployeeId { get; set; }

    public string ChangeType { get; set; } = null!;

    public string? NewEmployeeCompanyId { get; set; }

    public string? NewEmail { get; set; }

    public string? CurrentValue { get; set; }

    public string? NewValue { get; set; }

    public string? Reason { get; set; }

    public string Status { get; set; } = null!;

    public int? RequestedByUserId { get; set; }

    public int? ApprovedByUserId { get; set; }

    public string? AdminRemarks { get; set; }

    public DateTime RequestedAt { get; set; }

    public DateTime? ProcessedAt { get; set; }

    public string? CurrentPassword { get; set; }

    public virtual Employee Employee { get; set; } = null!;
}
