using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;

namespace Relevantz.EEPZ.Data.Repository
{
    /// <summary>
    /// Repository implementation for Goal entity operations.
    /// </summary>
    public class GoalRepository : IGoalRepository
    {
        private readonly EEPZDbContext _context;

        public GoalRepository(EEPZDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        // AsNoTracking is applied here at the base query level so all
        // read operations benefit from reduced EF tracking overhead.
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
            // AsNoTracking applied via GoalQuery() - no tracking overhead on reads.
            return await GoalQuery().ToListAsync();
        }

        public async Task<Goal?> GetGoalByIdAsync(int goalId)
        {
            // AsNoTracking applied via GoalQuery() - no tracking overhead on reads.
            return await GoalQuery()
                .FirstOrDefaultAsync(g => g.GoalId == goalId);
        }

        public async Task<List<Goal>> GetTeamGoalsAsync(int pageNumber = 1, int pageSize = 20)
        {
            pageNumber = pageNumber <= 0 ? 1 : pageNumber;
            pageSize = pageSize <= 0 ? 20 : pageSize;
            pageSize = pageSize > 100 ? 100 : pageSize;

            // AsNoTracking applied via GoalQuery() - no tracking overhead on reads.
            return await GoalQuery()
                .Where(g => g.ProjectId != null)
                .OrderBy(g => g.Goalcreatedat)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<List<Goal>> GetOrganizationLevelGoalsAsync()
        {
            // AsNoTracking applied via GoalQuery() - no tracking overhead on reads.
            return await GoalQuery()
                .Where(g => g.ProjectId == null)
                .ToListAsync();
        }

        public async Task<List<Goal>> GetGoalsByProjectIdAsync(int projectId)
        {
            // AsNoTracking applied via GoalQuery() - no tracking overhead on reads.
            return await GoalQuery()
                .Where(g => g.ProjectId == projectId)
                .OrderBy(g => g.Goalcreatedat)
                .ToListAsync();
        }
    }
}
