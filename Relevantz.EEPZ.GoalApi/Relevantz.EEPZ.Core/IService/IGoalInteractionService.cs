using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface IGoalInteractionService
    {
        Task<ApiResponseDto> AddCommentAsync(
            int goalId,
            CreateCommentDto dto,
            int currentUserEmployeeMasterId,
            string currentUserRole
        );
        Task<List<GoalCommentDto>> ListCommentsAsync(int goalId);
        Task<GoalDashboardSummaryDto> GetDashboardSummaryAsync(int currentUserEmployeeMasterId);
        Task<List<GoalSummaryDto>> GetOngoingAsync(string type, int currentUserEmployeeMasterId);
        Task<List<TimelineEventDto>> GetGoalTimelineAsync(
            int goalId,
            int currentUserEmployeeMasterId
        );
        Task<List<ProjectEmployeeDto>> GetProjectSubordinatesAsync(
            int projectId,
            int managerEmployeeMasterId
        );
    }
}
