using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IAssignmentsRepository
    {
        // Form lookups
        Task<Assessmentform?> GetFormByIdAsync(int formId);
        Task<List<Assessmentform>> GetAllFormsAsync();

        // User/Employee lookups
        Task<Userauthentication?> GetUserByIdAsync(int userId);
        Task<Userauthentication?> GetUserByEmployeeIdAsync(int employeeId);
        Task<List<Userauthentication>> GetUsersByIdsAsync(List<int> userIds);
        Task<List<Userauthentication>> GetAllActiveUsersAsync();

        // Employee/Profile lookups
        Task<Userprofile?> GetUserProfileByEmployeeIdAsync(int employeeId);
        Task<Employee?> GetEmployeeByIdAsync(int employeeId);
        Task<Employeedetailsmaster?> GetEmployeeDetailsByEmployeeIdAsync(int employeeId);

        // Assignment CRUD
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

        // Progress tracker
        Task<Formprogresstracker?> GetProgressTrackerByAssignmentIdAsync(int assignmentId);
        Task AddFormProgressTrackerAsync(Formprogresstracker tracker);
        Task UpdateProgressTrackerAsync(Formprogresstracker tracker);

        // Self assessments
        Task<Selfassessment?> GetSelfAssessmentByFormAndEmployeeAsync(int formId, int employeeId);

        // Eligibility helpers
        Task<List<Employee>> GetActiveEmployeesAsync();
        Task<List<Employeedetailsmaster>> GetEmployeeDetailsByIdsAsync(List<int> employeeIds);

        Task SaveChangesAsync();
    }
}
