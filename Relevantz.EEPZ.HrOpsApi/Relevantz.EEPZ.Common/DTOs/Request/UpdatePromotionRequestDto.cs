using System.ComponentModel.DataAnnotations;
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class UpdatePromotionRequestDto
    {
        [Required(ErrorMessage = "Promotion ID is required")]
        public int PromotionId { get; set; }
        [Required(ErrorMessage = "New Role is required")]
        [StringLength(100, ErrorMessage = "New Role cannot exceed 100 characters")]
        public string NewRole { get; set; } = string.Empty;
        [Required(ErrorMessage = "Promotion Date is required")]
        public DateOnly PromotionDate { get; set; }
        [StringLength(1000, ErrorMessage = "Justification cannot exceed 1000 characters")]
        public string? Justification { get; set; }
    }
}
