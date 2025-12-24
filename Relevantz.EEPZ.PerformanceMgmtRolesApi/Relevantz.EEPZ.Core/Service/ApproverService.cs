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
    public class ApproverService : IApproverService
    {
        private readonly IApproverRepository _repository;
 
        public ApproverService(IApproverRepository repository)
        {
            _repository = repository;
        }
 
        public async Task<IEnumerable<ApproverAssignmentRowDto>> GetSubmittedFormsAsync(int approverUserId, int page, int pageSize)
        {
            return await _repository.GetApproverSubmittedFormsAsync(approverUserId, page, pageSize);
        }
 
        public async Task<IEnumerable<ApproverAssignmentRowDto>> GetReworkFormsAsync(int approverUserId, int page, int pageSize)
        {
            return await _repository.GetApproverReworkFormsAsync(approverUserId, page, pageSize);
        }
 
        public async Task<IEnumerable<ApproverAssignmentRowDto>> GetSubmittedL1RatingsAsync(int approverUserId, int page, int pageSize)
        {
            return await _repository.GetSubmittedL1RatingsAsync(approverUserId, page, pageSize);
        }
 
        public async Task<IEnumerable<ReviewerAssessmentViewDto>> GetAssessmentsWithDetailsAsync(int approverUserId, int page, int pageSize)
        {
            return await _repository.GetApproverAssessmentsWithDetailsAsync(approverUserId, page, pageSize);
        }
 
        public async Task<ReviewerAssessmentViewDto?> GetAssessmentAsync(int approverUserId, int assessmentId)
        {
            return await _repository.GetAssessmentForApproverAsync(approverUserId, assessmentId);
        }
 
        public async Task<int> SaveReviewAsync(int approverUserId, SubmitReviewDto dto)
        {
            return await _repository.SaveApproverReviewAsync(approverUserId, dto);
        }
 
        public async Task<bool> SetDecisionAsync(int approverUserId, int assessmentId, string decision, string? approverComment)
        {
            return await _repository.SetApproverDecisionAsync(approverUserId, assessmentId, decision, approverComment);
        }
 
        public async Task<ReviewerDecisionDto?> GetLatestReviewerDecisionAsync(int assessmentId)
        {
            return await _repository.GetLatestReviewerDecisionAsync(assessmentId);
        }
        public async Task<List<AttachmentInfoDto>> GetAssessmentAttachmentsAsync(int assessmentId)
{
    return await _repository.GetAssessmentAttachmentsAsync(assessmentId);
}
 
public async Task<Selfassessmentattachment?> GetAttachmentByIdAsync(int attachmentId)
{
    return await _repository.GetAttachmentByIdAsync(attachmentId);
}
 
    }
}
 
 