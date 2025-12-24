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
 
 
namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface IApproverService
    {
        Task<IEnumerable<ApproverAssignmentRowDto>> GetSubmittedFormsAsync(int approverUserId, int page, int pageSize);
        Task<IEnumerable<ApproverAssignmentRowDto>> GetReworkFormsAsync(int approverUserId, int page, int pageSize);
        Task<IEnumerable<ApproverAssignmentRowDto>> GetSubmittedL1RatingsAsync(int approverUserId, int page, int pageSize);
        Task<IEnumerable<ReviewerAssessmentViewDto>> GetAssessmentsWithDetailsAsync(int approverUserId, int page, int pageSize);
        Task<ReviewerAssessmentViewDto?> GetAssessmentAsync(int approverUserId, int assessmentId);
        Task<int> SaveReviewAsync(int approverUserId, SubmitReviewDto dto);
        Task<bool> SetDecisionAsync(int approverUserId, int assessmentId, string decision, string? approverComment);
        Task<ReviewerDecisionDto?> GetLatestReviewerDecisionAsync(int assessmentId);
        Task<List<AttachmentInfoDto>> GetAssessmentAttachmentsAsync(int assessmentId);
        Task<Selfassessmentattachment?> GetAttachmentByIdAsync(int attachmentId);
 
    }
}
 
 