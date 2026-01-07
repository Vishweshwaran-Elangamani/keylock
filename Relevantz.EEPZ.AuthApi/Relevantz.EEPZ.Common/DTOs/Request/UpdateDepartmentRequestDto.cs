using System.ComponentModel.DataAnnotations;
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class UpdateDepartmentRequestDto
    {
        [Required(ErrorMessage = "Department ID is required")]
        public int DepartmentId { get; set; }
        [StringLength(100)]
        public string? DepartmentName { get; set; }
        [StringLength(20, ErrorMessage = "Department Code cannot exceed 20 characters")]
        [RegularExpression(@"^[A-Z0-9_-]+$", ErrorMessage = "Department Code must contain only uppercase letters, numbers, hyphens, and underscores")]
        public string? DepartmentCode { get; set; }
        [StringLength(255)]
        public string? Description { get; set; }
        [RegularExpression("^(Active|Inactive)$", ErrorMessage = "Status must be either 'Active' or 'Inactive'")]
        public string? Status { get; set; }
        public int? ParentDepartmentId { get; set; }
        public int? HodEmployeeId { get; set; }
        // Legacy fields - kept for backward compatibility
        public decimal? BudgetAllocated { get; set; }
        [StringLength(50)]
        public string? CostCenter { get; set; }
    }
}
