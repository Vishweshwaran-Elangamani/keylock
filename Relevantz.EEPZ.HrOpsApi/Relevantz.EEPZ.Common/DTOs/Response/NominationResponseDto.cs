namespace Relevantz.EEPZ.Common.DTOs.Response
{
    public class NominationResponseDto
    {
        public int NominationId { get; set; }
        public int OpportunityId { get; set; }
        public string OpportunityTitle { get; set; } = string.Empty;
        public int NomineeUserId { get; set; }
        public string NomineeEmail { get; set; } = string.Empty;
        public string NominationType { get; set; } = string.Empty;
        public int NominatedByUserId { get; set; }
        public string NominatedByEmail { get; set; } = string.Empty;
        public string Justification { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int? ReviewedByUserId { get; set; }
        public string? ReviewedByEmail { get; set; }
        public string? ReviewRemarks { get; set; }
        public DateTime SubmittedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
    }
}
 
 