using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class SelfAssessmentRepository : ISelfAssessmentRepository
    {
        private readonly EEPZDbContext _context;

        public SelfAssessmentRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<Assessmentform?> GetFormWithCompetenciesAsync(int formId)
        {
            return await _context.Assessmentforms
                .Include(f => f.Competencies)
                .FirstOrDefaultAsync(f => f.FormId == formId);
        }

        public async Task<Userauthentication?> GetUserByIdAsync(int userId)
        {
            return await _context.Userauthentications.FindAsync(userId);
        }

        public async Task<Userauthentication?> GetUserByEmployeeIdAsync(int employeeId)
        {
            return await _context.Userauthentications
                .FirstOrDefaultAsync(ua => ua.EmployeeId == employeeId);
        }

        public async Task<Selfassessment?> GetAssessmentForUpsertAsync(int formId, int userId)
        {
            return await _context.Selfassessments
                .FirstOrDefaultAsync(sa => sa.FormId == formId && sa.EmployeeId == userId);
        }

        public async Task UpsertSelfAssessmentAsync(Selfassessment assessment)
        {
            if (assessment.AssessmentId == 0)
            {
                _context.Selfassessments.Add(assessment);
            }
            else
            {
                _context.Selfassessments.Update(assessment);
            }
            await SaveChangesAsync();
        }

        public async Task DeleteAssessmentDetailsAsync(int assessmentId)
        {
            var existingDetails = await _context.Assessmentdetails
                .Where(ad => ad.AssessmentId == assessmentId)
                .ToListAsync();
            _context.Assessmentdetails.RemoveRange(existingDetails);
            await SaveChangesAsync();
        }

        public async Task AddAssessmentDetailsAsync(List<Assessmentdetail> details)
        {
            _context.Assessmentdetails.AddRange(details);
            await SaveChangesAsync();
        }

        public async Task<Assignment?> GetAssignmentWithProgressAsync(int formId, int userId)
        {
            return await _context.Assignments
                .Include(a => a.Formprogresstrackers)
                .FirstOrDefaultAsync(a => a.FormId == formId && a.EmployeeId == userId);
        }

        public async Task UpdateProgressTrackerAsync(Formprogresstracker tracker)
        {
            _context.Formprogresstrackers.Update(tracker);
            await SaveChangesAsync();
        }

        public async Task<Selfassessment?> GetSelfAssessmentByIdWithDetailsAsync(int assessmentId)
        {
            return await _context.Selfassessments
                .Include(sa => sa.Form)
                .Include(sa => sa.Employee)
                .Include(sa => sa.Assessmentdetails)
                    .ThenInclude(ad => ad.Competency)
                .Include(sa => sa.Selfassessmentattachments)
                .FirstOrDefaultAsync(sa => sa.AssessmentId == assessmentId);
        }

        public async Task<Selfassessment?> GetSelfAssessmentByFormAndUserWithDetailsAsync(int formId, int userId)
        {
            return await _context.Selfassessments
                .Include(sa => sa.Form)
                .Include(sa => sa.Employee)
                .Include(sa => sa.Assessmentdetails)
                    .ThenInclude(ad => ad.Competency)
                .Include(sa => sa.Selfassessmentattachments)
                .FirstOrDefaultAsync(sa => sa.FormId == formId && sa.EmployeeId == userId);
        }

        public async Task<List<Selfassessment>> GetSelfAssessmentsByUserAsync(int userId)
        {
            return await _context.Selfassessments
                .Where(a => a.EmployeeId == userId)
                .Include(a => a.Form)
                .ToListAsync();
        }

        public async Task<List<Selfassessment>> GetAllSelfAssessmentsWithDetailsAsync(string? status = null)
        {
            var query = _context.Selfassessments
                .Include(sa => sa.Form)
                .Include(sa => sa.Employee)
                .Include(sa => sa.Assessmentdetails)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(sa => sa.Status == status);

            return await query.OrderByDescending(sa => sa.SubmittedAt).ToListAsync();
        }

        public async Task<Selfassessment?> GetAssessmentForStatusUpdateAsync(int assessmentId)
        {
            return await _context.Selfassessments.FindAsync(assessmentId);
        }

        public async Task<List<Selfassessmentattachment>> GetAttachmentsByAssessmentIdAsync(int assessmentId)
        {
            return await _context.Selfassessmentattachments
                .Where(a => a.AssessmentId == assessmentId)
                .OrderBy(a => a.DisplayOrder)
                .ThenBy(a => a.UploadedAt)
                .ToListAsync();
        }

        public async Task<Selfassessmentattachment?> GetAttachmentByIdAsync(int attachmentId)
        {
            return await _context.Selfassessmentattachments.FindAsync(attachmentId);
        }

        public async Task DeleteAttachmentAsync(int attachmentId)
        {
            var attachment = await _context.Selfassessmentattachments.FindAsync(attachmentId);
            if (attachment != null)
            {
                _context.Selfassessmentattachments.Remove(attachment);
                await SaveChangesAsync();
            }
        }

        public async Task AddAttachmentsAsync(List<Selfassessmentattachment> attachments)
        {
            _context.Selfassessmentattachments.AddRange(attachments);
            await SaveChangesAsync();
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public async Task BeginTransactionAsync()
        {
            await _context.Database.BeginTransactionAsync();
        }

        public async Task CommitTransactionAsync()
        {
            await _context.Database.CommitTransactionAsync();
        }

        public async Task RollbackTransactionAsync()
        {
            await _context.Database.RollbackTransactionAsync();
        }
    }
}
