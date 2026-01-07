using System.ComponentModel.DataAnnotations;
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class UpdateRoleRequestDto
    {
        [Required(ErrorMessage = "Role ID is required")]
        public int RoleId { get; set; }
        [StringLength(50)]
        public string? RoleName { get; set; }
        [StringLength(20)]
        public string? RoleCode { get; set; }
        [StringLength(255)]
        public string? Description { get; set; }
    }
}
