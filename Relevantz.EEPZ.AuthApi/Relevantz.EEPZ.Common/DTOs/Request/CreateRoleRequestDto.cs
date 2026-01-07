using System.ComponentModel.DataAnnotations;
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class CreateRoleRequestDto
    {
        [Required(ErrorMessage = "Role Name is required")]
        [StringLength(50)]
        public string RoleName { get; set; } = string.Empty;
        [Required(ErrorMessage = "Role Code is required")]
        [StringLength(20)]
        public string RoleCode { get; set; } = string.Empty;
        [StringLength(255)]
        public string? Description { get; set; }
    }
}
