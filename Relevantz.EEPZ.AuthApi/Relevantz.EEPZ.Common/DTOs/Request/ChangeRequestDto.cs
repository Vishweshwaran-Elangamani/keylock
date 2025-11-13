using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class ChangeRequestDto
    {
        [Required(ErrorMessage = "Change Type is required")]
        public string ChangeType { get; set; } = string.Empty;

        public string? NewEmployeeCompanyId { get; set; }

        [EmailAddress]
        public string? NewEmail { get; set; }

        public string? NewValue { get; set; }

        [StringLength(1000)]
        public string? Reason { get; set; }
    }
}
