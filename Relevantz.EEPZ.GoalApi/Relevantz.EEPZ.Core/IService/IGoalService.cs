using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface IGoalService
    {
        Task<ApiResponseDto<int>> CreateGoalAsync(
            CreateGoalDto dto,
            int currentUserEmployeeMasterId,
            string currentUserRole
        );
        Task<List<GoalSummaryDto>> QueryGoalsAsync(
            GoalQueryDto query,
            int currentUserEmployeeMasterId,
            string currentUserRole
        );
        Task<ApiResponseDto> UpdateGoalAsync(
            int goalId,
            UpdateGoalDto dto,
            int currentUserEmployeeMasterId,
            string currentUserRole
        );
        Task<List<AssigneeDto>> GetAssigneesAsync(int goalId);
        Task<ApiResponseDto> AssignAsync(
            int goalId,
            AssignGoalDto dto,
            int currentUserEmployeeMasterId,
            string currentUserRole
        );
        Task<List<ProjectDto>> GetUserProjectsAsync(int employeeMasterId);
        Task<List<ProjectDto>> GetAllProjectsAsync();
        Task<ProjectDto> GetProjectAsync(int projectId);
    }
}
