using System;

namespace Relevantz.EEPZ.Common.ViewModels.InternalOpportunity.Response
{
    public class InternalOpportunityResponseDto
    {
        public int OpportunityId { get; set; }
        public string OpportunityName { get; set; }
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; }
        public string Description { get; set; }
        public string Requirements { get; set; }
        public string EligibilityCriteria { get; set; }
        public DateOnly Deadline { get; set; }
        public string Status { get; set; }
        public int PostedByUserId { get; set; }
        public string PostedByName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
