using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface IGoalInteractionService
    {
        Task<ApiResponseModel> AddComment(
            int goalId,
            CreateCommentModel commentDetails,
            int currentUserEmployeeMasterId,
            string currentUserRole
        );
        Task<List<GoalCommentModel>> GetAllComments(int goalId);
        Task<GoalDashboardSummaryModel> GetDashboardDetails(int currentUserEmployeeMasterId);
        Task<List<GoalSummaryModel>> GetOngoing(string type, int currentUserEmployeeMasterId);
        Task<List<TimelineEventModel>> GetGoalTimeline(
            int goalId,
            int currentUserEmployeeMasterId
        );
        Task<List<ProjectEmployeeModel>> FetchProjectTeam(
            int projectId,
            int managerEmployeeMasterId
        );
    }
}
