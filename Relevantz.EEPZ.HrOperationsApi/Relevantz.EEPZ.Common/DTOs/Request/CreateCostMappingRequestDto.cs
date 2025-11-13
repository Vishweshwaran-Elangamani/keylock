using System.ComponentModel.DataAnnotations;
 
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class CreateCostMappingRequestDto
    {
        [Required(ErrorMessage = "Department ID is required")]
        public int DepartmentId { get; set; }
 
        [Required(ErrorMessage = "Fiscal year is required")]
        [Range(2020, 2100, ErrorMessage = "Fiscal year must be between 2020 and 2100")]
        public int FiscalYear { get; set; }
 
        [Required(ErrorMessage = "Total budget is required")]
        [Range(0, 999999999.99, ErrorMessage = "Total budget must be between 0 and 999,999,999.99")]
        public decimal TotalBudget { get; set; }
 
        [Range(0, int.MaxValue, ErrorMessage = "Headcount must be a positive number")]
        public int? Headcount { get; set; }
    }
}
 
 