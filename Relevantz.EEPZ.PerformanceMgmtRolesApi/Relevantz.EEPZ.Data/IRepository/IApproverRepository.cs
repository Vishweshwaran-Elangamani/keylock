using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.Repository.Interfaces;
namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IApproverRepository
    {

        Task<IEnumerable<ApproverAssignmentRowDto>> GetApproverSubmittedFormsAsync(int approverUserId, int page, int pageSize);
        Task<IEnumerable<ApproverAssignmentRowDto>> GetApproverReworkFormsAsync(int approverUserId, int page, int pageSize);
        Task<IEnumerable<ApproverAssignmentRowDto>> GetSubmittedL1RatingsAsync(int approverUserId, int page, int pageSize);
        Task<IEnumerable<ReviewerAssessmentViewDto>> GetApproverAssessmentsWithDetailsAsync(int approverUserId, int page, int pageSize);
        Task<ReviewerAssessmentViewDto?> GetAssessmentForApproverAsync(int approverUserId, int assessmentId);


        Task<int> SaveApproverReviewAsync(int approverUserId, SubmitReviewDto dto);
        Task<bool> SetApproverDecisionAsync(int approverUserId, int assessmentId, string decision, string? approverComment);
        Task SubmitApproverReviewsAsync(int approverId, int assessmentId, List<ReviewItemDto> items);


        Task<List<AttachmentInfoDto>> GetAssessmentAttachmentsAsync(int assessmentId);

        Task<Selfassessmentattachment?> GetAttachmentByIdAsync(int attachmentId);

        Task<ReviewerDecisionDto?> GetLatestReviewerDecisionAsync(int assessmentId);

    }
}

