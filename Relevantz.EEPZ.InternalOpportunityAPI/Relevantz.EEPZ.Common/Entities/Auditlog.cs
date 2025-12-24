using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Auditlog
{
    public int LogId { get; set; }

    public int? UserId { get; set; }

    public string Action { get; set; } = null!;

    public string? Details { get; set; }

    public string? IpAddress { get; set; }

    public DateTime Timestamp { get; set; }

    public virtual Userauthentication? User { get; set; }
}
