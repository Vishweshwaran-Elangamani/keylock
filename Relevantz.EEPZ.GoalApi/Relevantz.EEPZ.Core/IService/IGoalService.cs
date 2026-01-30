using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface IGoalService
    {
        Task<ApiResponseModel<int>> CreateGoalAsync(
            CreateGoalModel goal,
            int currentUserEmployeeMasterId,
            string currentUserRole
        );
        Task<List<GoalSummaryModel>> QueryGoalsAsync(
            GoalQueryModel query,
            int currentUserEmployeeMasterId,
            string currentUserRole
        );
        Task<ApiResponseModel> UpdateGoalAsync(
            int goalId,
            UpdateGoalModel goalDetails,
            int currentUserEmployeeMasterId,
            string currentUserRole
        );
        Task<List<AssigneeModel>> GetAssigneesAsync(int goalId);
        Task<ApiResponseModel> AssignAsync(
            int goalId,
            AssignGoalModel assignmentDetails,
            int currentUserEmployeeMasterId,
            string currentUserRole
        );
        Task<List<ProjectModel>> GetUserProjectsAsync(int employeeMasterId);
        Task<List<ProjectModel>> GetAllProjectsAsync();
        Task<ProjectModel> GetProjectAsync(int projectId);
    }
}
