using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Department
{
    public int DepartmentId { get; set; }

    public string DepartmentName { get; set; } = null!;

    public decimal? BudgetAllocated { get; set; }

    public string? CostCenter { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<Budgetallocation> Budgetallocations { get; set; } = new List<Budgetallocation>();

    public virtual ICollection<Departmentbudget> Departmentbudgets { get; set; } = new List<Departmentbudget>();

    public virtual ICollection<Employeedetailsmaster> Employeedetailsmasters { get; set; } = new List<Employeedetailsmaster>();

    public virtual ICollection<Engagement> Engagements { get; set; } = new List<Engagement>();

    public virtual ICollection<Internalopportunity> Internalopportunities { get; set; } = new List<Internalopportunity>();

    public virtual ICollection<Organizationwideobjective> Organizationwideobjectives { get; set; } = new List<Organizationwideobjective>();

    public virtual ICollection<Payroll> Payrolls { get; set; } = new List<Payroll>();

    public virtual ICollection<Promotion> Promotions { get; set; } = new List<Promotion>();

    public virtual ICollection<Recognitiondetail> Recognitiondetails { get; set; } = new List<Recognitiondetail>();

    public virtual ICollection<Risk> Risks { get; set; } = new List<Risk>();

    public virtual ICollection<Slacompliance> Slacompliances { get; set; } = new List<Slacompliance>();

    public virtual ICollection<Sla> Slas { get; set; } = new List<Sla>();
}
