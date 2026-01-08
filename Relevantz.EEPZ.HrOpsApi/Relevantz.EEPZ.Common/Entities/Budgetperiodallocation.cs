using System;
using System.Collections.Generic;
namespace Relevantz.EEPZ.Common.Entities;
public partial class Budgetperiodallocation
{
    public int PeriodAllocationId { get; set; }
    public int BudgetId { get; set; }
    /// <summary>
    /// Q1, Q2, Q3, Q4, H1, H2
    /// </summary>
    public string Period { get; set; } = null!;
    public int PeriodYear { get; set; }
    public decimal AllocatedAmount { get; set; }
    public decimal UtilizedAmount { get; set; }
    public decimal UtilizationPercentage { get; set; }
    public int AllocatedByUserId { get; set; }
    public DateTime AllocatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? Notes { get; set; }
    public virtual Userauthentication AllocatedByUser { get; set; } = null!;
    public virtual Departmentbudget Budget { get; set; } = null!;
}
