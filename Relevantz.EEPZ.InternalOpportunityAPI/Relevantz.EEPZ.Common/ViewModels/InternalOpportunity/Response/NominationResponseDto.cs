using System;

namespace Relevantz.EEPZ.Common.ViewModels.Nomination.Response
{
    public class NominationResponseDto
    {
        public int NominationId { get; set; }
        public int OpportunityId { get; set; }
        public string OpportunityName { get; set; }
        public int NomineeUserId { get; set; }
        public string NomineeName { get; set; }
        public string NominationType { get; set; }
        public int NominatedByUserId { get; set; }
        public string NominatedByName { get; set; }
        public string Justification { get; set; }
        public string Status { get; set; }
        public DateTime SubmittedAt { get; set; }
        public int? ReviewedByUserId { get; set; }
        public string ReviewedByName { get; set; }
        public string ReviewRemarks { get; set; }
        public DateTime? ReviewedAt { get; set; }
    }
}
