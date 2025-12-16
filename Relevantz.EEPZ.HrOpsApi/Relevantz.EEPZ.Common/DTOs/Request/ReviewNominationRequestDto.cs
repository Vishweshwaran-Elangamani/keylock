using System.ComponentModel.DataAnnotations;
 
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class ReviewNominationRequestDto
    {
        [Required(ErrorMessage = "Nomination ID is required")]
        public int NominationId { get; set; }
 
        [Required(ErrorMessage = "Status is required")]
        [RegularExpression("^(Approved|Rejected)$", ErrorMessage = "Status must be 'Approved' or 'Rejected'")]
        public string Status { get; set; } = string.Empty;
 
        [Required(ErrorMessage = "Reviewed By User ID is required")]
        public int ReviewedByUserId { get; set; }
 
        [Required(ErrorMessage = "Review Remarks are required")]
        [StringLength(500, MinimumLength = 10, ErrorMessage = "Review Remarks must be between 10 and 500 characters")]
        public string ReviewRemarks { get; set; } = string.Empty;
    }
}
 
 