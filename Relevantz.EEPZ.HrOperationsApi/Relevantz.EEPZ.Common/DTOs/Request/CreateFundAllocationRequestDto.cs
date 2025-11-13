using System.ComponentModel.DataAnnotations;
 
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class CreateFundAllocationRequestDto
    {

         [Required(ErrorMessage = "Budget ID is required")]

        public int? BudgetId { get; set; }
 
        [Required(ErrorMessage = "Department ID is required")]
        public int DepartmentId { get; set; }
 
        public int? EmployeeUserId { get; set; }

        [Required(ErrorMessage = "Allocation Type is required")]
        [RegularExpression("^(Bonus|Promotion|Training|Other)$", ErrorMessage = "Allocation Type must be Bonus, Promotion, Training, or Other")]
        public string AllocationType { get; set; } = string.Empty;

         [Required(ErrorMessage = "AllocationName is required")]

         public string? AllocationName { get; set; }
 
 
        [Required(ErrorMessage = "Amount is required")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
        public decimal Amount { get; set; }
 
        [StringLength(100, ErrorMessage = "Goal Status cannot exceed 100 characters")]
        public string? GoalStatus { get; set; }
 
        [StringLength(500, ErrorMessage = "Notes cannot exceed 500 characters")]
        public string? Notes { get; set; }


 
        [Required(ErrorMessage = "Allocated By User ID is required")]
        public int AllocatedByUserId { get; set; }
    }
}
 
 