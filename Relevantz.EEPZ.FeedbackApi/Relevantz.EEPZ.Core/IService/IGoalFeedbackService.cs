using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    /// <summary>
    /// Service interface for Organization-Level Goal Feedback
    /// Uses Feedback table filtered by Goal.GoalType = "Organization"
    /// </summary>
    public interface IOrgGoalFeedbackService
    {
        // CREATE
        Task<OrgGoalFeedbackResponseDto> CreateOrgGoalFeedbackAsync(CreateOrgGoalFeedbackRequestDto dto);

        // READ
        Task<OrgGoalFeedbackResponseDto> GetOrgGoalFeedbackByIdAsync(int feedbackId);
        Task<List<OrgGoalFeedbackResponseDto>> GetFeedbackByOrgGoalAsync(int goalId); 
        Task<List<OrgGoalFeedbackResponseDto>> GetFeedbackBySubmitterAsync(int employeeId);
        Task<List<OrgGoalFeedbackResponseDto>> GetAllOrgGoalFeedbackAsync(int pageNumber = 1, int pageSize = 20);
        Task<List<OrgGoalFeedbackResponseDto>> GetFeedbackByStatusAsync(string status);
        Task<List<OrgGoalFeedbackResponseDto>> GetAnonymousOrgGoalFeedbackAsync();

        // UPDATE
        Task<OrgGoalFeedbackResponseDto> UpdateOrgGoalFeedbackAsync(int feedbackId, UpdateOrgGoalFeedbackRequestDto dto);
        Task<bool> ArchiveOrgGoalFeedbackAsync(int feedbackId);

        // DELETE
        Task<bool> DeleteOrgGoalFeedbackAsync(int feedbackId);

        // VALIDATION
        Task<bool> OrgGoalFeedbackExistsAsync(int feedbackId);
    }
}
