// IManagerReviewRepository.cs
using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Response;
 
namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IManagerReviewRepository
    {
        // L1 — Approver view
        Task<IEnumerable<ApproverAssignmentRowDto>> GetApproverSubmittedFormsAsync(
            int approverUserId, int page, int pageSize);
 
        // L2 — Reviewer view
        Task<IEnumerable<ApproverAssignmentRowDto>> GetReviewerSubmittedFormsAsync(
            int reviewerUserId, int page, int pageSize);
 
        Task SubmitApproverReviewsAsync(int approverId, int assessmentId, List<ReviewItemDto> items);
 
        Task SubmitReviewerReviewsAsync(int reviewerUserId, int assessmentId, List<ReviewItemDto> items);
 
        // L1 — submit ratings & comments
        Task<int> SaveApproverReviewAsync(int approverUserId, SubmitReviewDto dto);
 
        // L2 read a single assessment
        Task<ReviewerAssessmentViewDto?> GetAssessmentForReviewerAsync(int reviewerUserId, int assessmentId);
 
        // L2 save ratings/comments per-competency
        Task<int> SaveReviewerReviewAsync(int reviewerUserId, SubmitReviewDto dto);
 
        // L2 approve/reject decision
        Task<bool> SetReviewerDecisionAsync(int reviewerUserId, int assessmentId, string decision, string? reviewerComment);
 
        Task<IEnumerable<ApproverAssignmentRowDto>> GetApproverReworkFormsAsync(
            int approverUserId, int page, int pageSize);
 
        Task<ReviewerAssessmentViewDto?> GetAssessmentForApproverAsync(int approverUserId, int assessmentId);
        
        Task<IEnumerable<ReviewerAssessmentViewDto>> GetApproverAssessmentsWithDetailsAsync(
            int approverUserId, int page, int pageSize);
        
        Task<IEnumerable<ReviewerAssessmentViewDto>> GetReviewerAssessmentsWithDetailsAsync(
            int reviewerUserId, int page, int pageSize);
        
        Task<ReviewerDecisionDto?> GetLatestReviewerDecisionAsync(int assessmentId);
        
        // ✅ NEW: Get attachments for an assessment
        Task<List<AttachmentInfoDto>> GetAssessmentAttachmentsAsync(int assessmentId);
    }
}
