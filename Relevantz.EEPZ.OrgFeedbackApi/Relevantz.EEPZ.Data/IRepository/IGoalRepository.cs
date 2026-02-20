using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.IRepository
{
    /// <summary>
    /// Repository interface for Goal entity operations
    /// </summary>
    public interface IGoalRepository
    {
        Task<List<Goal>> GetAllGoalsAsync();

        Task<Goal?> GetGoalByIdAsync(int goalId);

        Task<List<Goal>> GetTeamGoalsAsync(int pageNumber = 1, int pageSize = 20);

        Task<List<Goal>> GetOrganizationLevelGoalsAsync();

        Task<List<Goal>> GetGoalsByProjectIdAsync(int projectId);
    }
}
