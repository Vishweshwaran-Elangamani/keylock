using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Enums;
using Relevantz.EEPZ.Common.Exceptions;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Data.Repository.Interface;

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
            (goalType == GOAL_TYPE.SELF)
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

            var userRole = await _repo.GetUserRoleAsync(employeeMasterId);

            if (userRole == USER_ROLE.LEADERSHIP)
                return true;

            if (goal.GoalType == GOAL_TYPE.ORG)
                return true;

            if (goal.CreatedBy == employeeMasterId)
                return true;

            if (await _repo.IsUserAssignedToGoalAsync(goalId, employeeMasterId))
                return true;

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

                    var creatorManagerId = await _repo.GetReportingManagerEmployeeMasterIdAsync(
                        goal.CreatedBy ?? 0
                    );
                    return creatorManagerId == currentUserEmployeeMasterId;

                case GOAL_TYPE.TEAM:
                    if (isCreator || isAssignee)
                        return true;

                    if (USER_ROLE.MANAGERIAL_ROLES.Contains(currentUserRole))
                    {
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
            var canComment = await _repo.CanUserCommentOnGoalAsync(goalId, employeeMasterId, role);
            return canComment;
        }

        public async Task<bool> IsGoalCommentableAsync(int goalId)
        {
            var isCommentable = await _repo.IsGoalCommentableAsync(goalId);
            return isCommentable;
        }

        public async Task<GoalDetailModel> GetGoalAsync(
            int goalId,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            var goal = await _repo.GetGoalByIdAsync(goalId);
            if (goal == null)
                throw new GoalNotFoundException(goalId);

            var canView = await CanViewGoalAsync(goalId, currentUserEmployeeMasterId);
            if (!canView)
                throw new GoalAccessDeniedException();

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

            string? projectName = null;
            if (goal.ProjectId.HasValue)
            {
                var project = await _repo.GetProjectByIdAsync(goal.ProjectId.Value);
                projectName = project?.ProjectName;
            }

            var creatorName = await GetEmployeeNameAsync(goal.CreatedBy);

            var assignees = await GetAssigneesWithDetailsAsync(goalId);

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
                        Role = edm.Role?.RoleName ?? USER_ROLE.EMPLOYEE,
                        IsAcknowledged = assignment.IsAcknowledged ?? false,
                        AcknowledgedOn = assignment.AcknowledgedOn,
                    }
                );
            }

            return result;
        }
    }
}
