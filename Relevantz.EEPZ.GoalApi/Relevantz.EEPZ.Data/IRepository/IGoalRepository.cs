using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interface
{
    public interface IGoalRepository
    {
        Task<List<Goal>> QueryGoalsAsync(GoalQueryDto request);
        Task AddGoalAsync(Goal goal);
        Task UpdateGoalAsync(Goal goal);
        Task<List<Project>> GetUserProjectsAsync(int employeeMasterId);
        Task<List<Project>> GetAllProjectsAsync();
        Task<Project> GetProjectAsync(int projectId);
        Task<List<GoalChecklist>> GetChecklistByGoalAsync(int goalId);
        Task AddChecklistRangeAsync(List<GoalChecklist> items);
        Task AddAssignmentsAsync(List<GoalAssignment> assignments);
        Task UpdateGoalAssignmentAsync(GoalAssignment assignment);
        Task<bool> IsManagerOfAsync(int managerEmployeeMasterId, int employeeEmployeeMasterId);
        Task<bool> IsManagerOfGoalAssigneesAsync(int goalId, int managerId);
        Task<bool> IsEmployeeInProjectAsync(int employeeMasterId, int projectId);
        Task<List<Project>> GetUserProjectsByEmployeeIdAsync(int employeeId);
        Task<List<AssigneeDto>> GetAssigneesWithDetailsAsync(int goalId);
        Task<bool> IsGoalCreatorAsync(int goalId, int employeeMasterId);
        Task<List<int>> GetGoalParticipantIdsAsync(int goalId);
        Task AddChecklistItemAsync(GoalChecklist item);
        Task DeleteChecklistItemAsync(int checklistId);
        Task UpdateGoalProgressAsync(int goalId, decimal progress, int userId);
    }
}
