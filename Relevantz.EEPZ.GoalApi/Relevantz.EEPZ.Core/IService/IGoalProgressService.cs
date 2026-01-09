using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface IGoalProgressService
    {
        Task<ApiResponseModel> ToggleChecklistAsync(
            int goalId,
            ToggleChecklistModel dto,
            int currentUserEmployeeMasterId
        );
        Task<ApiResponseModel> ManualUpdateProgressAsync(
            int goalId,
            ManualProgressUpdateModel dto,
            int currentUserEmployeeMasterId
        );
        Task<int> GetGoalProgressPercentAsync(int goalId, int forEmployeeMasterId);
        Task<int> GetTeamGoalProgressForManagerAsync(int goalId, int managerEmployeeMasterId);
        Task<int> GetCascadingProgressAsync(int goalId, int userId);
        Task<GoalProgressHierarchyModel> GetProgressHierarchyAsync(int goalId, int userId);
    }
}
