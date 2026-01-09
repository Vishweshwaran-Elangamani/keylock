using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Enums;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Data.Repository.Interface;
using Serilog;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class BaseGoalService : IBaseGoalService
    {
        private readonly IBaseGoalRepository _repo;
        private readonly IWebHostEnvironment _environment;

        public BaseGoalService(IBaseGoalRepository repo, IWebHostEnvironment environment)
        {
            _repo = repo;
            _environment = environment;
        }

        public bool CanCreate(string role, string goalType) =>
            (goalType == GOAL_TYPE.SELF) // All roles can create self goals
            || (
                goalType == GOAL_TYPE.TEAM
                && (role == USER_ROLE.MANAGER || role == USER_ROLE.DEPARTMENT_HEAD)
            )
            || (goalType == GOAL_TYPE.ORG && role == USER_ROLE.LEADERSHIP);

        public string? GetCreationApprovalType(string goalType) =>
            goalType == GOAL_TYPE.SELF ? APPROVAL_TYPE.SELF_GOAL_ACTIVATION
            : goalType == GOAL_TYPE.TEAM ? APPROVAL_TYPE.CREATION
            : null;

        public async Task<int?> GetApproverForUserAsync(int employeeMasterId, string approvalType)
        {
            // Get the user's reporting manager
            var managerId = await _repo.GetReportingManagerEmployeeMasterIdAsync(employeeMasterId);
            return managerId;
        }

        public async Task<string> GetEmployeeNameAsync(int? employeeMasterId)
        {
            if (!employeeMasterId.HasValue)
                return PROJECT_STATUS.UNKNOWN;

            var edm = await _repo.GetEmployeeDetailsByMasterIdAsync(employeeMasterId.Value);
            if (edm?.Employee?.Userprofile == null)
                return PROJECT_STATUS.UNKNOWN;

            var profile = edm.Employee.Userprofile;
            return $"{profile.FirstName} {profile.LastName}";
        }

        public async Task<bool> CanMarkCompleteAsync(int goalId, int employeeMasterId)
        {
            var goal = await _repo.GetGoalByIdAsync(goalId);
            if (goal == null)
                return false;

            bool isParticipant = await _repo.IsGoalParticipantAsync(goalId, employeeMasterId);
            if (!isParticipant)
                return false;

            if (goal.Goalstatus != GOAL_STATUS.OPEN && goal.Goalstatus != GOAL_STATUS.IN_PROGRESS)
                return false;

            var progress = await GetGoalProgressPercentAsync(goalId, employeeMasterId);
            if (progress < 100)
                return false;

            if (
                goal.Goalendat.HasValue
                && goal.Goalendat.Value < DateTime.UtcNow
                && goal.Goalstatus != GOAL_STATUS.REOPENED
            )
            {
                return false;
            }

            return true;
        }

        public async Task<int> GetGoalProgressPercentAsync(int goalId, int forEmployeeMasterId)
        {
            var latestLog = await _repo.GetLatestProgressLogAsync(goalId);

            if (latestLog != null && latestLog.Source == PROGRESS_SOURCE.MANUAL)
            {
                return latestLog.ProgressPercent ?? 0;
            }
            else
            {
                var completed = await _repo.CountCompletedForUserAsync(goalId, forEmployeeMasterId);
                var total = await _repo.CountTotalForUserAsync(goalId, forEmployeeMasterId);
                return total == 0 ? 0 : (int)Math.Round((double)completed / total * 100);
            }
        }

        public async Task<bool> CanViewGoalAsync(int goalId, int employeeMasterId)
        {
            var goal = await _repo.GetGoalByIdAsync(goalId);
            if (goal == null)
                return false;

            // Get user role
            var userRole = await _repo.GetUserRoleAsync(employeeMasterId);

            // Leadership can view ANY goal
            if (userRole == USER_ROLE.LEADERSHIP)
                return true;

            // Org goals visible to everyone
            if (goal.GoalType == GOAL_TYPE.ORG)
                return true;

            // Creator can always view
            if (goal.CreatedBy == employeeMasterId)
                return true;

            // Assignees can view
            if (await _repo.IsUserAssignedToGoalAsync(goalId, employeeMasterId))
                return true;

            // Reporting managers can view their subordinates' self goals
            if (goal.GoalType == GOAL_TYPE.SELF && goal.CreatedBy.HasValue)
            {
                var creatorManagerId = await _repo.GetReportingManagerEmployeeMasterIdAsync(
                    goal.CreatedBy.Value
                );
                if (creatorManagerId.HasValue && creatorManagerId.Value == employeeMasterId)
                {
                    return true;
                }
            }

            // Dept Head can view team goals in their department
            if (userRole == USER_ROLE.DEPARTMENT_HEAD && goal.GoalType == GOAL_TYPE.TEAM)
            {
                var deptHead = await _repo.GetEmployeeDetailsByMasterIdAsync(employeeMasterId);
                if (deptHead != null)
                {
                    var isInDept = await _repo.IsEmployeeInDepartmentAsync(
                        goalId,
                        deptHead.DepartmentId
                    );
                    if (isInDept)
                        return true;
                }
            }

            // Managers can view team goals of their subordinates
            if (goal.GoalType == GOAL_TYPE.TEAM && goal.CreatedBy.HasValue)
            {
                var creatorManagerId = await _repo.GetReportingManagerEmployeeMasterIdAsync(
                    goal.CreatedBy.Value
                );
                if (creatorManagerId.HasValue && creatorManagerId.Value == employeeMasterId)
                {
                    return true;
                }
            }
            return false;
        }

        public async Task<bool> CanCommentOnGoalAsync(
            int goalId,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            var goal = await _repo.GetGoalByIdAsync(goalId);
            if (goal == null)
                return false;

            var isCreator = goal.CreatedBy == currentUserEmployeeMasterId;
            var isAssignee = await _repo.IsUserAssignedToGoalAsync(
                goalId,
                currentUserEmployeeMasterId
            );
            var isLeadership = currentUserRole == USER_ROLE.LEADERSHIP;
            switch (goal.GoalType?.ToLower())
            {
                case GOAL_TYPE.SELF:
                    if (isCreator)
                        return true;

                    // Check if user is the creator's manager
                    var creatorManagerId = await _repo.GetReportingManagerEmployeeMasterIdAsync(
                        goal.CreatedBy ?? 0
                    );
                    return creatorManagerId == currentUserEmployeeMasterId;

                case GOAL_TYPE.TEAM:
                    if (isCreator || isAssignee)
                        return true;

                    // Check if user is a manager/dept head/leadership
                    if (USER_ROLE.MANAGERIAL_ROLES.Contains(currentUserRole))
                    {
                        // Check if user is manager of any assignee
                        var assignees = await _repo.GetAssigneesAsync(goalId);
                        foreach (var assignee in assignees)
                        {
                            if (assignee.AssignedTo.HasValue)
                            {
                                var assigneeManagerId =
                                    await _repo.GetReportingManagerEmployeeMasterIdAsync(
                                        assignee.AssignedTo.Value
                                    );
                                if (assigneeManagerId == currentUserEmployeeMasterId)
                                    return true;
                            }
                        }
                    }
                    return false;

                case GOAL_TYPE.ORG:
                    return isCreator || isLeadership;

                default:
                    return false;
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
                    "[CanUserCommentOnGoalAsync] Checking - Goal {GoalId}, User {ID} ({Role})",
                    goalId,
                    employeeMasterId,
                    role
                );

                var canComment = await _repo.CanUserCommentOnGoalAsync(
                    goalId,
                    employeeMasterId,
                    role
                );
                return canComment;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[CanUserCommentOnGoalAsync] Error checking permission");
                return false;
            }
        }

        public async Task<bool> IsGoalCommentableAsync(int goalId)
        {
            try
            {
                Log.Information("[IsGoalCommentableAsync] Checking - Goal {GoalId}", goalId);

                var isCommentable = await _repo.IsGoalCommentableAsync(goalId);
                return isCommentable;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[IsGoalCommentableAsync] Error checking if commentable");
                return false;
            }
        }

        public async Task<GoalDetailModel> GetGoalAsync(
            int goalId,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            var goal = await _repo.GetGoalByIdAsync(goalId);
            if (goal == null)
                throw new KeyNotFoundException("Goal not found");

            // Access control
            var canView = await CanViewGoalAsync(goalId, currentUserEmployeeMasterId);
            if (!canView)
                throw new UnauthorizedAccessException(
                    "You do not have permission to view this goal."
                );

            // Calculate OVERALL progress
            int progressPercent;
            var latestLog = await _repo.GetLatestProgressLogAsync(goalId);
            if (latestLog != null && latestLog.Source == PROGRESS_SOURCE.MANUAL)
            {
                progressPercent = latestLog.ProgressPercent ?? 0;
            }
            else
            {
                var allChecklistItems = await _repo.GetChecklistItemsByGoalIdAsync(goalId);
                if (allChecklistItems == null || !allChecklistItems.Any())
                {
                    progressPercent = 0;
                }
                else
                {
                    int completedCount = 0;
                    foreach (var item in allChecklistItems)
                    {
                        var isCompleted = await _repo.ChecklistHasProgressAsync(
                            item.ChecklistId,
                            item.AddedFor ?? currentUserEmployeeMasterId
                        );
                        if (isCompleted)
                            completedCount++;
                    }
                    progressPercent = (int)
                        Math.Round((double)completedCount / allChecklistItems.Count * 100);
                }
            }

            // Get project name
            string? projectName = null;
            if (goal.ProjectId.HasValue)
            {
                var project = await _repo.GetProjectByIdAsync(goal.ProjectId.Value);
                projectName = project?.ProjectName;
            }

            // Get creator name
            var creatorName = await GetEmployeeNameAsync(goal.CreatedBy);

            // GET ASSIGNEES WITH DETAILS (MOST IMPORTANT)
            var assignees = await GetAssigneesWithDetailsAsync(goalId);

            // Check permissions
            bool canEdit =
                goal.CreatedBy == currentUserEmployeeMasterId
                && goal.Goalstatus != GOAL_STATUS.COMPLETED
                && goal.Goalstatus != GOAL_STATUS.CLOSED;
            bool canComment = await CanCommentOnGoalAsync(
                goalId,
                currentUserEmployeeMasterId,
                currentUserRole
            );
            bool canMarkComplete = await CanMarkCompleteAsync(goalId, currentUserEmployeeMasterId);
            bool isOverdue =
                goal.Goalendat.HasValue
                && goal.Goalendat.Value < DateTime.UtcNow
                && goal.Goalstatus != GOAL_STATUS.COMPLETED
                && goal.Goalstatus != GOAL_STATUS.CLOSED;
            bool canRequestReopen = (
                isOverdue
                && (
                    goal.CreatedBy == currentUserEmployeeMasterId
                    || await _repo.IsUserAssignedToGoalAsync(goalId, currentUserEmployeeMasterId)
                )
            );
            // Check if user has pending approval
            bool hasPendingApproval = await _repo.HasPendingApprovalAsync(
                goalId,
                currentUserEmployeeMasterId
            );

            return new GoalDetailModel
            {
                GoalId = goal.GoalId,
                GoalType = goal.GoalType ?? GOAL_TYPE.SELF,
                ProjectId = goal.ProjectId,
                ProjectName = projectName,
                Title = goal.GoalTitle ?? "",
                Description = goal.GoalDescription,
                CreatedAt = goal.Goalcreatedat,
                CreatedByEmployeeMasterId = goal.CreatedBy,
                CreatedByName = creatorName,
                EndAt = goal.Goalendat,
                Status = goal.Goalstatus ?? GOAL_STATUS.PENDING,
                ProgressPercent = progressPercent,
                HasPendingApproval = hasPendingApproval,
                Checklist = goal
                    .GoalChecklists.Select(c => new GoalChecklistItemModel
                    {
                        ChecklistId = c.ChecklistId,
                        Title = c.ItemTitle ?? "",
                        Description = c.ItemDescription,
                        IsShared = c.IsShared ?? false,
                        AddedForEmployeeMasterId = c.AddedFor,
                        IsCompletedForCurrentUser = c.Goalchecklistprogresses.Any(p =>
                            p.UserId == (c.AddedFor ?? currentUserEmployeeMasterId)
                            && p.IsCompleted == true
                        ),
                    })
                    .ToList(),

                Assignees = assignees,

                CanEdit = canEdit,
                CanComment = canComment,
                CanMarkComplete = canMarkComplete,
                IsOverdue = isOverdue,
                CanRequestReopen = canRequestReopen,
            };
        }

        private async Task<List<AssigneeModel>> GetAssigneesWithDetailsAsync(int goalId)
        {
            var assignments = await _repo.GetAssigneesAsync(goalId);
            var result = new List<AssigneeModel>();

            foreach (var assignment in assignments)
            {
                if (!assignment.AssignedTo.HasValue)
                    continue;

                var edm = await _repo.GetEmployeeDetailsByMasterIdAsync(
                    assignment.AssignedTo.Value
                );
                if (edm?.Employee?.Userprofile == null)
                    continue;

                var profile = edm.Employee.Userprofile;

                result.Add(
                    new AssigneeModel
                    {
                        EmployeeMasterId = assignment.AssignedTo.Value,
                        Name = $"{profile.FirstName} {profile.LastName}".Trim(),
                        Role = edm.Role?.RoleName ?? USER_ROLE.EMPLOYEE, // Fixed: Use Role.RoleName
                        IsAcknowledged = assignment.IsAcknowledged ?? false,
                        AcknowledgedOn = assignment.AcknowledgedOn,
                    }
                );
            }

            return result;
        }
    }
}
