using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.IService
{
    /// <summary>
    /// Service interface for goal-related business operations
    /// </summary>
    public interface IGoalService
    {
        /// <summary>
        /// Retrieves all goals segregated by type
        /// </summary>
        /// <returns>Segregated goals response containing team and organization level goals</returns>
        Task<SegregatedGoalsResponse> GetAllGoalsAsync();

        /// <summary>
        /// Retrieves a specific goal by its identifier
        /// </summary>
        /// <param name="goalId">The goal identifier</param>
        /// <returns>Project goal response if found, otherwise null</returns>
        Task<ProjectGoalResponse> GetGoalByIdAsync(int goalId);

        /// <summary>
        /// Retrieves all team goals
        /// </summary>
        /// <returns>List of team goal responses</returns>
        Task<List<ProjectGoalResponse>> GetTeamGoalsAsync();

        /// <summary>
        /// Retrieves all organization level goals
        /// </summary>
        /// <returns>List of organization level goal responses</returns>
        Task<List<ProjectGoalResponse>> GetOrganizationLevelGoalsAsync();

        /// <summary>
        /// Retrieves goals for a specific project
        /// </summary>
        /// <param name="projectId">The project identifier</param>
        /// <returns>List of project goal responses</returns>
        Task<List<ProjectGoalResponse>> GetGoalsByProjectIdAsync(int projectId);
    }
}
