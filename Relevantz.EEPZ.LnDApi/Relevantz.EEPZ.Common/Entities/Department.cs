using System;
using System.Collections.Generic;

namespace Relevantz.EEPZ.Common.Entities;

public partial class Department
{
    public int DepartmentId { get; set; }

    public string DepartmentName { get; set; } = null!;

    public string DepartmentCode { get; set; } = null!;

    public string? Description { get; set; }

    public string Status { get; set; } = null!;

    public int? ParentDepartmentId { get; set; }

    public int? HodEmployeeId { get; set; }

    public decimal? BudgetAllocated { get; set; }

    public string? CostCenter { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<Budgetallocation> Budgetallocations { get; set; } = new List<Budgetallocation>();

    public virtual ICollection<Departmentbudget> Departmentbudgets { get; set; } = new List<Departmentbudget>();

    public virtual ICollection<Employeedetailsmaster> Employeedetailsmasters { get; set; } = new List<Employeedetailsmaster>();

    public virtual ICollection<Engagement> Engagements { get; set; } = new List<Engagement>();

    public virtual Employee? HodEmployee { get; set; }

    public virtual ICollection<Internalopportunity> Internalopportunities { get; set; } = new List<Internalopportunity>();

    public virtual ICollection<Department> InverseParentDepartment { get; set; } = new List<Department>();

    public virtual ICollection<Organizationwideobjective> Organizationwideobjectives { get; set; } = new List<Organizationwideobjective>();

    public virtual Department? ParentDepartment { get; set; }

    public virtual ICollection<Payroll> Payrolls { get; set; } = new List<Payroll>();

    public virtual ICollection<Promotion> Promotions { get; set; } = new List<Promotion>();

    public virtual ICollection<Recognitiondetail> Recognitiondetails { get; set; } = new List<Recognitiondetail>();

    public virtual ICollection<Risk> Risks { get; set; } = new List<Risk>();

    public virtual ICollection<Slacompliance> Slacompliances { get; set; } = new List<Slacompliance>();

    public virtual ICollection<Sla> Slas { get; set; } = new List<Sla>();
}
