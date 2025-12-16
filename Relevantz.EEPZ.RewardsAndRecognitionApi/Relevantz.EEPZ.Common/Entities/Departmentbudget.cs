using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Departmentbudget
{
    public int BudgetId { get; set; }

    public int DepartmentId { get; set; }

    public int FiscalYear { get; set; }

    public decimal TotalBudget { get; set; }

    public decimal? AllocatedAmount { get; set; }

    public decimal? UtilizedAmount { get; set; }

    public decimal? UtilizationPercentage { get; set; }

    public int? Headcount { get; set; }

    public decimal? AvgCostPerEmployee { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<Budgetallocation> Budgetallocations { get; set; } = new List<Budgetallocation>();

    public virtual ICollection<Budgetperiodallocation> Budgetperiodallocations { get; set; } = new List<Budgetperiodallocation>();

    public virtual Department Department { get; set; } = null!;
}
