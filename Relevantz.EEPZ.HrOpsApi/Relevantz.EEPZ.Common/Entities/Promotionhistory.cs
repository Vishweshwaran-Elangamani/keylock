using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Promotionhistory
{
    public int HistoryId { get; set; }
    public int EmployeeUserId { get; set; }
    public int PromotionId { get; set; }
    public string? FromRole { get; set; }
    public string ToRole { get; set; } = null!;
    public decimal SalaryChange { get; set; }
    public DateOnly PromotionDate { get; set; }
    public DateTime RecordedAt { get; set; }
    public virtual Userauthentication EmployeeUser { get; set; } = null!;
    public virtual Promotion Promotion { get; set; } = null!;
}
