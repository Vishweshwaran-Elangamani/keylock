using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface IGoalInteractionService
    {
        Task<ApiResponseModel> AddCommentAsync(
            int goalId,
            CreateCommentModel dto,
            int currentUserEmployeeMasterId,
            string currentUserRole
        );
        Task<List<GoalCommentModel>> GetAllCommentsAsync(int goalId);
        Task<GoalDashboardSummaryModel> GetDashboardDetailsAsync(int currentUserEmployeeMasterId);
        Task<List<GoalSummaryModel>> GetOngoingAsync(string type, int currentUserEmployeeMasterId);
        Task<List<TimelineEventModel>> GetGoalTimelineAsync(
            int goalId,
            int currentUserEmployeeMasterId
        );
        Task<List<ProjectEmployeeModel>> GetProjectSubordinatesAsync(
            int projectId,
            int managerEmployeeMasterId
        );
    }
}
