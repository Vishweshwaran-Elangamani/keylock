using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Recognitionreward
{
    public int RewardId { get; set; }
    public int EmployeeId { get; set; }
    public string? RewardType { get; set; }
    public string? AmountGrade { get; set; }
    public string? Reason { get; set; }
    public DateTime? RewardDate { get; set; }
    public int? SubmittedBy { get; set; }
    public virtual Userauthentication Employee { get; set; } = null!;
    public virtual Userauthentication? SubmittedByNavigation { get; set; }
}
