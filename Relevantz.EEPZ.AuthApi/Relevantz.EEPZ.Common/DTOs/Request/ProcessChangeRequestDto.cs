using System.ComponentModel.DataAnnotations;
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class ProcessChangeRequestDto
    {
        [Required(ErrorMessage = "Request ID is required")]
        public int RequestId { get; set; }
        [Required(ErrorMessage = "Status is required")]
        public string Status { get; set; } = string.Empty; 
        [StringLength(500)]
        public string? AdminRemarks { get; set; }
    }
}
