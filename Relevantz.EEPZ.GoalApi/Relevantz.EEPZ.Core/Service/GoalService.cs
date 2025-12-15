using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Enums;
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

        public GoalService(
            IGoalRepository repo,
            IBaseGoalRepository baseRepo,
            IGoalProgressRepository progressRepo,
            IGoalApprovalsRepository approvalsRepo,
            IGoalInteractionRepository interactionRepo,
            IBaseGoalService baseService,
            IWebHostEnvironment environment
        )
        {
            _repo = repo;
            _baseRepo = baseRepo;
            _progressRepo = progressRepo;
            _approvalsRepo = approvalsRepo;
            _interactionRepo = interactionRepo;
            _baseService = baseService;
            _environment = environment;
        }

        public async Task<ApiResponseDto<int>> CreateGoalAsync(
            CreateGoalDto dto,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            try
            {
                Log.Information(
                    "[CreateGoal] Starting goal creation - EmpMasterId: {EmpMasterId}, Role: {Role}, Type: {GoalType}, ProjectId: {ProjectId}",
                    currentUserEmployeeMasterId,
                    currentUserRole,
                    dto.GoalType,
                    dto.ProjectId
                );

                // Validation: Can user create this goal type?
                if (!_baseService.CanCreate(currentUserRole, dto.GoalType))
                {
                    Log.Warning(
                        "[CreateGoal] ERROR: Role insufficient - Role: {Role}, GoalType: {GoalType}",
                        currentUserRole,
                        dto.GoalType
                    );
                    return ApiResponseDto<int>.ErrorResponse(
                        ResponseMessages.Codes.ROLE_INSUFFICIENT,
                        $"Role '{currentUserRole}' not permitted to create '{dto.GoalType}' goals."
                    );
                }

                // Validation: Minimum 3 checklist items
                if (dto.Checklist == null || dto.Checklist.Count < 3)
                {
                    Log.Warning(
                        "[CreateGoal] ERROR: Insufficient checklist items - Count: {Count}",
                        dto.Checklist?.Count ?? 0
                    );
                    return ApiResponseDto<int>.ErrorResponse(
                        ResponseMessages.Codes.GOAL_CHECKLIST_INSUFFICIENT,
                        "Goal must have at least 3 checklist items."
                    );
                }

                var validChecklistItems = dto
                    .Checklist.Where(c => !string.IsNullOrWhiteSpace(c.Title))
                    .ToList();

                if (validChecklistItems.Count < 3)
                {
                    Log.Warning(
                        "[CreateGoal] ERROR: Insufficient valid checklist items - Count: {Count}",
                        validChecklistItems.Count
                    );
                    return ApiResponseDto<int>.ErrorResponse(
                        ResponseMessages.Codes.GOAL_CHECKLIST_INSUFFICIENT,
                        "Goal must have at least 3 valid checklist items with titles."
                    );
                }

                // AUTO-ASSIGN self goal checklist items FIRST (before validation)
                if (dto.GoalType == GOAL_TYPE.SELF)
                {
                    Log.Information(
                        "[CreateGoal] Auto-assigning self goal checklist items to creator"
                    );
                    foreach (var item in validChecklistItems)
                    {
                        item.AddedForEmployeeMasterId = currentUserEmployeeMasterId;
                    }
                }

                // NOW validate unassigned items (will pass for self goals after auto-assignment)
                var unassignedItems = validChecklistItems
                    .Where(c => !c.AddedForEmployeeMasterId.HasValue)
                    .ToList();

                if (unassignedItems.Any())
                {
                    Log.Warning(
                        "[CreateGoal] ERROR: Unassigned checklist items - Count: {Count}",
                        unassignedItems.Count
                    );
                    return ApiResponseDto<int>.ErrorResponse(
                        ResponseMessages.Codes.GOAL_CHECKLIST_UNASSIGNED,
                        $"Found {unassignedItems.Count} unassigned checklist item(s). Please assign each item to a team member."
                    );
                }

                // Validate date
                if (dto.Deadline <= DateTime.UtcNow)
                {
                    Log.Warning(
                        "[CreateGoal] ERROR: Past deadline - Deadline: {Deadline}",
                        dto.Deadline
                    );
                    return ApiResponseDto<int>.ErrorResponse(
                        ResponseMessages.Codes.GOAL_DEADLINE_PAST,
                        "Deadline must be in the future."
                    );
                }

                // Team goal validation
                if (dto.GoalType == GOAL_TYPE.TEAM)
                {
                    var checklistAssignees = validChecklistItems
                        .Select(c => c.AddedForEmployeeMasterId!.Value)
                        .Distinct()
                        .ToList();

                    var invalidAssignees = checklistAssignees
                        .Except(dto.AssignedToEmployeeMasterIds)
                        .ToList();

                    if (invalidAssignees.Any())
                    {
                        Log.Warning(
                            "[CreateGoal] ERROR: Invalid team assignees - Invalid: {Invalid}",
                            string.Join(", ", invalidAssignees)
                        );
                        return ApiResponseDto<int>.ErrorResponse(
                            ResponseMessages.Codes.GOAL_CHECKLIST_UNASSIGNED,
                            $"Invalid assignees found: {string.Join(", ", invalidAssignees)}. Valid assignees: {string.Join(", ", dto.AssignedToEmployeeMasterIds)}"
                        );
                    }

                    foreach (var assigneeId in dto.AssignedToEmployeeMasterIds)
                    {
                        var assigneeItems = validChecklistItems
                            .Where(c => c.AddedForEmployeeMasterId == assigneeId)
                            .ToList();

                        if (!assigneeItems.Any())
                        {
                            Log.Warning(
                                "[CreateGoal] ERROR: Assignee has no items - AssigneeId: {AssigneeId}",
                                assigneeId
                            );
                            return ApiResponseDto<int>.ErrorResponse(
                                ResponseMessages.Codes.GOAL_CHECKLIST_UNASSIGNED,
                                $"Assignee {assigneeId} has no checklist items assigned."
                            );
                        }
                    }
                }

                // Project validation
                if (dto.ProjectId.HasValue && dto.ProjectId.Value > 0)
                {
                    Log.Information(
                        "[CreateGoal] Validating project access - EmpMasterId: {EmpMasterId}, ProjectId: {ProjectId}",
                        currentUserEmployeeMasterId,
                        dto.ProjectId.Value
                    );

                    var isInProject = await _repo.IsEmployeeInProjectAsync(
                        currentUserEmployeeMasterId,
                        dto.ProjectId.Value
                    );

                    Log.Information(
                        "[CreateGoal] Project validation result: {IsInProject}",
                        isInProject
                    );

                    if (!isInProject)
                    {
                        Log.Warning(
                            "[CreateGoal] ERROR: ACCESS DENIED - User {EmpMasterId} not in project {ProjectId}",
                            currentUserEmployeeMasterId,
                            dto.ProjectId.Value
                        );

                        return ApiResponseDto<int>.ErrorResponse(
                            ResponseMessages.Codes.PROJECT_NOT_MEMBER,
                            "You are not a member of the selected project."
                        );
                    }

                    Log.Information("[CreateGoal] Project validation PASSED");
                }

                // Self goal assignment auto-correction
                if (dto.GoalType == GOAL_TYPE.SELF)
                {
                    if (
                        dto.AssignedToEmployeeMasterIds.Count != 1
                        || dto.AssignedToEmployeeMasterIds[0] != currentUserEmployeeMasterId
                    )
                    {
                        Log.Information("[CreateGoal] Auto-correcting self goal assignment");
                        dto.AssignedToEmployeeMasterIds = new List<int>
                        {
                            currentUserEmployeeMasterId,
                        };
                    }
                }

                // Team goal assignment validation
                if (dto.GoalType == GOAL_TYPE.TEAM && dto.AssignedToEmployeeMasterIds.Count > 0)
                {
                    var subordinates = await _baseRepo.GetSubordinateEmployeeMasterIdsAsync(
                        currentUserEmployeeMasterId
                    );
                    var invalidAssignments = dto
                        .AssignedToEmployeeMasterIds.Except(subordinates)
                        .ToList();

                    if (invalidAssignments.Any())
                    {
                        Log.Warning(
                            "[CreateGoal] ERROR: Invalid team assignments - Invalid: {Invalid}",
                            string.Join(", ", invalidAssignments)
                        );
                        return ApiResponseDto<int>.ErrorResponse(
                            ResponseMessages.Codes.GOAL_ASSIGNEE_INVALID,
                            $"Invalid assignees: {string.Join(", ", invalidAssignments)}. You can only assign goals to your direct subordinates."
                        );
                    }
                }

                // Create the goal
                Log.Information("[CreateGoal] All validations passed, creating goal...");
                var goalId = await CreateGoalInternalAsync(
                    dto,
                    currentUserEmployeeMasterId,
                    currentUserRole,
                    validChecklistItems
                );

                Log.Information(
                    "[CreateGoal] Goal created successfully - GoalId: {GoalId}",
                    goalId
                );

                var metadata = new
                {
                    GoalId = goalId,
                    GoalType = dto.GoalType,
                    RequiresApproval = currentUserRole != USER_ROLE.LEADERSHIP,
                    AssigneeCount = dto.AssignedToEmployeeMasterIds?.Count ?? 0,
                    ChecklistItemCount = validChecklistItems.Count,
                };

                return ApiResponseDto<int>.SuccessResponse(
                    ResponseMessages.Codes.GOAL_CREATED_SUCCESS,
                    goalId,
                    metadata
                );
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "[CreateGoal] ERROR: Error creating goal - EmpMasterId: {EmpMasterId}",
                    currentUserEmployeeMasterId
                );
                return ApiResponseDto<int>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR,
                    "Failed to create goal due to an internal error."
                );
            }
        }

        private async Task<int> CreateGoalInternalAsync(
            CreateGoalDto dto,
            int currentUserEmployeeMasterId,
            string currentUserRole,
            List<ChecklistItemDto> validChecklistItems
        )
        {
            // Determine initial status
            string initialStatus;
            if (currentUserRole == USER_ROLE.LEADERSHIP)
            {
                initialStatus = GOAL_STATUS.OPEN;
            }
            else if (dto.GoalType == GOAL_TYPE.ORG)
            {
                initialStatus = GOAL_STATUS.OPEN;
            }
            else
            {
                initialStatus = GOAL_STATUS.PENDING;
            }

            // Create goal
            var goal = new Goal
            {
                GoalType = dto.GoalType,
                ProjectId = dto.ProjectId > 0 ? dto.ProjectId : null,
                GoalTitle = dto.Title,
                GoalDescription = dto.Description,
                Goalcreatedat = DateTime.UtcNow,
                Goalendat = dto.Deadline,
                CreatedBy = currentUserEmployeeMasterId,
                Goalstatus = initialStatus,
            };

            await _repo.AddGoalAsync(goal);
            await _baseRepo.SaveChangesAsync();

            // Add checklist items
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

            await _repo.AddChecklistRangeAsync(checklistItems);

            // Add assignments
            if (dto.AssignedToEmployeeMasterIds?.Count > 0)
            {
                var assignments = dto
                    .AssignedToEmployeeMasterIds.Select(to => new GoalAssignment
                    {
                        GoalId = goal.GoalId,
                        AssignedBy = currentUserEmployeeMasterId,
                        AssignedTo = to,
                        AssignedOn = DateTime.UtcNow,
                    })
                    .ToList();
                await _repo.AddAssignmentsAsync(assignments);
            }

            // Create approval request if needed
            if (currentUserRole != USER_ROLE.LEADERSHIP && initialStatus == GOAL_STATUS.PENDING)
            {
                var approvalType = _baseService.GetCreationApprovalType(dto.GoalType);
                if (approvalType != null)
                {
                    var approverId = await _baseRepo.GetReportingManagerEmployeeMasterIdAsync(
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
                    await _approvalsRepo.AddApprovalAsync(approval);
                }
            }

            // Initial progress log
            await _progressRepo.AddProgressLogAsync(
                new Goalprogresslog
                {
                    GoalId = goal.GoalId,
                    UpdatedBy = currentUserEmployeeMasterId,
                    UpdatedOn = DateTime.UtcNow,
                    ProgressPercent = 0,
                    Source = PROGRESS_SOURCE.AUTO,
                }
            );

            await _baseRepo.SaveChangesAsync();
            return goal.GoalId;
        }

        public async Task<List<GoalSummaryDto>> QueryGoalsAsync(
            GoalQueryDto query,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            try
            {
                Log.Information(
                    "[QueryGoalsAsync] Service - Type: {Type}, Role: {Role}, UserID: {ID}",
                    query.Type,
                    currentUserRole ?? "NULL",
                    currentUserEmployeeMasterId
                );

                var goals = await _repo.QueryGoalsAsync(
                    new GoalQueryDto
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

                Log.Information(
                    "[QueryGoalsAsync] Service - Repository returned {Count} goals",
                    goals.Count
                );

                var result = new List<GoalSummaryDto>();

                foreach (var g in goals)
                {
                    // Calculate OVERALL progress
                    int latestProgress;
                    var latestLog = await _baseRepo.GetLatestProgressLogAsync(g.GoalId);
                    if (latestLog != null && latestLog.Source == PROGRESS_SOURCE.MANUAL)
                    {
                        latestProgress = latestLog.ProgressPercent ?? 0;
                    }
                    else
                    {
                        var allChecklistItems = await _baseRepo.GetChecklistItemsByGoalIdAsync(
                            g.GoalId
                        );
                        if (allChecklistItems == null || !allChecklistItems.Any())
                        {
                            latestProgress = 0;
                        }
                        else
                        {
                            int completedCount = 0;
                            foreach (var item in allChecklistItems)
                            {
                                var isCompleted = await _baseRepo.ChecklistHasProgressAsync(
                                    item.ChecklistId,
                                    item.AddedFor ?? currentUserEmployeeMasterId
                                );
                                if (isCompleted)
                                    completedCount++;
                            }
                            latestProgress = (int)
                                Math.Round((double)completedCount / allChecklistItems.Count * 100);
                        }
                    }

                    var isOverdue =
                        g.Goalendat.HasValue
                        && g.Goalendat.Value < DateTime.UtcNow
                        && g.Goalstatus != GOAL_STATUS.COMPLETED
                        && g.Goalstatus != GOAL_STATUS.CLOSED;

                    var canAssign =
                        (
                            currentUserRole == USER_ROLE.MANAGER
                            || currentUserRole == USER_ROLE.DEPARTMENT_HEAD
                        )
                        && g.GoalType == GOAL_TYPE.TEAM
                        && g.CreatedBy == currentUserEmployeeMasterId
                        && g.Goalstatus == GOAL_STATUS.OPEN;

                    string? projectName = null;
                    if (g.ProjectId.HasValue)
                    {
                        var project = await _baseRepo.GetProjectByIdAsync(g.ProjectId.Value);
                        projectName = project?.ProjectName;
                    }

                    var creatorName = await _baseService.GetEmployeeNameAsync(g.CreatedBy);

                    // Calculate personal progress for team goal assignees
                    int? myProgress = null;
                    var isCreator = g.CreatedBy == currentUserEmployeeMasterId;
                    var isAssignee = g.GoalAssignments.Any(a =>
                        a.AssignedTo == currentUserEmployeeMasterId
                    );

                    if (g.GoalType == GOAL_TYPE.TEAM && !isCreator && isAssignee)
                    {
                        myProgress = await CalculatePersonalProgressAsync(
                            g.GoalId,
                            currentUserEmployeeMasterId
                        );
                    }

                    // Check pending approval
                    var hasPendingApproval = g.GoalApprovals.Any(a =>
                        a.RequestedBy == currentUserEmployeeMasterId
                        && a.ApprovalType == APPROVAL_TYPE.TASK_ACKNOWLEDGMENT
                        && a.ApprovalStatus == APPROVAL_STATUS.PENDING
                    );

                    // Check acknowledgment status
                    var isAcknowledged = g
                        .GoalAssignments.Where(a => a.AssignedTo == currentUserEmployeeMasterId)
                        .Any(a => a.IsAcknowledged == true);

                    // Get assignees with acknowledgment status
                    var assignees = new List<AssigneeDto>();
                    if (g.GoalType == GOAL_TYPE.TEAM)
                    {
                        assignees = await GetAssigneesWithDetailsAsync(g.GoalId);
                    }

                    result.Add(
                        new GoalSummaryDto
                        {
                            GoalId = g.GoalId,
                            Title = g.GoalTitle ?? "",
                            DescriptionShort = string.IsNullOrWhiteSpace(g.GoalDescription)
                                ? null
                                : (
                                    g.GoalDescription!.Length > 80
                                        ? g.GoalDescription.Substring(0, 80) + "..."
                                        : g.GoalDescription
                                ),
                            GoalType = g.GoalType ?? GOAL_TYPE.SELF,
                            Status = g.Goalstatus ?? GOAL_STATUS.PENDING,
                            CreatedAt = g.Goalcreatedat,
                            EndAt = g.Goalendat,
                            ProgressPercent = latestProgress,
                            ProjectId = g.ProjectId,
                            ProjectName = projectName,
                            CreatedByEmployeeMasterId = g.CreatedBy,
                            CreatedByName = creatorName,
                            IsOverdue = isOverdue,
                            CanAssign = canAssign,
                            MyProgress = myProgress,
                            HasPendingApproval = hasPendingApproval,
                            IsAcknowledged = isAcknowledged,
                            Assignees = assignees.Any() ? assignees : null,
                        }
                    );
                }

                Log.Information("[QueryGoalsAsync] Service - Returning {Count} DTOs", result.Count);
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "[QueryGoalsAsync] Service error for user {ID}",
                    currentUserEmployeeMasterId
                );
                throw;
            }
        }

        private async Task<int> CalculatePersonalProgressAsync(int goalId, int userId)
        {
            var goal = await _baseRepo.GetGoalByIdAsync(goalId);
            if (goal == null)
                return 0;

            var userItems = goal.GoalChecklists.Where(c => c.AddedFor == userId).ToList();

            if (!userItems.Any())
                return 0;

            var completedCount = 0;
            foreach (var item in userItems)
            {
                var hasProgress = await _baseRepo.ChecklistHasProgressAsync(item.ChecklistId, userId);
                if (hasProgress)
                {
                    completedCount++;
                }
            }

            return (int)Math.Round((double)completedCount / userItems.Count * 100);
        }

        public async Task<ApiResponseDto> UpdateGoalAsync(
            int goalId,
            UpdateGoalDto dto,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            try
            {
                var goal = await _baseRepo.GetGoalByIdAsync(goalId);
                if (goal == null)
                {
                    return ApiResponseDto.ErrorResponse(ResponseMessages.Codes.GOAL_NOT_FOUND);
                }

                // Access control
                if (goal.GoalType == GOAL_TYPE.ORG && currentUserRole != USER_ROLE.LEADERSHIP)
                {
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.GOAL_ACCESS_DENIED,
                        "Only Leadership can update organization goals."
                    );
                }

                if (goal.GoalType != GOAL_TYPE.ORG && goal.CreatedBy != currentUserEmployeeMasterId)
                {
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.GOAL_ACCESS_DENIED,
                        "Only the goal creator can update this goal."
                    );
                }

                // Validate deadline if provided
                if (dto.Deadline.HasValue && dto.Deadline.Value <= DateTime.UtcNow)
                {
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.GOAL_DEADLINE_PAST,
                        "Deadline must be in the future."
                    );
                }

                // **Handle Checklist Updates**
                if (dto.Checklist != null && dto.Checklist.Any())
                {
                    // Get existing checklist items for this goal
                    var existingChecklists = await _baseRepo.GetChecklistItemsByGoalIdAsync(goalId);

                    // FIXED CODE - Only block deletion of completed items
                    var completedChecklistIds = new List<int>();
                    foreach (var checklist in existingChecklists)
                    {
                        var hasProgress = await _baseRepo.ChecklistHasProgressAsync(
                            checklist.ChecklistId,
                            currentUserEmployeeMasterId
                        );
                        if (hasProgress)
                        {
                            completedChecklistIds.Add(checklist.ChecklistId);
                        }
                    }

                    // Delete ONLY uncompleted items
                    foreach (var existingItem in existingChecklists)
                    {
                        // Skip completed items - don't delete them
                        if (completedChecklistIds.Contains(existingItem.ChecklistId))
                        {
                            continue; // Keep completed items
                        }

                        // Safe to delete uncompleted items
                        await _repo.DeleteChecklistItemAsync(existingItem.ChecklistId);
                    }

                    // Add new checklist items from DTO
                    foreach (var dtoItem in dto.Checklist)
                    {
                        var newItem = new GoalChecklist
                        {
                            GoalId = goalId,
                            ItemTitle = dtoItem.Title,
                            ItemDescription = dtoItem.Description,
                            IsShared = false,
                            AddedBy = currentUserEmployeeMasterId,
                            AddedFor =
                                dtoItem.AddedForEmployeeMasterId ?? currentUserEmployeeMasterId,
                        };
                        await _repo.AddChecklistItemAsync(newItem);
                    }

                    // **Recalculate progress**
                    await RecalculateProgressAsync(goalId, currentUserEmployeeMasterId);
                }

                // Update basic goal fields
                if (!string.IsNullOrWhiteSpace(dto.Title))
                    goal.GoalTitle = dto.Title;
                if (dto.Description != null)
                    goal.GoalDescription = dto.Description;
                if (dto.Deadline.HasValue)
                    goal.Goalendat = dto.Deadline;

                await _repo.UpdateGoalAsync(goal);
                await _baseRepo.SaveChangesAsync();

                var metadata = new { GoalId = goalId, UpdatedBy = currentUserEmployeeMasterId };

                return ApiResponseDto.SuccessResponse(
                    ResponseMessages.Codes.GOAL_UPDATED_SUCCESS,
                    metadata
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating goal {goalId}: {ex}");
                return ApiResponseDto.ErrorResponse(ResponseMessages.Codes.INTERNAL_SERVER_ERROR);
            }
        }

        private async Task RecalculateProgressAsync(int goalId, int userId)
        {
            var goal = await _baseRepo.GetGoalByIdAsync(goalId);
            if (goal == null)
                return;

            // Get all checklist items for this goal
            var checklists = await _baseRepo.GetChecklistItemsByGoalIdAsync(goalId);

            if (checklists == null || !checklists.Any())
            {
                // No checklist - reset progress
                await _repo.UpdateGoalProgressAsync(goalId, 0, userId);
                return;
            }

            // Count completed items for this user
            var totalItems = checklists.Count;
            var completedCount = 0;

            foreach (var checklist in checklists)
            {
                var isCompleted = await _baseRepo.ChecklistHasProgressAsync(
                    checklist.ChecklistId,
                    userId
                );
                if (isCompleted)
                {
                    completedCount++;
                }
            }

            // Calculate new progress
            var newProgress = totalItems > 0 ? (decimal)completedCount / totalItems * 100 : 0;

            // Update goal progress
            await _repo.UpdateGoalProgressAsync(goalId, newProgress, userId);

            // If progress drops below 100% and goal was completed, revert status
            if (newProgress < 100 && goal.Goalstatus == GOAL_STATUS.COMPLETED)
            {
                goal.Goalstatus = GOAL_STATUS.IN_PROGRESS;
                await _repo.UpdateGoalAsync(goal);
            }
        }

        public async Task<List<AssigneeDto>> GetAssigneesAsync(int goalId)
        {
            return await GetAssigneesWithDetailsAsync(goalId);
        }

        private async Task<List<AssigneeDto>> GetAssigneesWithDetailsAsync(int goalId)
        {
            var assignments = await _baseRepo.GetAssigneesAsync(goalId);
            var result = new List<AssigneeDto>();

            foreach (var assignment in assignments)
            {
                if (!assignment.AssignedTo.HasValue)
                    continue;

                var edm = await _baseRepo.GetEmployeeDetailsByMasterIdAsync(
                    assignment.AssignedTo.Value
                );
                if (edm?.Employee?.Userprofile == null)
                    continue;

                var profile = edm.Employee.Userprofile;

                result.Add(
                    new AssigneeDto
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

        public async Task<ApiResponseDto> AssignAsync(
            int goalId,
            AssignGoalDto dto,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            try
            {
                var goal = await _baseRepo.GetGoalByIdAsync(goalId);
                if (goal == null)
                {
                    return ApiResponseDto.ErrorResponse(ResponseMessages.Codes.GOAL_NOT_FOUND);
                }

                if (goal.GoalType != GOAL_TYPE.TEAM)
                {
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.ASSIGNMENT_ACCESS_DENIED,
                        "Only team goals support delegation."
                    );
                }

                if (!USER_ROLE.CanAssignGoals(currentUserRole))
                {
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.ASSIGNMENT_ACCESS_DENIED,
                        "Only managers/dept heads can assign goals."
                    );
                }

                // Check authorization
                var existingAssignees = await _baseRepo.GetAssigneesAsync(goalId);
                var existingAssigneeIds = existingAssignees
                    .Select(a => a.AssignedTo)
                    .Where(id => id.HasValue)
                    .Select(id => id!.Value)
                    .ToList();

                bool isCreator = goal.CreatedBy == currentUserEmployeeMasterId;
                bool isAssignee = existingAssigneeIds.Contains(currentUserEmployeeMasterId);

                if (!isCreator && !isAssignee)
                {
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.ASSIGNMENT_ACCESS_DENIED,
                        "Only the goal creator or assigned participants can delegate this goal."
                    );
                }

                // Validate subordinates
                var subordinates = await _baseRepo.GetSubordinateEmployeeMasterIdsAsync(
                    currentUserEmployeeMasterId
                );
                var invalidAssignments = dto
                    .AssignedToEmployeeMasterIds.Except(subordinates)
                    .ToList();
                if (invalidAssignments.Any())
                {
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.ASSIGNMENT_INVALID_SUBORDINATE,
                        $"Invalid assignees: {string.Join(", ", invalidAssignments)}. You can only assign goals to your direct subordinates."
                    );
                }

                // Check for duplicates
                var duplicateAssignees = dto
                    .AssignedToEmployeeMasterIds.Intersect(existingAssigneeIds)
                    .ToList();

                if (duplicateAssignees.Any())
                {
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.ASSIGNMENT_DUPLICATE,
                        $"The following users are already assigned to this goal: {string.Join(", ", duplicateAssignees)}"
                    );
                }

                // Validate checklist
                if (dto.AdditionalChecklist == null || dto.AdditionalChecklist.Count == 0)
                {
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.ASSIGNMENT_CHECKLIST_REQUIRED,
                        "You must provide at least one checklist item for each newly assigned user."
                    );
                }

                var sharedItems = dto
                    .AdditionalChecklist.Where(c => !c.AddedForEmployeeMasterId.HasValue)
                    .ToList();

                if (sharedItems.Any())
                {
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.ASSIGNMENT_CHECKLIST_REQUIRED,
                        "Shared checklist items are not allowed. All items must be assigned to a specific user."
                    );
                }

                // Add assignments
                var assignments = dto
                    .AssignedToEmployeeMasterIds.Select(to => new GoalAssignment
                    {
                        GoalId = goal.GoalId,
                        AssignedBy = currentUserEmployeeMasterId,
                        AssignedTo = to,
                        AssignedOn = DateTime.UtcNow,
                    })
                    .ToList();
                await _repo.AddAssignmentsAsync(assignments);

                // Add checklist items
                var items = dto
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
                await _repo.AddChecklistRangeAsync(items);

                // Create delegation approval request
                var approverId = await _baseRepo.GetReportingManagerEmployeeMasterIdAsync(
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
                await _approvalsRepo.AddApprovalAsync(approval);

                await _baseRepo.SaveChangesAsync();

                var metadata = new
                {
                    GoalId = goalId,
                    AssignedBy = currentUserEmployeeMasterId,
                    NewAssignees = dto.AssignedToEmployeeMasterIds,
                    ChecklistItemsAdded = items.Count,
                };

                return ApiResponseDto.SuccessResponse(
                    ResponseMessages.Codes.ASSIGNMENT_SUCCESS,
                    metadata
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error assigning goal {goalId}: {ex}");
                return ApiResponseDto.ErrorResponse(ResponseMessages.Codes.INTERNAL_SERVER_ERROR);
            }
        }

        public async Task<List<ProjectDto>> GetUserProjectsAsync(int employeeMasterId)
        {
            try
            {
                // Check if user is a Leadership
                var userRole = await _baseRepo.GetUserRoleAsync(employeeMasterId);

                if (userRole == USER_ROLE.LEADERSHIP)
                {
                    // Leaders see all active projects
                    var allProjects = await _repo.GetAllProjectsAsync();
                    return allProjects
                        .Select(p => new ProjectDto
                        {
                            ProjectId = p.ProjectId,
                            ProjectName = p.ProjectName ?? "",
                            Description = p.Description,
                            Status = p.Status ?? PROJECT_STATUS.UNKNOWN,
                            StartDate = p.StartDate,
                            EndDate = p.EndDate,
                        })
                        .ToList();
                }

                // FIXED: Get EmployeeId from empMasterId first
                var employeeDetails = await _baseRepo.GetEmployeeDetailsByMasterIdAsync(
                    employeeMasterId
                );
                if (employeeDetails == null)
                {
                    return new List<ProjectDto>();
                }

                var employeeId = employeeDetails.EmployeeId;

                // Now get projects using EmployeeId (not empMasterId)
                var userProjects = await _repo.GetUserProjectsByEmployeeIdAsync(employeeId);

                return userProjects
                    .Select(p => new ProjectDto
                    {
                        ProjectId = p.ProjectId,
                        ProjectName = p.ProjectName ?? "",
                        Description = p.Description,
                        Status = p.Status ?? PROJECT_STATUS.UNKNOWN,
                        StartDate = p.StartDate,
                        EndDate = p.EndDate,
                    })
                    .ToList();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting user projects: {ex.Message}");
                return new List<ProjectDto>();
            }
        }

        public async Task<List<ProjectDto>> GetAllProjectsAsync()
        {
            try
            {
                var allProjects = await _repo.GetAllProjectsAsync();
                return allProjects
                    .Select(p => new ProjectDto
                    {
                        ProjectId = p.ProjectId,
                        ProjectName = p.ProjectName ?? "",
                        Description = p.Description,
                        Status = p.Status ?? PROJECT_STATUS.UNKNOWN,
                        StartDate = p.StartDate,
                        EndDate = p.EndDate,
                    })
                    .ToList();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting all projects: {ex.Message}");
                return new List<ProjectDto>();
            }
        }

        public async Task<ProjectDto> GetProjectAsync(int projectId)
        {
            var project = await _repo.GetProjectAsync(projectId);
            if (project == null)
                throw new KeyNotFoundException("Project not found");

            var employees = await _interactionRepo.GetProjectEmployeesAsync(projectId);

            return new ProjectDto
            {
                ProjectId = project.ProjectId,
                ProjectName = project.ProjectName ?? "",
                Description = project.Description,
                Status = project.Status ?? PROJECT_STATUS.UNKNOWN,
                StartDate = project.StartDate,
                EndDate = project.EndDate,
                Employees = employees,
            };
        }
    }
}
