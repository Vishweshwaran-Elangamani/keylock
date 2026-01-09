using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interface
{
    public interface IBaseGoalRepository
    {
        Task<Employeedetailsmaster?> GetEmployeeDetailsByMasterIdAsync(int employeeMasterId);
        Task<Goal?> GetGoalByIdAsync(int goalId);
        Task<int?> GetReportingManagerEmployeeMasterIdAsync(int employeeMasterId);
        Task<bool> IsGoalParticipantAsync(int goalId, int employeeMasterId);
        Task<Goalprogresslog?> GetLatestProgressLogAsync(int goalId);
        Task<int> CountCompletedForUserAsync(int goalId, int userEmployeeMasterId);
        Task<int> CountTotalForUserAsync(int goalId, int userEmployeeMasterId);
        Task<string?> GetUserRoleAsync(int employeeMasterId);
        Task<bool> IsUserAssignedToGoalAsync(int goalId, int employeeMasterId);
        Task<bool> IsEmployeeInDepartmentAsync(int goalId, int departmentId);
        Task<List<GoalAssignment>> GetAssigneesAsync(int goalId);
        Task<bool> CanUserCommentOnGoalAsync(int goalId, int employeeMasterId, string role);
        Task<bool> IsGoalCommentableAsync(int goalId);
        Task<List<GoalChecklist>> GetChecklistItemsByGoalIdAsync(int goalId);
        Task<bool> ChecklistHasProgressAsync(int checklistId, int userId);
        Task<Project?> GetProjectByIdAsync(int projectId);
        Task<bool> HasPendingApprovalAsync(int goalId, int userId);
        Task<GoalAssignment> GetGoalAssignmentAsync(int goalId, int assignedTo);

        Task<List<int>> GetSubordinateEmployeeMasterIdsAsync(int managerEmployeeMasterId);
        Task SaveChangesAsync();
    }
}
