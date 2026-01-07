using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Loginattempt
{
    public int AttemptId { get; set; }
    public string Email { get; set; } = null!;
    public DateTime AttemptTime { get; set; }
    public bool IsSuccessful { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? FailureReason { get; set; }
    public int? UserId { get; set; }
    public virtual Userauthentication? User { get; set; }
}
