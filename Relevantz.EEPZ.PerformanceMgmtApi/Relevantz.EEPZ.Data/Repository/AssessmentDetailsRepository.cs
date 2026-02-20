using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    /// <summary>
    /// Read-mostly repository for assessment aggregation scenarios.
    /// Queries use <see cref="EntityFrameworkQueryableExtensions.AsNoTracking{TEntity}(IQueryable{TEntity})"/>
    /// to minimize tracking overhead in query-only pipelines.
    /// </summary>
    public class AssessmentDetailsRepository : IAssessmentDetailsRepository
    {
        private readonly EEPZDbContext _assessmentDetailsDbContext;

        /// <summary>
        /// Centralized literal to avoid magic strings in queries.
        /// </summary>
        private const string ActionSend = "Send";

        public AssessmentDetailsRepository(EEPZDbContext assessmentDetailsDbContext)
        {
            _assessmentDetailsDbContext =
                assessmentDetailsDbContext ?? throw new ArgumentNullException(nameof(assessmentDetailsDbContext));
        }

        /// <summary>
        /// Retrieves all user profiles.
        /// </summary>
        public async Task<List<Userprofile>> GetAllUserProfilesAsync()
        {
            // FIXED: corrected field name (_assessmentDetailsDbContext).
            return await _assessmentDetailsDbContext.Userprofiles
                .AsNoTracking()
                .ToListAsync();
        }

        /// <summary>
        /// Retrieves all user authentications.
        /// </summary>
        public async Task<List<Userauthentication>> GetAllUserAuthenticationsAsync()
        {
            return await _assessmentDetailsDbContext.Userauthentications
                .AsNoTracking()
                .ToListAsync();
        }

        /// <summary>
        /// Retrieves all projects.
        /// </summary>
        public async Task<List<Project>> GetAllProjectsAsync()
        {
            return await _assessmentDetailsDbContext.Projects
                .AsNoTracking()
                .ToListAsync();
        }

        /// <summary>
        /// Retrieves all project-employee assignments.
        /// </summary>
        public async Task<List<Projectemployee>> GetAllProjectEmployeesAsync()
        {
            return await _assessmentDetailsDbContext.Projectemployees
                .AsNoTracking()
                .ToListAsync();
        }

        /// <summary>
        /// Retrieves all self-assessments with their details and competencies.
        /// </summary>
        /// <remarks>
        /// Uses <c>Include</c>/<c>ThenInclude</c> to avoid lazy-loading at the service layer.
        /// </remarks>
        public async Task<List<Selfassessment>> GetAllSelfAssessmentsWithDetailsAsync()
        {
            return await _assessmentDetailsDbContext.Selfassessments
                .Include(sa => sa.Assessmentdetails)
                    .ThenInclude(ad => ad.Competency)
                .AsNoTracking()
                .ToListAsync();
        }

        /// <summary>
        /// Retrieves all assessment reviews.
        /// </summary>
        public async Task<List<Assessmentreview>> GetAllAssessmentReviewsAsync()
        {
            return await _assessmentDetailsDbContext.Assessmentreviews
                .AsNoTracking()
                .ToListAsync();
        }

        /// <summary>
        /// Retrieves assignments filtered by <c>Action == "Send"</c>, including the form and its competencies.
        /// </summary>
        /// <remarks>
        /// Shapes data with <c>Include</c> so the service can compose results without lazy-loading.
        /// </remarks>
        public async Task<List<Assignment>> GetAssignmentsWithFormCompetenciesAsync()
        {
            return await _assessmentDetailsDbContext.Assignments
                .Where(a => a.Action == ActionSend)
                .Include(a => a.Form)
                    .ThenInclude(f => f.Competencies)
                .AsNoTracking()
                .ToListAsync();
        }

        /// <summary>
        /// Retrieves all self-assessment attachments.
        /// </summary>
        public async Task<List<Selfassessmentattachment>> GetAllSelfAssessmentAttachmentsAsync()
        {
            return await _assessmentDetailsDbContext.Selfassessmentattachments
                .AsNoTracking()
                .ToListAsync();
        }

        /// <summary>
        /// Retrieves a self-assessment attachment by its ID.
        /// </summary>
        public async Task<Selfassessmentattachment?> GetAttachmentByIdAsync(int attachmentId)
        {
            return await _assessmentDetailsDbContext.Selfassessmentattachments
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.AttachmentId == attachmentId);
        }
    }
}