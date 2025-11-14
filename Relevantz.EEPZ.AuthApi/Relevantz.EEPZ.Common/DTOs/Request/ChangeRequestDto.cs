using System.ComponentModel.DataAnnotations;
 
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    /// <summary>
    /// Single DTO for both Employee submission and Admin processing
    /// </summary>
    public class ChangeRequestDto
    {
       
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string? NewEmail { get; set; }
 
        [StringLength(1000)]
        public string? Reason { get; set; }
       
        public int? RequestId { get; set; }
 
        [StringLength(50)]
        public string? Status { get; set; }
 
        [StringLength(500)]
        public string? AdminRemarks { get; set; }
    }
}
 
 