using System.ComponentModel.DataAnnotations;
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class UpdateCostMappingRequestDto
    {
        [Required(ErrorMessage = "Budget ID is required")]
        public int BudgetId { get; set; }
        [Range(0, 999999999.99, ErrorMessage = "Total budget must be between 0 and 999,999,999.99")]
        public decimal? TotalBudget { get; set; }
        [Range(0, 999999999.99, ErrorMessage = "Allocated amount must be between 0 and 999,999,999.99")]
        public decimal? AllocatedAmount { get; set; }
        [Range(0, 999999999.99, ErrorMessage = "Utilized amount must be between 0 and 999,999,999.99")]
        public decimal? UtilizedAmount { get; set; }
        [Range(0, int.MaxValue, ErrorMessage = "Headcount must be a positive number")]
        public int? Headcount { get; set; }
    }
}
