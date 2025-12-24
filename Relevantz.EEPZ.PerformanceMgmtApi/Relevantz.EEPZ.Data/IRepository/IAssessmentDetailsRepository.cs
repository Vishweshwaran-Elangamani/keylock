using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IAssessmentDetailsRepository
    {
        Task<List<Userprofile>> GetAllUserProfilesAsync();
        Task<List<Userauthentication>> GetAllUserAuthenticationsAsync();
        Task<List<Project>> GetAllProjectsAsync();
        Task<List<Projectemployee>> GetAllProjectEmployeesAsync();
        Task<List<Selfassessment>> GetAllSelfAssessmentsWithDetailsAsync();
        Task<List<Assessmentreview>> GetAllAssessmentReviewsAsync();
        Task<List<Assignment>> GetAssignmentsWithFormCompetenciesAsync();
        Task<List<Selfassessmentattachment>> GetAllSelfAssessmentAttachmentsAsync();
        Task<Selfassessmentattachment?> GetAttachmentByIdAsync(int attachmentId);
    }
}
