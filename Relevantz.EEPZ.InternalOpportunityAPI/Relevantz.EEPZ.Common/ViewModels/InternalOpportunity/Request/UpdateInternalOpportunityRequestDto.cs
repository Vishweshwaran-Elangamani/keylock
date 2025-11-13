using System;
using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Common.ViewModels.InternalOpportunity.Request
{
    public class UpdateInternalOpportunityRequestDto
    {
        [StringLength(200, MinimumLength = 5, ErrorMessage = "Opportunity name must be between 5 and 200 characters")]
        public string OpportunityName { get; set; }

        public int? DepartmentId { get; set; }

        [StringLength(1000)]
        public string Description { get; set; }

        [StringLength(500)]
        public string Requirements { get; set; }

        [StringLength(500)]
        public string EligibilityCriteria { get; set; }

        public DateOnly? Deadline { get; set; }

        public string Status { get; set; }
    }
}
