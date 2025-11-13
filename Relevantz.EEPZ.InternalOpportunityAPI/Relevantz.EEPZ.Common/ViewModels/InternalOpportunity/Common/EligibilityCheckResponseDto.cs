using System;

namespace Relevantz.EEPZ.Common.ViewModels.Common
{
    public class EligibilityCheckResponseDto
    {
        public int OpportunityId { get; set; }
        public string OpportunityName { get; set; }
        public bool IsEligible { get; set; }
        public string Message { get; set; }
        public string EligibilityCriteria { get; set; }
    }
}
