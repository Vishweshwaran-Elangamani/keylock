using System.ComponentModel.DataAnnotations;
namespace Relevantz.EEPZ.Common.DTOs.Request
{
    public class CreateNominationRequestDto
    {
        [Required(ErrorMessage = "Opportunity ID is required")]
        public int OpportunityId { get; set; }
        [Required(ErrorMessage = "Nominee User ID is required")]
        public int NomineeUserId { get; set; }
        [Required(ErrorMessage = "Nomination Type is required")]
        [RegularExpression("^(SelfNomination|ManagerNomination)$", ErrorMessage = "Nomination Type must be 'SelfNomination' or 'ManagerNomination'")]
        public string NominationType { get; set; } = string.Empty;
        [Required(ErrorMessage = "Nominated By User ID is required")]
        public int NominatedByUserId { get; set; }
        [Required(ErrorMessage = "Justification is required")]
        [StringLength(1000, MinimumLength = 50, ErrorMessage = "Justification must be between 50 and 1000 characters")]
        public string Justification { get; set; } = string.Empty;
    }
}
