using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class UpdateDepartmentRequestDto
    {
        [Required(ErrorMessage = "Department ID is required")]
        public int DepartmentId { get; set; }

        [StringLength(100)]
        public string? DepartmentName { get; set; }

        public decimal? BudgetAllocated { get; set; }

        [StringLength(50)]
        public string? CostCenter { get; set; }
    }
}
