using System;
using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.ViewModels.Common
{
    public class EligibilityCheckRequestDto
    {
        [Required(ErrorMessage = "Opportunity ID is required")]
        public int OpportunityId { get; set; }
    }
}
