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
    public interface IReviewerService
    {
        Task<IEnumerable<ApproverAssignmentRowDto>> GetSubmittedFormsAsync(int reviewerUserId, int page, int pageSize);
        Task<IEnumerable<ApproverAssignmentRowDto>> GetSubmittedRatingsAsync(int reviewerUserId, int page, int pageSize);
        Task<IEnumerable<ReviewerAssessmentViewDto>> GetAssessmentsWithDetailsAsync(int reviewerUserId, int page, int pageSize);
        Task<ReviewerAssessmentViewDto?> GetAssessmentAsync(int reviewerUserId, int assessmentId);
        Task<int> SaveReviewAsync(int reviewerUserId, SubmitReviewDto dto);
        Task<bool> SetDecisionAsync(int reviewerUserId, int assessmentId, string decision, string? reviewerComment);
 
         Task<List<AttachmentInfoDto>> GetAssessmentAttachmentsAsync(int assessmentId);
        Task<Selfassessmentattachment?> GetAttachmentByIdAsync(int attachmentId);
    }
}
 
 