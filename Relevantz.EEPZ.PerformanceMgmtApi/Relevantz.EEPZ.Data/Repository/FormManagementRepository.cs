using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class FormManagementRepository : IFormManagementRepository
    {
        private readonly EEPZDbContext _context;

        public FormManagementRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<Assessmentform?> GetFormByIdWithCompetenciesAsync(int formId)
        {
            return await _context.Assessmentforms
                .Include(f => f.CreatedByNavigation)
                .Include(f => f.Competencies)
                .FirstOrDefaultAsync(f => f.FormId == formId);
        }

        public async Task<List<Assessmentform>> GetAllFormsWithDetailsAsync()
        {
            return await _context.Assessmentforms
                .Include(f => f.CreatedByNavigation)
                .Include(f => f.Competencies)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<Assessmentform?> GetFormForDeleteAsync(int formId)
        {
            return await _context.Assessmentforms
                .Include(f => f.Assignments)
                .FirstOrDefaultAsync(f => f.FormId == formId);
        }

        public async Task AddFormAsync(Assessmentform form)
        {
            _context.Assessmentforms.Add(form);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateFormAsync(Assessmentform form)
        {
            _context.Assessmentforms.Update(form);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteFormAsync(Assessmentform form)
        {
            _context.Assessmentforms.Remove(form);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteCompetenciesByFormIdAsync(int formId)
        {
            var competencies = await _context.Competencies
                .Where(c => c.FormId == formId)
                .ToListAsync();
            
            _context.Competencies.RemoveRange(competencies);
            await _context.SaveChangesAsync();
        }

        public async Task AddCompetenciesAsync(List<Competency> competencies)
        {
            _context.Competencies.AddRange(competencies);
            await _context.SaveChangesAsync();
        }

        public async Task<Userauthentication?> GetUserWithEmployeeAsync(int userId)
        {
            return await _context.Userauthentications
                .Include(u => u.Employee)
                .FirstOrDefaultAsync(u => u.UserId == userId);
        }

        public async Task<Employeedetailsmaster?> GetEmployeeDetailsWithRoleAsync(int employeeId)
        {
            return await _context.Employeedetailsmasters
                .Include(d => d.Role)
                .FirstOrDefaultAsync(d => d.EmployeeId == employeeId);
        }

        public async Task<Assignment?> GetDraftByAssignmentIdAsync(int assignmentId)
        {
            return await _context.Assignments
                .FirstOrDefaultAsync(a => a.AssignmentId == assignmentId && a.Action == "Save as Draft");
        }

        public async Task DeleteDraftAsync(int assignmentId)
        {
            var draft = await _context.Assignments.FindAsync(assignmentId);
            if (draft != null)
            {
                _context.Assignments.Remove(draft);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<Assessmentform>> GetFormsByCreatorAsync(int createdBy)
        {
            return await _context.Assessmentforms
                .Include(f => f.CreatedByNavigation)
                .Include(f => f.Competencies)
                .Where(f => f.CreatedBy == createdBy)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Assessmentform>> GetFormsByTypeAsync(string formType)
        {
            return await _context.Assessmentforms
                .Include(f => f.CreatedByNavigation)
                .Include(f => f.Competencies)
                .Where(f => f.Type == formType)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
