using System.ComponentModel.DataAnnotations;
 
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class CreateResponsibilityDistributionRequestDto
    {
        [Required(ErrorMessage = "Team ID is required")]
        public int TeamId { get; set; }
 
        [Required(ErrorMessage = "Manager User ID is required")]
        public int ManagerUserId { get; set; }
 
        [Required(ErrorMessage = "Member count is required")]
        [Range(1, 1000, ErrorMessage = "Member count must be between 1 and 1000")]
        public int MemberCount { get; set; }
 
        [Required(ErrorMessage = "Tasks distributed is required")]
        [Range(0, 10000, ErrorMessage = "Tasks distributed must be between 0 and 10000")]
        public int TasksDistributed { get; set; }
 
        [StringLength(20, ErrorMessage = "Status cannot exceed 20 characters")]
        public string? Status { get; set; } = "Active";
 
        public DateTime? EvaluationDate { get; set; }
    }
}
 
 