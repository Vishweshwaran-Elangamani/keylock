using System;

namespace Relevantz.EEPZ.Common.ViewModels.Nomination.Response
{
    public class MyNominationResponseDto
    {
        public int NominationId { get; set; }
        public string OpportunityName { get; set; }
        public string Status { get; set; }
        public string Justification { get; set; }
        public DateTime SubmittedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public string ManagerReviewStatus { get; set; }
        public string DepartmentHeadStatus { get; set; }
        public decimal? MeritScore { get; set; }
        public string ReviewRemarks { get; set; }
    }
}
