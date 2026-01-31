using Mapster;
using MapsterMapper;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
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
        private readonly IMapper _mapper;

        public BaseGoalService(
            IBaseGoalRepository repo,
            IWebHostEnvironment environment,
            IMapper mapper
        )
        {
            _repo = repo;
            _environment = environment;
            _mapper = mapper;
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

        public async Task<int?> GetApproverForUser(int employeeMasterId, string approvalType)
        {
            var managerId = await _repo.GetReportingManagerEmployeeMasterId(employeeMasterId);
            return managerId;
        }

        public async Task<string> GetEmployeeName(int? employeeMasterId)
        {
            if (!employeeMasterId.HasValue)
                return PROJECT_STATUS.UNKNOWN;

            var edm = await _repo.GetEmployeeDetailsByMasterId(employeeMasterId.Value);
            if (edm?.Employee?.Userprofile == null)
                return PROJECT_STATUS.UNKNOWN;

            var profile = edm.Employee.Userprofile;
            return $"{profile.FirstName} {profile.LastName}";
        }

        public async Task<bool> CanMarkComplete(int goalId, int employeeMasterId)
        {
            var goal = await _repo.GetGoalById(goalId);
            if (goal == null)
                return false;

            bool isParticipant = await _repo.IsGoalParticipant(goalId, employeeMasterId);
            if (!isParticipant)
                return false;

            if (goal.Goalstatus != GOAL_STATUS.OPEN && goal.Goalstatus != GOAL_STATUS.IN_PROGRESS)
                return false;

            var progress = await GetGoalProgressPercent(goalId, employeeMasterId);
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

        public async Task<int> GetGoalProgressPercent(int goalId, int forEmployeeMasterId)
        {
            var latestLog = await _repo.GetLatestProgressLog(goalId);

            if (latestLog != null && latestLog.Source == PROGRESS_SOURCE.MANUAL)
            {
                return latestLog.ProgressPercent ?? 0;
            }
            else
            {
                var completed = await _repo.CountCompletedForUser(goalId, forEmployeeMasterId);
                var total = await _repo.CountTotalForUser(goalId, forEmployeeMasterId);
                return total == 0 ? 0 : (int)Math.Round((double)completed / total * 100);
            }
        }

        public async Task<bool> CanViewGoal(int goalId, int employeeMasterId)
        {
            var goal = await _repo.GetGoalById(goalId);
            if (goal == null)
                return false;

            var userRole = await _repo.GetUserRole(employeeMasterId);

            if (userRole == USER_ROLE.LEADERSHIP)
                return true;

            if (goal.GoalType == GOAL_TYPE.ORG)
                return true;

            if (goal.CreatedBy == employeeMasterId)
                return true;

            if (await _repo.IsUserAssignedToGoal(goalId, employeeMasterId))
                return true;

            if (goal.GoalType == GOAL_TYPE.SELF && goal.CreatedBy.HasValue)
            {
                var creatorManagerId = await _repo.GetReportingManagerEmployeeMasterId(
                    goal.CreatedBy.Value
                );
                if (creatorManagerId.HasValue && creatorManagerId.Value == employeeMasterId)
                {
                    return true;
                }
            }

            if (userRole == USER_ROLE.DEPARTMENT_HEAD && goal.GoalType == GOAL_TYPE.TEAM)
            {
                var deptHead = await _repo.GetEmployeeDetailsByMasterId(employeeMasterId);
                if (deptHead != null)
                {
                    var isInDept = await _repo.IsEmployeeInDepartment(
                        goalId,
                        deptHead.DepartmentId
                    );
                    if (isInDept)
                        return true;
                }
            }

            if (goal.GoalType == GOAL_TYPE.TEAM && goal.CreatedBy.HasValue)
            {
                var creatorManagerId = await _repo.GetReportingManagerEmployeeMasterId(
                    goal.CreatedBy.Value
                );
                if (creatorManagerId.HasValue && creatorManagerId.Value == employeeMasterId)
                {
                    return true;
                }
            }
            return false;
        }

        public async Task<bool> CanCommentOnGoal(
            int goalId,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            var goal = await _repo.GetGoalById(goalId);
            if (goal == null)
                return false;

            var isCreator = goal.CreatedBy == currentUserEmployeeMasterId;
            var isAssignee = await _repo.IsUserAssignedToGoal(
                goalId,
                currentUserEmployeeMasterId
            );
            var isLeadership = currentUserRole == USER_ROLE.LEADERSHIP;

            switch (goal.GoalType?.ToLower())
            {
                case GOAL_TYPE.SELF:
                    if (isCreator)
                        return true;

                    var creatorManagerId = await _repo.GetReportingManagerEmployeeMasterId(
                        goal.CreatedBy ?? 0
                    );
                    return creatorManagerId == currentUserEmployeeMasterId;

                case GOAL_TYPE.TEAM:
                    if (isCreator || isAssignee)
                        return true;

                    if (USER_ROLE.MANAGERIAL_ROLES.Contains(currentUserRole))
                    {
                        var assignees = await _repo.GetAssignees(goalId);
                        foreach (var assignee in assignees)
                        {
                            if (assignee.AssignedTo.HasValue)
                            {
                                var assigneeManagerId =
                                    await _repo.GetReportingManagerEmployeeMasterId(
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

        public async Task<bool> CanUserCommentOnGoal(
            int goalId,
            int employeeMasterId,
            string role
        )
        {
            var canComment = await _repo.CanUserCommentOnGoal(goalId, employeeMasterId, role);
            return canComment;
        }

        public async Task<bool> IsGoalCommentable(int goalId)
        {
            var isCommentable = await _repo.IsGoalCommentable(goalId);
            return isCommentable;
        }

        public async Task<GoalDetailModel> GetGoal(
            int goalId,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            var goal = await _repo.GetGoalById(goalId);
            if (goal == null)
                throw new GoalNotFoundException(goalId);

            var canView = await CanViewGoal(goalId, currentUserEmployeeMasterId);
            if (!canView)
                throw new GoalAccessDeniedException();

            // Use Mapster to map base properties
            var goalDetail = _mapper.Map<GoalDetailModel>(goal);


            goalDetail.ProgressPercent = await CalculateGoalProgress(
                goalId,
                currentUserEmployeeMasterId
            );


            goalDetail.ProjectName = await GetProjectName(goal.ProjectId);

            goalDetail.CreatedByName = await GetEmployeeName(goal.CreatedBy);


            goalDetail.Checklist = await MapChecklistItems(
                goal.GoalChecklists.ToList(),
                currentUserEmployeeMasterId
            );


            goalDetail.Assignees = await GetAssigneesWithDetails(goalId);

            // Set permission flags
            goalDetail.CanEdit =
                goal.CreatedBy == currentUserEmployeeMasterId
                && goal.Goalstatus != GOAL_STATUS.COMPLETED
                && goal.Goalstatus != GOAL_STATUS.CLOSED;

            goalDetail.CanComment = await CanCommentOnGoal(
                goalId,
                currentUserEmployeeMasterId,
                currentUserRole
            );

            goalDetail.CanMarkComplete = await CanMarkComplete(
                goalId,
                currentUserEmployeeMasterId
            );


            bool isOverdue =
                goal.Goalendat.HasValue
                && goal.Goalendat.Value < DateTime.UtcNow
                && goal.Goalstatus != GOAL_STATUS.COMPLETED
                && goal.Goalstatus != GOAL_STATUS.CLOSED;

            goalDetail.IsOverdue = isOverdue;

            goalDetail.CanRequestReopen =
                isOverdue
                && (
                    goal.CreatedBy == currentUserEmployeeMasterId
                    || await _repo.IsUserAssignedToGoal(goalId, currentUserEmployeeMasterId)
                );

            goalDetail.HasPendingApproval = await _repo.HasPendingApproval(
                goalId,
                currentUserEmployeeMasterId
            );

            return goalDetail;
        }

        private async Task<int> CalculateGoalProgress(
            int goalId,
            int currentUserEmployeeMasterId
        )
        {
            var latestLog = await _repo.GetLatestProgressLog(goalId);

            if (latestLog != null && latestLog.Source == PROGRESS_SOURCE.MANUAL)
            {
                return latestLog.ProgressPercent ?? 0;
            }

            var allChecklistItems = await _repo.GetChecklistItemsByGoalId(goalId);
            if (allChecklistItems == null || !allChecklistItems.Any())
            {
                return 0;
            }

            int completedCount = 0;
            foreach (var item in allChecklistItems)
            {
                var isCompleted = await _repo.ChecklistHasProgress(
                    item.ChecklistId,
                    item.AddedFor ?? currentUserEmployeeMasterId
                );
                if (isCompleted)
                    completedCount++;
            }

            return (int)Math.Round((double)completedCount / allChecklistItems.Count * 100);
        }

        private async Task<string?> GetProjectName(int? projectId)
        {
            if (!projectId.HasValue)
                return null;

            var project = await _repo.GetProjectById(projectId.Value);
            return project?.ProjectName;
        }

        private async Task<List<GoalChecklistItemModel>> MapChecklistItems(
            List<GoalChecklist> checklists,
            int currentUserEmployeeMasterId
        )
        {
            var checklistModels = new List<GoalChecklistItemModel>();

            foreach (var checklist in checklists)
            {
                // Use Mapster for base mapping
                var item = _mapper.Map<GoalChecklistItemModel>(checklist);

                // Set completion status
                item.IsCompletedForCurrentUser = checklist.Goalchecklistprogresses.Any(p =>
                    p.UserId == (checklist.AddedFor ?? currentUserEmployeeMasterId)
                    && p.IsCompleted == true
                );

                checklistModels.Add(item);
            }

            return checklistModels;
        }

        private async Task<List<AssigneeModel>> GetAssigneesWithDetails(int goalId)
        {
            var assignments = await _repo.GetAssignees(goalId);
            var result = new List<AssigneeModel>();

            foreach (var assignment in assignments)
            {
                if (!assignment.AssignedTo.HasValue)
                    continue;

                var edm = await _repo.GetEmployeeDetailsByMasterId(
                    assignment.AssignedTo.Value
                );
                if (edm?.Employee?.Userprofile == null)
                    continue;


                var assignee = _mapper.Map<AssigneeModel>(assignment);


                var profile = edm.Employee.Userprofile;
                assignee.Name = $"{profile.FirstName} {profile.LastName}".Trim();
                assignee.Role = edm.Role?.RoleName ?? USER_ROLE.EMPLOYEE;

                result.Add(assignee);
            }

            return result;
        }

        public async Task<CanMarkCompleteModel> GetMarkCompleteEligibility(
            int goalId,
            int employeeMasterId,
            string role
        )
        {
            var goal = await _repo.GetGoalById(goalId);
            if (goal == null)
            {
                return new CanMarkCompleteModel
                {
                    CanComplete = false,
                    Reason = "Goal not found",
                    Reasons = new List<string> { "Goal not found" },
                };
            }

            bool isParticipant = await _repo.IsGoalParticipant(goalId, employeeMasterId);
            var progress = await GetGoalProgressPercent(goalId, employeeMasterId);

            var isOverdue = goal.Goalendat.HasValue && goal.Goalendat.Value < DateTime.UtcNow;
            var hasRequiredProgress = progress >= 100;
            var hasValidStatus =
                goal.Goalstatus == GOAL_STATUS.OPEN
                || goal.Goalstatus == GOAL_STATUS.IN_PROGRESS
                || goal.Goalstatus == GOAL_STATUS.REOPENED;
            var isNotOverdue = !isOverdue || goal.Goalstatus == GOAL_STATUS.REOPENED;

            var reasons = new List<string>();
            if (!hasRequiredProgress)
                reasons.Add($"Progress must be 100% (current: {progress}%)");
            if (isOverdue && goal.Goalstatus != GOAL_STATUS.REOPENED)
                reasons.Add("Goal is overdue");
            if (!hasValidStatus)
                reasons.Add($"Invalid status: {goal.Goalstatus}");
            if (!isParticipant)
                reasons.Add("Not a participant");

            var shouldRequestReopen = isOverdue && goal.Goalstatus != GOAL_STATUS.REOPENED;

            return new CanMarkCompleteModel
            {
                CanComplete = reasons.Count == 0,
                Reason = reasons.Any() ? string.Join(", ", reasons) : null,
                Reasons = reasons.Any() ? reasons : null,
                IsOverdue = isOverdue,
                ShouldRequestReopen = shouldRequestReopen,
                Details = new CanMarkCompleteDetailsModel
                {
                    HasRequiredProgress = hasRequiredProgress,
                    CurrentProgress = progress,
                    IsNotOverdue = isNotOverdue,
                    HasValidStatus = hasValidStatus,
                    CurrentStatus = goal.Goalstatus,
                    IsParticipant = isParticipant,
                },
            };
        }
    }
}
