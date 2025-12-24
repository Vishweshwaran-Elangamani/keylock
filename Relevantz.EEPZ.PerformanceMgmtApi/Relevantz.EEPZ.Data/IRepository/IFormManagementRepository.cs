using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IFormManagementRepository
    {
        // Form operations
        Task<Assessmentform?> GetFormByIdWithCompetenciesAsync(int formId);
        Task<List<Assessmentform>> GetAllFormsWithDetailsAsync();
        Task<Assessmentform?> GetFormForDeleteAsync(int formId);
        Task AddFormAsync(Assessmentform form);
        Task UpdateFormAsync(Assessmentform form);
        Task DeleteFormAsync(Assessmentform form);

        // Competency operations
        Task DeleteCompetenciesByFormIdAsync(int formId);
        Task AddCompetenciesAsync(List<Competency> competencies);

        // User validation
        Task<Userauthentication?> GetUserWithEmployeeAsync(int userId);
        Task<Employeedetailsmaster?> GetEmployeeDetailsWithRoleAsync(int employeeId);

        // Draft operations
        Task<Assignment?> GetDraftByAssignmentIdAsync(int assignmentId);
        Task DeleteDraftAsync(int assignmentId);

        // Additional queries
        Task<List<Assessmentform>> GetFormsByCreatorAsync(int createdBy);
        Task<List<Assessmentform>> GetFormsByTypeAsync(string formType);

        Task SaveChangesAsync();
    }
}
