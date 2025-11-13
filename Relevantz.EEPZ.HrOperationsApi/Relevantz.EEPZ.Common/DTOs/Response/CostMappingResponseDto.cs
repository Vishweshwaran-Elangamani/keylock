namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class CostMappingResponseDto
    {
        public int BudgetId { get; set; }
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public int FiscalYear { get; set; }
        public decimal TotalBudget { get; set; }
        public decimal AllocatedAmount { get; set; }
        public decimal UtilizedAmount { get; set; }
        public decimal UtilizationPercentage { get; set; }
        public int Headcount { get; set; }
        public decimal AvgCostPerEmployee { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
 
 