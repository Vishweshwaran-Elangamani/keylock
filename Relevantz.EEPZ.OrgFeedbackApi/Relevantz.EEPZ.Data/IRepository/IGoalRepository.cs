using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.IRepository
{
    /// <summary>
    /// Repository interface for Goal entity operations
    /// </summary>
    public interface IGoalRepository
    {
        /// <summary>
        /// Retrieves all goals with related entities
        /// </summary>
        /// <returns>List of all goals</returns>
        Task<List<Goal>> GetAllGoalsAsync();

        /// <summary>
        /// Retrieves a specific goal by its identifier
        /// </summary>
        /// <param name="goalId">The goal identifier</param>
        /// <returns>Goal entity if found, otherwise null</returns>
        Task<Goal> GetGoalByIdAsync(int goalId);

        /// <summary>
        /// Retrieves all team goals (goals linked to projects)
        /// </summary>
        /// <returns>List of team goals</returns>
        Task<List<Goal>> GetTeamGoalsAsync();

        /// <summary>
        /// Retrieves all organization level goals (goals not linked to projects)
        /// </summary>
        /// <returns>List of organization level goals</returns>
        Task<List<Goal>> GetOrganizationLevelGoalsAsync();

        /// <summary>
        /// Retrieves goals for a specific project
        /// </summary>
        /// <param name="projectId">The project identifier</param>
        /// <returns>List of goals for the specified project</returns>
        Task<List<Goal>> GetGoalsByProjectIdAsync(int projectId);
    }
}
