using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Leadershipauditlog
{
    public int LogId { get; set; }
    public int? UserId { get; set; }
    public string? Action { get; set; }
    public string? TargetTable { get; set; }
    public int? TargetId { get; set; }
    public DateTime? Timestamp { get; set; }
    public string? Status { get; set; }
    public virtual Userauthentication? User { get; set; }
}
