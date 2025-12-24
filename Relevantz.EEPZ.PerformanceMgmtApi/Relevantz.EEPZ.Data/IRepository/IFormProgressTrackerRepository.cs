using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface IFormProgressTrackerRepository
    {
        Task<List<Formprogresstracker>> GetAllTrackersWithAssignmentsAsync();
        Task<Formprogresstracker?> GetTrackerByIdAsync(int trackerId);
        Task<Formprogresstracker?> GetTrackerByAssignmentIdAsync(int assignmentId);
        Task<Formprogresstracker?> GetTrackerForUpsertAsync(int assignmentId);
        Task UpsertTrackerAsync(Formprogresstracker tracker);
        Task ReloadTrackerAsync(Formprogresstracker tracker);

        Task<List<Userauthentication>> GetUsersByUserIdsAsync(List<int> userIds);
        Task<List<Userprofile>> GetUserProfilesByEmployeeIdsAsync(List<int> employeeIds);
        Task<List<Employee>> GetEmployeesByEmployeeIdsAsync(List<int> employeeIds);
        Task<List<Selfassessment>> GetLatestSelfAssessmentsAsync(List<int> userIds, List<int> formIds);
        Task<List<Departmentheadapproval>> GetDeptApprovalsByAssessmentIdsAsync(List<int> assessmentIds);
    }
}
