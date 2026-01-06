namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class DepartmentHierarchyResponseDto
    {
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public string DepartmentCode { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = string.Empty;
        public int? ParentDepartmentId { get; set; }
        public int? HodEmployeeId { get; set; }
        public string? HodEmployeeName { get; set; }
        public string? HodEmployeeCompanyId { get; set; }
        public int Level { get; set; }
        public string HierarchyPath { get; set; } = string.Empty;
        public List<DepartmentHierarchyResponseDto> Children { get; set; } = new List<DepartmentHierarchyResponseDto>();
        public bool HasChildren => Children.Any();
        public int DirectChildCount => Children.Count;
        public int TotalChildCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
