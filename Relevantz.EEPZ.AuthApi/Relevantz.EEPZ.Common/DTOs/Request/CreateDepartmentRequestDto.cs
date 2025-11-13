using System.ComponentModel.DataAnnotations;
 
namespace Relevantz.EEPZ.Common.DTOs.Request

{

    public class CreateDepartmentRequestDto

    {

        [Required(ErrorMessage = "Department Name is required")]

        [StringLength(100)]

        public string DepartmentName { get; set; } = string.Empty;
 
        [Required(ErrorMessage = "Department Code is required")]

        [StringLength(100)]

        public string DepartmentCode { get; set; } = string.Empty;
 
        [StringLength(255)]

        public string? Description { get; set; }
 
        public int? ManagerUserId { get; set; }
 
        public decimal? BudgetAllocated { get; set; }
 
        [StringLength(50)]

        public string? CostCenter { get; set; }

    }

}

 