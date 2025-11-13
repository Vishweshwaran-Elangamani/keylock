using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interface
{
    public interface IGoalModuleRepository
    {
        // Goals
        Task<Goal?> GetGoalByIdAsync(int goalId);
        Task<List<Goal>> QueryGoalsAsync(
            int requesterEmployeeMasterId,
            string? type,
            string? status,
            int? projectId,
            DateTime? dueBefore,
            DateTime? dueAfter,
            string? search,
            int? createdBy,
            int? assignedTo,
            DateTime? createdAfter,
            DateTime? createdBefore,
            int page,
            int pageSize,
            string? requesterRole = null 
        );
        Task AddGoalAsync(Goal goal);
        Task UpdateGoalAsync(Goal goal);

        // Projects
        Task<List<Project>> GetUserProjectsAsync(int employeeMasterId);
        Task<List<Project>> GetAllProjectsAsync();
        Task<Project> GetProjectAsync(int projectId);
        Task<List<ProjectEmployeeDto>> GetProjectEmployeesAsync(int projectId);
        Task<List<ProjectEmployeeDto>> GetProjectSubordinatesAsync(
            int projectId,
            int managerEmployeeMasterId
        );

        // Checklist
        Task<List<GoalChecklist>> GetChecklistByGoalAsync(int goalId);
        Task AddChecklistRangeAsync(List<GoalChecklist> items);
        Task<GoalChecklist?> GetChecklistItemAsync(int checklistId);
        Task<List<GoalApproval>> GetPendingApprovalsForGoalAndUserAsync(
            int goalId,
            int employeeMasterId,
            string[] approvalTypes
        );

        // Progress
        Task<Goalchecklistprogress?> GetChecklistProgressAsync(
            int checklistId,
            int userEmployeeMasterId
        );
        Task SetChecklistProgressAsync(int checklistId, int userEmployeeMasterId, bool completed);
        Task<int> CountCompletedForUserAsync(int goalId, int userEmployeeMasterId);
        Task<int> CountTotalForUserAsync(int goalId, int userEmployeeMasterId);

        // Assignments
        Task<List<GoalAssignment>> GetAssigneesAsync(int goalId);
        Task AddAssignmentsAsync(List<GoalAssignment> assignments);
        Task<bool> IsUserAssignedToGoalAsync(int goalId, int employeeMasterId);
        Task<GoalAssignment> GetGoalAssignmentAsync(int goalId, int assignedTo);
        Task UpdateGoalAssignmentAsync(GoalAssignment assignment);

        // Approvals
        Task AddApprovalAsync(GoalApproval approval);
        Task<GoalApproval?> GetApprovalByIdAsync(int approvalId);
        Task<List<GoalApproval>> GetPendingApprovalsForApproverAsync(int approverEmployeeMasterId);
        Task UpdateApprovalAsync(GoalApproval approval);
        Task<int> CountPendingApprovalsForUserAsync(int employeeMasterId);
        Task<List<GoalApproval>> GetAllApprovalsForUserAsync(int userId, string userRole);
        IQueryable<GoalApproval> GetGoalApprovalsQueryable();
        Task<int> CountAsync<T>(IQueryable<T> query);
        Task<List<T>> GetPagedAsync<T>(IQueryable<T> query, int page, int pageSize);
        Task<bool> HasPendingApprovalAsync(int goalId, int userId);

        // Add this method for closure/reactivation
        Task<GoalApproval?> GetPendingApprovalByGoalAndTypeAsync(int goalId, string approvalType);

        // Attachments
        Task AddAttachmentAsync(GoalAttachment attachment);
        Task<List<GoalAttachment>> GetAttachmentsByGoalAsync(int goalId);
        Task<GoalAttachment?> GetAttachmentByIdAsync(int attachmentId);
        Task MarkAttachmentsAsProofAsync(List<int> attachmentIds, int approvalId);
        Task DeleteAttachmentAsync(int attachmentId);
        Task<List<GoalAttachment>> GetProofAttachmentsForApprovalAsync(int approvalId);
        Task UnmarkProofAttachmentsAsync(int approvalId);

        // Comments
        Task AddCommentAsync(GoalComment comment);
        Task<List<GoalComment>> GetCommentsByGoalAsync(int goalId);
        Task<bool> CanUserCommentOnGoalAsync(int goalId, int employeeMasterId, string role);
        Task<bool> IsGoalCommentableAsync(int goalId);

        // Progress Logs
        Task AddProgressLogAsync(Goalprogresslog log);
        Task<List<Goalprogresslog>> GetProgressLogsByGoalAsync(int goalId);
        Task<Goalprogresslog?> GetLatestProgressLogAsync(int goalId);

        // Employee Hierarchy
        Task<int?> GetReportingManagerEmployeeMasterIdAsync(int employeeMasterId);
        Task<List<int>> GetSubordinateEmployeeMasterIdsAsync(int managerEmployeeMasterId);
        Task<bool> IsManagerOfAsync(int managerEmployeeMasterId, int employeeEmployeeMasterId);
        Task<string?> GetUserRoleAsync(int employeeMasterId);
        Task<Employeedetailsmaster?> GetEmployeeDetailsByMasterIdAsync(int employeeMasterId);
        Task<bool> IsEmployeeInDepartmentAsync(int goalId, int departmentId);
        Task<bool> IsManagerOfGoalAssigneesAsync(int goalId, int managerId);

        // Project Info
        Task<Project?> GetProjectByIdAsync(int projectId);
        Task<bool> IsEmployeeInProjectAsync(int employeeMasterId, int projectId);
        Task<List<Project>> GetUserProjectsByEmployeeIdAsync(int employeeId);
        Task<List<AssigneeDto>> GetAssigneesWithDetailsAsync(int goalId);

        // Goal Access
        Task<bool> IsGoalCreatorAsync(int goalId, int employeeMasterId);
        Task<bool> IsGoalParticipantAsync(int goalId, int employeeMasterId);
        Task<List<int>> GetGoalParticipantIdsAsync(int goalId);

        // Cascading Progress
        Task<List<int>> GetSubordinatesAssignedToGoalAsync(int goalId, int managerEmployeeMasterId);
        Task<List<GoalChecklist>> GetUserOwnChecklistItemsAsync(int goalId, int userId);
        Task<int> CountUserOwnCompletedItemsAsync(int goalId, int userId);

        Task<List<GoalChecklist>> GetChecklistItemsByGoalIdAsync(int goalId);
        Task AddChecklistItemAsync(GoalChecklist item);
        Task DeleteChecklistItemAsync(int checklistId);
        Task<bool> ChecklistHasProgressAsync(int checklistId, int userId);
        Task UpdateGoalProgressAsync(int goalId, decimal progress, int userId);

        Task SaveChangesAsync();
    }
}
