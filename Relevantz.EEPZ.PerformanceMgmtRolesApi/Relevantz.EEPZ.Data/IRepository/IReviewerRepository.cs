using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IReviewerRepository
    {

        Task<IEnumerable<ApproverAssignmentRowDto>> GetReviewerSubmittedFormsAsync(int reviewerUserId, int page, int pageSize);
        Task<IEnumerable<ApproverAssignmentRowDto>> GetReviewerSubmittedRatingsAsync(int reviewerUserId, int page, int pageSize);
        Task<IEnumerable<ReviewerAssessmentViewDto>> GetReviewerAssessmentsWithDetailsAsync(int reviewerUserId, int page, int pageSize);
        Task<ReviewerAssessmentViewDto?> GetAssessmentForReviewerAsync(int reviewerUserId, int assessmentId);


        Task<int> SaveReviewerReviewAsync(int reviewerUserId, SubmitReviewDto dto);
        Task<bool> SetReviewerDecisionAsync(int reviewerUserId, int assessmentId, string decision, string? reviewerComment);
        Task SubmitReviewerReviewsAsync(int reviewerUserId, int assessmentId, List<ReviewItemDto> items);


        Task<List<AttachmentInfoDto>> GetAssessmentAttachmentsAsync(int assessmentId);


        Task<Selfassessmentattachment?> GetAttachmentByIdAsync(int attachmentId);
        Task<ReviewerDecisionDto?> GetLatestReviewerDecisionAsync(int assessmentId);
    }
}

