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

        Task<List<Goal>> GetTeamGoalsAsync();

        Task<List<Goal>> GetOrganizationLevelGoalsAsync();

        Task<List<Goal>> GetGoalsByProjectIdAsync(int projectId);
    }
}
