namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class PeriodAllocationResponseDto
    {
        public int PeriodAllocationId { get; set; }
        public int BudgetId { get; set; }
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = null!;
        public string Period { get; set; } = null!;
        public int PeriodYear { get; set; }
        public decimal AllocatedAmount { get; set; }
        public decimal UtilizedAmount { get; set; }
        public decimal UtilizationPercentage { get; set; }
        public int AllocatedByUserId { get; set; }
        public string AllocatedByEmail { get; set; } = null!;
        public DateTime AllocatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? Notes { get; set; }
        
        // Calculated fields
        public decimal RemainingAmount { get; set; }
        public int SubAllocationCount { get; set; }
    }
}
