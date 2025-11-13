namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class DepartmentResponseDto
    {
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public decimal? BudgetAllocated { get; set; }
        public string? CostCenter { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
