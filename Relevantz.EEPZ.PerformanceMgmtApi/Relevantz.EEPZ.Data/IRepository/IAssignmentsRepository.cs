using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IAssignmentsRepository
    {
        Task<Assessmentform?> GetFormByIdAsync(int formId);
        Task<List<Assessmentform>> GetAllFormsAsync();

        Task<Userauthentication?> GetUserByIdAsync(int userId);
        Task<Userauthentication?> GetUserByEmployeeIdAsync(int employeeId);
        Task<List<Userauthentication>> GetUsersByIdsAsync(List<int> userIds);
        Task<List<Userauthentication>> GetAllActiveUsersAsync();

        Task<Userprofile?> GetUserProfileByEmployeeIdAsync(int employeeId);
        Task<Employee?> GetEmployeeByIdAsync(int employeeId);
        Task<Employeedetailsmaster?> GetEmployeeDetailsByEmployeeIdAsync(int employeeId);

        Task<Assignment?> GetAssignmentByIdAsync(int assignmentId);
        Task<List<Assignment>> GetAssignmentsByFormIdAsync(int formId);
        Task<List<Assignment>> GetAssignmentsByUserIdAsync(int userId);
        Task<List<Assignment>> GetAssignmentsByEmployeeIdAsync(int employeeId);
        Task<List<Assignment>> GetAllAssignmentsAsync();
        Task<List<Assignment>> GetDraftAssignmentsAsync();
        Task<bool> AssignmentExistsAsync(int formId, int employeeId, string action);

        Task AddAssignmentAsync(Assignment assignment);
        Task UpdateAssignmentAsync(Assignment assignment);
        Task DeleteAssignmentAsync(int assignmentId);

        Task<Formprogresstracker?> GetProgressTrackerByAssignmentIdAsync(int assignmentId);
        Task AddFormProgressTrackerAsync(Formprogresstracker tracker);
        Task UpdateProgressTrackerAsync(Formprogresstracker tracker);

        Task<Selfassessment?> GetSelfAssessmentByFormAndEmployeeAsync(int formId, int employeeId);

        Task<List<Employee>> GetActiveEmployeesAsync();
        Task<List<Employeedetailsmaster>> GetEmployeeDetailsByIdsAsync(List<int> employeeIds);

        Task SaveChangesAsync();
    }
}
