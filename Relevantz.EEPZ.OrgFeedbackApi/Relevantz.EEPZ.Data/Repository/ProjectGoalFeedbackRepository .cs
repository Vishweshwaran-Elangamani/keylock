using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class ProjectGoalFeedbackRepository : IProjectGoalFeedbackRepository
    {
        private readonly EEPZDbContext _context;

        public ProjectGoalFeedbackRepository(EEPZDbContext context)
        {
            _context = context;
        }

        private IQueryable<Projectgoalfeedback> FeedbackQuery()
        {
            return _context.Projectgoalfeedbacks
                .AsNoTracking()
                .Include(f => f.EmployeeMaster)
                    .ThenInclude(e => e.Employee)
                    .ThenInclude(e => e.Userprofile)
                .Include(f => f.Project)
                .Include(f => f.Goal);
        }

        public async Task<Projectgoalfeedback> SubmitFeedbackAsync(Projectgoalfeedback feedback)
        {
            ArgumentNullException.ThrowIfNull(feedback);

            feedback.SubmittedAt = DateTime.UtcNow;
            feedback.CreatedAt = DateTime.UtcNow;
            feedback.UpdatedAt = DateTime.UtcNow;

            _context.Projectgoalfeedbacks.Add(feedback);
            await _context.SaveChangesAsync();

            return feedback;
        }

        public async Task<List<Projectgoalfeedback>> GetFeedbackByProjectAndGoalAsync(int projectId, int goalId)
        {
            return await FeedbackQuery()
                .Where(f => f.ProjectId == projectId && f.GoalId == goalId)
                .OrderByDescending(f => f.SubmittedAt)
                .ToListAsync();
        }

        public async Task<List<Projectgoalfeedback>> GetFeedbackByProjectAsync(int projectId)
        {
            return await FeedbackQuery()
                .Where(f => f.ProjectId == projectId)
                .OrderByDescending(f => f.SubmittedAt)
                .ToListAsync();
        }

        public async Task<List<Projectgoalfeedback>> GetFeedbackByEmployeeAsync(int employeeId)
        {
            return await FeedbackQuery()
                .Where(f => f.EmployeeMasterId == employeeId)
                .OrderByDescending(f => f.SubmittedAt)
                .ToListAsync();
        }

        public async Task<Projectgoalfeedback?> GetFeedbackByIdAsync(int feedbackId)
        {
            return await FeedbackQuery()
                .FirstOrDefaultAsync(f => f.FeedbackId == feedbackId);
        }

        public async Task<bool> EmployeeExistsAsync(int employeeId)
        {
            return await _context.Employeedetailsmasters
                .AsNoTracking()
                .AnyAsync(e => e.EmployeeMasterId == employeeId);
        }

        public async Task<bool> ProjectExistsAsync(int projectId)
        {
            return await _context.Projects
                .AsNoTracking()
                .AnyAsync(p => p.ProjectId == projectId);
        }

        public async Task<bool> GoalExistsAsync(int goalId)
        {
            return await _context.Goals
                .AsNoTracking()
                .AnyAsync(g => g.GoalId == goalId);
        }

        public async Task<bool> IsEmployeeInProjectAsync(int employeeId, int projectId)
        {
            return await _context.Projectemployees
                .AsNoTracking()
                .AnyAsync(pe => pe.EmployeeId == employeeId && pe.ProjectId == projectId);
        }
    }
}
