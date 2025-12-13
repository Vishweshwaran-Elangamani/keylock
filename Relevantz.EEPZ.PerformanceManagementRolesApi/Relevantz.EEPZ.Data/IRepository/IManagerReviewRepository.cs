
using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IManagerReviewRepository
    {

        Task<IEnumerable<ApproverAssignmentRowDto>> GetApproverSubmittedFormsAsync(
            int approverUserId, int page, int pageSize);

        Task<IEnumerable<ApproverAssignmentRowDto>> GetReviewerSubmittedFormsAsync(
            int reviewerUserId, int page, int pageSize);

        Task SubmitApproverReviewsAsync(int approverId, int assessmentId, List<ReviewItemDto> items);

        Task SubmitReviewerReviewsAsync(int reviewerUserId, int assessmentId, List<ReviewItemDto> items);

        Task<int> SaveApproverReviewAsync(int approverUserId, SubmitReviewDto dto);

        Task<ReviewerAssessmentViewDto?> GetAssessmentForReviewerAsync(int reviewerUserId, int assessmentId);

        Task<int> SaveReviewerReviewAsync(int reviewerUserId, SubmitReviewDto dto);

        Task<bool> SetReviewerDecisionAsync(int reviewerUserId, int assessmentId, string decision, string? reviewerComment);

        Task<IEnumerable<ApproverAssignmentRowDto>> GetApproverReworkFormsAsync(
            int approverUserId, int page, int pageSize);

        Task<ReviewerAssessmentViewDto?> GetAssessmentForApproverAsync(int approverUserId, int assessmentId);

        Task<IEnumerable<ReviewerAssessmentViewDto>> GetApproverAssessmentsWithDetailsAsync(
            int approverUserId, int page, int pageSize);

        Task<IEnumerable<ReviewerAssessmentViewDto>> GetReviewerAssessmentsWithDetailsAsync(
            int reviewerUserId, int page, int pageSize);

        Task<ReviewerDecisionDto?> GetLatestReviewerDecisionAsync(int assessmentId);

        Task<List<AttachmentInfoDto>> GetAssessmentAttachmentsAsync(int assessmentId);
    }
}
