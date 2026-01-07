namespace Relevantz.EEPZ.Common.DTOs.Response
{
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
}
