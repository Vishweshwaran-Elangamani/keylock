using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.IService
{
    /// <summary>
    /// Service interface for goal-related business operations.
    /// </summary>
    public interface IGoalService
    {
        /// <summary>
        /// Retrieves all goals segregated by type.
        /// </summary>
        /// <returns>Segregated goals response containing team and organization level goals.</returns>
        Task<SegregatedGoalsResponseDto> GetAllGoalsAsync();

        /// <summary>
        /// Retrieves a specific goal by its identifier.
        /// </summary>
        /// <param name="goalId">The goal identifier.</param>
        /// <returns>Project goal response if found, otherwise null.</returns>
        Task<ProjectGoalResponseDto?> GetGoalByIdAsync(int goalId);

        /// <summary>
        /// Retrieves team goals with pagination.
        /// </summary>
        /// <param name="pageNumber">Page number for pagination (default 1).</param>
        /// <param name="pageSize">Number of items per page (default 20).</param>
        /// <returns>List of team goal responses.</returns>
        Task<List<ProjectGoalResponseDto>> GetTeamGoalsAsync(int pageNumber = 1, int pageSize = 20);

        /// <summary>
        /// Retrieves all organization level goals.
        /// </summary>
        /// <returns>List of organization level goal responses.</returns>
        Task<List<ProjectGoalResponseDto>> GetOrganizationLevelGoalsAsync();

        /// <summary>
        /// Retrieves goals for a specific project.
        /// </summary>
        /// <param name="projectId">The project identifier.</param>
        /// <returns>List of project goal responses.</returns>
        Task<List<ProjectGoalResponseDto>> GetGoalsByProjectIdAsync(int projectId);
    }
}
