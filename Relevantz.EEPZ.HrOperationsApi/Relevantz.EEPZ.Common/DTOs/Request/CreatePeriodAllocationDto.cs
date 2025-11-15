namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class CreatePeriodAllocationDto
    {
        public int BudgetId { get; set; }
        public string Period { get; set; } = null!; // "Q1", "Q2", "Q3", "Q4"
        public int PeriodYear { get; set; }
        public decimal AllocatedAmount { get; set; }
        public int AllocatedByUserId { get; set; }
        public string? Notes { get; set; }
    }
}
