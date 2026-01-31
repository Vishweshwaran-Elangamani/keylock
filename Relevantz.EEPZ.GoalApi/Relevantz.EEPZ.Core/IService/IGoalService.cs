using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface IGoalService
    {
        Task<ApiResponseModel<int>> CreateGoal(
            CreateGoalModel goal,
            int currentUserEmployeeMasterId,
            string currentUserRole
        );
        Task<List<GoalSummaryModel>> QueryGoals(
            GoalQueryModel query,
            int currentUserEmployeeMasterId,
            string currentUserRole
        );
        Task<ApiResponseModel> UpdateGoal(
            int goalId,
            UpdateGoalModel goalDetails,
            int currentUserEmployeeMasterId,
            string currentUserRole
        );
        Task<List<AssigneeModel>> GetAssignees(int goalId);
        Task<ApiResponseModel> Assign(
            int goalId,
            AssignGoalModel assignmentDetails,
            int currentUserEmployeeMasterId,
            string currentUserRole
        );
        Task<List<ProjectModel>> GetUserProjects(int employeeMasterId);
        Task<List<ProjectModel>> GetAllProjects();
        Task<ProjectModel> GetProject(int projectId);
    }
}
