namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class DepartmentHierarchyResponseDto
    {
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public string DepartmentCode { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = string.Empty;
        
        // Parent reference
        public int? ParentDepartmentId { get; set; }
        
        // HOD information
        public int? HodEmployeeId { get; set; }
        public string? HodEmployeeName { get; set; }
        public string? HodEmployeeCompanyId { get; set; }

        // Hierarchy metadata
        public int Level { get; set; }
        public string HierarchyPath { get; set; } = string.Empty;

        // Recursive children for tree structure
        public List<DepartmentHierarchyResponseDto> Children { get; set; } = new List<DepartmentHierarchyResponseDto>();
        
        // Convenience properties
        public bool HasChildren => Children.Any();
        public int DirectChildCount => Children.Count;
        public int TotalChildCount { get; set; }

        // Timestamps
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
