namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class CreateDepartmentBudgetDto
    {
        public int DepartmentId { get; set; }
        public int FiscalYear { get; set; }
        public decimal TotalBudget { get; set; }
        public decimal? AllocatedAmount { get; set; }
    }
}
