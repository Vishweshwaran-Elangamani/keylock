using System.ComponentModel.DataAnnotations;
 
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class CreatePromotionRequestDto
    {
        [Required(ErrorMessage = "Employee User ID is required")]
        public int EmployeeUserId { get; set; }
 
        [Required(ErrorMessage = "Department ID is required")]
        public int DepartmentId { get; set; }

        [Required(ErrorMessage = "Manager ID is required")]
        public int ManagerId { get; set; } 
 
        [Required(ErrorMessage = "Old Role is required")]
        [StringLength(100, ErrorMessage = "Old Role cannot exceed 100 characters")]
        public string OldRole { get; set; } = string.Empty;
 
        [Required(ErrorMessage = "New Role is required")]
        [StringLength(100, ErrorMessage = "New Role cannot exceed 100 characters")]
        public string NewRole { get; set; } = string.Empty;
 
        [Required(ErrorMessage = "Promotion Date is required")]
        public DateOnly PromotionDate { get; set; }
 
        [Required(ErrorMessage = "Justification is required")]
        [StringLength(1000, MinimumLength = 50, ErrorMessage = "Justification must be between 50 and 1000 characters")]
        public string Justification { get; set; } = string.Empty;

        public string? AdditionalJustification { get; set; }
    }
}
 
 