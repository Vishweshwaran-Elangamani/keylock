namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class FundAllocationResponseDto
    {
        public int AllocationId { get; set; }
        public int? BudgetId { get; set; }  
 
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public int? EmployeeUserId { get; set; }
        public string? EmployeeEmail { get; set; }
        public string AllocationType { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string? GoalStatus { get; set; }
        public string? Notes { get; set; }
        public int AllocatedByUserId { get; set; }
        public string AllocatedByEmail { get; set; } = string.Empty;
        public DateTime AllocatedAt { get; set; }

        public decimal UtilizedAmount { get; set; }  
        public decimal UtilizationPercentage { get; set; }  
        public DateTime? UpdatedAt { get; set; }  
    
 
    }
}
 
 