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
using Serilog;

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

            Log.Debug("BaseGoalService initialized.");
        }

        public bool CanCreate(string role, string goalType)
        {
            var canCreate =
                (goalType == GOAL_TYPE.SELF)
                || (
                    goalType == GOAL_TYPE.TEAM
                    && (role == USER_ROLE.MANAGER || role == USER_ROLE.DEPARTMENT_HEAD)
                )
                || (goalType == GOAL_TYPE.ORG && role == USER_ROLE.LEADERSHIP);

            Log.Information(
                "CanCreate | Role={Role} | GoalType={GoalType} | Result={Result}",
                role,
                goalType,
                canCreate
            );
            return canCreate;
        }

        public string? GetCreationApprovalType(string goalType)
        {
            var approvalType =
                goalType == GOAL_TYPE.SELF ? APPROVAL_TYPE.SELF_GOAL_ACTIVATION
                : goalType == GOAL_TYPE.TEAM ? APPROVAL_TYPE.CREATION
                : null;

            Log.Information(
                "GetCreationApprovalType | GoalType={GoalType} | ApprovalType={ApprovalType}",
                goalType,
                approvalType ?? "null"
            );

            return approvalType;
        }

        public async Task<int?> GetApproverForUser(int employeeMasterId, string approvalType)
        {
            Log.Information(
                "GetApproverForUser START | EmployeeMasterId={EmployeeMasterId} | ApprovalType={ApprovalType}",
                employeeMasterId,
                approvalType
            );

            var managerId = await _repo.GetReportingManagerEmployeeMasterId(employeeMasterId);

            Log.Information(
                "GetApproverForUser END | EmployeeMasterId={EmployeeMasterId} | ManagerId={ManagerId}",
                employeeMasterId,
                managerId.HasValue ? managerId.Value : null
            );

            return managerId;
        }

        public async Task<string> GetEmployeeName(int? employeeMasterId)
        {
            Log.Information(
                "GetEmployeeName START | EmployeeMasterId={EmployeeMasterId}",
                employeeMasterId.HasValue ? employeeMasterId.Value : -1
            );

            if (!employeeMasterId.HasValue)
            {
                Log.Information("GetEmployeeName | No EmployeeMasterId provided -> UNKNOWN");
                return PROJECT_STATUS.UNKNOWN;
            }

            var edm = await _repo.GetEmployeeDetailsByMasterId(employeeMasterId.Value);
            if (edm?.Employee?.Userprofile == null)
            {
                Log.Information(
                    "GetEmployeeName | Profile not found for EmployeeMasterId={EmployeeMasterId} -> UNKNOWN",
                    employeeMasterId.Value
                );
                return PROJECT_STATUS.UNKNOWN;
            }

            var profile = edm.Employee.Userprofile;
            var fullName = $"{profile.FirstName} {profile.LastName}";
            Log.Information(
                "GetEmployeeName END | EmployeeMasterId={EmployeeMasterId} | Name={Name}",
                employeeMasterId.Value,
                fullName
            );
            return fullName;
        }

        public async Task<bool> CanMarkComplete(int goalId, int employeeMasterId)
        {
            Log.Information(
                "CanMarkComplete START | GoalId={GoalId} | EmployeeMasterId={EmployeeMasterId}",
                goalId,
                employeeMasterId
            );

            var goal = await _repo.GetGoalById(goalId);
            if (goal == null)
            {
                Log.Information("CanMarkComplete | Goal not found -> false");
                return false;
            }

            bool isParticipant = await _repo.IsGoalParticipant(goalId, employeeMasterId);
            if (!isParticipant)
            {
                Log.Information("CanMarkComplete | Not a participant -> false");
                return false;
            }

            if (goal.Goalstatus != GOAL_STATUS.OPEN && goal.Goalstatus != GOAL_STATUS.IN_PROGRESS)
            {
                Log.Information(
                    "CanMarkComplete | Invalid status={Status} -> false",
                    goal.Goalstatus
                );
                return false;
            }

            var progress = await GetGoalProgressPercent(goalId, employeeMasterId);
            if (progress < 100)
            {
                Log.Information("CanMarkComplete | Progress={Progress} < 100 -> false", progress);
                return false;
            }

            if (
                goal.Goalendat.HasValue
                && goal.Goalendat.Value < DateTime.UtcNow
                && goal.Goalstatus != GOAL_STATUS.REOPENED
            )
            {
                Log.Information(
                    "CanMarkComplete | Overdue and not REOPENED | GoalEndAt={GoalEndAt} | Status={Status} -> false",
                    goal.Goalendat,
                    goal.Goalstatus
                );
                return false;
            }

            Log.Information("CanMarkComplete END -> true");
            return true;
        }

        public async Task<int> GetGoalProgressPercent(int goalId, int forEmployeeMasterId)
        {
            Log.Information(
                "GetGoalProgressPercent START | GoalId={GoalId} | ForEmployeeMasterId={EmployeeMasterId}",
                goalId,
                forEmployeeMasterId
            );

            var latestLog = await _repo.GetLatestProgressLog(goalId);

            if (latestLog != null && latestLog.Source == PROGRESS_SOURCE.MANUAL)
            {
                var manual = latestLog.ProgressPercent ?? 0;
                Log.Information(
                    "GetGoalProgressPercent | MANUAL source | Percent={Percent}",
                    manual
                );
                return manual;
            }
            else
            {
                var completed = await _repo.CountCompletedForUser(goalId, forEmployeeMasterId);
                var total = await _repo.CountTotalForUser(goalId, forEmployeeMasterId);
                var percent = total == 0 ? 0 : (int)Math.Round((double)completed / total * 100);
                Log.Information(
                    "GetGoalProgressPercent | AUTO (checklist) | Completed={Completed} | Total={Total} | Percent={Percent}",
                    completed,
                    total,
                    percent
                );
                return percent;
            }
        }

        public async Task<bool> CanViewGoal(int goalId, int employeeMasterId)
        {
            Log.Information(
                "CanViewGoal START | GoalId={GoalId} | EmployeeMasterId={EmployeeMasterId}",
                goalId,
                employeeMasterId
            );

            var goal = await _repo.GetGoalById(goalId);
            if (goal == null)
            {
                Log.Information("CanViewGoal | Goal not found -> false");
                return false;
            }

            var userRole = await _repo.GetUserRole(employeeMasterId);

            if (userRole == USER_ROLE.LEADERSHIP)
            {
                Log.Information("CanViewGoal | User is LEADERSHIP -> true");
                return true;
            }

            if (goal.GoalType == GOAL_TYPE.ORG)
            {
                Log.Information("CanViewGoal | Goal is ORG -> true");
                return true;
            }

            if (goal.CreatedBy == employeeMasterId)
            {
                Log.Information("CanViewGoal | User is creator -> true");
                return true;
            }

            if (await _repo.IsUserAssignedToGoal(goalId, employeeMasterId))
            {
                Log.Information("CanViewGoal | User is assignee -> true");
                return true;
            }

            if (goal.GoalType == GOAL_TYPE.SELF && goal.CreatedBy.HasValue)
            {
                var creatorManagerId = await _repo.GetReportingManagerEmployeeMasterId(
                    goal.CreatedBy.Value
                );
                if (creatorManagerId.HasValue && creatorManagerId.Value == employeeMasterId)
                {
                    Log.Information("CanViewGoal | SELF goal, user is creator's manager -> true");
                    return true;
                }
            }

            if (userRole == USER_ROLE.DEPARTMENT_HEAD && goal.GoalType == GOAL_TYPE.TEAM)
            {
                var deptHead = await _repo.GetEmployeeDetailsByMasterId(employeeMasterId);
                if (deptHead != null)
                {
                    var isInDept = await _repo.IsEmployeeInDepartment(goalId, deptHead.DepartmentId);
                    if (isInDept)
                    {
                        Log.Information(
                            "CanViewGoal | DEPARTMENT_HEAD and employee in department -> true"
                        );
                        return true;
                    }
                }
            }

            if (goal.GoalType == GOAL_TYPE.TEAM && goal.CreatedBy.HasValue)
            {
                var creatorManagerId = await _repo.GetReportingManagerEmployeeMasterId(
                    goal.CreatedBy.Value
                );
                if (creatorManagerId.HasValue && creatorManagerId.Value == employeeMasterId)
                {
                    Log.Information("CanViewGoal | TEAM goal, user is creator's manager -> true");
                    return true;
                }
            }

            Log.Information("CanViewGoal END -> false");
            return false;
        }

        public async Task<bool> CanCommentOnGoal(
            int goalId,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            Log.Information(
                "CanCommentOnGoal START | GoalId={GoalId} | UserId={UserId} | Role={Role}",
                goalId,
                currentUserEmployeeMasterId,
                currentUserRole
            );

            var goal = await _repo.GetGoalById(goalId);
            if (goal == null)
            {
                Log.Information("CanCommentOnGoal | Goal not found -> false");
                return false;
            }

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
                    {
                        Log.Information("CanCommentOnGoal | SELF | IsCreator -> true");
                        return true;
                    }

                    var creatorManagerId = await _repo.GetReportingManagerEmployeeMasterId(
                        goal.CreatedBy ?? 0
                    );
                    var selfAllowed = creatorManagerId == currentUserEmployeeMasterId;
                    Log.Information(
                        "CanCommentOnGoal | SELF | IsCreatorsManager={IsCreatorsManager} -> {Result}",
                        selfAllowed,
                        selfAllowed
                    );
                    return selfAllowed;

                case GOAL_TYPE.TEAM:
                    if (isCreator || isAssignee)
                    {
                        Log.Information(
                            "CanCommentOnGoal | TEAM | IsCreatorOrAssignee -> true"
                        );
                        return true;
                    }

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
                                {
                                    Log.Information(
                                        "CanCommentOnGoal | TEAM | Current user manages an assignee -> true"
                                    );
                                    return true;
                                }
                            }
                        }
                    }
                    Log.Information("CanCommentOnGoal | TEAM -> false");
                    return false;

                case GOAL_TYPE.ORG:
                    var orgAllowed = isCreator || isLeadership;
                    Log.Information(
                        "CanCommentOnGoal | ORG | IsCreator={IsCreator} | IsLeadership={IsLeadership} -> {Result}",
                        isCreator,
                        isLeadership,
                        orgAllowed
                    );
                    return orgAllowed;

                default:
                    Log.Information("CanCommentOnGoal | DEFAULT -> false");
                    return false;
            }
        }

        public async Task<bool> CanUserCommentOnGoal(
            int goalId,
            int employeeMasterId,
            string role
        )
        {
            Log.Information(
                "CanUserCommentOnGoal START | GoalId={GoalId} | UserId={UserId} | Role={Role}",
                goalId,
                employeeMasterId,
                role
            );

            var canComment = await _repo.CanUserCommentOnGoal(goalId, employeeMasterId, role);

            Log.Information(
                "CanUserCommentOnGoal END | GoalId={GoalId} | UserId={UserId} | CanComment={CanComment}",
                goalId,
                employeeMasterId,
                canComment
            );

            return canComment;
        }

        public async Task<bool> IsGoalCommentable(int goalId)
        {
            Log.Information("IsGoalCommentable START | GoalId={GoalId}", goalId);

            var isCommentable = await _repo.IsGoalCommentable(goalId);

            Log.Information(
                "IsGoalCommentable END | GoalId={GoalId} | Result={Result}",
                goalId,
                isCommentable
            );

            return isCommentable;
        }

        public async Task<GoalDetailModel> GetGoal(
            int goalId,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            Log.Information(
                "GetGoal START | GoalId={GoalId} | UserId={UserId} | Role={Role}",
                goalId,
                currentUserEmployeeMasterId,
                currentUserRole
            );

            var goal = await _repo.GetGoalById(goalId);
            if (goal == null)
            {
                Log.Warning("GetGoal | Goal not found | GoalId={GoalId}", goalId);
                throw new GoalNotFoundException(goalId);
            }

            var canView = await CanViewGoal(goalId, currentUserEmployeeMasterId);
            if (!canView)
            {
                Log.Warning(
                    "GetGoal | Access denied | GoalId={GoalId} | UserId={UserId}",
                    goalId,
                    currentUserEmployeeMasterId
                );
                throw new GoalAccessDeniedException();
            }

            var goalDetail = _mapper.Map<GoalDetailModel>(goal);
            Log.Debug("GetGoal | Mapped base goal to GoalDetailModel");

            goalDetail.ProgressPercent = await CalculateGoalProgress(
                goalId,
                currentUserEmployeeMasterId
            );
            Log.Information(
                "GetGoal | ProgressPercent={ProgressPercent}",
                goalDetail.ProgressPercent
            );

            goalDetail.ProjectName = await GetProjectName(goal.ProjectId);
            Log.Information("GetGoal | ProjectName={ProjectName}", goalDetail.ProjectName);

            goalDetail.CreatedByName = await GetEmployeeName(goal.CreatedBy);
            Log.Information("GetGoal | CreatedByName={CreatedByName}", goalDetail.CreatedByName);

            goalDetail.Checklist = await MapChecklistItems(
                goal.GoalChecklists.ToList(),
                currentUserEmployeeMasterId
            );
            Log.Information("GetGoal | ChecklistCount={Count}", goalDetail.Checklist?.Count ?? 0);

            goalDetail.Assignees = await GetAssigneesWithDetails(goalId);
            Log.Information("GetGoal | AssigneesCount={Count}", goalDetail.Assignees?.Count ?? 0);

            goalDetail.CanEdit =
                goal.CreatedBy == currentUserEmployeeMasterId
                && goal.Goalstatus != GOAL_STATUS.COMPLETED
                && goal.Goalstatus != GOAL_STATUS.CLOSED;
            Log.Information("GetGoal | CanEdit={CanEdit}", goalDetail.CanEdit);

            goalDetail.CanComment = await CanCommentOnGoal(
                goalId,
                currentUserEmployeeMasterId,
                currentUserRole
            );
            Log.Information("GetGoal | CanComment={CanComment}", goalDetail.CanComment);

            goalDetail.CanMarkComplete = await CanMarkComplete(
                goalId,
                currentUserEmployeeMasterId
            );
            Log.Information(
                "GetGoal | CanMarkComplete={CanMarkComplete}",
                goalDetail.CanMarkComplete
            );

            bool isOverdue =
                goal.Goalendat.HasValue
                && goal.Goalendat.Value < DateTime.UtcNow
                && goal.Goalstatus != GOAL_STATUS.COMPLETED
                && goal.Goalstatus != GOAL_STATUS.CLOSED;
            goalDetail.IsOverdue = isOverdue;
            Log.Information("GetGoal | IsOverdue={IsOverdue}", isOverdue);

            goalDetail.CanRequestReopen =
                isOverdue
                && (
                    goal.CreatedBy == currentUserEmployeeMasterId
                    || await _repo.IsUserAssignedToGoal(goalId, currentUserEmployeeMasterId)
                );
            Log.Information(
                "GetGoal | CanRequestReopen={CanRequestReopen}",
                goalDetail.CanRequestReopen
            );

            goalDetail.HasPendingApproval = await _repo.HasPendingApproval(
                goalId,
                currentUserEmployeeMasterId
            );
            Log.Information(
                "GetGoal | HasPendingApproval={HasPendingApproval}",
                goalDetail.HasPendingApproval
            );

            Log.Information("GetGoal END | GoalId={GoalId}", goalId);
            return goalDetail;
        }

        private async Task<int> CalculateGoalProgress(
            int goalId,
            int currentUserEmployeeMasterId
        )
        {
            Log.Debug(
                "CalculateGoalProgress START | GoalId={GoalId} | UserId={UserId}",
                goalId,
                currentUserEmployeeMasterId
            );

            var latestLog = await _repo.GetLatestProgressLog(goalId);

            if (latestLog != null && latestLog.Source == PROGRESS_SOURCE.MANUAL)
            {
                var manualPercent = latestLog.ProgressPercent ?? 0;
                Log.Debug(
                    "CalculateGoalProgress | MANUAL source | Percent={Percent}",
                    manualPercent
                );
                return manualPercent;
            }

            var allChecklistItems = await _repo.GetChecklistItemsByGoalId(goalId);
            if (allChecklistItems == null || !allChecklistItems.Any())
            {
                Log.Debug("CalculateGoalProgress | No checklist items -> 0");
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

            var percent = (int)Math.Round((double)completedCount / allChecklistItems.Count * 100);
            Log.Debug(
                "CalculateGoalProgress END | Completed={Completed} | Total={Total} | Percent={Percent}",
                completedCount,
                allChecklistItems.Count,
                percent
            );
            return percent;
        }

        private async Task<string?> GetProjectName(int? projectId)
        {
            Log.Debug("GetProjectName START | ProjectId={ProjectId}", projectId);

            if (!projectId.HasValue)
            {
                Log.Debug("GetProjectName | No ProjectId -> null");
                return null;
            }

            var project = await _repo.GetProjectById(projectId.Value);
            var name = project?.ProjectName;

            Log.Debug("GetProjectName END | ProjectId={ProjectId} | Name={Name}", projectId, name);
            return name;
        }

        private async Task<List<GoalChecklistItemModel>> MapChecklistItems(
            List<GoalChecklist> checklists,
            int currentUserEmployeeMasterId
        )
        {
            Log.Debug(
                "MapChecklistItems START | InputCount={Count} | UserId={UserId}",
                checklists?.Count ?? 0,
                currentUserEmployeeMasterId
            );

            var checklistModels = new List<GoalChecklistItemModel>();

            foreach (var checklist in checklists)
            {
                var item = _mapper.Map<GoalChecklistItemModel>(checklist);

                item.IsCompletedForCurrentUser = checklist.Goalchecklistprogresses.Any(p =>
                    p.UserId == (checklist.AddedFor ?? currentUserEmployeeMasterId)
                    && p.IsCompleted == true
                );

                checklistModels.Add(item);
            }

            Log.Debug("MapChecklistItems END | OutputCount={Count}", checklistModels.Count);
            return checklistModels;
        }

        private async Task<List<AssigneeModel>> GetAssigneesWithDetails(int goalId)
        {
            Log.Debug("GetAssigneesWithDetails START | GoalId={GoalId}", goalId);

            var assignments = await _repo.GetAssignees(goalId);
            var result = new List<AssigneeModel>();

            foreach (var assignment in assignments)
            {
                if (!assignment.AssignedTo.HasValue)
                    continue;

                var edm = await _repo.GetEmployeeDetailsByMasterId(assignment.AssignedTo.Value);
                if (edm?.Employee?.Userprofile == null)
                    continue;

                var assignee = _mapper.Map<AssigneeModel>(assignment);

                var profile = edm.Employee.Userprofile;
                assignee.Name = $"{profile.FirstName} {profile.LastName}".Trim();
                assignee.Role = edm.Role?.RoleName ?? USER_ROLE.EMPLOYEE;

                result.Add(assignee);
            }

            Log.Debug(
                "GetAssigneesWithDetails END | GoalId={GoalId} | Count={Count}",
                goalId,
                result.Count
            );
            return result;
        }

        public async Task<CanMarkCompleteModel> GetMarkCompleteEligibility(
            int goalId,
            int employeeMasterId,
            string role
        )
        {
            Log.Information(
                "GetMarkCompleteEligibility START | GoalId={GoalId} | UserId={UserId} | Role={Role}",
                goalId,
                employeeMasterId,
                role
            );

            var goal = await _repo.GetGoalById(goalId);
            if (goal == null)
            {
                Log.Information("GetMarkCompleteEligibility | Goal not found -> CanComplete=false");
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

            Log.Information(
                "GetMarkCompleteEligibility END | GoalId={GoalId} | UserId={UserId} | CanComplete={CanComplete} | Progress={Progress} | IsOverdue={IsOverdue} | HasValidStatus={HasValidStatus} | IsParticipant={IsParticipant}",
                goalId,
                employeeMasterId,
                reasons.Count == 0,
                progress,
                isOverdue,
                hasValidStatus,
                isParticipant
            );

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