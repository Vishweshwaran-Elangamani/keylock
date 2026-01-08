namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class PayrollResponseDto
    {
        public int PayrollId { get; set; }
        public int EmployeeUserId { get; set; }
        public string EmployeeEmail { get; set; } = string.Empty;
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public string PayrollPeriod { get; set; } = string.Empty;
        public decimal? OldSalary { get; set; }  
        public decimal? NewSalary { get; set; }
        public decimal? IncrementPercentage { get; set; }
        public DateOnly EffectiveDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public int? ApprovedByUserId { get; set; }
        public string? ApprovedByEmail { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
    }
}
