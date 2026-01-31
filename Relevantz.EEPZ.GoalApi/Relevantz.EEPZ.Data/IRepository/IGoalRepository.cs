using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Data.Repository.Interface
{
    public interface IGoalRepository
    {
        Task<List<Goal>> QueryGoals(GoalQueryModel request);
        Task AddGoal(Goal goal);
        Task UpdateGoal(Goal goal);
        Task<List<Project>> GetUserProjects(int employeeMasterId);
        Task<List<Project>> GetAllProjects();
        Task<Project> GetProject(int projectId);
        Task<List<GoalChecklist>> GetChecklistByGoal(int goalId);
        Task AddChecklistRange(List<GoalChecklist> items);
        Task AddAssignments(List<GoalAssignment> assignments);
        Task UpdateGoalAssignment(GoalAssignment assignment);
        Task<bool> IsManagerOf(int managerEmployeeMasterId, int employeeEmployeeMasterId);
        Task<bool> IsManagerOfGoalAssignees(int goalId, int managerId);
        Task<bool> IsEmployeeInProject(int employeeMasterId, int projectId);
        Task<List<Project>> GetUserProjectsByEmployeeId(int employeeId);
        Task<List<AssigneeModel>> GetAssigneesWithDetails(int goalId);
        Task<bool> IsGoalCreator(int goalId, int employeeMasterId);
        Task<List<int>> GetGoalParticipantIds(int goalId);
        Task AddChecklistItem(GoalChecklist item);
        Task DeleteChecklistItem(int checklistId);
        Task UpdateGoalProgress(int goalId, decimal progress, int userId);
    }
}
