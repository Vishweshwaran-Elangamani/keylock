using System;

namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class EmployeeBasicInfo
    {
        public int EmployeeMasterId { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeCompanyId { get; set; } = null!;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? RoleName { get; set; }
        public string? DepartmentName { get; set; }
        public bool IsPrimary { get; set; }
    }

    public class DepartmentDto
    {
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public decimal? BudgetAllocated { get; set; }
        public string? CostCenter { get; set; }
    }

    public class DepartmentDetailDto
    {
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public decimal? BudgetAllocated { get; set; }
        public string? CostCenter { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
