using System.ComponentModel.DataAnnotations;
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class UpdateFundAllocationRequestDto
    {
        [Required(ErrorMessage = "Allocation ID is required")]
        public int AllocationId { get; set; }
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
        public decimal? Amount { get; set; }
        [StringLength(100, ErrorMessage = "Goal Status cannot exceed 100 characters")]
        public string? GoalStatus { get; set; }
        [StringLength(500, ErrorMessage = "Notes cannot exceed 500 characters")]
        public string? Notes { get; set; }
    }
}
