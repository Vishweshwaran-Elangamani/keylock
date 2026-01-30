using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface IGoalProgressService
    {
        Task<ApiResponseModel> UpdateChecklistStatusAsync(
            int goalId,
            UpdateChecklistStatusModel updateDetails,
            int currentUserEmployeeMasterId
        );
        Task<ApiResponseModel> UpdateProgressPercentageAsync(
            int goalId,
            UpdateProgressPercentageModel updateDetails,
            int currentUserEmployeeMasterId
        );
        Task<int> GetGoalProgressPercentAsync(int goalId, int forEmployeeMasterId);
        Task<int> GetTeamGoalProgressForManagerAsync(int goalId, int managerEmployeeMasterId);
        Task<int> GetDependentProgressAsync(int goalId, int userId);
        Task<GoalProgressHierarchyModel> FetchGoalProgressTreeAsync(int goalId, int userId);
    }
}
