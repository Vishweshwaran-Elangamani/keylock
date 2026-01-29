using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class AssessmentDetailsRepository : IAssessmentDetailsRepository
    {
        private readonly EEPZDbContext _dbContext;

        public AssessmentDetailsRepository(EEPZDbContext dbContext)
        {
            _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        }

        /// <summary>
        /// Retrieves all user profiles from the database.
        /// </summary>
        public async Task<List<Userprofile>> GetAllUserProfilesAsync()
        {
            return await _dbContext.Userprofiles.AsNoTracking().ToListAsync();
        }

        /// <summary>
        /// Retrieves all user authentications from the database.
        /// </summary>
        public async Task<List<Userauthentication>> GetAllUserAuthenticationsAsync()
        {
            return await _dbContext.Userauthentications.AsNoTracking().ToListAsync();
        }

        /// <summary>
        /// Retrieves all projects from the database.
        /// </summary>
        public async Task<List<Project>> GetAllProjectsAsync()
        {
            return await _dbContext.Projects.AsNoTracking().ToListAsync();
        }

        /// <summary>
        /// Retrieves all project employees from the database.
        /// </summary>
        public async Task<List<Projectemployee>> GetAllProjectEmployeesAsync()
        {
            return await _dbContext.Projectemployees.AsNoTracking().ToListAsync();
        }

        /// <summary>
        /// Retrieves all self-assessments with their details and competencies.
        /// </summary>
        public async Task<List<Selfassessment>> GetAllSelfAssessmentsWithDetailsAsync()
        {
            return await _dbContext.Selfassessments
                .Include(sa => sa.Assessmentdetails)
                    .ThenInclude(ad => ad.Competency)
                .AsNoTracking()
                .ToListAsync();
        }

        /// <summary>
        /// Retrieves all assessment reviews from the database.
        /// </summary>
        public async Task<List<Assessmentreview>> GetAllAssessmentReviewsAsync()
        {
            return await _dbContext.Assessmentreviews.AsNoTracking().ToListAsync();
        }

        /// <summary>
        /// Retrieves assignments with their form competencies where action is 'Send'.
        /// </summary>
        public async Task<List<Assignment>> GetAssignmentsWithFormCompetenciesAsync()
        {
            return await _dbContext.Assignments
                .Where(a => a.Action == "Send")
                .Include(a => a.Form)
                    .ThenInclude(f => f.Competencies)
                .AsNoTracking()
                .ToListAsync();
        }

        /// <summary>
        /// Retrieves all self-assessment attachments from the database.
        /// </summary>
        public async Task<List<Selfassessmentattachment>> GetAllSelfAssessmentAttachmentsAsync()
        {
            return await _dbContext.Selfassessmentattachments.AsNoTracking().ToListAsync();
        }

        /// <summary>
        /// Retrieves a self-assessment attachment by its ID without tracking.
        /// </summary>
        public async Task<Selfassessmentattachment?> GetAttachmentByIdAsync(int attachmentId)
        {
            return await _dbContext.Selfassessmentattachments
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.AttachmentId == attachmentId);
        }
    }
}

