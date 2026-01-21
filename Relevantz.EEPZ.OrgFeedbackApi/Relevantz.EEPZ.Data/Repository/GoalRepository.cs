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

        private IQueryable<Goal> GoalQuery()
        {
            return _context.Goals
                .AsNoTracking()
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
                .Include(g => g.Project);
        }

        public async Task<List<Goal>> GetAllGoalsAsync()
        {
            return await GoalQuery().ToListAsync();
        }

        public async Task<Goal?> GetGoalByIdAsync(int goalId)
        {
            return await GoalQuery()
                .FirstOrDefaultAsync(g => g.GoalId == goalId);
        }

        public async Task<List<Goal>> GetTeamGoalsAsync()
        {
            return await GoalQuery()
                .Where(g => g.ProjectId != null)
                .ToListAsync();
        }

        public async Task<List<Goal>> GetOrganizationLevelGoalsAsync()
        {
            return await GoalQuery()
                .Where(g => g.ProjectId == null)
                .ToListAsync();
        }

        public async Task<List<Goal>> GetGoalsByProjectIdAsync(int projectId)
        {
            return await GoalQuery()
                .Where(g => g.ProjectId == projectId)
                .ToListAsync();
        }
    }
}
