using System.ComponentModel.DataAnnotations;
 
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class RejectPromotionRequestDto
    {
        [Required(ErrorMessage = "Promotion ID is required")]
        public int PromotionId { get; set; }
 
        [Required(ErrorMessage = "Rejected By User ID is required")]
        public int RejectedByUserId { get; set; }
 
        [Required(ErrorMessage = "Rejection reason is required")]
        [StringLength(500, MinimumLength = 20, ErrorMessage = "Rejection reason must be between 20 and 500 characters")]
        public string RejectionReason { get; set; } = string.Empty;
    }
}
 
 