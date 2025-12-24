using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class FormProgressTrackerRepository : IFormProgressTrackerRepository
    {
        private readonly EEPZDbContext _context;

        public FormProgressTrackerRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<List<Formprogresstracker>> GetAllTrackersWithAssignmentsAsync()
        {
            return await _context.Formprogresstrackers
                .Include(t => t.Assignment)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Formprogresstracker?> GetTrackerByIdAsync(int trackerId)
        {
            return await _context.Formprogresstrackers
                .Include(t => t.Assignment)
                .FirstOrDefaultAsync(t => t.TrackerId == trackerId);
        }

        public async Task<Formprogresstracker?> GetTrackerByAssignmentIdAsync(int assignmentId)
        {
            return await _context.Formprogresstrackers
                .Include(t => t.Assignment)
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.AssignmentId == assignmentId);
        }

        public async Task<Formprogresstracker?> GetTrackerForUpsertAsync(int assignmentId)
        {
            return await _context.Formprogresstrackers
                .FirstOrDefaultAsync(t => t.AssignmentId == assignmentId);
        }

        public async Task UpsertTrackerAsync(Formprogresstracker tracker)
        {
            if (tracker.TrackerId == 0)
            {
                _context.Formprogresstrackers.Add(tracker);
            }
            else
            {
                _context.Formprogresstrackers.Update(tracker);
            }
            await _context.SaveChangesAsync();
        }

        public async Task ReloadTrackerAsync(Formprogresstracker tracker)
        {
            await _context.Entry(tracker).ReloadAsync();
        }

        public async Task<List<Userauthentication>> GetUsersByUserIdsAsync(List<int> userIds)
        {
            return await _context.Userauthentications
                .Where(u => userIds.Contains(u.UserId))
                .Include(u => u.Employee)
                .ToListAsync();
        }

        public async Task<List<Userprofile>> GetUserProfilesByEmployeeIdsAsync(List<int> employeeIds)
        {
            return await _context.Userprofiles
                .Where(up => employeeIds.Contains(up.EmployeeId))
                .ToListAsync();
        }

        public async Task<List<Employee>> GetEmployeesByEmployeeIdsAsync(List<int> employeeIds)
        {
            return await _context.Employees
                .Where(e => employeeIds.Contains(e.EmployeeId))
                .ToListAsync();
        }

        public async Task<List<Selfassessment>> GetLatestSelfAssessmentsAsync(List<int> userIds, List<int> formIds)
        {
            return await _context.Selfassessments
                .Where(sa => userIds.Contains(sa.EmployeeId) && formIds.Contains(sa.FormId) && sa.Status == "Submitted")
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<List<Departmentheadapproval>> GetDeptApprovalsByAssessmentIdsAsync(List<int> assessmentIds)
        {
            return await _context.Departmentheadapprovals
                .Where(a => assessmentIds.Contains(a.AssessmentId))
                .AsNoTracking()
                .ToListAsync();
        }
    }
}
