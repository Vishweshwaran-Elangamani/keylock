using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.Entities;
 
namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IManagerReviewRepository
    {
        // L1 — Approver view
        Task<IEnumerable<ApproverAssignmentRowDto>> GetApproverSubmittedFormsAsync(
            int approverUserId, int page, int pageSize);
 
        // L2 — Reviewer view
        // L2-only projects: visible immediately.
        // Projects with L1: visible only after at least one L1 (Approver) review exists.
        Task<IEnumerable<ApproverAssignmentRowDto>> GetReviewerSubmittedFormsAsync(
            int reviewerUserId, int page, int pageSize);

            // Add after SaveApproverReviewAsync (around line 23):

Task SubmitApproverReviewsAsync(int approverId, int assessmentId, List<ReviewItemDto> items);
 
// Add after SaveReviewerReviewAsync (around line 28):

Task SubmitReviewerReviewsAsync(int reviewerUserId, int assessmentId, List<ReviewItemDto> items);

 
 
        // L1 — submit ratings & comments (per-detail records in AssessmentReview)
        Task<int> SaveApproverReviewAsync(int approverUserId, SubmitReviewDto dto);
 
        // L2 read a single assessment with employee + L1 + (latest) L2 per-competency
        Task<ReviewerAssessmentViewDto?> GetAssessmentForReviewerAsync(int reviewerUserId, int assessmentId);
 
        // L2 save ratings/comments per-competency
        Task<int> SaveReviewerReviewAsync(int reviewerUserId, SubmitReviewDto dto);
 
        // L2 approve/reject decision for the assessment
        Task<bool> SetReviewerDecisionAsync(int reviewerUserId, int assessmentId, string decision, string? reviewerComment);
 
        Task<IEnumerable<ApproverAssignmentRowDto>> GetApproverReworkFormsAsync(
        int approverUserId, int page, int pageSize);
 
        Task<ReviewerAssessmentViewDto?> GetAssessmentForApproverAsync(int approverUserId, int assessmentId);
        Task<IEnumerable<ReviewerAssessmentViewDto>> GetApproverAssessmentsWithDetailsAsync(
    int approverUserId, int page, int pageSize);
        Task<IEnumerable<ReviewerAssessmentViewDto>> GetReviewerAssessmentsWithDetailsAsync(
    int reviewerUserId, int page, int pageSize);
        Task<ReviewerDecisionDto?> GetLatestReviewerDecisionAsync(int assessmentId);
   
    }
}
 