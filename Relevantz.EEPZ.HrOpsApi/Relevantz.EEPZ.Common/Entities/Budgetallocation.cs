using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Budgetallocation
{
    public int AllocationId { get; set; }
    public int DepartmentId { get; set; }
    public int? EmployeeUserId { get; set; }
    public string AllocationType { get; set; } = null!;
    public decimal Amount { get; set; }
    public string? GoalStatus { get; set; }
    public string? Notes { get; set; }
    public int AllocatedByUserId { get; set; }
    public DateTime AllocatedAt { get; set; }
    public int? BudgetId { get; set; }
    public decimal? UtilizedAmount { get; set; }
    public decimal? UtilizationPercentage { get; set; }
    public DateTime? UpdatedAt { get; set; }
    /// <summary>
    /// Q1, Q2, Q3, Q4
    /// </summary>
    public string? Period { get; set; }
    public int? PeriodYear { get; set; }
    public virtual Userauthentication AllocatedByUser { get; set; } = null!;
    public virtual Departmentbudget? Budget { get; set; }
    public virtual Department Department { get; set; } = null!;
    public virtual Userauthentication? EmployeeUser { get; set; }
}
