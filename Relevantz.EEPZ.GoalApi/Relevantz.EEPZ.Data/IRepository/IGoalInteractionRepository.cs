using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Data.Repository.Interface
{
    public interface IGoalInteractionRepository
    {
        Task AddComment(GoalComment comment);
        Task<List<GoalComment>> GetCommentsByGoal(int goalId);
        Task<List<Goalprogresslog>> GetProgressLogsByGoal(int goalId);
        Task<List<ProjectEmployeeModel>> GetProjectEmployees(int projectId);
        Task<List<ProjectEmployeeModel>> FetchProjectTeam(
            int projectId,
            int managerEmployeeMasterId
        );
    }
}
