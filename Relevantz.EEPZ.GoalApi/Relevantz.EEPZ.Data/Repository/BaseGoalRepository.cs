using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Enums;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interface;
using Serilog;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class BaseGoalRepository : IBaseGoalRepository
    {
        private readonly EEPZDbContext _db;    
        private readonly IWebHostEnvironment environment;    

        public BaseGoalRepository(EEPZDbContext db, IWebHostEnvironment _environment)
        {
            _db = db;   
            environment = _environment;   
        }

        public async Task<Employeedetailsmaster?> GetEmployeeDetailsByMasterIdAsync(
            int employeeMasterId
        )
        {
            try
            {
                Log.Information(
                    "[GetEmployeeDetailsByMasterIdAsync] Fetching EDM for {ID}",
                    employeeMasterId
                );

                var result = await _db
                    .Employeedetailsmasters.Include(e => e.Employee)
                    .ThenInclude(e => e.Userprofile)
                    .Include(e => e.Role)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(e => e.EmployeeMasterId == employeeMasterId);

                if (result == null)  
                {
                    Log.Warning(
                        "[GetEmployeeDetailsByMasterIdAsync] EDM not found for {ID}",
                        employeeMasterId
                    );
                    return null;
                }

                Log.Information(
                    "[GetEmployeeDetailsByMasterIdAsync] Found - Employee: {First} {Last}, Profile: {ProfileExists}",
                    result.Employee?.Userprofile?.FirstName,
                    result.Employee?.Userprofile?.LastName,
                    result.Employee?.Userprofile != null
                );

                return result;
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "[GetEmployeeDetailsByMasterIdAsync] Error for {ID}",
                    employeeMasterId
                );
                throw;
            }
        }

        public async Task<Goal?> GetGoalByIdAsync(int goalId)
        {
            try
            {
                Log.Information("[GetGoalByIdAsync] Fetching goal {GoalId}", goalId);
                var result = await _db
                    .Goals.Include(g => g.GoalChecklists)
                    .ThenInclude(c => c.Goalchecklistprogresses)
                    .Include(g => g.GoalAssignments)
                    .Include(g => g.GoalApprovals)
                    .Include(g => g.GoalAttachments)
                    .Include(g => g.GoalComments)
                    .Include(g => g.Goalprogresslogs)
                    .FirstOrDefaultAsync(g => g.GoalId == goalId);
                Log.Information("[GetGoalByIdAsync] Successfully fetched goal {GoalId}", goalId);
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetGoalByIdAsync] Error fetching goal {GoalId}", goalId);
                throw;
            }
        }

        public async Task<int?> GetReportingManagerEmployeeMasterIdAsync(int employeeMasterId)
        {
            try
            {
                Log.Information(
                    "[GetReportingManagerEmployeeMasterIdAsync] Fetching reporting manager for employee {EmployeeMasterId}",
                    employeeMasterId
                );
                var employee = await _db
                    .Employeedetailsmasters.Include(edm => edm.Employee)
                    .FirstOrDefaultAsync(edm => edm.EmployeeMasterId == employeeMasterId);

                if (employee?.Employee?.ReportingManagerEmployeeId == null)
                {
                    Log.Warning(
                        "[GetReportingManagerEmployeeMasterIdAsync] No manager found for employee {EmployeeMasterId}",
                        employeeMasterId
                    );
                    return null;
                }

                var managerEdm = await _db.Employeedetailsmasters.FirstOrDefaultAsync(edm =>
                    edm.EmployeeId == employee.Employee.ReportingManagerEmployeeId
                );

                if (managerEdm != null)
                    Log.Information(
                        "[GetReportingManagerEmployeeMasterIdAsync] Manager found: {ManagerID}",
                        managerEdm.EmployeeMasterId
                    );

                return managerEdm?.EmployeeMasterId;
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "[GetReportingManagerEmployeeMasterIdAsync] Error fetching reporting manager"
                );
                throw;
            }
        }

        public async Task<bool> IsGoalParticipantAsync(int goalId, int employeeMasterId)
        {
            try
            {
                Log.Information(
                    "[IsGoalParticipantAsync] Checking if user {UserID} participates in goal {GoalId}",
                    employeeMasterId,
                    goalId
                );
                var goal = await _db
                    .Goals.Include(g => g.GoalAssignments)
                    .FirstOrDefaultAsync(g => g.GoalId == goalId);

                if (goal == null)
                {
                    Log.Warning("[IsGoalParticipantAsync] Goal not found: {GoalId}", goalId);
                    return false;
                }

                var result =
                    goal.CreatedBy == employeeMasterId
                    || goal.GoalAssignments.Any(a => a.AssignedTo == employeeMasterId);
                Log.Information("[IsGoalParticipantAsync] Is participant: {IsParticipant}", result);
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[IsGoalParticipantAsync] Error checking goal participant");
                throw;
            }
        }

        public async Task<Goalprogresslog?> GetLatestProgressLogAsync(int goalId)
        {
            try
            {
                Log.Information(
                    "[GetLatestProgressLogAsync] Fetching latest progress log for goal {GoalId}",
                    goalId
                );
                var result = await _db
                    .Goalprogresslogs.Where(p => p.GoalId == goalId)
                    .OrderByDescending(p => p.UpdatedOn)
                    .FirstOrDefaultAsync();
                Log.Information(
                    "[GetLatestProgressLogAsync] Latest progress log found: {Found}",
                    result != null
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetLatestProgressLogAsync] Error fetching latest progress log");
                throw;
            }
        }

        public async Task<int> CountCompletedForUserAsync(int goalId, int userEmployeeMasterId)
        {
            try
            {
                Log.Information(
                    "[CountCompletedForUserAsync] Counting completed items for goal {GoalId}, user {UserID}",
                    goalId,
                    userEmployeeMasterId
                );
                var result = await _db
                    .Goalchecklistprogresses.Where(p =>
                        p.IsCompleted == true
                        && p.UserId == userEmployeeMasterId
                        && _db.GoalChecklists.Any(c =>
                            c.ChecklistId == p.ChecklistId && c.GoalId == goalId
                        )
                    )
                    .CountAsync();
                Log.Information(
                    "[CountCompletedForUserAsync] Found {Count} completed items",
                    result
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[CountCompletedForUserAsync] Error counting completed items");
                throw;
            }
        }

        public async Task<int> CountTotalForUserAsync(int goalId, int userEmployeeMasterId)
        {
            try
            {
                Log.Information(
                    "[CountTotalForUserAsync] Counting total items for goal {GoalId}, user {UserID}",
                    goalId,
                    userEmployeeMasterId
                );
                var result = await _db
                    .GoalChecklists.Where(c =>
                        c.GoalId == goalId && c.AddedFor == userEmployeeMasterId
                    )
                    .CountAsync();
                Log.Information("[CountTotalForUserAsync] Found {Count} total items", result);
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[CountTotalForUserAsync] Error counting total items");
                throw;
            }
        }

        public async Task<string?> GetUserRoleAsync(int employeeMasterId)
        {
            try
            {
                Log.Information(
                    "[GetUserRoleAsync] Fetching role for employee {EmployeeMasterId}",
                    employeeMasterId
                );
                var edm = await _db
                    .Employeedetailsmasters.Include(edm => edm.Role)
                    .FirstOrDefaultAsync(edm => edm.EmployeeMasterId == employeeMasterId);

                var roleName = edm?.Role?.RoleName;
                Log.Information("[GetUserRoleAsync] Role: {Role}", roleName ?? "NOT FOUND");
                return roleName;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetUserRoleAsync] Error fetching user role");
                throw;
            }
        }

        public async Task<bool> IsUserAssignedToGoalAsync(int goalId, int employeeMasterId)
        {
            try
            {
                Log.Information(
                    "[IsUserAssignedToGoalAsync] Checking if user {UserID} is assigned to goal {GoalId}",
                    employeeMasterId,
                    goalId
                );
                var result = await _db.GoalAssignments.AnyAsync(a =>
                    a.GoalId == goalId && a.AssignedTo == employeeMasterId
                );
                Log.Information("[IsUserAssignedToGoalAsync] User assigned: {IsAssigned}", result);
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[IsUserAssignedToGoalAsync] Error checking user assignment");
                throw;
            }
        }

        public async Task<bool> IsEmployeeInDepartmentAsync(int goalId, int departmentId)
        {
            var goal = await _db
                .Goals.Include(g => g.GoalAssignments)
                .FirstOrDefaultAsync(g => g.GoalId == goalId);

            if (goal == null)
                return false;

            var assigneeIds = goal
                .GoalAssignments.Where(a => a.AssignedTo.HasValue)
                .Select(a => a.AssignedTo.Value)
                .ToList();

            var isInDept = await _db.Employeedetailsmasters.AnyAsync(e =>
                e.DepartmentId == departmentId && assigneeIds.Contains(e.EmployeeMasterId)
            );

            return isInDept;
        }

        public async Task<List<GoalAssignment>> GetAssigneesAsync(int goalId)
        {
            try
            {
                Log.Information("[GetAssigneesAsync] Fetching assignees for goal {GoalId}", goalId);
                var result = await _db.GoalAssignments.Where(a => a.GoalId == goalId).ToListAsync();
                Log.Information("[GetAssigneesAsync] Found {Count} assignees", result.Count);
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "[GetAssigneesAsync] Error fetching assignees for goal {GoalId}",
                    goalId
                );
                throw;
            }
        }

        public async Task<bool> CanUserCommentOnGoalAsync(
            int goalId,
            int employeeMasterId,
            string role
        )
        {
            try
            {
                Log.Information(
                    "[CanUserCommentOnGoalAsync] Checking permission - Goal {GoalId}, User {ID} ({Role})",
                    goalId,
                    employeeMasterId,
                    role
                );

                // Get the goal
                var goal = await _db
                    .Goals.AsNoTracking()
                    .FirstOrDefaultAsync(g => g.GoalId == goalId);

                if (goal == null)
                    return false;

                // Creator can always comment
                if (goal.CreatedBy == employeeMasterId)
                    return true;

                // Assignee can always comment
                var isAssignee = await _db
                    .GoalAssignments.AsNoTracking()
                    .AnyAsync(a => a.GoalId == goalId && a.AssignedTo == employeeMasterId);

                if (isAssignee)
                    return true;

                // DeptHead/Manager can comment on TEAM goals
                var isDeptHeadOrManager =
                    role == USER_ROLE.DEPARTMENT_HEAD || role == USER_ROLE.MANAGER;
                var isTeamGoal = goal.GoalType == GOAL_TYPE.TEAM;

                if (isDeptHeadOrManager && isTeamGoal)
                {
                    Log.Information(
                        "[CanUserCommentOnGoalAsync] {Role} {ID} can comment on team goal {GoalId}",
                        role,
                        employeeMasterId,
                        goalId
                    );
                    return true;
                }

                Log.Warning(
                    "[CanUserCommentOnGoalAsync] Access denied - User {ID} ({Role}) on goal {GoalId}",
                    employeeMasterId,
                    role,
                    goalId
                );
                return false;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[CanUserCommentOnGoalAsync] Error checking permission");
                throw;
            }
        }

        public async Task<bool> IsGoalCommentableAsync(int goalId)
        {
            try
            {
                var goal = await _db
                    .Goals.AsNoTracking()
                    .FirstOrDefaultAsync(g => g.GoalId == goalId);

                if (goal == null)
                    return false;

                // Cannot comment on completed/closed/cancelled goals
                var nonCommentableStatuses = new[] { "completed", "closed", "cancelled" };
                var isCommentable = !nonCommentableStatuses.Contains(
                    goal.Goalstatus?.ToLower() ?? ""
                );

                Log.Information(
                    "[IsGoalCommentableAsync] Goal {GoalId} - Status: {Status}, Commentable: {Commentable}",
                    goalId,
                    goal.Goalstatus,
                    isCommentable
                );

                return isCommentable;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[IsGoalCommentableAsync] Error checking if goal is commentable");
                throw;
            }
        }

        public async Task<List<GoalChecklist>> GetChecklistItemsByGoalIdAsync(int goalId)
        {
            try
            {
                Log.Information(
                    "[GetChecklistItemsByGoalIdAsync] Fetching checklist items for goal {GoalId}",
                    goalId
                );
                var result = await _db
                    .GoalChecklists.Where(x => x.GoalId == goalId)
                    .Include(x => x.Goalchecklistprogresses)
                    .ToListAsync();
                Log.Information(
                    "[GetChecklistItemsByGoalIdAsync] Found {Count} items",
                    result.Count
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetChecklistItemsByGoalIdAsync] Error fetching checklist items");
                throw;
            }
        }

        public async Task<bool> ChecklistHasProgressAsync(int checklistId, int userId)
        {
            try
            {
                Log.Information(
                    "[ChecklistHasProgressAsync] Checking progress for checklist {ChecklistId}, user {UserID}",
                    checklistId,
                    userId
                );
                var result = await _db.Goalchecklistprogresses.AnyAsync(x =>
                    x.ChecklistId == checklistId && x.UserId == userId && x.IsCompleted == true
                );
                Log.Information("[ChecklistHasProgressAsync] Has progress: {HasProgress}", result);
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[ChecklistHasProgressAsync] Error checking progress");
                throw;
            }
        }

        public async Task<Project?> GetProjectByIdAsync(int projectId)
        {
            try
            {
                Log.Information("[GetProjectByIdAsync] Fetching project {ProjectId}", projectId);
                var result = await _db.Projects.FirstOrDefaultAsync(p => p.ProjectId == projectId);
                Log.Information("[GetProjectByIdAsync] Project found: {Found}", result != null);
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetProjectByIdAsync] Error fetching project");
                throw;
            }
        }

        public async Task<bool> HasPendingApprovalAsync(int goalId, int userId)
        {
            try
            {
                Log.Information(
                    "[HasPendingApprovalAsync] Checking for pending approvals on goal {GoalId}, user {UserID}",
                    goalId,
                    userId
                );
                var result = await _db.GoalApprovals.AnyAsync(a =>
                    a.GoalId == goalId
                    && a.RequestedBy == userId
                    && a.ApprovalStatus == APPROVAL_STATUS.PENDING
                    && (
                        a.ApprovalType == APPROVAL_TYPE.COMPLETION
                        || a.ApprovalType == APPROVAL_TYPE.TASK_ACKNOWLEDGMENT
                    )
                );
                Log.Information(
                    "[HasPendingApprovalAsync] Has pending approval: {HasPending}",
                    result
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[HasPendingApprovalAsync] Error checking pending approvals");
                throw;
            }
        }

        public async Task<GoalAssignment> GetGoalAssignmentAsync(int goalId, int assignedTo)
        {
            try
            {
                Log.Information(
                    "[GetGoalAssignmentAsync] Fetching assignment for goal {GoalId}, assignee {AssigneeID}",
                    goalId,
                    assignedTo
                );
                var result = await _db.GoalAssignments.FirstOrDefaultAsync(ga =>
                    ga.GoalId == goalId && ga.AssignedTo == assignedTo
                );
                Log.Information(
                    "[GetGoalAssignmentAsync] Assignment found: {Found}",
                    result != null
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetGoalAssignmentAsync] Error fetching goal assignment");
                throw;
            }
        }

        public async Task<List<int>> GetSubordinateEmployeeMasterIdsAsync(
            int managerEmployeeMasterId
        )
        {
            try
            {
                Log.Information(
                    "[GetSubordinateEmployeeMasterIdsAsync] Fetching subordinates for manager {ManagerID}",
                    managerEmployeeMasterId
                );
                var managerEdm = await _db
                    .Employeedetailsmasters.Include(edm => edm.Employee)
                    .FirstOrDefaultAsync(edm => edm.EmployeeMasterId == managerEmployeeMasterId);

                if (managerEdm == null)
                {
                    Log.Warning(
                        "[GetSubordinateEmployeeMasterIdsAsync] Manager not found: {ManagerID}",
                        managerEmployeeMasterId
                    );
                    return new List<int>();
                }

                var subordinates = await _db
                    .Employees.Where(e => e.ReportingManagerEmployeeId == managerEdm.EmployeeId)
                    .Select(e => e.EmployeeId)
                    .ToListAsync();

                var subordinateMasterIds = await _db
                    .Employeedetailsmasters.Where(edm => subordinates.Contains(edm.EmployeeId))
                    .Select(edm => edm.EmployeeMasterId)
                    .ToListAsync();

                Log.Information(
                    "[GetSubordinateEmployeeMasterIdsAsync] Found {Count} subordinates",
                    subordinateMasterIds.Count
                );
                return subordinateMasterIds;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetSubordinateEmployeeMasterIdsAsync] Error fetching subordinates");
                throw;
            }
        }

        public async Task SaveChangesAsync()
        {
            try
            {
                Log.Information("[SaveChangesAsync] Saving changes to database");
                await _db.SaveChangesAsync();
                Log.Information("[SaveChangesAsync] Changes saved successfully");
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[SaveChangesAsync] Error saving changes");
                throw;
            }
        }
    }
}
