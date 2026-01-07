using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;

namespace Relevantz.EEPZ.Data.Repository
{
    /// <summary>
    /// Repository implementation for Goal entity operations
    /// </summary>
    public class GoalRepository : IGoalRepository
    {
        private readonly EEPZDbContext _context;

        public GoalRepository(EEPZDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Retrieves all goals with related entities
        /// </summary>
        /// <returns>List of all goals</returns>
        public async Task<List<Goal>> GetAllGoalsAsync()
        {
            return await _context.Goals
                .Include(g => g.CreatedByNavigation)
                    .ThenInclude(e => e.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(g => g.CreatedByNavigation)
                    .ThenInclude(e => e.Employee)
                        .ThenInclude(e => e.Userauthentication)
                .Include(g => g.CreatedByNavigation)
                    .ThenInclude(e => e.Role)
                .Include(g => g.CreatedByNavigation)
                    .ThenInclude(e => e.Department)
                .Include(g => g.Project)
                .ToListAsync();
        }

        /// <summary>
        /// Retrieves a specific goal by its identifier
        /// </summary>
        /// <param name="goalId">The goal identifier</param>
        /// <returns>Goal entity if found, otherwise null</returns>
        public async Task<Goal> GetGoalByIdAsync(int goalId)
        {
            return await _context.Goals
                .Include(g => g.CreatedByNavigation)
                    .ThenInclude(e => e.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(g => g.CreatedByNavigation)
                    .ThenInclude(e => e.Employee)
                        .ThenInclude(e => e.Userauthentication)
                .Include(g => g.CreatedByNavigation)
                    .ThenInclude(e => e.Role)
                .Include(g => g.CreatedByNavigation)
                    .ThenInclude(e => e.Department)
                .Include(g => g.Project)
                .FirstOrDefaultAsync(g => g.GoalId == goalId);
        }

        /// <summary>
        /// Retrieves all team goals (goals linked to projects)
        /// </summary>
        /// <returns>List of team goals</returns>
        public async Task<List<Goal>> GetTeamGoalsAsync()
        {
            return await _context.Goals
                .Include(g => g.CreatedByNavigation)
                    .ThenInclude(e => e.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(g => g.CreatedByNavigation)
                    .ThenInclude(e => e.Employee)
                        .ThenInclude(e => e.Userauthentication)
                .Include(g => g.CreatedByNavigation)
                    .ThenInclude(e => e.Role)
                .Include(g => g.CreatedByNavigation)
                    .ThenInclude(e => e.Department)
                .Include(g => g.Project)
                .Where(g => g.Project != null)
                .ToListAsync();
        }

        /// <summary>
        /// Retrieves all organization level goals (goals not linked to projects)
        /// </summary>
        /// <returns>List of organization level goals</returns>
        public async Task<List<Goal>> GetOrganizationLevelGoalsAsync()
        {
            return await _context.Goals
                .Include(g => g.CreatedByNavigation)
                    .ThenInclude(e => e.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(g => g.CreatedByNavigation)
                    .ThenInclude(e => e.Employee)
                        .ThenInclude(e => e.Userauthentication)
                .Include(g => g.CreatedByNavigation)
                    .ThenInclude(e => e.Role)
                .Include(g => g.CreatedByNavigation)
                    .ThenInclude(e => e.Department)
                .Include(g => g.Project)
                .Where(g => g.Project == null)
                .ToListAsync();
        }

        /// <summary>
        /// Retrieves goals for a specific project
        /// </summary>
        /// <param name="projectId">The project identifier</param>
        /// <returns>List of goals for the specified project</returns>
        public async Task<List<Goal>> GetGoalsByProjectIdAsync(int projectId)
        {
            return await _context.Goals
                .Include(g => g.CreatedByNavigation)
                    .ThenInclude(e => e.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(g => g.CreatedByNavigation)
                    .ThenInclude(e => e.Employee)
                        .ThenInclude(e => e.Userauthentication)
                .Include(g => g.CreatedByNavigation)
                    .ThenInclude(e => e.Role)
                .Include(g => g.CreatedByNavigation)
                    .ThenInclude(e => e.Department)
                .Include(g => g.Project)
                .Where(g => g.ProjectId == projectId)
                .ToListAsync();
        }
    }
}
