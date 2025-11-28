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
        public int CurrentApprovalLevel { get; set; }
        public int? L1ManagerUserId { get; set; }
        public string L1ManagerName { get; set; }
        public string L1ReviewRemarks { get; set; }
        public DateTime? L1ReviewedAt { get; set; }
        public string L1Status { get; set; }
        public int? L2ManagerUserId { get; set; }
        public string L2ManagerName { get; set; }
        public string L2ReviewRemarks { get; set; }
        public DateTime? L2ReviewedAt { get; set; }
        public string L2Status { get; set; }
        public int? DeptHeadUserId { get; set; }
        public string DeptHeadName { get; set; }
        public string DeptHeadReviewRemarks { get; set; }
        public DateTime? DeptHeadReviewedAt { get; set; }
        public string DeptHeadStatus { get; set; }
        public int? ReviewedByUserId { get; set; }
        public string ReviewedByName { get; set; }
        public string ReviewRemarks { get; set; }
        public DateTime? ReviewedAt { get; set; }
    }
}
