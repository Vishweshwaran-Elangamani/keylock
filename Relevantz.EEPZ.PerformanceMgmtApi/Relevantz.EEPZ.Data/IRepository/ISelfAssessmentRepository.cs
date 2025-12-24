using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface ISelfAssessmentRepository
    {
        Task<Assessmentform?> GetFormWithCompetenciesAsync(int formId);
        Task<Userauthentication?> GetUserByIdAsync(int userId);
        Task<Userauthentication?> GetUserByEmployeeIdAsync(int employeeId);
        Task<Selfassessment?> GetAssessmentForUpsertAsync(int formId, int userId);
        Task UpsertSelfAssessmentAsync(Selfassessment assessment);
        Task DeleteAssessmentDetailsAsync(int assessmentId);
        Task AddAssessmentDetailsAsync(List<Assessmentdetail> details);
        
        Task<Assignment?> GetAssignmentWithProgressAsync(int formId, int userId);
        Task UpdateProgressTrackerAsync(Formprogresstracker tracker);
        
        Task<Selfassessment?> GetSelfAssessmentByIdWithDetailsAsync(int assessmentId);
        Task<Selfassessment?> GetSelfAssessmentByFormAndUserWithDetailsAsync(int formId, int userId);
        Task<List<Selfassessment>> GetSelfAssessmentsByUserAsync(int userId);
        Task<List<Selfassessment>> GetAllSelfAssessmentsWithDetailsAsync(string? status = null);
        Task<Selfassessment?> GetAssessmentForStatusUpdateAsync(int assessmentId);
        
        Task<List<Selfassessmentattachment>> GetAttachmentsByAssessmentIdAsync(int assessmentId);
        Task<Selfassessmentattachment?> GetAttachmentByIdAsync(int attachmentId);
        Task DeleteAttachmentAsync(int attachmentId);
        Task AddAttachmentsAsync(List<Selfassessmentattachment> attachments);
        
        Task SaveChangesAsync();
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
    }
}
