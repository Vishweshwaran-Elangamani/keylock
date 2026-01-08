using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Payroll
{
    public int PayrollId { get; set; }
    public int EmployeeUserId { get; set; }
    public int DepartmentId { get; set; }
    public string PayrollPeriod { get; set; } = null!;
    public decimal? OldSalary { get; set; }
    public decimal NewSalary { get; set; }
    public decimal? IncrementPercentage { get; set; }
    public DateOnly EffectiveDate { get; set; }
    public string Status { get; set; } = null!;
    public int? ApprovedByUserId { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public virtual Userauthentication? ApprovedByUser { get; set; }
    public virtual Department Department { get; set; } = null!;
    public virtual Userauthentication EmployeeUser { get; set; } = null!;
}
