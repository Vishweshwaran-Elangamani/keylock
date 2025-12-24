using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class AssessmentDetailsRepository : IAssessmentDetailsRepository
    {
        private readonly EEPZDbContext _context;

        public AssessmentDetailsRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<List<Userprofile>> GetAllUserProfilesAsync()
        {
            return await _context.Userprofiles.AsNoTracking().ToListAsync();
        }

        public async Task<List<Userauthentication>> GetAllUserAuthenticationsAsync()
        {
            return await _context.Userauthentications.AsNoTracking().ToListAsync();
        }

        public async Task<List<Project>> GetAllProjectsAsync()
        {
            return await _context.Projects.AsNoTracking().ToListAsync();
        }

        public async Task<List<Projectemployee>> GetAllProjectEmployeesAsync()
        {
            return await _context.Projectemployees.AsNoTracking().ToListAsync();
        }

        public async Task<List<Selfassessment>> GetAllSelfAssessmentsWithDetailsAsync()
        {
            return await _context.Selfassessments
                .Include(sa => sa.Assessmentdetails)
                    .ThenInclude(ad => ad.Competency)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<List<Assessmentreview>> GetAllAssessmentReviewsAsync()
        {
            return await _context.Assessmentreviews.AsNoTracking().ToListAsync();
        }

        public async Task<List<Assignment>> GetAssignmentsWithFormCompetenciesAsync()
        {
            return await _context.Assignments
                .Where(a => a.Action == "Send")
                .Include(a => a.Form)
                    .ThenInclude(f => f.Competencies)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<List<Selfassessmentattachment>> GetAllSelfAssessmentAttachmentsAsync()
        {
            return await _context.Selfassessmentattachments.AsNoTracking().ToListAsync();
        }

        public async Task<Selfassessmentattachment?> GetAttachmentByIdAsync(int attachmentId)
        {
            return await _context.Selfassessmentattachments
                .FirstOrDefaultAsync(a => a.AttachmentId == attachmentId);
        }
    }
}
