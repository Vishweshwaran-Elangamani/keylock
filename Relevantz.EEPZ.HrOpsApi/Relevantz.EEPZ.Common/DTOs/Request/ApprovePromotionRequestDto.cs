using System.ComponentModel.DataAnnotations;
 
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class ApprovePromotionRequestDto
    {
        [Required(ErrorMessage = "Promotion ID is required")]
        public int PromotionId { get; set; }
 
        [Required(ErrorMessage = "Approved By User ID is required")]
        public int ApprovedByUserId { get; set; }

        
        [Required(ErrorMessage = "Old Salary is required")]
        [Range(0, double.MaxValue, ErrorMessage = "Old Salary must be greater than or equal to 0")]
        public decimal OldSalary { get; set; }
 
        [Required(ErrorMessage = "New Salary is required")]
        [Range(0, double.MaxValue, ErrorMessage = "New Salary must be greater than or equal to 0")]
        public decimal NewSalary { get; set; }
 
        [StringLength(500, ErrorMessage = "Notes cannot exceed 500 characters")]
        public string? Notes { get; set; }
    }
}
 
 