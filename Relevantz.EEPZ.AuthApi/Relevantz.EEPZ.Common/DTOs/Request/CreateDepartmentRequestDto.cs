using System.ComponentModel.DataAnnotations;
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class CreateDepartmentRequestDto
    {
        [Required(ErrorMessage = "Department Name is required")]
        [StringLength(100)]
        public string DepartmentName { get; set; } = string.Empty;
        [Required(ErrorMessage = "Department Code is required")]
        [StringLength(20, ErrorMessage = "Department Code cannot exceed 20 characters")]
        [RegularExpression(@"^[A-Z0-9_-]+$", ErrorMessage = "Department Code must contain only uppercase letters, numbers, hyphens, and underscores")]
        public string DepartmentCode { get; set; } = string.Empty;
        [StringLength(255)]
        public string? Description { get; set; }
        [Required(ErrorMessage = "Status is required")]
        [RegularExpression("^(Active|Inactive)$", ErrorMessage = "Status must be either 'Active' or 'Inactive'")]
        public string Status { get; set; } = "Active";
        public int? ParentDepartmentId { get; set; }
        public int? HodEmployeeId { get; set; }
        public decimal? BudgetAllocated { get; set; }
        [StringLength(50)]
        public string? CostCenter { get; set; }
        [Obsolete("Use HodEmployeeId instead")]
        public int? ManagerUserId { get; set; }
    }
}
