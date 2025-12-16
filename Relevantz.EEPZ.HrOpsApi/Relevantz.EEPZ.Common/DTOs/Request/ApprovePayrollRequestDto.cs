using System.ComponentModel.DataAnnotations;
 
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class ApprovePayrollRequestDto
    {
        [Required(ErrorMessage = "Payroll ID is required")]
        public int PayrollId { get; set; }
 
        [Required(ErrorMessage = "Approved By User ID is required")]
        public int ApprovedByUserId { get; set; }
 
        [StringLength(500, ErrorMessage = "Notes cannot exceed 500 characters")]
        public string? Notes { get; set; }
    }
}
 
 