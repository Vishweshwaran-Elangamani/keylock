using System.ComponentModel.DataAnnotations;
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class AssignRoleDepartmentRequestDto
    {
        [Required(ErrorMessage = "Employee ID is required")]
        public int EmployeeId { get; set; }
        [Required(ErrorMessage = "Role ID is required")]
        public int RoleId { get; set; }
        [Required(ErrorMessage = "Department ID is required")]
        public int DepartmentId { get; set; }
    }
}
