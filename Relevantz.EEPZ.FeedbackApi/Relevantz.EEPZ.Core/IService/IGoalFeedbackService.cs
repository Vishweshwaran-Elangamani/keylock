using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{

    public interface IOrgGoalFeedbackService
    {
        Task<OrgGoalFeedbackResponseDto> CreateOrgGoalFeedbackAsync(CreateOrgGoalFeedbackRequestDto dto);

        Task<OrgGoalFeedbackResponseDto> GetOrgGoalFeedbackByIdAsync(int feedbackId);
        Task<List<OrgGoalFeedbackResponseDto>> GetFeedbackByOrgGoalAsync(int goalId); 
        Task<List<OrgGoalFeedbackResponseDto>> GetFeedbackBySubmitterAsync(int employeeId);
        Task<List<OrgGoalFeedbackResponseDto>> GetAllOrgGoalFeedbackAsync(int pageNumber = 1, int pageSize = 20);
        Task<List<OrgGoalFeedbackResponseDto>> GetFeedbackByStatusAsync(string status);
        Task<List<OrgGoalFeedbackResponseDto>> GetAnonymousOrgGoalFeedbackAsync();

        Task<OrgGoalFeedbackResponseDto> UpdateOrgGoalFeedbackAsync(int feedbackId, UpdateOrgGoalFeedbackRequestDto dto);
        Task<bool> ArchiveOrgGoalFeedbackAsync(int feedbackId);
        Task<bool> DeleteOrgGoalFeedbackAsync(int feedbackId);
        Task<bool> OrgGoalFeedbackExistsAsync(int feedbackId);
    }
}
