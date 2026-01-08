using System.ComponentModel.DataAnnotations;
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class CreatePayrollRequestDto
    {
        [Required(ErrorMessage = "Employee User ID is required")]
        public int EmployeeUserId { get; set; }
        [Required(ErrorMessage = "Department ID is required")]
        public int DepartmentId { get; set; }
        [Required(ErrorMessage = "Payroll Period is required")]
        [StringLength(50, ErrorMessage = "Payroll Period cannot exceed 50 characters")]
        public string PayrollPeriod { get; set; } = string.Empty;
        [Required(ErrorMessage = "Old Salary is required")]
        [Range(0, double.MaxValue, ErrorMessage = "Old Salary must be greater than or equal to 0")]
        public decimal OldSalary { get; set; }
        [Required(ErrorMessage = "New Salary is required")]
        [Range(0, double.MaxValue, ErrorMessage = "New Salary must be greater than or equal to 0")]
        public decimal NewSalary { get; set; }
        [Required(ErrorMessage = "Effective Date is required")]
        public DateOnly EffectiveDate { get; set; }
        [StringLength(500, ErrorMessage = "Notes cannot exceed 500 characters")]
        public string? Notes { get; set; }
    }
}
