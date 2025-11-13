using System;

namespace Relevantz.EEPZ.Common.ViewModels.Nomination.Response
{
    public class NominationDetailResponseDto
    {
        public int NominationId { get; set; }
        public int OpportunityId { get; set; }
        public string OpportunityName { get; set; }
        public string OpportunityDescription { get; set; }
        public int NomineeUserId { get; set; }
        public string NomineeName { get; set; }
        public string NomineeEmail { get; set; }
        public int NomineeCurrentDepartmentId { get; set; }
        public string NomineeCurrentDepartment { get; set; }
        public string NominationType { get; set; }
        public int NominatedByUserId { get; set; }
        public string NominatedByName { get; set; }
        public string Justification { get; set; }
        public string Status { get; set; }
        public DateTime SubmittedAt { get; set; }
        public ManagerReviewDetailDto ManagerReview { get; set; }
        public DepartmentHeadReviewDetailDto DepartmentHeadReview { get; set; }
    }

    public class ManagerReviewDetailDto
    {
        public int ViewedByUserId { get; set; }
        public string ViewedByName { get; set; }
        public string ActionTaken { get; set; }
        public DateTime ViewedAt { get; set; }
    }

    public class DepartmentHeadReviewDetailDto
    {
        public int ReviewedByUserId { get; set; }
        public string ReviewedByName { get; set; }
        public string ReviewRemarks { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public decimal? MeritScore { get; set; }
        public decimal? DiversityScore { get; set; }
        public bool ConflictOfInterest { get; set; }
        public string ReviewNotes { get; set; }
    }
}
