using System.ComponentModel.DataAnnotations;
 
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class AcknowledgeRequestDto
    {
        [Required(ErrorMessage = "ApprovalId is required")]
        public int ApprovalId { get; set; }
 
        [Required(ErrorMessage = "Comments are required")]
        [MinLength(10, ErrorMessage = "Please provide at least 10 characters")]
        [MaxLength(2000, ErrorMessage = "Comments cannot exceed 2000 characters")]
        public string Comments { get; set; } = string.Empty;
    }
}
 
 