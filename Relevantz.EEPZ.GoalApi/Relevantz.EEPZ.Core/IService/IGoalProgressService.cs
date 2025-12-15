using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface IGoalProgressService
    {
        Task<ApiResponseDto> ToggleChecklistAsync(
            int goalId,
            ToggleChecklistDto dto,
            int currentUserEmployeeMasterId
        );
        Task<ApiResponseDto> ManualUpdateProgressAsync(
            int goalId,
            ManualProgressUpdateDto dto,
            int currentUserEmployeeMasterId
        );
        Task<int> GetGoalProgressPercentAsync(int goalId, int forEmployeeMasterId);
        Task<int> GetTeamGoalProgressForManagerAsync(int goalId, int managerEmployeeMasterId);
        Task<int> GetCascadingProgressAsync(int goalId, int userId);
        Task<GoalProgressHierarchyDto> GetProgressHierarchyAsync(int goalId, int userId);
    }
}
