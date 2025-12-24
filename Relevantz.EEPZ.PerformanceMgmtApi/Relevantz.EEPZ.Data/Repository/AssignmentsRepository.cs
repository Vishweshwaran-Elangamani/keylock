using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class AssignmentsRepository : IAssignmentsRepository
    {
        private readonly EEPZDbContext _context;

        public AssignmentsRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<Assessmentform?> GetFormByIdAsync(int formId)
        {
            return await _context.Assessmentforms
                .Include(f => f.Competencies)
                .FirstOrDefaultAsync(f => f.FormId == formId);
        }

        public async Task<List<Assessmentform>> GetAllFormsAsync()
        {
            return await _context.Assessmentforms
                .Include(f => f.Competencies)
                .ToListAsync();
        }

        public async Task<Userauthentication?> GetUserByIdAsync(int userId)
        {
            return await _context.Userauthentications
                .Include(u => u.Employee)
                .FirstOrDefaultAsync(u => u.UserId == userId);
        }

        public async Task<Userauthentication?> GetUserByEmployeeIdAsync(int employeeId)
        {
            return await _context.Userauthentications
                .Include(u => u.Employee)
                .FirstOrDefaultAsync(u => u.EmployeeId == employeeId);
        }

        public async Task<List<Userauthentication>> GetUsersByIdsAsync(List<int> userIds)
        {
            return await _context.Userauthentications
                .Where(u => userIds.Contains(u.UserId))
                .Include(u => u.Employee)
                .ToListAsync();
        }

        public async Task<List<Userauthentication>> GetAllActiveUsersAsync()
        {
            return await _context.Userauthentications
                .Where(u => u.Status == "Active")
                .Include(u => u.Employee)
                .ToListAsync();
        }

        public async Task<Userprofile?> GetUserProfileByEmployeeIdAsync(int employeeId)
        {
            return await _context.Userprofiles
                .FirstOrDefaultAsync(p => p.EmployeeId == employeeId);
        }

        public async Task<Employee?> GetEmployeeByIdAsync(int employeeId)
        {
            return await _context.Employees
                .FirstOrDefaultAsync(e => e.EmployeeId == employeeId);
        }

        public async Task<Employeedetailsmaster?> GetEmployeeDetailsByEmployeeIdAsync(int employeeId)
        {
            return await _context.Employeedetailsmasters
                .Include(d => d.Role)
                .FirstOrDefaultAsync(d => d.EmployeeId == employeeId);
        }

        public async Task<Assignment?> GetAssignmentByIdAsync(int assignmentId)
        {
            return await _context.Assignments
                .Include(a => a.Form)
                .ThenInclude(f => f.Competencies)
                .Include(a => a.Employee)
                .Include(a => a.Formprogresstrackers)
                .FirstOrDefaultAsync(a => a.AssignmentId == assignmentId);
        }

        public async Task<List<Assignment>> GetAssignmentsByFormIdAsync(int formId)
        {
            return await _context.Assignments
                .Where(a => a.FormId == formId && a.Action == "Send")
                .Include(a => a.Form)
                .Include(a => a.Employee)
                .Include(a => a.Formprogresstrackers)
                .OrderByDescending(a => a.AssignedAt)
                .ToListAsync();
        }

        public async Task<List<Assignment>> GetAssignmentsByUserIdAsync(int userId)
        {
            return await _context.Assignments
                .Where(a => a.EmployeeId == userId && a.Action == "Send")
                .Include(a => a.Form)
                .ThenInclude(f => f.Competencies)
                .Include(a => a.Employee)
                .Include(a => a.Formprogresstrackers)
                .OrderByDescending(a => a.AssignedAt)
                .ToListAsync();
        }

        public async Task<List<Assignment>> GetAssignmentsByEmployeeIdAsync(int employeeId)
        {
            return await _context.Assignments
                .Where(a => a.EmployeeId == employeeId && a.Action == "Send")
                .Include(a => a.Form)
                .ThenInclude(f => f.Competencies)
                .Include(a => a.Employee)
                .Include(a => a.Formprogresstrackers)
                .OrderByDescending(a => a.AssignedAt)
                .ToListAsync();
        }

        public async Task<List<Assignment>> GetAllAssignmentsAsync()
        {
            return await _context.Assignments
                .Where(a => a.Action == "Send")
                .Include(a => a.Form)
                .Include(a => a.Employee)
                .Include(a => a.Formprogresstrackers)
                .OrderByDescending(a => a.AssignedAt)
                .ToListAsync();
        }

        public async Task<List<Assignment>> GetDraftAssignmentsAsync()
        {
            return await _context.Assignments
                .Where(a => a.Action == "Save as Draft")
                .Include(a => a.Form)
                .Include(a => a.Employee)
                .ToListAsync();
        }

        public async Task<bool> AssignmentExistsAsync(int formId, int employeeId, string action)
        {
            return await _context.Assignments
                .AnyAsync(a => a.FormId == formId && a.EmployeeId == employeeId && a.Action == action);
        }

        public async Task AddAssignmentAsync(Assignment assignment)
        {
            _context.Assignments.Add(assignment);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAssignmentAsync(Assignment assignment)
        {
            _context.Assignments.Update(assignment);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAssignmentAsync(int assignmentId)
        {
            var assignment = await _context.Assignments.FindAsync(assignmentId);
            if (assignment != null)
            {
                _context.Assignments.Remove(assignment);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<Formprogresstracker?> GetProgressTrackerByAssignmentIdAsync(int assignmentId)
        {
            return await _context.Formprogresstrackers
                .FirstOrDefaultAsync(t => t.AssignmentId == assignmentId);
        }

        public async Task AddFormProgressTrackerAsync(Formprogresstracker tracker)
        {
            _context.Formprogresstrackers.Add(tracker);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateProgressTrackerAsync(Formprogresstracker tracker)
        {
            _context.Formprogresstrackers.Update(tracker);
            await _context.SaveChangesAsync();
        }

        public async Task<Selfassessment?> GetSelfAssessmentByFormAndEmployeeAsync(int formId, int employeeId)
        {
            return await _context.Selfassessments
                .Where(sa => sa.FormId == formId && sa.EmployeeId == employeeId && sa.Status == "Submitted")
                .OrderByDescending(sa => sa.SubmittedAt)
                .FirstOrDefaultAsync();
        }

        public async Task<List<Employee>> GetActiveEmployeesAsync()
        {
            return await _context.Employees
                .Where(e => e.EmploymentStatus == "Active" && e.IsActive == true)
                .ToListAsync();
        }

        public async Task<List<Employeedetailsmaster>> GetEmployeeDetailsByIdsAsync(List<int> employeeIds)
        {
            return await _context.Employeedetailsmasters
                .Where(ed => employeeIds.Contains(ed.EmployeeId))
                .Include(ed => ed.Role)
                .ToListAsync();
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
