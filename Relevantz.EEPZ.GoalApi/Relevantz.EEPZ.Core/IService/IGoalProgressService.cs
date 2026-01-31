using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface IGoalProgressService
    {
        Task<ApiResponseModel> UpdateChecklistStatus(
            int goalId,
            UpdateChecklistStatusModel updateDetails,
            int currentUserEmployeeMasterId
        );
        Task<ApiResponseModel> UpdateProgressPercentage(
            int goalId,
            UpdateProgressPercentageModel updateDetails,
            int currentUserEmployeeMasterId
        );
        Task<int> GetGoalProgressPercent(int goalId, int forEmployeeMasterId);
        Task<int> GetTeamGoalProgressForManager(int goalId, int managerEmployeeMasterId);
        Task<int> GetDependentProgress(int goalId, int userId);
        Task<GoalProgressHierarchyModel> FetchGoalProgressTree(int goalId, int userId);
    }
}
