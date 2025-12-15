using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interface
{
    public interface IGoalInteractionRepository
    {
        Task AddCommentAsync(GoalComment comment);
        Task<List<GoalComment>> GetCommentsByGoalAsync(int goalId);
        Task<List<Goalprogresslog>> GetProgressLogsByGoalAsync(int goalId);
        Task<List<ProjectEmployeeDto>> GetProjectEmployeesAsync(int projectId);
        Task<List<ProjectEmployeeDto>> GetProjectSubordinatesAsync(
            int projectId,
            int managerEmployeeMasterId
        );
    }
}
