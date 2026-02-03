using FluentValidation;
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
    public class GoalService : IGoalService
    {
        private readonly IGoalRepository _repo;
        private readonly IBaseGoalRepository _baseRepo;
        private readonly IGoalProgressRepository _progressRepo;
        private readonly IGoalApprovalsRepository _approvalsRepo;
        private readonly IGoalInteractionRepository _interactionRepo;
        private readonly IBaseGoalService _baseService;
        private readonly IWebHostEnvironment _environment;
        private readonly IValidator<CreateGoalModel> _createGoalValidator;
        private readonly IValidator<UpdateGoalModel> _updateGoalValidator;
        private readonly IValidator<AssignGoalModel> _assignGoalValidator;
        private readonly IValidator<GoalQueryModel> _goalQueryValidator;
        private readonly IMapper _mapper;

        public GoalService(
            IGoalRepository repo,
            IBaseGoalRepository baseRepo,
            IGoalProgressRepository progressRepo,
            IGoalApprovalsRepository approvalsRepo,
            IGoalInteractionRepository interactionRepo,
            IBaseGoalService baseService,
            IWebHostEnvironment environment,
            IValidator<CreateGoalModel> createGoalValidator,
            IValidator<UpdateGoalModel> updateGoalValidator,
            IValidator<AssignGoalModel> assignGoalValidator,
            IValidator<GoalQueryModel> goalQueryValidator,
            IMapper mapper
        )
        {
            _repo = repo;
            _baseRepo = baseRepo;
            _progressRepo = progressRepo;
            _approvalsRepo = approvalsRepo;
            _interactionRepo = interactionRepo;
            _baseService = baseService;
            _environment = environment;
            _createGoalValidator = createGoalValidator;
            _updateGoalValidator = updateGoalValidator;
            _assignGoalValidator = assignGoalValidator;
            _goalQueryValidator = goalQueryValidator;
            _mapper = mapper;

            Log.Debug("GoalService initialized.");
        }

        public async Task<ApiResponseModel<int>> CreateGoal(
            CreateGoalModel goal,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            Log.Information(
                "CreateGoal START | UserId={UserId} | Role={Role} | Title={Title} | Type={Type} | ProjectId={ProjectId} | ChecklistCount={ChecklistCount} | Assignees={AssigneeCount}",
                currentUserEmployeeMasterId,
                currentUserRole,
                goal?.Title,
                goal?.GoalType,
                goal?.ProjectId,
                goal?.Checklist?.Count ?? 0,
                goal?.AssignedToEmployeeMasterIds?.Count ?? 0
            );

            var validationResult = await _createGoalValidator.ValidateAsync(goal);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                Log.Warning(
                    "CreateGoal VALIDATION_FAILED | UserId={UserId} | Errors={Errors}",
                    currentUserEmployeeMasterId,
                    string.Join("; ", errors)
                );
                throw new BadRequestException("VALIDATION_FAILED", string.Join("; ", errors));
            }

            if (!_baseService.CanCreate(currentUserRole, goal.GoalType))
            {
                Log.Warning(
                    "CreateGoal FORBIDDEN | Role not permitted | UserId={UserId} | Role={Role} | GoalType={GoalType}",
                    currentUserEmployeeMasterId,
                    currentUserRole,
                    goal.GoalType
                );
                throw new ForbiddenException(
                    ResponseMessages.Codes.ROLE_INSUFFICIENT,
                    $"Role '{currentUserRole}' not permitted to create '{goal.GoalType}' goals."
                );
            }

            var validChecklistItems = goal
                .Checklist.Where(c => !string.IsNullOrWhiteSpace(c.Title))
                .ToList();

            if (goal.GoalType == GOAL_TYPE.SELF)
            {
                foreach (var item in validChecklistItems)
                {
                    item.AddedForEmployeeMasterId = currentUserEmployeeMasterId;
                }
            }

            if (goal.ProjectId.HasValue && goal.ProjectId.Value > 0)
            {
                var isInProject = await _repo.IsEmployeeInProject(
                    currentUserEmployeeMasterId,
                    goal.ProjectId.Value
                );

                if (!isInProject)
                {
                    Log.Warning(
                        "CreateGoal FORBIDDEN | User not in project | UserId={UserId} | ProjectId={ProjectId}",
                        currentUserEmployeeMasterId,
                        goal.ProjectId
                    );
                    throw new ForbiddenException(
                        ResponseMessages.Codes.PROJECT_NOT_MEMBER,
                        "You are not a member of the selected project."
                    );
                }
            }

            if (goal.GoalType == GOAL_TYPE.SELF)
            {
                if (
                    goal.AssignedToEmployeeMasterIds.Count != 1
                    || goal.AssignedToEmployeeMasterIds[0] != currentUserEmployeeMasterId
                )
                {
                    Log.Debug(
                        "CreateGoal | Normalizing SELF goal assignees to current user | UserId={UserId}",
                        currentUserEmployeeMasterId
                    );
                    goal.AssignedToEmployeeMasterIds = new List<int>
                    {
                        currentUserEmployeeMasterId,
                    };
                }
            }

            if (goal.GoalType == GOAL_TYPE.TEAM && goal.AssignedToEmployeeMasterIds.Count > 0)
            {
                var subordinates = await _baseRepo.GetSubordinateEmployeeMasterIds(
                    currentUserEmployeeMasterId
                );
                var invalidAssignments = goal
                    .AssignedToEmployeeMasterIds.Except(subordinates)
                    .ToList();

                if (invalidAssignments.Any())
                {
                    Log.Warning(
                        "CreateGoal INVALID_ASSIGNEES | UserId={UserId} | Invalid={InvalidList}",
                        currentUserEmployeeMasterId,
                        string.Join(", ", invalidAssignments)
                    );
                    throw new BusinessRuleException(
                        ResponseMessages.Codes.GOAL_ASSIGNEE_INVALID,
                        $"Invalid assignees: {string.Join(", ", invalidAssignments)}. You can only assign goals to your direct subordinates."
                    );
                }
            }

            var goalId = await CreateGoalInternal(
                goal,
                currentUserEmployeeMasterId,
                currentUserRole,
                validChecklistItems
            );

            var metadata = new
            {
                GoalId = goalId,
                GoalType = goal.GoalType,
                RequiresApproval = currentUserRole != USER_ROLE.LEADERSHIP,
                AssigneeCount = goal.AssignedToEmployeeMasterIds?.Count ?? 0,
                ChecklistItemCount = validChecklistItems.Count,
            };

            Log.Information(
                "CreateGoal END | UserId={UserId} | GoalId={GoalId} | Type={Type} | RequiresApproval={RequiresApproval}",
                currentUserEmployeeMasterId,
                goalId,
                goal.GoalType,
                metadata.RequiresApproval
            );

            return ApiResponseModel<int>.SuccessResponse(
                ResponseMessages.Codes.GOAL_CREATED_SUCCESS,
                goalId,
                metadata
            );
        }

        private async Task<int> CreateGoalInternal(
            CreateGoalModel goalDetails,
            int currentUserEmployeeMasterId,
            string currentUserRole,
            List<ChecklistItemModel> validChecklistItems
        )
        {
            Log.Debug(
                "CreateGoalInternal START | UserId={UserId} | Role={Role} | Type={Type} | Title={Title} | ValidChecklist={ChecklistCount}",
                currentUserEmployeeMasterId,
                currentUserRole,
                goalDetails?.GoalType,
                goalDetails?.Title,
                validChecklistItems?.Count ?? 0
            );

            string initialStatus;
            if (currentUserRole == USER_ROLE.LEADERSHIP)
            {
                initialStatus = GOAL_STATUS.OPEN;
            }
            else if (goalDetails.GoalType == GOAL_TYPE.ORG)
            {
                initialStatus = GOAL_STATUS.OPEN;
            }
            else
            {
                initialStatus = GOAL_STATUS.PENDING;
            }

            var goal = new Goal
            {
                GoalType = goalDetails.GoalType,
                ProjectId = goalDetails.ProjectId > 0 ? goalDetails.ProjectId : null,
                GoalTitle = goalDetails.Title,
                GoalDescription = goalDetails.Description,
                Goalcreatedat = DateTime.UtcNow,
                Goalendat = goalDetails.Deadline,
                CreatedBy = currentUserEmployeeMasterId,
                Goalstatus = initialStatus,
            };

            await _repo.AddGoal(goal);
            await _baseRepo.SaveChanges();

            var checklistItems = validChecklistItems
                .Select(c => new GoalChecklist
                {
                    GoalId = goal.GoalId,
                    ItemTitle = c.Title,
                    ItemDescription = c.Description,
                    IsShared = false,
                    AddedBy = currentUserEmployeeMasterId,
                    AddedFor = c.AddedForEmployeeMasterId!.Value,
                })
                .ToList();

            await _repo.AddChecklistRange(checklistItems);

            if (goalDetails.AssignedToEmployeeMasterIds?.Count > 0)
            {
                var assignments = goalDetails
                    .AssignedToEmployeeMasterIds.Select(to => new GoalAssignment
                    {
                        GoalId = goal.GoalId,
                        AssignedBy = currentUserEmployeeMasterId,
                        AssignedTo = to,
                        AssignedOn = DateTime.UtcNow,
                    })
                    .ToList();
                await _repo.AddAssignments(assignments);
            }

            if (currentUserRole != USER_ROLE.LEADERSHIP && initialStatus == GOAL_STATUS.PENDING)
            {
                var approvalType = _baseService.GetCreationApprovalType(goalDetails.GoalType);
                if (approvalType != null)
                {
                    var approverId = await _baseRepo.GetReportingManagerEmployeeMasterId(
                        currentUserEmployeeMasterId
                    );
                    var approval = new GoalApproval
                    {
                        GoalId = goal.GoalId,
                        ApprovalType = approvalType,
                        RequestedBy = currentUserEmployeeMasterId,
                        RequestedOn = DateTime.UtcNow,
                        ApprovedBy = approverId,
                        ApprovalStatus = APPROVAL_STATUS.PENDING,
                    };
                    await _approvalsRepo.AddApproval(approval);

                    Log.Debug(
                        "CreateGoalInternal | Created approval | GoalId={GoalId} | Type={Type} | ApproverId={ApproverId}",
                        goal.GoalId,
                        approvalType,
                        approverId
                    );
                }
            }

            await _progressRepo.AddProgressLog(
                new Goalprogresslog
                {
                    GoalId = goal.GoalId,
                    UpdatedBy = currentUserEmployeeMasterId,
                    UpdatedOn = DateTime.UtcNow,
                    ProgressPercent = 0,
                    Source = PROGRESS_SOURCE.AUTO,
                }
            );

            await _baseRepo.SaveChanges();

            Log.Debug(
                "CreateGoalInternal END | GoalId={GoalId} | InitialStatus={Status} | ChecklistAdded={ChecklistCount}",
                goal.GoalId,
                initialStatus,
                checklistItems.Count
            );

            return goal.GoalId;
        }

        public async Task<List<GoalSummaryModel>> QueryGoals(
            GoalQueryModel query,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            Log.Information(
                "QueryGoals START | UserId={UserId} | Role={Role} | Query={@Query}",
                currentUserEmployeeMasterId,
                currentUserRole,
                query
            );

            var validationResult = await _goalQueryValidator.ValidateAsync(query);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                Log.Warning(
                    "QueryGoals VALIDATION_FAILED | UserId={UserId} | Errors={Errors}",
                    currentUserEmployeeMasterId,
                    string.Join("; ", errors)
                );
                throw new BadRequestException("VALIDATION_FAILED", string.Join("; ", errors));
            }

            var goals = await _repo.QueryGoals(
                new GoalQueryModel
                {
                    CurrentUserEmpMasterID = currentUserEmployeeMasterId,
                    Type = query.Type,
                    Status = query.Status,
                    ProjectId = query.ProjectId,
                    DueBefore = query.DueBefore,
                    DueAfter = query.DueAfter,
                    Search = query.Search,
                    CreatedByEmployeeMasterId = query.CreatedByEmployeeMasterId,
                    AssignedToEmployeeMasterId = query.AssignedToEmployeeMasterId,
                    CreatedAfter = query.CreatedAfter,
                    CreatedBefore = query.CreatedBefore,
                    Page = query.Page,
                    PageSize = query.PageSize,
                    CurrentUserRole = currentUserRole,
                }
            );

            var result = new List<GoalSummaryModel>();

            foreach (var goal in goals)
            {
                var summary = _mapper.Map<GoalSummaryModel>(goal);
                summary.DescriptionShort = GetShortDescription(goal.GoalDescription);
                summary.ProgressPercent = await CalculateGoalProgress(
                    goal.GoalId,
                    currentUserEmployeeMasterId
                );
                summary.ProjectName = await GetProjectName(goal.ProjectId);
                summary.CreatedByName = await _baseService.GetEmployeeName(goal.CreatedBy);
                summary.IsOverdue = IsGoalOverdue(goal);
                summary.CanAssign = CanAssignGoal(
                    goal,
                    currentUserEmployeeMasterId,
                    currentUserRole
                );

                var isCreator = goal.CreatedBy == currentUserEmployeeMasterId;
                var isAssignee = goal.GoalAssignments.Any(a =>
                    a.AssignedTo == currentUserEmployeeMasterId
                );

                if (goal.GoalType == GOAL_TYPE.TEAM && !isCreator && isAssignee)
                {
                    summary.MyProgress = await CalculatePersonalProgress(
                        goal.GoalId,
                        currentUserEmployeeMasterId
                    );
                }

                summary.HasPendingApproval = goal.GoalApprovals.Any(a =>
                    a.RequestedBy == currentUserEmployeeMasterId
                    && a.ApprovalType == APPROVAL_TYPE.TASK_ACKNOWLEDGMENT
                    && a.ApprovalStatus == APPROVAL_STATUS.PENDING
                );

                summary.IsAcknowledged = goal
                    .GoalAssignments.Where(a => a.AssignedTo == currentUserEmployeeMasterId)
                    .Any(a => a.IsAcknowledged == true);

                if (goal.GoalType == GOAL_TYPE.TEAM)
                {
                    var assignees = await GetAssigneesWithDetails(goal.GoalId);
                    summary.Assignees = assignees.Any() ? assignees : null;
                }

                result.Add(summary);
            }

            Log.Information(
                "QueryGoals END | UserId={UserId} | Returned={Count}",
                currentUserEmployeeMasterId,
                result.Count
            );

            return result;
        }

        private async Task<int> CalculatePersonalProgress(int goalId, int userId)
        {
            Log.Debug(
                "CalculatePersonalProgress START | GoalId={GoalId} | UserId={UserId}",
                goalId,
                userId
            );

            var goal = await _baseRepo.GetGoalById(goalId);
            if (goal == null)
            {
                Log.Debug("CalculatePersonalProgress | Goal not found -> 0 | GoalId={GoalId}", goalId);
                return 0;
            }

            var userItems = goal.GoalChecklists.Where(c => c.AddedFor == userId).ToList();

            if (!userItems.Any())
            {
                Log.Debug("CalculatePersonalProgress | No items -> 0 | GoalId={GoalId}", goalId);
                return 0;
            }

            var completedCount = 0;
            foreach (var item in userItems)
            {
                var hasProgress = await _baseRepo.ChecklistHasProgress(
                    item.ChecklistId,
                    userId
                );
                if (hasProgress)
                {
                    completedCount++;
                }
            }

            var percent = (int)Math.Round((double)completedCount / userItems.Count * 100);

            Log.Debug(
                "CalculatePersonalProgress END | GoalId={GoalId} | Items={Items} | Completed={Completed} | Percent={Percent}",
                goalId,
                userItems.Count,
                completedCount,
                percent
            );

            return percent;
        }

        public async Task<ApiResponseModel> UpdateGoal(
            int goalId,
            UpdateGoalModel goalDetails,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            Log.Information(
                "UpdateGoal START | GoalId={GoalId} | UserId={UserId} | Role={Role}",
                goalId,
                currentUserEmployeeMasterId,
                currentUserRole
            );

            var validationResult = await _updateGoalValidator.ValidateAsync(goalDetails);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                Log.Warning(
                    "UpdateGoal VALIDATION_FAILED | GoalId={GoalId} | UserId={UserId} | Errors={Errors}",
                    goalId,
                    currentUserEmployeeMasterId,
                    string.Join("; ", errors)
                );
                throw new BadRequestException("VALIDATION_FAILED", string.Join("; ", errors));
            }

            var goal = await _baseRepo.GetGoalById(goalId);
            if (goal == null)
            {
                Log.Warning("UpdateGoal FAILED | Goal not found | GoalId={GoalId}", goalId);
                throw new GoalNotFoundException(goalId);
            }

            if (goal.GoalType == GOAL_TYPE.ORG && currentUserRole != USER_ROLE.LEADERSHIP)
            {
                Log.Warning(
                    "UpdateGoal ACCESS DENIED | ORG goal | GoalId={GoalId} | UserId={UserId} | Role={Role}",
                    goalId,
                    currentUserEmployeeMasterId,
                    currentUserRole
                );
                throw new GoalAccessDeniedException();
            }

            if (goal.GoalType != GOAL_TYPE.ORG && goal.CreatedBy != currentUserEmployeeMasterId)
            {
                Log.Warning(
                    "UpdateGoal ACCESS DENIED | Not creator | GoalId={GoalId} | UserId={UserId}",
                    goalId,
                    currentUserEmployeeMasterId
                );
                throw new GoalAccessDeniedException();
            }

            if (goalDetails.Checklist != null && goalDetails.Checklist.Any())
            {
                var existingChecklists = await _baseRepo.GetChecklistItemsByGoalId(goalId);

                var completedChecklistIds = new List<int>();
                foreach (var checklist in existingChecklists)
                {
                    var hasProgress = await _baseRepo.ChecklistHasProgress(
                        checklist.ChecklistId,
                        currentUserEmployeeMasterId
                    );
                    if (hasProgress)
                    {
                        completedChecklistIds.Add(checklist.ChecklistId);
                    }
                }

                foreach (var existingItem in existingChecklists)
                {
                    if (completedChecklistIds.Contains(existingItem.ChecklistId))
                    {
                        continue;
                    }

                    await _repo.DeleteChecklistItem(existingItem.ChecklistId);
                }

                foreach (var dtoItem in goalDetails.Checklist)
                {
                    var newItem = new GoalChecklist
                    {
                        GoalId = goalId,
                        ItemTitle = dtoItem.Title,
                        ItemDescription = dtoItem.Description,
                        IsShared = false,
                        AddedBy = currentUserEmployeeMasterId,
                        AddedFor = dtoItem.AddedForEmployeeMasterId ?? currentUserEmployeeMasterId,
                    };
                    await _repo.AddChecklistItem(newItem);
                }

                await RecalculateProgress(goalId, currentUserEmployeeMasterId);
            }

            if (!string.IsNullOrWhiteSpace(goalDetails.Title))
                goal.GoalTitle = goalDetails.Title;
            if (goalDetails.Description != null)
                goal.GoalDescription = goalDetails.Description;
            if (goalDetails.Deadline.HasValue)
                goal.Goalendat = goalDetails.Deadline;

            await _repo.UpdateGoal(goal);
            await _baseRepo.SaveChanges();

            var metadata = new { GoalId = goalId, UpdatedBy = currentUserEmployeeMasterId };

            Log.Information(
                "UpdateGoal END | GoalId={GoalId} | UpdatedBy={UserId}",
                goalId,
                currentUserEmployeeMasterId
            );

            return ApiResponseModel.SuccessResponse(
                ResponseMessages.Codes.GOAL_UPDATED_SUCCESS,
                metadata
            );
        }

        private async Task RecalculateProgress(int goalId, int userId)
        {
            Log.Debug(
                "RecalculateProgress START | GoalId={GoalId} | UserId={UserId}",
                goalId,
                userId
            );

            var goal = await _baseRepo.GetGoalById(goalId);
            if (goal == null)
            {
                Log.Debug("RecalculateProgress | Goal not found -> exit | GoalId={GoalId}", goalId);
                return;
            }

            var checklists = await _baseRepo.GetChecklistItemsByGoalId(goalId);

            if (checklists == null || !checklists.Any())
            {
                await _repo.UpdateGoalProgress(goalId, 0, userId);
                Log.Debug("RecalculateProgress | No checklist -> progress set to 0 | GoalId={GoalId}", goalId);
                return;
            }

            var totalItems = checklists.Count;
            var completedCount = 0;

            foreach (var checklist in checklists)
            {
                var isCompleted = await _baseRepo.ChecklistHasProgress(
                    checklist.ChecklistId,
                    userId
                );
                if (isCompleted)
                {
                    completedCount++;
                }
            }

            var newProgress = totalItems > 0 ? (decimal)completedCount / totalItems * 100 : 0;

            await _repo.UpdateGoalProgress(goalId, newProgress, userId);

            if (newProgress < 100 && goal.Goalstatus == GOAL_STATUS.COMPLETED)
            {
                goal.Goalstatus = GOAL_STATUS.IN_PROGRESS;
                await _repo.UpdateGoal(goal);
                Log.Debug(
                    "RecalculateProgress | Goal status adjusted to IN_PROGRESS | GoalId={GoalId}",
                    goalId
                );
            }

            Log.Debug(
                "RecalculateProgress END | GoalId={GoalId} | Items={Items} | Completed={Completed} | NewProgress={Progress}",
                goalId,
                totalItems,
                completedCount,
                newProgress
            );
        }

        public async Task<List<AssigneeModel>> GetAssignees(int goalId)
        {
            Log.Information("GetAssignees START | GoalId={GoalId}", goalId);
            var result = await GetAssigneesWithDetails(goalId);
            Log.Information("GetAssignees END | GoalId={GoalId} | Count={Count}", goalId, result.Count);
            return result;
        }

        private async Task<List<AssigneeModel>> GetAssigneesWithDetails(int goalId)
        {
            Log.Debug("GetAssigneesWithDetails START | GoalId={GoalId}", goalId);

            var assignments = await _baseRepo.GetAssignees(goalId);
            var result = new List<AssigneeModel>();

            foreach (var assignment in assignments)
            {
                if (!assignment.AssignedTo.HasValue)
                    continue;

                var edm = await _baseRepo.GetEmployeeDetailsByMasterId(
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

            Log.Debug("GetAssigneesWithDetails END | GoalId={GoalId} | Count={Count}", goalId, result.Count);
            return result;
        }

        public async Task<ApiResponseModel> Assign(
            int goalId,
            AssignGoalModel assignmentDetails,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            Log.Information(
                "Assign START | GoalId={GoalId} | UserId={UserId} | Role={Role} | NewAssignees={Count} | ExtraChecklist={ExtraCount}",
                goalId,
                currentUserEmployeeMasterId,
                currentUserRole,
                assignmentDetails?.AssignedToEmployeeMasterIds?.Count ?? 0,
                assignmentDetails?.AdditionalChecklist?.Count ?? 0
            );

            var validationResult = await _assignGoalValidator.ValidateAsync(assignmentDetails);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                Log.Warning(
                    "Assign VALIDATION_FAILED | GoalId={GoalId} | UserId={UserId} | Errors={Errors}",
                    goalId,
                    currentUserEmployeeMasterId,
                    string.Join("; ", errors)
                );
                throw new BadRequestException("VALIDATION_FAILED", string.Join("; ", errors));
            }

            var goal = await _baseRepo.GetGoalById(goalId);
            if (goal == null)
            {
                Log.Warning("Assign FAILED | Goal not found | GoalId={GoalId}", goalId);
                throw new GoalNotFoundException(goalId);
            }

            if (goal.GoalType != GOAL_TYPE.TEAM)
            {
                Log.Warning(
                    "Assign ACCESS DENIED | Not a team goal | GoalId={GoalId} | UserId={UserId}",
                    goalId,
                    currentUserEmployeeMasterId
                );
                throw new AccessDeniedException(
                    ResponseMessages.Codes.ASSIGNMENT_ACCESS_DENIED,
                    "Only team goals support delegation."
                );
            }

            if (!USER_ROLE.CanAssignGoals(currentUserRole))
            {
                Log.Warning(
                    "Assign ACCESS DENIED | Role cannot assign | GoalId={GoalId} | UserId={UserId} | Role={Role}",
                    goalId,
                    currentUserEmployeeMasterId,
                    currentUserRole
                );
                throw new AccessDeniedException(
                    ResponseMessages.Codes.ASSIGNMENT_ACCESS_DENIED,
                    "Only managers/dept heads can assign goals."
                );
            }

            var existingAssignees = await _baseRepo.GetAssignees(goalId);
            var existingAssigneeIds = existingAssignees
                .Select(a => a.AssignedTo)
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .ToList();

            bool isCreator = goal.CreatedBy == currentUserEmployeeMasterId;
            bool isAssignee = existingAssigneeIds.Contains(currentUserEmployeeMasterId);

            if (!isCreator && !isAssignee)
            {
                Log.Warning(
                    "Assign ACCESS DENIED | Not creator or assignee | GoalId={GoalId} | UserId={UserId}",
                    goalId,
                    currentUserEmployeeMasterId
                );
                throw new AccessDeniedException(
                    ResponseMessages.Codes.ASSIGNMENT_ACCESS_DENIED,
                    "Only the goal creator or assigned participants can delegate this goal."
                );
            }

            var subordinates = await _baseRepo.GetSubordinateEmployeeMasterIds(
                currentUserEmployeeMasterId
            );
            var invalidAssignments = assignmentDetails
                .AssignedToEmployeeMasterIds.Except(subordinates)
                .ToList();
            if (invalidAssignments.Any())
            {
                Log.Warning(
                    "Assign INVALID_SUBORDINATES | GoalId={GoalId} | UserId={UserId} | Invalid={Invalid}",
                    goalId,
                    currentUserEmployeeMasterId,
                    string.Join(", ", invalidAssignments)
                );
                throw new BusinessRuleException(
                    ResponseMessages.Codes.ASSIGNMENT_INVALID_SUBORDINATE,
                    $"Invalid assignees: {string.Join(", ", invalidAssignments)}. You can only assign goals to your direct subordinates."
                );
            }

            var duplicateAssignees = assignmentDetails
                .AssignedToEmployeeMasterIds.Intersect(existingAssigneeIds)
                .ToList();

            if (duplicateAssignees.Any())
            {
                Log.Warning(
                    "Assign DUPLICATE | GoalId={GoalId} | UserId={UserId} | Duplicates={Duplicates}",
                    goalId,
                    currentUserEmployeeMasterId,
                    string.Join(", ", duplicateAssignees)
                );
                throw new ConflictException(
                    ResponseMessages.Codes.ASSIGNMENT_DUPLICATE,
                    $"The following users are already assigned to this goal: {string.Join(", ", duplicateAssignees)}"
                );
            }

            var assignments = assignmentDetails
                .AssignedToEmployeeMasterIds.Select(to => new GoalAssignment
                {
                    GoalId = goal.GoalId,
                    AssignedBy = currentUserEmployeeMasterId,
                    AssignedTo = to,
                    AssignedOn = DateTime.UtcNow,
                })
                .ToList();
            await _repo.AddAssignments(assignments);

            var items = assignmentDetails
                .AdditionalChecklist.Select(c => new GoalChecklist
                {
                    GoalId = goal.GoalId,
                    ItemTitle = c.Title,
                    ItemDescription = c.Description,
                    IsShared = false,
                    AddedBy = currentUserEmployeeMasterId,
                    AddedFor = c.AddedForEmployeeMasterId!.Value,
                })
                .ToList();
            await _repo.AddChecklistRange(items);

            var approverId = await _baseRepo.GetReportingManagerEmployeeMasterId(
                currentUserEmployeeMasterId
            );
            var approval = new GoalApproval
            {
                GoalId = goal.GoalId,
                ApprovalType = APPROVAL_TYPE.DELEGATION,
                RequestedBy = currentUserEmployeeMasterId,
                RequestedOn = DateTime.UtcNow,
                ApprovedBy = approverId,
                ApprovalStatus = APPROVAL_STATUS.PENDING,
            };
            await _approvalsRepo.AddApproval(approval);

            await _baseRepo.SaveChanges();

            var metadata = new
            {
                GoalId = goalId,
                AssignedBy = currentUserEmployeeMasterId,
                NewAssignees = assignmentDetails.AssignedToEmployeeMasterIds,
                ChecklistItemsAdded = items.Count,
            };

            Log.Information(
                "Assign END | GoalId={GoalId} | AssignedBy={UserId} | NewAssignees={Count} | ChecklistAdded={ChecklistCount}",
                goalId,
                currentUserEmployeeMasterId,
                assignmentDetails.AssignedToEmployeeMasterIds?.Count ?? 0,
                items.Count
            );

            return ApiResponseModel.SuccessResponse(
                ResponseMessages.Codes.ASSIGNMENT_SUCCESS,
                metadata
            );
        }

        public async Task<List<ProjectModel>> GetUserProjects(int employeeMasterId)
        {
            Log.Information("GetUserProjects START | UserId={UserId}", employeeMasterId);

            var userRole = await _baseRepo.GetUserRole(employeeMasterId);

            if (userRole == USER_ROLE.LEADERSHIP)
            {
                var allProjects = await _repo.GetAllProjects();
                var mapped = _mapper.Map<List<ProjectModel>>(allProjects);

                Log.Information(
                    "GetUserProjects END | UserId={UserId} | Role=LEADERSHIP | Count={Count}",
                    employeeMasterId,
                    mapped?.Count ?? 0
                );

                return mapped;
            }

            var employeeDetails = await _baseRepo.GetEmployeeDetailsByMasterId(
                employeeMasterId
            );
            if (employeeDetails == null)
            {
                Log.Information(
                    "GetUserProjects END | UserId={UserId} | No employee details -> empty list",
                    employeeMasterId
                );
                return new List<ProjectModel>();
            }

            var employeeId = employeeDetails.EmployeeId;
            var userProjects = await _repo.GetUserProjectsByEmployeeId(employeeId);

            var result = _mapper.Map<List<ProjectModel>>(userProjects);

            Log.Information(
                "GetUserProjects END | UserId={UserId} | Role={Role} | Count={Count}",
                employeeMasterId,
                userRole,
                result?.Count ?? 0
            );

            return result;
        }

        public async Task<List<ProjectModel>> GetAllProjects()
        {
            Log.Information("GetAllProjects START");
            var allProjects = await _repo.GetAllProjects();
            var mapped = _mapper.Map<List<ProjectModel>>(allProjects);
            Log.Information("GetAllProjects END | Count={Count}", mapped?.Count ?? 0);
            return mapped;
        }

        public async Task<ProjectModel> GetProject(int projectId)
        {
            Log.Information("GetProject START | ProjectId={ProjectId}", projectId);

            var project = await _repo.GetProject(projectId);
            if (project == null)
            {
                Log.Warning("GetProject FAILED | Project not found | ProjectId={ProjectId}", projectId);
                throw new ProjectNotFoundException(projectId);
            }

            var projectModel = _mapper.Map<ProjectModel>(project);
            projectModel.Employees = await _interactionRepo.GetProjectEmployees(projectId);

            Log.Information(
                "GetProject END | ProjectId={ProjectId} | Employees={Count}",
                projectId,
                projectModel.Employees?.Count ?? 0
            );

            return projectModel;
        }

        // HELPER METHODS

        private string? GetShortDescription(string? description)
        {
            var result = string.IsNullOrWhiteSpace(description)
                ? null
                : (description.Length > 80 ? description.Substring(0, 80) + "..." : description);

            Log.Debug(
                "GetShortDescription | InLen={InLen} | OutLen={OutLen}",
                description?.Length ?? 0,
                result?.Length ?? 0
            );

            return result;
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

            var latestLog = await _baseRepo.GetLatestProgressLog(goalId);

            if (latestLog != null && latestLog.Source == PROGRESS_SOURCE.MANUAL)
            {
                var manual = latestLog.ProgressPercent ?? 0;
                Log.Debug(
                    "CalculateGoalProgress | Source=MANUAL | Percent={Percent}",
                    manual
                );
                return manual;
            }

            var allChecklistItems = await _baseRepo.GetChecklistItemsByGoalId(goalId);

            if (allChecklistItems == null || !allChecklistItems.Any())
            {
                Log.Debug("CalculateGoalProgress | No checklist items -> 0");
                return 0;
            }

            int completedCount = 0;
            foreach (var item in allChecklistItems)
            {
                var isCompleted = await _baseRepo.ChecklistHasProgress(
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
                Log.Debug("GetProjectName | Null ProjectId -> null");
                return null;
            }

            var project = await _baseRepo.GetProjectById(projectId.Value);
            var name = project?.ProjectName;

            Log.Debug("GetProjectName END | ProjectId={ProjectId} | Name={Name}", projectId, name);
            return name;
        }

        private bool IsGoalOverdue(Goal goal)
        {
            var overdue = goal.Goalendat.HasValue
                && goal.Goalendat.Value < DateTime.UtcNow
                && goal.Goalstatus != GOAL_STATUS.COMPLETED
                && goal.Goalstatus != GOAL_STATUS.CLOSED;

            Log.Debug(
                "IsGoalOverdue | GoalId={GoalId} | EndAt={EndAt} | Status={Status} | Overdue={Overdue}",
                goal?.GoalId,
                goal?.Goalendat,
                goal?.Goalstatus,
                overdue
            );

            return overdue;
        }

        private bool CanAssignGoal(Goal goal, int userId, string userRole)
        {
            var can =
                (userRole == USER_ROLE.MANAGER || userRole == USER_ROLE.DEPARTMENT_HEAD)
                && goal.GoalType == GOAL_TYPE.TEAM
                && goal.CreatedBy == userId
                && goal.Goalstatus == GOAL_STATUS.OPEN;

            Log.Debug(
                "CanAssignGoal | GoalId={GoalId} | UserId={UserId} | Role={Role} | Result={Result}",
                goal?.GoalId,
                userId,
                userRole,
                can
            );

            return can;
        }
    }
}