namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class UpdateDepartmentBudgetDto
    {
        public int BudgetId { get; set; }
        public int DepartmentId { get; set; }
        public int FiscalYear { get; set; }
        public decimal TotalBudget { get; set; }
        public decimal AllocatedAmount { get; set; }
    }
}
