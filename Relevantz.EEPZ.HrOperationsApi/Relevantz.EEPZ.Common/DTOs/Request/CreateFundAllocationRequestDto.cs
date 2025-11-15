namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class CreateFundAllocationRequestDto
    {
        public int BudgetId { get; set; }
        public int DepartmentId { get; set; }
        public int? EmployeeUserId { get; set; }
        public string AllocationType { get; set; } = null!;
        public decimal Amount { get; set; }
        public string? GoalStatus { get; set; }
        public string? Notes { get; set; }
        public int AllocatedByUserId { get; set; }
        public string? Period { get; set; }
        public int? PeriodYear { get; set; }
    }
}
