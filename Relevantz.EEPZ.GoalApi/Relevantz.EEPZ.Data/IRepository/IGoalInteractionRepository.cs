using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Data.Repository.Interface
{
    public interface IGoalInteractionRepository
    {
        Task AddCommentAsync(GoalComment comment);
        Task<List<GoalComment>> GetCommentsByGoalAsync(int goalId);
        Task<List<Goalprogresslog>> GetProgressLogsByGoalAsync(int goalId);
        Task<List<ProjectEmployeeModel>> GetProjectEmployeesAsync(int projectId);
        Task<List<ProjectEmployeeModel>> FetchProjectTeamAsync(
            int projectId,
            int managerEmployeeMasterId
        );
    }
}
