namespace Relevantz.EEPZ.Common.DTOs.Response
{
    // Standard department response DTO
    public class DepartmentResponseDto
    {
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public string DepartmentCode { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = string.Empty;
        public int? ParentDepartmentId { get; set; }
        public string? ParentDepartmentName { get; set; }
        public int? HodEmployeeId { get; set; }
        public string? HodEmployeeName { get; set; }
        public string? HodEmployeeCompanyId { get; set; }
        public decimal? BudgetAllocated { get; set; }
        public string? CostCenter { get; set; }
        
        // Timestamps
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        
        public int ChildDepartmentCount { get; set; }
        public bool HasChildren { get; set; }
    }

    // Hierarchy wrapper - contains list of root departments
    public class DepartmentHierarchyResponseDto
    {
        public List<DepartmentHierarchyNodeDto> Departments { get; set; } = new();
    }

    // Individual node in hierarchy tree with recursive children
    public class DepartmentHierarchyNodeDto
    {
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public string DepartmentCode { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int? ParentDepartmentId { get; set; }
        public int? HodEmployeeId { get; set; }
        public string? HodEmployeeName { get; set; }
        public decimal? BudgetAllocated { get; set; }
        
        // Recursive children for tree structure
        public List<DepartmentHierarchyNodeDto> Children { get; set; } = new();
        
        // Computed properties
        public bool HasChildren => Children.Any();
        public int DirectChildCount => Children.Count;
    }
}
