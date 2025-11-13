using System;
using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.ViewModels.Nomination.Request
{
    public class CreateSelfNominationRequestDto
    {
        [Required(ErrorMessage = "Opportunity ID is required")]
        public int OpportunityId { get; set; }

        [StringLength(1000, MinimumLength = 10, ErrorMessage = "Justification must be between 10 and 1000 characters")]
        public string Justification { get; set; }
    }
}
