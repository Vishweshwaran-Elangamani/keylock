using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class ProjectGoalFeedbackRepository : IProjectGoalFeedbackRepository
    {
        private readonly EEPZDbContext _context;

        public ProjectGoalFeedbackRepository(EEPZDbContext context)
        {
            _context = context;
        }
        public async Task<Projectgoalfeedback> SubmitFeedbackAsync(Projectgoalfeedback feedback)
        {
            try
            {
                feedback.SubmittedAt = DateTime.Now;
                feedback.CreatedAt = DateTime.Now;
                feedback.UpdatedAt = DateTime.Now;

                _context.Projectgoalfeedbacks.Add(feedback);
                await _context.SaveChangesAsync();

                return feedback;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error submitting feedback: {ex.Message}");
            }
        }
        public async Task<List<Projectgoalfeedback>> GetFeedbackByProjectAndGoalAsync(int projectId, int goalId)
        {
            try
            {
                return await _context.Projectgoalfeedbacks
                    .Where(f => f.ProjectId == projectId && f.GoalId == goalId)
                    .Include(f => f.EmployeeMaster)
                        .ThenInclude(e => e.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(f => f.Project)
                    .Include(f => f.Goal)
                    .OrderByDescending(f => f.SubmittedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving feedback by project and goal: {ex.Message}");
            }
        }
        public async Task<List<Projectgoalfeedback>> GetFeedbackByProjectAsync(int projectId)
        {
            try
            {
                return await _context.Projectgoalfeedbacks
                    .Where(f => f.ProjectId == projectId)
                    .Include(f => f.EmployeeMaster)
                        .ThenInclude(e => e.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(f => f.Project)
                    .Include(f => f.Goal)
                    .OrderByDescending(f => f.SubmittedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving feedback by project: {ex.Message}");
            }
        }
        public async Task<List<Projectgoalfeedback>> GetFeedbackByEmployeeAsync(int employeeId)
        {
            try
            {
                return await _context.Projectgoalfeedbacks
                    .Where(f => f.EmployeeMasterId == employeeId)
                    .Include(f => f.EmployeeMaster)
                        .ThenInclude(e => e.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(f => f.Project)
                    .Include(f => f.Goal)
                    .OrderByDescending(f => f.SubmittedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving feedback by employee: {ex.Message}");
            }
        }
        public async Task<Projectgoalfeedback> GetFeedbackByIdAsync(int feedbackId)
        {
            try
            {
                return await _context.Projectgoalfeedbacks
                    .Include(f => f.EmployeeMaster)
                        .ThenInclude(e => e.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(f => f.Project)
                    .Include(f => f.Goal)
                    .FirstOrDefaultAsync(f => f.FeedbackId == feedbackId);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving feedback by ID: {ex.Message}");
            }
        }
        public async Task<bool> EmployeeExistsAsync(int employeeId)
        {
            try
            {
                return await _context.Employeedetailsmasters
                    .AnyAsync(e => e.EmployeeMasterId == employeeId);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error checking employee existence: {ex.Message}");
            }
        }
        public async Task<bool> ProjectExistsAsync(int projectId)
        {
            try
            {
                return await _context.Projects
                    .AnyAsync(p => p.ProjectId == projectId);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error checking project existence: {ex.Message}");
            }
        }
        public async Task<bool> GoalExistsAsync(int goalId)
        {
            try
            {
                return await _context.Goals
                    .AnyAsync(g => g.GoalId == goalId);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error checking goal existence: {ex.Message}");
            }
        }
        public async Task<bool> IsEmployeeInProjectAsync(int employeeId, int projectId)
        {
            try
            {
                return await _context.Projectemployees
                    .AnyAsync(pe => pe.EmployeeId == employeeId && pe.ProjectId == projectId);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error checking employee in project: {ex.Message}");
            }
        }
    }
}
