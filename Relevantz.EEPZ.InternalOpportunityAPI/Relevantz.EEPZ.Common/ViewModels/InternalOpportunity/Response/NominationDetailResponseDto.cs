// using System;

// namespace Relevantz.EEPZ.Common.ViewModels.Nomination.Response
// {
//     public class NominationDetailResponseDto
//     {
//         public int NominationId { get; set; }
//         public int OpportunityId { get; set; }
//         public string OpportunityName { get; set; }
//         public string OpportunityDescription { get; set; }
//         public int NomineeUserId { get; set; }
//         public string NomineeName { get; set; }
//         public string NomineeEmail { get; set; }
//         public int NomineeCurrentDepartmentId { get; set; }
//         public string NomineeCurrentDepartment { get; set; }
//         public string NominationType { get; set; }
//         public int NominatedByUserId { get; set; }
//         public string NominatedByName { get; set; }
//         public string Justification { get; set; }
//         public string Status { get; set; }
//         public DateTime SubmittedAt { get; set; }
//         public ManagerReviewDetailDto ManagerReview { get; set; }
//         public DepartmentHeadReviewDetailDto DepartmentHeadReview { get; set; }
//     }

//     public class ManagerReviewDetailDto
//     {
//         public int ViewedByUserId { get; set; }
//         public string ViewedByName { get; set; }
//         public string ActionTaken { get; set; }
//         public DateTime ViewedAt { get; set; }
//     }

//     public class DepartmentHeadReviewDetailDto
//     {
//         public int ReviewedByUserId { get; set; }
//         public string ReviewedByName { get; set; }
//         public string ReviewRemarks { get; set; }
//         public DateTime? ReviewedAt { get; set; }
//         public decimal? MeritScore { get; set; }
//         public decimal? DiversityScore { get; set; }
//         public bool ConflictOfInterest { get; set; }
//         public string ReviewNotes { get; set; }
//     }
// }

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
        
        // ✅ NEW: Current approval level
        public int CurrentApprovalLevel { get; set; }
        
        // ✅ NEW: L1 Manager review details
        public L1ManagerReviewDetailDto L1ManagerReview { get; set; }
        
        // ✅ NEW: L2 Manager review details
        public L2ManagerReviewDetailDto L2ManagerReview { get; set; }
        
        // ✅ UPDATED: Department Head review details
        public DepartmentHeadReviewDetailDto DepartmentHeadReview { get; set; }
        
        // ✅ LEGACY: Keep for backward compatibility (deprecated)
        [Obsolete("Use L1ManagerReview and L2ManagerReview instead")]
        public ManagerReviewDetailDto ManagerReview { get; set; }
    }

    // ✅ NEW: L1 Manager Review Details
    public class L1ManagerReviewDetailDto
    {
        public int? L1ManagerUserId { get; set; }
        public string L1ManagerName { get; set; }
        public string ReviewRemarks { get; set; }
        public string Status { get; set; } // Approved/Rejected/Pending
        public DateTime? ReviewedAt { get; set; }
    }

    // ✅ NEW: L2 Manager Review Details
    public class L2ManagerReviewDetailDto
    {
        public int? L2ManagerUserId { get; set; }
        public string L2ManagerName { get; set; }
        public string ReviewRemarks { get; set; }
        public string Status { get; set; } // Approved/Rejected/Pending
        public DateTime? ReviewedAt { get; set; }
    }

    // ✅ LEGACY: Keep for backward compatibility
    [Obsolete("Use L1ManagerReviewDetailDto and L2ManagerReviewDetailDto instead")]
    public class ManagerReviewDetailDto
    {
        public int ViewedByUserId { get; set; }
        public string ViewedByName { get; set; }
        public string ActionTaken { get; set; }
        public DateTime ViewedAt { get; set; }
    }

    public class DepartmentHeadReviewDetailDto
    {
        public int? DeptHeadUserId { get; set; }
        public string DeptHeadName { get; set; }
        public string ReviewRemarks { get; set; }
        public string Status { get; set; } // Approved/Rejected/Pending
        public DateTime? ReviewedAt { get; set; }
        public decimal? MeritScore { get; set; }
        public decimal? DiversityScore { get; set; }
        public bool ConflictOfInterest { get; set; }
        public string ReviewNotes { get; set; }
    }
}
