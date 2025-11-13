using System.ComponentModel.DataAnnotations;
 
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class ApprovalRequestDto
    {
        [Required(ErrorMessage = "EmployeeId is required")]
        public int EmployeeId { get; set; }
 
        [Required(ErrorMessage = "ProjectId is required")]
        public int ProjectId { get; set; }
 
        [Required(ErrorMessage = "AssessmentId is required")]
        public int AssessmentId { get; set; }
    }
}
 
 