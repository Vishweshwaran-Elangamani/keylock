using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Data.Repository.Interface
{
    public interface IBaseGoalRepository
    {
        Task<Employeedetailsmaster?> GetEmployeeDetailsByMasterId(int employeeMasterId);
        Task<Goal?> GetGoalById(int goalId);
        Task<int?> GetReportingManagerEmployeeMasterId(int employeeMasterId);
        Task<bool> IsGoalParticipant(int goalId, int employeeMasterId);
        Task<Goalprogresslog?> GetLatestProgressLog(int goalId);
        Task<int> CountCompletedForUser(int goalId, int userEmployeeMasterId);
        Task<int> CountTotalForUser(int goalId, int userEmployeeMasterId);
        Task<string?> GetUserRole(int employeeMasterId);
        Task<bool> IsUserAssignedToGoal(int goalId, int employeeMasterId);
        Task<bool> IsEmployeeInDepartment(int goalId, int departmentId);
        Task<List<GoalAssignment>> GetAssignees(int goalId);
        Task<bool> CanUserCommentOnGoal(int goalId, int employeeMasterId, string role);
        Task<bool> IsGoalCommentable(int goalId);
        Task<List<GoalChecklist>> GetChecklistItemsByGoalId(int goalId);
        Task<bool> ChecklistHasProgress(int checklistId, int userId);
        Task<Project?> GetProjectById(int projectId);
        Task<bool> HasPendingApproval(int goalId, int userId);
        Task<GoalAssignment> GetGoalAssignment(int goalId, int assignedTo);

        Task<List<int>> GetSubordinateEmployeeMasterIds(int managerEmployeeMasterId);
        Task SaveChanges();
    }
}
