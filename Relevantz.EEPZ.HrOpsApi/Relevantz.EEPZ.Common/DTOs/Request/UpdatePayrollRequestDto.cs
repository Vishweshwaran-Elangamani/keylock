using System.ComponentModel.DataAnnotations;
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class UpdatePayrollRequestDto
    {
        [Required(ErrorMessage = "Payroll ID is required")]
        public int PayrollId { get; set; }
        [Required(ErrorMessage = "New Salary is required")]
        [Range(0, double.MaxValue, ErrorMessage = "New Salary must be greater than or equal to 0")]
        public decimal NewSalary { get; set; }
        [Required(ErrorMessage = "Effective Date is required")]
        public DateOnly EffectiveDate { get; set; }
        [StringLength(500, ErrorMessage = "Notes cannot exceed 500 characters")]
        public string? Notes { get; set; }
    }
}
