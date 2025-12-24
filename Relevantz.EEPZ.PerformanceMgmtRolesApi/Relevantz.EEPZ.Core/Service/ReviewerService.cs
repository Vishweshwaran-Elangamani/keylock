using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Interfaces;
 
 
namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class ReviewerService : IReviewerService
    {
        private readonly IReviewerRepository _repository;
 
        public ReviewerService(IReviewerRepository repository)
        {
            _repository = repository;
        }
 
        public async Task<IEnumerable<ApproverAssignmentRowDto>> GetSubmittedFormsAsync(int reviewerUserId, int page, int pageSize)
        {
            return await _repository.GetReviewerSubmittedFormsAsync(reviewerUserId, page, pageSize);
        }
 
        public async Task<IEnumerable<ApproverAssignmentRowDto>> GetSubmittedRatingsAsync(int reviewerUserId, int page, int pageSize)
        {
            return await _repository.GetReviewerSubmittedRatingsAsync(reviewerUserId, page, pageSize);
        }
 
        public async Task<IEnumerable<ReviewerAssessmentViewDto>> GetAssessmentsWithDetailsAsync(int reviewerUserId, int page, int pageSize)
        {
            return await _repository.GetReviewerAssessmentsWithDetailsAsync(reviewerUserId, page, pageSize);
        }
 
        public async Task<ReviewerAssessmentViewDto?> GetAssessmentAsync(int reviewerUserId, int assessmentId)
        {
            return await _repository.GetAssessmentForReviewerAsync(reviewerUserId, assessmentId);
        }
 
        public async Task<List<AttachmentInfoDto>> GetAssessmentAttachmentsAsync(int assessmentId)
{
    return await _repository.GetAssessmentAttachmentsAsync(assessmentId);
}
 
public async Task<Selfassessmentattachment?> GetAttachmentByIdAsync(int attachmentId)
{
    return await _repository.GetAttachmentByIdAsync(attachmentId);
}
 
        public async Task<int> SaveReviewAsync(int reviewerUserId, SubmitReviewDto dto)
        {
            return await _repository.SaveReviewerReviewAsync(reviewerUserId, dto);
        }
 
        public async Task<bool> SetDecisionAsync(int reviewerUserId, int assessmentId, string decision, string? reviewerComment)
        {
            return await _repository.SetReviewerDecisionAsync(reviewerUserId, assessmentId, decision, reviewerComment);
        }
    }
}
 
 