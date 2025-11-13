using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Data.Repository.Interface;
using Serilog;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class GoalModuleService : IGoalModuleService
    {
        private readonly IGoalModuleRepository _repo;
        private readonly IWebHostEnvironment _environment;

        public GoalModuleService(IGoalModuleRepository repo, IWebHostEnvironment environment)
        {
            _repo = repo;
            _environment = environment;
        }

        // ==================== HELPER METHODS ====================
        private static bool CanCreate(string role, string goalType) =>
            (goalType == "self") // All roles can create self goals
            || (goalType == "team" && (role == "Manager" || role == "Department Head"))
            || (goalType == "org" && role == "Leadership");

        private static string? GetCreationApprovalType(string goalType) =>
            goalType == "self" ? "selfgoalactivation"
            : goalType == "team" ? "creation"
            : null;

        private async Task<int?> GetApproverForUserAsync(int employeeMasterId, string approvalType)
        {
            // Get the user's reporting manager
            var managerId = await _repo.GetReportingManagerEmployeeMasterIdAsync(employeeMasterId);
            return managerId;
        }

        private async Task<string> GetEmployeeNameAsync(int? employeeMasterId)
        {
            if (!employeeMasterId.HasValue)
                return "Unknown";

            var edm = await _repo.GetEmployeeDetailsByMasterIdAsync(employeeMasterId.Value);
            if (edm?.Employee?.Userprofile == null)
                return "Unknown";

            var profile = edm.Employee.Userprofile;
            return $"{profile.FirstName} {profile.LastName}";
        }

        // ==================== GOAL LIFECYCLE ====================
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
                if (!CanCreate(currentUserRole, dto.GoalType))
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
                if (dto.GoalType == "self")
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
                if (dto.GoalType == "team")
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
                if (dto.GoalType == "self")
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
                if (dto.GoalType == "team" && dto.AssignedToEmployeeMasterIds.Count > 0)
                {
                    var subordinates = await _repo.GetSubordinateEmployeeMasterIdsAsync(
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
                    RequiresApproval = currentUserRole != "Leadership",
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
            if (currentUserRole == "Leadership")
            {
                initialStatus = "open";
            }
            else if (dto.GoalType == "org")
            {
                initialStatus = "open";
            }
            else
            {
                initialStatus = "pending";
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
            await _repo.SaveChangesAsync();

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
            if (currentUserRole != "Leadership" && initialStatus == "pending")
            {
                var approvalType = GetCreationApprovalType(dto.GoalType);
                if (approvalType != null)
                {
                    var approverId = await _repo.GetReportingManagerEmployeeMasterIdAsync(
                        currentUserEmployeeMasterId
                    );
                    var approval = new GoalApproval
                    {
                        GoalId = goal.GoalId,
                        ApprovalType = approvalType,
                        RequestedBy = currentUserEmployeeMasterId,
                        RequestedOn = DateTime.UtcNow,
                        ApprovedBy = approverId,
                        ApprovalStatus = "pending",
                    };
                    await _repo.AddApprovalAsync(approval);
                }
            }

            // Initial progress log
            await _repo.AddProgressLogAsync(
                new Goalprogresslog
                {
                    GoalId = goal.GoalId,
                    UpdatedBy = currentUserEmployeeMasterId,
                    UpdatedOn = DateTime.UtcNow,
                    ProgressPercent = 0,
                    Source = "auto",
                }
            );

            await _repo.SaveChangesAsync();
            return goal.GoalId;
        }

        public async Task<GoalDetailDto> GetGoalAsync(
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
            if (latestLog != null && latestLog.Source == "manual")
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
                && goal.Goalstatus != "completed"
                && goal.Goalstatus != "closed";
            bool canComment = await CanCommentOnGoalAsync(
                goalId,
                currentUserEmployeeMasterId,
                currentUserRole
            );
            bool canMarkComplete = await CanMarkCompleteAsync(goalId, currentUserEmployeeMasterId);
            bool isOverdue =
                goal.Goalendat.HasValue
                && goal.Goalendat.Value < DateTime.UtcNow
                && goal.Goalstatus != "completed"
                && goal.Goalstatus != "closed";
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

            return new GoalDetailDto
            {
                GoalId = goal.GoalId,
                GoalType = goal.GoalType ?? "self",
                ProjectId = goal.ProjectId,
                ProjectName = projectName,
                Title = goal.GoalTitle ?? "",
                Description = goal.GoalDescription,
                CreatedAt = goal.Goalcreatedat,
                CreatedByEmployeeMasterId = goal.CreatedBy,
                CreatedByName = creatorName,
                EndAt = goal.Goalendat,
                Status = goal.Goalstatus ?? "pending",
                ProgressPercent = progressPercent,
                HasPendingApproval = hasPendingApproval,
                Checklist = goal
                    .GoalChecklists.Select(c => new GoalChecklistItemDto
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
                    currentUserEmployeeMasterId,
                    query.Type,
                    query.Status,
                    query.ProjectId,
                    query.DueBefore,
                    query.DueAfter,
                    query.Search,
                    query.CreatedByEmployeeMasterId,
                    query.AssignedToEmployeeMasterId,
                    query.CreatedAfter,
                    query.CreatedBefore,
                    query.Page,
                    query.PageSize,
                    currentUserRole
                );

                Log.Information(
                    "[QueryGoalsAsync] Service - Repository returned {Count} goals",
                    goals.Count
                );

                var result = new List<GoalSummaryDto>();

                foreach (var g in goals)
                {
                    var latestProgress = g
                        .Goalprogresslogs.OrderByDescending(p => p.UpdatedOn)
                        .FirstOrDefault();

                    var isOverdue =
                        g.Goalendat.HasValue
                        && g.Goalendat.Value < DateTime.UtcNow
                        && g.Goalstatus != "completed"
                        && g.Goalstatus != "closed";

                    var canAssign =
                        (currentUserRole == "Manager" || currentUserRole == "Department Head")
                        && g.GoalType == "team"
                        && g.CreatedBy == currentUserEmployeeMasterId
                        && g.Goalstatus == "open";

                    string? projectName = null;
                    if (g.ProjectId.HasValue)
                    {
                        var project = await _repo.GetProjectByIdAsync(g.ProjectId.Value);
                        projectName = project?.ProjectName;
                    }

                    var creatorName = await GetEmployeeNameAsync(g.CreatedBy);

                    // Calculate personal progress for team goal assignees
                    int? myProgress = null;
                    var isCreator = g.CreatedBy == currentUserEmployeeMasterId;
                    var isAssignee = g.GoalAssignments.Any(a =>
                        a.AssignedTo == currentUserEmployeeMasterId
                    );

                    if (g.GoalType == "team" && !isCreator && isAssignee)
                    {
                        myProgress = await CalculatePersonalProgressAsync(
                            g.GoalId,
                            currentUserEmployeeMasterId
                        );
                    }

                    // Check pending approval
                    var hasPendingApproval = g.GoalApprovals.Any(a =>
                        a.RequestedBy == currentUserEmployeeMasterId
                        && a.ApprovalType == "task_acknowledgment"
                        && a.ApprovalStatus == "pending"
                    );

                    // Check acknowledgment status
                    var isAcknowledged = g
                        .GoalAssignments.Where(a => a.AssignedTo == currentUserEmployeeMasterId)
                        .Any(a => a.IsAcknowledged == true);

                    // Get assignees with acknowledgment status
                    var assignees = new List<AssigneeDto>();
                    if (g.GoalType == "team")
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
                            GoalType = g.GoalType ?? "self",
                            Status = g.Goalstatus ?? "pending",
                            CreatedAt = g.Goalcreatedat,
                            EndAt = g.Goalendat,
                            ProgressPercent = latestProgress?.ProgressPercent ?? 0,
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
            var goal = await _repo.GetGoalByIdAsync(goalId);
            if (goal == null)
                return 0;

            var userItems = goal.GoalChecklists.Where(c => c.AddedFor == userId).ToList();

            if (!userItems.Any())
                return 0;

            var completedCount = 0;
            foreach (var item in userItems)
            {
                var hasProgress = await _repo.ChecklistHasProgressAsync(item.ChecklistId, userId);
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
                var goal = await _repo.GetGoalByIdAsync(goalId);
                if (goal == null)
                {
                    return ApiResponseDto.ErrorResponse(ResponseMessages.Codes.GOAL_NOT_FOUND);
                }

                // Access control
                if (goal.GoalType == "org" && currentUserRole != "Leadership")
                {
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.GOAL_ACCESS_DENIED,
                        "Only Leadership can update organization goals."
                    );
                }

                if (goal.GoalType != "org" && goal.CreatedBy != currentUserEmployeeMasterId)
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
                    var existingChecklists = await _repo.GetChecklistItemsByGoalIdAsync(goalId);

                    // FIXED CODE - Only block deletion of completed items
                    var completedChecklistIds = new List<int>();
                    foreach (var checklist in existingChecklists)
                    {
                        var hasProgress = await _repo.ChecklistHasProgressAsync(
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
                await _repo.SaveChangesAsync();

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
            var goal = await _repo.GetGoalByIdAsync(goalId);
            if (goal == null)
                return;

            // Get all checklist items for this goal
            var checklists = await _repo.GetChecklistItemsByGoalIdAsync(goalId);

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
                var isCompleted = await _repo.ChecklistHasProgressAsync(
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
            if (newProgress < 100 && goal.Goalstatus == "completed")
            {
                goal.Goalstatus = "inprogress";
                await _repo.UpdateGoalAsync(goal);
            }
        }

        public async Task<List<AssigneeDto>> GetAssigneesAsync(int goalId)
        {
            return await GetAssigneesWithDetailsAsync(goalId);
        }

        private async Task<List<AssigneeDto>> GetAssigneesWithDetailsAsync(int goalId)
        {
            var assignments = await _repo.GetAssigneesAsync(goalId);
            var result = new List<AssigneeDto>();

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
                    new AssigneeDto
                    {
                        EmployeeMasterId = assignment.AssignedTo.Value,
                        Name = $"{profile.FirstName} {profile.LastName}".Trim(),
                        Role = edm.Role?.RoleName ?? "Employee", // Fixed: Use Role.RoleName
                        IsAcknowledged = assignment.IsAcknowledged ?? false,
                        AcknowledgedOn = assignment.AcknowledgedOn,
                    }
                );
            }

            return result;
        }

        // ==================== PROJECT METHODS ====================

        public async Task<List<ProjectDto>> GetUserProjectsAsync(int employeeMasterId)
        {
            try
            {
                // Check if user is a Leadership
                var userRole = await _repo.GetUserRoleAsync(employeeMasterId);

                if (userRole == "Leadership")
                {
                    // Leaders see all active projects
                    var allProjects = await _repo.GetAllProjectsAsync();
                    return allProjects
                        .Select(p => new ProjectDto
                        {
                            ProjectId = p.ProjectId,
                            ProjectName = p.ProjectName ?? "",
                            Description = p.Description,
                            Status = p.Status ?? "Unknown",
                            StartDate = p.StartDate,
                            EndDate = p.EndDate,
                        })
                        .ToList();
                }

                // FIXED: Get EmployeeId from empMasterId first
                var employeeDetails = await _repo.GetEmployeeDetailsByMasterIdAsync(
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
                        Status = p.Status ?? "Unknown",
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
                        Status = p.Status ?? "Unknown",
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

            var employees = await _repo.GetProjectEmployeesAsync(projectId);

            return new ProjectDto
            {
                ProjectId = project.ProjectId,
                ProjectName = project.ProjectName ?? "",
                Description = project.Description,
                Status = project.Status ?? "Unknown",
                StartDate = project.StartDate,
                EndDate = project.EndDate,
                Employees = employees,
            };
        }

        public async Task<List<ProjectEmployeeDto>> GetProjectSubordinatesAsync(
            int projectId,
            int managerEmployeeMasterId
        )
        {
            return await _repo.GetProjectSubordinatesAsync(projectId, managerEmployeeMasterId);
        }

        // ==================== ASSIGNMENTS ====================
        public async Task<ApiResponseDto> AssignAsync(
            int goalId,
            AssignGoalDto dto,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            try
            {
                var goal = await _repo.GetGoalByIdAsync(goalId);
                if (goal == null)
                {
                    return ApiResponseDto.ErrorResponse(ResponseMessages.Codes.GOAL_NOT_FOUND);
                }

                if (goal.GoalType != "team")
                {
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.ASSIGNMENT_ACCESS_DENIED,
                        "Only team goals support delegation."
                    );
                }

                if (!(currentUserRole == "Manager" || currentUserRole == "Department Head"))
                {
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.ASSIGNMENT_ACCESS_DENIED,
                        "Only managers/dept heads can assign goals."
                    );
                }

                // Check authorization
                var existingAssignees = await _repo.GetAssigneesAsync(goalId);
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
                var subordinates = await _repo.GetSubordinateEmployeeMasterIdsAsync(
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
                var approverId = await _repo.GetReportingManagerEmployeeMasterIdAsync(
                    currentUserEmployeeMasterId
                );
                var approval = new GoalApproval
                {
                    GoalId = goal.GoalId,
                    ApprovalType = "delegation",
                    RequestedBy = currentUserEmployeeMasterId,
                    RequestedOn = DateTime.UtcNow,
                    ApprovedBy = approverId,
                    ApprovalStatus = "pending",
                };
                await _repo.AddApprovalAsync(approval);

                await _repo.SaveChangesAsync();

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

        // ==================== FILE STORAGE METHODS ====================

        public async Task<FileUploadResponseDto> UploadFileAsync(
            int goalId,
            IFormFile file,
            string title,
            int currentUserEmployeeMasterId
        )
        {
            var goal = await _repo.GetGoalByIdAsync(goalId);
            if (goal == null)
                throw new KeyNotFoundException("Goal not found");

            // Check if user can upload to this goal
            var canView = await CanViewGoalAsync(goalId, currentUserEmployeeMasterId);
            if (!canView)
                throw new UnauthorizedAccessException("You cannot upload files to this goal.");

            // Validate file
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty or null");

            // Validate file size (10MB limit)
            const long maxFileSize = 10 * 1024 * 1024;
            if (file.Length > maxFileSize)
                throw new InvalidOperationException("File size exceeds maximum limit of 10MB");

            // Validate file extension
            var allowedExtensions = new[]
            {
                ".pdf",
                ".doc",
                ".docx",
                ".xls",
                ".xlsx",
                ".png",
                ".jpg",
                ".jpeg",
                ".txt",
                ".zip",
            };
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(fileExtension))
                throw new InvalidOperationException($"File type '{fileExtension}' is not allowed");

            // Handle null WebRootPath
            string webRootPath = _environment.WebRootPath;
            if (string.IsNullOrEmpty(webRootPath))
            {
                webRootPath = Path.Combine(_environment.ContentRootPath, "wwwroot");
            }

            // Create upload directory
            var uploadsFolder = Path.Combine(webRootPath, "uploads", "goal-attachments");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            // Generate unique filename
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            // Save file
            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            // Store relative path in database
            var relativePath = Path.Combine("uploads", "goal-attachments", uniqueFileName)
                .Replace("\\", "/");

            // Save attachment record
            var attachment = new GoalAttachment
            {
                GoalId = goalId,
                AttachmentTitle = title,
                Attachments = relativePath,
                AttachedBy = currentUserEmployeeMasterId,
                AttachedOn = DateTime.UtcNow,
            };

            await _repo.AddAttachmentAsync(attachment);
            await _repo.SaveChangesAsync();

            return new FileUploadResponseDto
            {
                AttachmentId = attachment.Goalattachmentsid,
                AttachmentTitle = attachment.AttachmentTitle ?? "",
                FilePath = attachment.Attachments ?? "",
                FileName = file.FileName,
                FileSize = file.Length,
                ContentType = file.ContentType,
                UploadedOn = attachment.AttachedOn ?? DateTime.UtcNow,
            };
        }

        public async Task<(
            byte[] fileBytes,
            string contentType,
            string fileName
        )> DownloadFileAsync(int attachmentId, int currentUserEmployeeMasterId)
        {
            var attachment = await _repo.GetAttachmentByIdAsync(attachmentId);
            if (attachment == null)
                throw new KeyNotFoundException("Attachment not found");

            // Check if user can access this goal
            var canView = await CanViewGoalAsync(attachment.GoalId, currentUserEmployeeMasterId);
            if (!canView)
                throw new UnauthorizedAccessException("You cannot access this attachment.");

            // Handle null WebRootPath
            string webRootPath = _environment.WebRootPath;
            if (string.IsNullOrEmpty(webRootPath))
            {
                webRootPath = Path.Combine(_environment.ContentRootPath, "wwwroot");
            }

            // Get full file path
            var fullPath = Path.Combine(webRootPath, attachment.Attachments?.TrimStart('/') ?? "");

            if (!File.Exists(fullPath))
                throw new FileNotFoundException("Attachment file not found on server.");

            var fileBytes = await File.ReadAllBytesAsync(fullPath);
            var contentType = GetContentType(attachment.Attachments ?? "");

            // Use the original filename from attachment title or extract from path
            var fileName = !string.IsNullOrEmpty(attachment.AttachmentTitle)
                ? attachment.AttachmentTitle
                : Path.GetFileName(attachment.Attachments ?? "download");

            // Ensure filename has proper extension
            if (!Path.HasExtension(fileName) && !string.IsNullOrEmpty(attachment.Attachments))
            {
                var extension = Path.GetExtension(attachment.Attachments);
                fileName += extension;
            }

            return (fileBytes, contentType, fileName);
        }

        public async Task<bool> DeleteAttachmentAsync(
            int attachmentId,
            int currentUserEmployeeMasterId
        )
        {
            var attachment = await _repo.GetAttachmentByIdAsync(attachmentId);
            if (attachment == null)
                throw new KeyNotFoundException("Attachment not found");

            var goal = await _repo.GetGoalByIdAsync(attachment.GoalId);
            if (goal == null)
                throw new KeyNotFoundException("Goal not found");

            // Only attachment uploader or goal creator can delete
            if (
                attachment.AttachedBy != currentUserEmployeeMasterId
                && goal.CreatedBy != currentUserEmployeeMasterId
            )
                throw new UnauthorizedAccessException("You cannot delete this attachment.");

            // Delete file from storage
            if (!string.IsNullOrEmpty(attachment.Attachments))
            {
                string webRootPath = _environment.WebRootPath;
                if (string.IsNullOrEmpty(webRootPath))
                {
                    webRootPath = Path.Combine(_environment.ContentRootPath, "wwwroot");
                }

                var fullPath = Path.Combine(webRootPath, attachment.Attachments.TrimStart('/'));
                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                }
            }

            // Delete from database
            await _repo.DeleteAttachmentAsync(attachmentId);
            await _repo.SaveChangesAsync();

            return true;
        }

        private string GetContentType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            return extension switch
            {
                ".pdf" => "application/pdf",
                ".doc" => "application/msword",
                ".docx" =>
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xls" => "application/vnd.ms-excel",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".txt" => "text/plain",
                ".zip" => "application/zip",
                _ => "application/octet-stream",
            };
        }

        // ==================== APPROVALS ====================
        public async Task<ApiResponseDto<int>> RequestApprovalAsync(
            int goalId,
            CreateApprovalRequestDto dto,
            int requesterEmployeeMasterId,
            string requesterRole
        )
        {
            try
            {
                var goal = await _repo.GetGoalByIdAsync(goalId);
                if (goal == null)
                {
                    return ApiResponseDto<int>.ErrorResponse(ResponseMessages.Codes.GOAL_NOT_FOUND);
                }

                if (dto.ApprovalType == "completion")
                {
                    if (requesterRole == "Leadership" && (goal.GoalType?.ToLower() == "org"))
                    {
                        var autoApproval = new GoalApproval
                        {
                            GoalId = goalId,
                            ApprovalType = "completion",
                            RequestedBy = requesterEmployeeMasterId,
                            RequestedOn = DateTime.UtcNow,
                            ApprovedBy = requesterEmployeeMasterId,
                            ApprovalStatus = "approved",
                            ApprovedOn = DateTime.UtcNow,
                        };

                        await _repo.AddApprovalAsync(autoApproval);
                        goal.Goalstatus = "completed";
                        await _repo.SaveChangesAsync();

                        return ApiResponseDto<int>.SuccessResponse(
                            ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                            autoApproval.ApprovalId
                        );
                    }

                    if (requesterRole == "Leadership" && (goal.GoalType?.ToLower() == "self"))
                    {
                        var autoApproval = new GoalApproval
                        {
                            GoalId = goalId,
                            ApprovalType = "completion",
                            RequestedBy = requesterEmployeeMasterId,
                            RequestedOn = DateTime.UtcNow,
                            ApprovedBy = requesterEmployeeMasterId,
                            ApprovalStatus = "approved",
                            ApprovedOn = DateTime.UtcNow,
                        };

                        await _repo.AddApprovalAsync(autoApproval);
                        goal.Goalstatus = "completed";
                        await _repo.SaveChangesAsync();

                        return ApiResponseDto<int>.SuccessResponse(
                            ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                            autoApproval.ApprovalId
                        );
                    }

                    var managerId = await _repo.GetReportingManagerEmployeeMasterIdAsync(
                        requesterEmployeeMasterId
                    );
                    if (!managerId.HasValue)
                    {
                        return ApiResponseDto<int>.ErrorResponse(
                            ResponseMessages.Codes.APPROVAL_NO_MANAGER,
                            "Cannot submit approval: No reporting manager found"
                        );
                    }

                    var approval = new GoalApproval
                    {
                        GoalId = goalId,
                        ApprovalType = "completion",
                        RequestedBy = requesterEmployeeMasterId,
                        RequestedOn = DateTime.UtcNow,
                        ApprovedBy = managerId.Value,
                        ApprovalStatus = "pending",
                    };

                    await _repo.AddApprovalAsync(approval);
                    await _repo.SaveChangesAsync();

                    return ApiResponseDto<int>.SuccessResponse(
                        ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                        approval.ApprovalId
                    );
                }

                if (dto.ApprovalType == "closure")
                {
                    if (goal.CreatedBy != requesterEmployeeMasterId)
                    {
                        return ApiResponseDto<int>.ErrorResponse(
                            ResponseMessages.Codes.GOAL_ACCESS_DENIED,
                            "Only goal creator can request closure"
                        );
                    }

                    if (
                        new[] { "closed", "completed", "cancelled" }.Contains(
                            goal.Goalstatus?.ToLower() ?? ""
                        )
                    )
                    {
                        return ApiResponseDto<int>.ErrorResponse(
                            ResponseMessages.Codes.GOAL_INVALID_STATUS,
                            "Goal is already completed or closed"
                        );
                    }

                    if (requesterRole == "Leadership" && (goal.GoalType?.ToLower() == "org"))
                    {
                        var autoApproval = new GoalApproval
                        {
                            GoalId = goalId,
                            ApprovalType = "closure",
                            RequestedBy = requesterEmployeeMasterId,
                            RequestedOn = DateTime.UtcNow,
                            ApprovedBy = requesterEmployeeMasterId,
                            ApprovalStatus = "approved",
                            ApprovedOn = DateTime.UtcNow,
                        };

                        await _repo.AddApprovalAsync(autoApproval);
                        goal.Goalstatus = "closed";
                        await _repo.SaveChangesAsync();

                        return ApiResponseDto<int>.SuccessResponse(
                            ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                            autoApproval.ApprovalId
                        );
                    }

                    var managerId = await _repo.GetReportingManagerEmployeeMasterIdAsync(
                        requesterEmployeeMasterId
                    );
                    if (!managerId.HasValue)
                    {
                        return ApiResponseDto<int>.ErrorResponse(
                            ResponseMessages.Codes.APPROVAL_NO_MANAGER,
                            "No manager found to approve closure"
                        );
                    }

                    var approval = new GoalApproval
                    {
                        GoalId = goalId,
                        ApprovalType = "closure",
                        RequestedBy = requesterEmployeeMasterId,
                        RequestedOn = DateTime.UtcNow,
                        ApprovedBy = managerId.Value,
                        ApprovalStatus = "pending",
                    };

                    await _repo.AddApprovalAsync(approval);
                    await _repo.SaveChangesAsync();

                    return ApiResponseDto<int>.SuccessResponse(
                        ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                        approval.ApprovalId
                    );
                }

                if (dto.ApprovalType == "reopening")
                {
                    if (!goal.Goalendat.HasValue || goal.Goalendat.Value >= DateTime.UtcNow)
                    {
                        return ApiResponseDto<int>.ErrorResponse(
                            ResponseMessages.Codes.GOAL_INVALID_STATUS,
                            "Goal is not overdue"
                        );
                    }

                    if (
                        goal.CreatedBy != requesterEmployeeMasterId
                        && !await _repo.IsUserAssignedToGoalAsync(goalId, requesterEmployeeMasterId)
                    )
                    {
                        return ApiResponseDto<int>.ErrorResponse(
                            ResponseMessages.Codes.GOAL_ACCESS_DENIED,
                            "Only goal creator or assignees can request reopening"
                        );
                    }

                    var managerId = await _repo.GetReportingManagerEmployeeMasterIdAsync(
                        requesterEmployeeMasterId
                    );
                    if (!managerId.HasValue)
                    {
                        return ApiResponseDto<int>.ErrorResponse(
                            ResponseMessages.Codes.APPROVAL_NO_MANAGER,
                            "No manager found to approve reopening"
                        );
                    }

                    var approval = new GoalApproval
                    {
                        GoalId = goalId,
                        ApprovalType = "reopening",
                        RequestedBy = requesterEmployeeMasterId,
                        RequestedOn = DateTime.UtcNow,
                        ApprovedBy = managerId.Value,
                        ApprovalStatus = "pending",
                    };

                    await _repo.AddApprovalAsync(approval);
                    await _repo.SaveChangesAsync();

                    return ApiResponseDto<int>.SuccessResponse(
                        ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                        approval.ApprovalId
                    );
                }

                if (dto.ApprovalType == "reactivation")
                {
                    if (goal.CreatedBy != requesterEmployeeMasterId)
                    {
                        return ApiResponseDto<int>.ErrorResponse(
                            ResponseMessages.Codes.GOAL_ACCESS_DENIED,
                            "Only goal creator can request reactivation"
                        );
                    }

                    if (!new[] { "closed", "completed" }.Contains(goal.Goalstatus?.ToLower() ?? ""))
                    {
                        return ApiResponseDto<int>.ErrorResponse(
                            ResponseMessages.Codes.GOAL_INVALID_STATUS,
                            "Only closed or completed goals can be reactivated"
                        );
                    }

                    if (requesterRole == "Leadership" && (goal.GoalType?.ToLower() == "org"))
                    {
                        var autoApproval = new GoalApproval
                        {
                            GoalId = goalId,
                            ApprovalType = "reactivation",
                            RequestedBy = requesterEmployeeMasterId,
                            RequestedOn = DateTime.UtcNow,
                            ApprovedBy = requesterEmployeeMasterId,
                            ApprovalStatus = "approved",
                            ApprovedOn = DateTime.UtcNow,
                        };

                        await _repo.AddApprovalAsync(autoApproval);
                        goal.Goalstatus = "reopened";
                        await _repo.SaveChangesAsync();

                        return ApiResponseDto<int>.SuccessResponse(
                            ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                            autoApproval.ApprovalId
                        );
                    }

                    var managerId = await _repo.GetReportingManagerEmployeeMasterIdAsync(
                        requesterEmployeeMasterId
                    );
                    if (!managerId.HasValue)
                    {
                        return ApiResponseDto<int>.ErrorResponse(
                            ResponseMessages.Codes.APPROVAL_NO_MANAGER,
                            "No manager found to approve reactivation"
                        );
                    }

                    var approval = new GoalApproval
                    {
                        GoalId = goalId,
                        ApprovalType = "reactivation",
                        RequestedBy = requesterEmployeeMasterId,
                        RequestedOn = DateTime.UtcNow,
                        ApprovedBy = managerId.Value,
                        ApprovalStatus = "pending",
                    };

                    await _repo.AddApprovalAsync(approval);
                    await _repo.SaveChangesAsync();

                    return ApiResponseDto<int>.SuccessResponse(
                        ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                        approval.ApprovalId
                    );
                }

                var approverId = dto.ApprovalType switch
                {
                    "creation" or "selfgoalactivation" or "delegation" or "task_acknowledgment" =>
                        await _repo.GetReportingManagerEmployeeMasterIdAsync(
                            requesterEmployeeMasterId
                        ),
                    _ => throw new InvalidOperationException(
                        $"Unknown approval type: {dto.ApprovalType}"
                    ),
                };

                if (!approverId.HasValue)
                {
                    return ApiResponseDto<int>.ErrorResponse(
                        ResponseMessages.Codes.APPROVAL_NO_MANAGER,
                        "Cannot submit approval: No reporting manager found"
                    );
                }

                var standardApproval = new GoalApproval
                {
                    GoalId = goalId,
                    ApprovalType = dto.ApprovalType,
                    RequestedBy = requesterEmployeeMasterId,
                    RequestedOn = DateTime.UtcNow,
                    ApprovedBy = approverId.Value,
                    ApprovalStatus = "pending",
                };

                await _repo.AddApprovalAsync(standardApproval);
                await _repo.SaveChangesAsync();

                return ApiResponseDto<int>.SuccessResponse(
                    ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                    standardApproval.ApprovalId
                );
            }
            catch (Exception ex)
            {
                return ApiResponseDto<int>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
            }
        }

        public async Task<ApiResponseDto> DecideApprovalAsync(
            int approvalId,
            DecideApprovalDto dto,
            int approverEmployeeMasterId,
            string approverRole
        )
        {
            try
            {
                var approval = await _repo.GetApprovalByIdAsync(approvalId);
                if (approval == null)
                {
                    return ApiResponseDto.ErrorResponse(ResponseMessages.Codes.APPROVAL_NOT_FOUND);
                }

                var goal = approval.Goal;

                if (!approval.ApprovedBy.HasValue)
                {
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.APPROVAL_NOT_FOUND,
                        "This approval request is malformed (no approver assigned)."
                    );
                }

                if (approval.ApprovedBy.Value != approverEmployeeMasterId)
                {
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.APPROVAL_ACCESS_DENIED,
                        $"You are not authorized to approve this request. This approval is assigned to employee ID {approval.ApprovedBy.Value}."
                    );
                }

                if (approval.ApprovalStatus != "pending")
                {
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.APPROVAL_ALREADY_DECIDED,
                        $"This approval has already been {approval.ApprovalStatus}. Decision was made on {approval.ApprovedOn:yyyy-MM-dd HH:mm}."
                    );
                }

                if (dto.Decision != "approved" && dto.Decision != "rejected")
                {
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.APPROVAL_INVALID_DECISION,
                        $"Invalid decision: '{dto.Decision}'. Must be 'approved' or 'rejected'."
                    );
                }

                approval.ApprovalStatus = dto.Decision;
                approval.ApprovedOn = DateTime.UtcNow;
                await _repo.UpdateApprovalAsync(approval);

                if (
                    approval.ApprovalType == "completion"
                    || approval.ApprovalType == "task_acknowledgment"
                )
                {
                    if (dto.Decision == "rejected")
                    {
                        await _repo.UnmarkProofAttachmentsAsync(approvalId);
                    }
                }

                if (dto.Decision == "approved")
                {
                    switch (approval.ApprovalType)
                    {
                        case "creation":
                        case "selfgoalactivation":
                            goal.Goalstatus = "open";
                            await _repo.UpdateGoalAsync(goal);
                            break;

                        case "delegation":
                            goal.Goalstatus = "open";
                            await _repo.UpdateGoalAsync(goal);
                            break;

                        case "completion":
                            var requesterRole = approval.RequestedBy.HasValue
                                ? await _repo.GetUserRoleAsync(approval.RequestedBy.Value)
                                : null;

                            bool shouldCompleteGoal = false;

                            if (goal.GoalType == "self")
                            {
                                shouldCompleteGoal = true;
                            }
                            else if (goal.GoalType == "team")
                            {
                                shouldCompleteGoal =
                                    requesterRole == "Manager"
                                    || requesterRole == "Department Head"
                                    || requesterRole == "Leadership";

                                if (shouldCompleteGoal)
                                {
                                    bool isCreator = goal.CreatedBy == approval.RequestedBy;
                                    bool isAssignedManager = await _repo.IsUserAssignedToGoalAsync(
                                        goal.GoalId,
                                        approval.RequestedBy.Value
                                    );

                                    if (!isCreator && !isAssignedManager)
                                    {
                                        shouldCompleteGoal = false;
                                    }
                                }
                            }
                            else if (goal.GoalType == "org")
                            {
                                shouldCompleteGoal = requesterRole == "Leadership";
                            }

                            if (shouldCompleteGoal)
                            {
                                goal.Goalstatus = "completed";
                                await _repo.UpdateGoalAsync(goal);
                            }
                            break;

                        case "task_acknowledgment":
                            if (approval.RequestedBy.HasValue)
                            {
                                var assignment = await _repo.GetGoalAssignmentAsync(
                                    goal.GoalId,
                                    approval.RequestedBy.Value
                                );

                                if (assignment != null)
                                {
                                    assignment.IsAcknowledged = true;
                                    assignment.AcknowledgedOn = DateTime.UtcNow;
                                    assignment.AcknowledgedBy = approverEmployeeMasterId;
                                    await _repo.UpdateGoalAssignmentAsync(assignment);

                                    Log.Information(
                                        "[DecideApproval] Employee {EmployeeId} acknowledged for goal {GoalId} by {ApproverId}",
                                        approval.RequestedBy.Value,
                                        goal.GoalId,
                                        approverEmployeeMasterId
                                    );
                                }
                            }
                            break;

                        case "reopening":
                            if (!dto.NewDeadline.HasValue)
                            {
                                return ApiResponseDto.ErrorResponse(
                                    ResponseMessages.Codes.INVALID_REQUEST,
                                    "New deadline is required to approve reopening request",
                                    new[] { "Please enter a deadline date" }
                                );
                            }

                            if (dto.NewDeadline.Value <= DateTime.UtcNow)
                            {
                                return ApiResponseDto.ErrorResponse(
                                    ResponseMessages.Codes.INVALID_REQUEST,
                                    "New deadline must be in the future",
                                    new[]
                                    {
                                        $"Deadline must be after {DateTime.UtcNow:yyyy-MM-dd HH:mm}",
                                    }
                                );
                            }

                            goal.Goalendat = dto.NewDeadline.Value;
                            goal.Goalstatus = "reopened";
                            goal.ReopenedBy = approval.RequestedBy;
                            goal.ReopenedOn = DateTime.UtcNow;
                            await _repo.UpdateGoalAsync(goal);
                            break;

                        case "closure":
                            goal.Goalstatus = "closed";
                            goal.ClosedBy = approverEmployeeMasterId;
                            goal.ClosedOn = DateTime.UtcNow;
                            await _repo.UpdateGoalAsync(goal);
                            break;

                        case "reactivation":
                            goal.Goalstatus = "open";
                            await _repo.UpdateGoalAsync(goal);
                            break;

                        default:
                            return ApiResponseDto.ErrorResponse(
                                ResponseMessages.Codes.INTERNAL_SERVER_ERROR,
                                $"Unknown approval type: {approval.ApprovalType}"
                            );
                    }
                }
                else
                {
                    switch (approval.ApprovalType)
                    {
                        case "creation":
                        case "selfgoalactivation":
                            goal.Goalstatus = "closed";
                            await _repo.UpdateGoalAsync(goal);
                            break;

                        case "delegation":
                            break;

                        case "completion":
                        case "task_acknowledgment":
                            if (!(goal.Goalstatus == "inprogress" || goal.Goalstatus == "open"))
                            {
                                goal.Goalstatus = "inprogress";
                                await _repo.UpdateGoalAsync(goal);
                            }
                            break;

                        case "reopening":
                            goal.ReopenUntil = null;
                            await _repo.UpdateGoalAsync(goal);
                            break;

                        case "closure":
                            break;

                        case "reactivation":
                            break;
                    }
                }

                await _repo.SaveChangesAsync();

                var metadata = new
                {
                    ApprovalId = approvalId,
                    GoalId = goal.GoalId,
                    Decision = dto.Decision,
                    ApprovalType = approval.ApprovalType,
                    ApprovedBy = approverEmployeeMasterId,
                    ApprovedOn = approval.ApprovedOn,
                };

                return ApiResponseDto.SuccessResponse(
                    ResponseMessages.Codes.APPROVAL_DECIDED_SUCCESS,
                    metadata
                );
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[DecideApproval] Error deciding approval {ApprovalId}", approvalId);
                return ApiResponseDto.ErrorResponse(ResponseMessages.Codes.INTERNAL_SERVER_ERROR);
            }
        }

        public async Task<ApiResponseDto> RequestClosureAsync(
            int goalId,
            CreateApprovalRequestDto dto,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            try
            {
                var goal = await _repo.GetGoalByIdAsync(goalId);
                if (goal == null)
                    return ApiResponseDto.ErrorResponse(ResponseMessages.Codes.GOAL_NOT_FOUND);

                // Only creator can request closure
                if (goal.CreatedBy != currentUserEmployeeMasterId)
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.GOAL_ACCESS_DENIED,
                        "Only the goal creator can request closure"
                    );

                // Can't close already completed/closed goals
                if (new[] { "completed", "closed", "expired" }.Contains(goal.Goalstatus?.ToLower()))
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.GOAL_INVALID_STATUS,
                        "Cannot request closure for a completed or closed goal"
                    );

                // Check for existing pending closure request
                var existingPending = await _repo.GetPendingApprovalByGoalAndTypeAsync(
                    goalId,
                    "closure"
                );
                if (existingPending != null)
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.APPROVAL_ALREADY_DECIDED,
                        "A closure request is already pending for this goal"
                    );

                // Get creator's manager
                var managerId = await _repo.GetReportingManagerEmployeeMasterIdAsync(
                    currentUserEmployeeMasterId
                );
                if (managerId == null)
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.APPROVAL_NO_MANAGER,
                        "No manager found to approve closure request"
                    );

                // Create approval request
                var approval = new GoalApproval
                {
                    GoalId = goalId,
                    ApprovalType = "closure",
                    RequestedBy = currentUserEmployeeMasterId,
                    RequestedOn = DateTime.UtcNow,
                    ApprovalStatus = "pending",
                    ApprovedBy = managerId,
                };

                await _repo.AddApprovalAsync(approval);
                await _repo.SaveChangesAsync();

                return ApiResponseDto.SuccessResponse(
                    ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                    new { approvalId = approval.ApprovalId, goalId }
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error requesting closure for goal {goalId}: {ex}");
                return ApiResponseDto.ErrorResponse(ResponseMessages.Codes.INTERNAL_SERVER_ERROR);
            }
        }

        public async Task<ApiResponseDto> RequestReactivationAsync(
            int goalId,
            CreateApprovalRequestDto dto,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            try
            {
                var goal = await _repo.GetGoalByIdAsync(goalId);
                if (goal == null)
                    return ApiResponseDto.ErrorResponse(ResponseMessages.Codes.GOAL_NOT_FOUND);

                // Only creator can request reactivation
                if (goal.CreatedBy != currentUserEmployeeMasterId)
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.GOAL_ACCESS_DENIED,
                        "Only the goal creator can request reactivation"
                    );

                // Can only reactivate closed goals
                if (goal.Goalstatus?.ToLower() != "closed")
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.GOAL_INVALID_STATUS,
                        "Only closed goals can be reactivated"
                    );

                // Check for existing pending reactivation request
                var existingPending = await _repo.GetPendingApprovalByGoalAndTypeAsync(
                    goalId,
                    "reactivation"
                );
                if (existingPending != null)
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.APPROVAL_ALREADY_DECIDED,
                        "A reactivation request is already pending for this goal"
                    );

                // Get creator's manager
                var managerId = await _repo.GetReportingManagerEmployeeMasterIdAsync(
                    currentUserEmployeeMasterId
                );
                if (managerId == null)
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.APPROVAL_NO_MANAGER,
                        "No manager found to approve reactivation request"
                    );

                // Create approval request
                var approval = new GoalApproval
                {
                    GoalId = goalId,
                    ApprovalType = "reactivation",
                    RequestedBy = currentUserEmployeeMasterId,
                    RequestedOn = DateTime.UtcNow,
                    ApprovalStatus = "pending",
                    ApprovedBy = managerId,
                };

                await _repo.AddApprovalAsync(approval);
                await _repo.SaveChangesAsync();

                return ApiResponseDto.SuccessResponse(
                    ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                    new { approvalId = approval.ApprovalId, goalId }
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error requesting reactivation for goal {goalId}: {ex}");
                return ApiResponseDto.ErrorResponse(ResponseMessages.Codes.INTERNAL_SERVER_ERROR);
            }
        }

        public async Task<List<GoalApprovalDto>> GetPendingApprovalsAsync(
            int approverEmployeeMasterId
        )
        {
            var approvals = await _repo.GetPendingApprovalsForApproverAsync(
                approverEmployeeMasterId
            );
            var result = new List<GoalApprovalDto>();

            foreach (var a in approvals)
            {
                var requesterName = await GetEmployeeNameAsync(a.RequestedBy);

                // Get ALL attachments for context
                var allAttachments = a
                    .Goal?.GoalAttachments.Select(att => new GoalAttachmentDto
                    {
                        GoalAttachmentId = att.Goalattachmentsid,
                        GoalId = att.GoalId,
                        AttachmentTitle = att.AttachmentTitle ?? "",
                        FilePath = att.Attachments ?? "",
                        AttachedByEmployeeMasterId = att.AttachedBy,
                        AttachedOn = att.AttachedOn,
                        IsProofOfCompletion = att.IsProofOfCompletion ?? true,
                        LinkedApprovalId = att.LinkedApprovalId,
                    })
                    .ToList();

                // Get PROOF attachments specifically for THIS approval
                List<GoalAttachmentDto>? proofAttachments = null;
                if (a.ApprovalType == "completion" || a.ApprovalType == "task_acknowledgment")
                {
                    proofAttachments = allAttachments
                        ?.Where(att =>
                            att.LinkedApprovalId == a.ApprovalId && att.IsProofOfCompletion
                        )
                        .ToList();
                }

                result.Add(
                    new GoalApprovalDto
                    {
                        ApprovalId = a.ApprovalId,
                        GoalId = a.GoalId,
                        GoalTitle = a.Goal?.GoalTitle ?? "",
                        ApprovalType = a.ApprovalType ?? "",
                        RequestedByEmployeeMasterId = a.RequestedBy,
                        RequestedByName = requesterName,
                        RequestedOn = a.RequestedOn,
                        ApprovalStatus = a.ApprovalStatus ?? "pending",
                        AllAttachments = allAttachments,
                        ProofAttachments = proofAttachments,
                        ReopenUntil = a.Goal?.ReopenUntil,
                    }
                );
            }

            return result;
        }

        public async Task<PagedApprovalsDto> GetUserApprovalsAsync(
            ApprovalQueryDto query,
            int userId,
            string userRole
        )
        {
            // Build the base query using SQL-translatable expressions
            var baseQuery = _repo
                .GetGoalApprovalsQueryable()
                .Where(ga =>
                    ga.RequestedBy == userId
                    || ga.ApprovedBy == userId
                    || ga.Goal.CreatedBy == userId
                    || ga.Goal.GoalAssignments.Any(assignment => assignment.AssignedTo == userId)
                );

            // Apply filters
            if (!string.IsNullOrEmpty(query.Status) && query.Status != "all")
            {
                baseQuery = baseQuery.Where(ga => ga.ApprovalStatus == query.Status);
            }

            if (!string.IsNullOrEmpty(query.Type) && query.Type != "all")
            {
                baseQuery = baseQuery.Where(ga => ga.ApprovalType == query.Type);
            }

            if (!string.IsNullOrEmpty(query.Involvement) && query.Involvement != "all")
            {
                switch (query.Involvement.ToLower())
                {
                    case "requested":
                        baseQuery = baseQuery.Where(ga => ga.RequestedBy == userId);
                        break;
                    case "reviewing":
                        baseQuery = baseQuery.Where(ga =>
                            ga.ApprovalStatus == "pending"
                            && ga.ApprovedBy == userId
                            && ga.RequestedBy != userId
                        );
                        break;
                }
            }

            if (query.RequestedAfter.HasValue)
            {
                baseQuery = baseQuery.Where(ga => ga.RequestedOn >= query.RequestedAfter.Value);
            }

            if (query.RequestedBefore.HasValue)
            {
                baseQuery = baseQuery.Where(ga => ga.RequestedOn <= query.RequestedBefore.Value);
            }

            if (query.GoalId.HasValue)
            {
                baseQuery = baseQuery.Where(ga => ga.GoalId == query.GoalId.Value);
            }

            // Apply search filter
            if (!string.IsNullOrEmpty(query.Search))
            {
                var searchTerm = query.Search.ToLower();
                baseQuery = baseQuery.Where(ga => ga.Goal.GoalTitle.ToLower().Contains(searchTerm));
            }

            // Get total count before pagination
            var totalCount = await _repo.CountAsync(baseQuery);

            // Apply pagination and ordering
            var approvals = await _repo.GetPagedAsync(
                baseQuery.OrderByDescending(ga => ga.RequestedOn),
                query.Page,
                query.PageSize
            );

            // Map to DTOs
            var approvalDtos = new List<UserGoalApprovalDto>();
            foreach (var ga in approvals)
            {
                var dto = await MapToUserGoalApprovalDto(ga, userId, userRole);
                approvalDtos.Add(dto);
            }

            // Calculate summary counts
            var summary = await CalculateApprovalSummaryOptimized(userId, userRole);

            // Calculate pagination info
            var totalPages = (int)Math.Ceiling((double)totalCount / query.PageSize);

            return new PagedApprovalsDto
            {
                Items = approvalDtos,
                TotalCount = totalCount,
                Page = query.Page,
                PageSize = query.PageSize,
                TotalPages = totalPages,
                HasNextPage = query.Page < totalPages,
                HasPreviousPage = query.Page > 1,
                Summary = summary,
            };
        }

        private async Task<ApprovalSummaryDto> CalculateApprovalSummaryOptimized(
            int userId,
            string userRole
        )
        {
            var baseQuery = _repo
                .GetGoalApprovalsQueryable()
                .Where(ga =>
                    ga.RequestedBy == userId
                    || ga.ApprovedBy == userId
                    || ga.Goal.CreatedBy == userId
                    || ga.Goal.GoalAssignments.Any(assignment => assignment.AssignedTo == userId)
                );

            var myPending = await _repo.CountAsync(
                baseQuery.Where(ga => ga.ApprovalStatus == "pending" && ga.RequestedBy == userId)
            );

            var toReview = await _repo.CountAsync(
                baseQuery.Where(ga =>
                    ga.ApprovalStatus == "pending"
                    && ga.ApprovedBy == userId
                    && ga.RequestedBy != userId
                )
            );

            var myRequests = await _repo.CountAsync(
                baseQuery.Where(ga => ga.RequestedBy == userId)
            );

            var history = await _repo.CountAsync(
                baseQuery.Where(ga => ga.ApprovalStatus != "pending")
            );

            var total = await _repo.CountAsync(baseQuery);

            return new ApprovalSummaryDto
            {
                MyPending = myPending,
                ToReview = toReview,
                MyRequests = myRequests,
                History = history,
                Total = total,
            };
        }

        private string DetermineUserRoleInApproval(
            GoalApproval approval,
            int userId,
            string userRole
        )
        {
            if (approval.RequestedBy == userId)
                return "Requester";

            if (approval.ApprovedBy == userId)
                return "Approver";

            if (approval.Goal?.CreatedBy == userId)
                return "GoalCreator";

            if (approval.Goal?.GoalAssignments?.Any(ga => ga.AssignedTo == userId) == true)
                return "GoalAssignee";

            if (
                approval.ApprovalStatus == "pending"
                && CanUserApproveTypeInMemory(approval.ApprovalType, userRole)
            )
                return "PotentialApprover";

            return "Observer";
        }

        private bool CanUserApproveTypeInMemory(string approvalType, string userRole)
        {
            return approvalType switch
            {
                "creation" or "selfgoalactivation" => new[]
                {
                    "Manager",
                    "Department Head",
                    "Leadership",
                }.Contains(userRole),
                "completion" or "task_acknowledgment" => new[]
                {
                    "Manager",
                    "Department Head",
                    "Leadership",
                }.Contains(userRole),
                "reopening" => new[] { "Manager", "Department Head", "Leadership" }.Contains(
                    userRole
                ),
                "delegation" => new[] { "Department Head", "Leadership" }.Contains(userRole),
                _ => false,
            };
        }

        private bool CanUserMakeDecision(GoalApproval approval, int userId, string userRole)
        {
            return approval.ApprovalStatus == "pending"
                && approval.ApprovedBy == userId
                && CanUserApproveTypeInMemory(approval.ApprovalType, userRole)
                && approval.RequestedBy != userId;
        }

        private async Task<UserGoalApprovalDto> MapToUserGoalApprovalDto(
            GoalApproval approval,
            int userId,
            string userRole
        )
        {
            var requesterName = await GetEmployeeNameAsync(approval.RequestedBy);
            var approverName = await GetEmployeeNameAsync(approval.ApprovedBy);
            var goalCreatorName = await GetEmployeeNameAsync(approval.Goal?.CreatedBy);

            // Get goal assignees
            var goalAssignees = new List<AssigneeDto>();
            if (approval.Goal?.GoalAssignments != null)
            {
                foreach (var assignment in approval.Goal.GoalAssignments)
                {
                    if (assignment.AssignedTo.HasValue)
                    {
                        var assigneeName = await GetEmployeeNameAsync(assignment.AssignedTo);
                        var assigneeRole = assignment.AssignedTo.HasValue
                            ? await _repo.GetUserRoleAsync(assignment.AssignedTo.Value)
                            : null;

                        goalAssignees.Add(
                            new AssigneeDto
                            {
                                EmployeeMasterId = assignment.AssignedTo.Value,
                                Name = assigneeName,
                                Role = assigneeRole,
                            }
                        );
                    }
                }
            }

            // Get attachments
            var allAttachments = new List<GoalAttachmentDto>();
            var proofAttachments = new List<GoalAttachmentDto>();

            if (approval.Goal?.GoalAttachments != null)
            {
                foreach (var att in approval.Goal.GoalAttachments)
                {
                    var attacherName = await GetEmployeeNameAsync(att.AttachedBy);

                    var attachmentDto = new GoalAttachmentDto
                    {
                        GoalAttachmentId = att.Goalattachmentsid,
                        GoalId = att.GoalId,
                        AttachmentTitle = att.AttachmentTitle ?? "",
                        FilePath = att.Attachments ?? "",
                        AttachedByEmployeeMasterId = att.AttachedBy,
                        AttachedByName = attacherName,
                        AttachedOn = att.AttachedOn,
                        IsProofOfCompletion = att.IsProofOfCompletion ?? true,
                        LinkedApprovalId = att.LinkedApprovalId,
                    };

                    allAttachments.Add(attachmentDto);

                    if (
                        att.IsProofOfCompletion
                        ?? true && att.LinkedApprovalId == approval.ApprovalId
                    )
                    {
                        proofAttachments.Add(attachmentDto);
                    }
                }
            }

            var dto = new UserGoalApprovalDto
            {
                ApprovalId = approval.ApprovalId,
                GoalId = approval.GoalId,
                GoalTitle = approval.Goal?.GoalTitle ?? "",
                ApprovalType = approval.ApprovalType ?? "",
                RequestedByEmployeeMasterId = approval.RequestedBy,
                RequestedByName = requesterName,
                RequestedOn = approval.RequestedOn,
                ApprovalStatus = approval.ApprovalStatus ?? "pending",
                ReopenUntil = approval.Goal?.ReopenUntil,

                // Approver information
                ApproverEmployeeMasterId = approval.ApprovedBy,
                ApproverName = approverName,
                ApproverRole = approval.ApprovedBy.HasValue
                    ? await _repo.GetUserRoleAsync(approval.ApprovedBy.Value)
                    : null,
                ApprovedOn = approval.ApprovedOn,

                // Goal information
                GoalCreatedByEmployeeMasterId = approval.Goal?.CreatedBy,
                GoalCreatedByName = goalCreatorName,
                GoalAssignees = goalAssignees,

                // Attachments
                AllAttachments = allAttachments,
                ProofAttachments = proofAttachments,

                // User context
                UserRole = DetermineUserRoleInApproval(approval, userId, userRole),
                CanMakeDecision = CanUserMakeDecision(approval, userId, userRole),
                UserContext = GenerateUserContext(approval, userId, userRole),
            };

            return dto;
        }

        private string GenerateUserContext(GoalApproval approval, int userId, string userRole)
        {
            var contexts = new List<string>();

            if (approval.RequestedBy == userId)
                contexts.Add("You requested this approval");

            if (approval.ApprovedBy == userId)
                contexts.Add("You approved/rejected this request");

            if (approval.Goal?.CreatedBy == userId)
                contexts.Add("You created this goal");

            if (approval.Goal?.GoalAssignments?.Any(ga => ga.AssignedTo == userId) == true)
                contexts.Add("You are assigned to this goal");

            if (
                approval.ApprovalStatus == "pending"
                && CanUserApproveTypeInMemory(approval.ApprovalType, userRole)
                && approval.RequestedBy != userId
            )
                contexts.Add("You can review this request");

            return contexts.Any() ? string.Join("; ", contexts) : "Related to your goals or team";
        }

        // ==================== CHECKLIST & PROGRESS ====================
        public async Task<ApiResponseDto> ToggleChecklistAsync(
            int goalId,
            ToggleChecklistDto dto,
            int currentUserEmployeeMasterId
        )
        {
            try
            {
                var goal = await _repo.GetGoalByIdAsync(goalId);
                if (goal == null)
                {
                    return ApiResponseDto.ErrorResponse(ResponseMessages.Codes.GOAL_NOT_FOUND);
                }

                // Check if user is acknowledged and block toggling
                var assignment = await _repo.GetGoalAssignmentAsync(
                    goalId,
                    currentUserEmployeeMasterId
                );
                if (assignment?.IsAcknowledged == true)
                {
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.CHECKLIST_LOCKED,
                        "Your tasks have been acknowledged. You cannot modify the checklist.",
                        new { IsAcknowledged = true, AcknowledgedOn = assignment.AcknowledgedOn }
                    );
                }

                var checklistItem = await _repo.GetChecklistItemAsync(dto.ChecklistId);
                if (checklistItem == null || checklistItem.GoalId != goalId)
                {
                    return ApiResponseDto.ErrorResponse(ResponseMessages.Codes.CHECKLIST_NOT_FOUND);
                }

                // Set progress
                await _repo.SetChecklistProgressAsync(
                    dto.ChecklistId,
                    currentUserEmployeeMasterId,
                    dto.IsCompleted
                );

                await _repo.SaveChangesAsync();

                // Auto-transition from "open" to "inprogress" when user starts working
                if (dto.IsCompleted && goal.Goalstatus == "open")
                {
                    goal.Goalstatus = "inprogress";
                    await _repo.UpdateGoalAsync(goal);

                    Log.Information(
                        "[ToggleChecklist] Goal {GoalId} transitioned from 'open' to 'inprogress'",
                        goalId
                    );
                }

                // Recalculate progress
                var completed = await _repo.CountCompletedForUserAsync(
                    goalId,
                    currentUserEmployeeMasterId
                );
                var total = await _repo.CountTotalForUserAsync(goalId, currentUserEmployeeMasterId);
                var percent = total == 0 ? 0 : (int)Math.Round((double)completed / total * 100);

                // Auto-revoke pending approvals if progress drops below 100%
                if (percent < 100)
                {
                    var pendingApprovals = await _repo.GetPendingApprovalsForGoalAndUserAsync(
                        goalId,
                        currentUserEmployeeMasterId,
                        new[] { "task_acknowledgment", "completion" }
                    );

                    foreach (var approval in pendingApprovals)
                    {
                        approval.ApprovalStatus = "rejected";
                    }

                    if (pendingApprovals.Any())
                    {
                        await _repo.SaveChangesAsync();

                        // Log the auto-revoke event
                        await _repo.AddProgressLogAsync(
                            new Goalprogresslog
                            {
                                GoalId = goalId,
                                UpdatedBy = currentUserEmployeeMasterId,
                                UpdatedOn = DateTime.UtcNow,
                                ProgressPercent = percent,
                                Source = "auto",
                            }
                        );
                    }
                }

                // Add progress log
                await _repo.AddProgressLogAsync(
                    new Goalprogresslog
                    {
                        GoalId = goalId,
                        UpdatedBy = currentUserEmployeeMasterId,
                        UpdatedOn = DateTime.UtcNow,
                        ProgressPercent = percent,
                        Source = "auto",
                    }
                );

                // Keep status as "inprogress" even at 100%
                // Status only changes to "completed" after approval
                if (percent == 100 && goal.Goalstatus == "open")
                {
                    goal.Goalstatus = "inprogress";
                    await _repo.UpdateGoalAsync(goal);
                }

                await _repo.SaveChangesAsync();

                var metadata = new
                {
                    GoalId = goalId,
                    ChecklistId = dto.ChecklistId,
                    IsCompleted = dto.IsCompleted,
                    NewProgress = percent,
                    UpdatedBy = currentUserEmployeeMasterId,
                    StatusChanged = goal.Goalstatus == "inprogress" && dto.IsCompleted,
                };

                return ApiResponseDto.SuccessResponse(
                    ResponseMessages.Codes.CHECKLIST_TOGGLED_SUCCESS,
                    metadata
                );
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "[ToggleChecklist] Error toggling checklist for goal {GoalId}",
                    goalId
                );
                return ApiResponseDto.ErrorResponse(ResponseMessages.Codes.INTERNAL_SERVER_ERROR);
            }
        }

        public async Task<ApiResponseDto> ManualUpdateProgressAsync(
            int goalId,
            ManualProgressUpdateDto dto,
            int currentUserEmployeeMasterId
        )
        {
            try
            {
                var goal = await _repo.GetGoalByIdAsync(goalId);
                if (goal == null)
                {
                    return ApiResponseDto.ErrorResponse(ResponseMessages.Codes.GOAL_NOT_FOUND);
                }

                var role = await _repo.GetUserRoleAsync(currentUserEmployeeMasterId);
                if (!(role == "Manager" || role == "Department Head" || role == "Leadership"))
                {
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.PROGRESS_UPDATE_DENIED,
                        "Only managers and above can manually update progress."
                    );
                }

                await _repo.AddProgressLogAsync(
                    new Goalprogresslog
                    {
                        GoalId = goalId,
                        UpdatedBy = currentUserEmployeeMasterId,
                        UpdatedOn = DateTime.UtcNow,
                        ProgressPercent = dto.ProgressPercent,
                        Source = dto.Source,
                    }
                );

                await _repo.SaveChangesAsync();

                var metadata = new
                {
                    GoalId = goalId,
                    ProgressPercent = dto.ProgressPercent,
                    Source = dto.Source,
                    UpdatedBy = currentUserEmployeeMasterId,
                };

                return ApiResponseDto.SuccessResponse(
                    ResponseMessages.Codes.GOAL_PROGRESS_UPDATED,
                    metadata
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error manually updating progress for goal {goalId}: {ex}");
                return ApiResponseDto.ErrorResponse(ResponseMessages.Codes.INTERNAL_SERVER_ERROR);
            }
        }

        public async Task<int> GetGoalProgressPercentAsync(int goalId, int forEmployeeMasterId)
        {
            var latestLog = await _repo.GetLatestProgressLogAsync(goalId);

            if (latestLog != null && latestLog.Source == "manual")
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

        public async Task<int> GetTeamGoalProgressForManagerAsync(
            int goalId,
            int managerEmployeeMasterId
        )
        {
            var goal = await _repo.GetGoalByIdAsync(goalId);
            if (goal == null)
                return 0;

            if (goal.GoalType != "team")
                return await GetGoalProgressPercentAsync(goalId, managerEmployeeMasterId);

            var assignees = await _repo.GetAssigneesAsync(goalId);
            if (!assignees.Any())
                return 0;

            var subordinates = await _repo.GetSubordinateEmployeeMasterIdsAsync(
                managerEmployeeMasterId
            );

            var relevantAssignees = assignees
                .Where(a => a.AssignedTo.HasValue && subordinates.Contains(a.AssignedTo.Value))
                .ToList();

            if (!relevantAssignees.Any())
                return 0;

            int totalProgress = 0;
            foreach (var assignee in relevantAssignees)
            {
                var progress = await GetGoalProgressPercentAsync(
                    goalId,
                    assignee.AssignedTo!.Value
                );
                totalProgress += progress;
            }

            return totalProgress / relevantAssignees.Count;
        }

        // ==================== CASCADING PROGRESS ====================

        public async Task<int> GetCascadingProgressAsync(int goalId, int userId)
        {
            var goal = await _repo.GetGoalByIdAsync(goalId);
            if (goal == null)
                throw new KeyNotFoundException("Goal not found");

            var ownProgress = await CalculateUserOwnProgressAsync(goalId, userId);
            var subordinates = await _repo.GetSubordinatesAssignedToGoalAsync(goalId, userId);

            if (!subordinates.Any())
            {
                return ownProgress;
            }

            var subordinateProgressList = new List<int>();
            foreach (var subId in subordinates)
            {
                var subProgress = await GetCascadingProgressAsync(goalId, subId);
                subordinateProgressList.Add(subProgress);
            }

            var teamProgress = subordinateProgressList.Any()
                ? (int)subordinateProgressList.Average()
                : 0;
            var userRole = await _repo.GetUserRoleAsync(userId);
            var (ownWeight, teamWeight) = GetWeightsForRole(userRole);

            var cascadingProgress = (ownProgress * ownWeight + teamProgress * teamWeight) / 100;
            return cascadingProgress;
        }

        public async Task<GoalProgressHierarchyDto> GetProgressHierarchyAsync(
            int goalId,
            int userId
        )
        {
            var user = await _repo.GetEmployeeDetailsByMasterIdAsync(userId);
            if (user == null)
                throw new KeyNotFoundException("User not found");

            var goal = await _repo.GetGoalByIdAsync(goalId);
            if (goal == null)
                throw new KeyNotFoundException("Goal not found");

            var ownProgress = await CalculateUserOwnProgressAsync(goalId, userId);
            var ownItems = await _repo.GetUserOwnChecklistItemsAsync(goalId, userId);
            var ownItemsCompleted = await _repo.CountUserOwnCompletedItemsAsync(goalId, userId);

            var subordinateIds = await _repo.GetSubordinatesAssignedToGoalAsync(goalId, userId);
            var subordinateDetails = new List<SubordinateProgressDto>();
            int? teamProgress = null;

            if (subordinateIds.Any())
            {
                var subordinateProgressList = new List<int>();

                foreach (var subId in subordinateIds)
                {
                    var subUser = await _repo.GetEmployeeDetailsByMasterIdAsync(subId);

                    if (subUser != null)
                    {
                        var subProgress = await GetCascadingProgressAsync(goalId, subId);
                        subordinateProgressList.Add(subProgress);

                        var subItems = await _repo.GetUserOwnChecklistItemsAsync(goalId, subId);
                        var subItemsCompleted = await _repo.CountUserOwnCompletedItemsAsync(
                            goalId,
                            subId
                        );

                        subordinateDetails.Add(
                            new SubordinateProgressDto
                            {
                                UserId = subId,
                                UserName =
                                    $"{subUser.Employee.Userprofile.FirstName} {subUser.Employee.Userprofile.LastName}",
                                Role = subUser.Role.RoleName,
                                Progress = subProgress,
                                ItemCount = subItems.Count,
                                ItemsCompleted = subItemsCompleted,
                            }
                        );
                    }
                }

                teamProgress = subordinateProgressList.Any()
                    ? (int)subordinateProgressList.Average()
                    : 0;
            }

            var userRole = await _repo.GetUserRoleAsync(userId);
            var (ownWeight, teamWeight) = GetWeightsForRole(userRole);

            int cascadingProgress;
            if (teamProgress.HasValue)
            {
                cascadingProgress =
                    (ownProgress * ownWeight + teamProgress.Value * teamWeight) / 100;
            }
            else
            {
                cascadingProgress = ownProgress;
                ownWeight = 100;
                teamWeight = 0;
            }

            return new GoalProgressHierarchyDto
            {
                GoalId = goalId,
                UserId = userId,
                UserName =
                    $"{user.Employee.Userprofile.FirstName} {user.Employee.Userprofile.LastName}",
                Role = user.Role.RoleName,
                OwnProgress = ownProgress,
                TeamProgress = teamProgress,
                CascadingProgress = cascadingProgress,
                OwnWeight = ownWeight,
                TeamWeight = teamWeight,
                OwnItemCount = ownItems.Count,
                OwnItemsCompleted = ownItemsCompleted,
                Subordinates = subordinateDetails,
            };
        }

        private async Task<int> CalculateUserOwnProgressAsync(int goalId, int userId)
        {
            var userItems = await _repo.GetUserOwnChecklistItemsAsync(goalId, userId);

            if (!userItems.Any())
                return 0;

            var completedCount = await _repo.CountUserOwnCompletedItemsAsync(goalId, userId);
            return (int)Math.Round((double)completedCount / userItems.Count * 100);
        }

        private (int ownWeight, int teamWeight) GetWeightsForRole(string? role)
        {
            if (string.IsNullOrWhiteSpace(role))
                return (50, 50);

            var normalized = role.Trim().ToLower().Replace(" ", "");

            return normalized switch
            {
                "employee" => (100, 0),
                "manager" => (50, 50),
                "Department Head" => (30, 70),
                "Leadership" => (20, 80),
                _ => (50, 50),
            };
        }

        // ==================== ATTACHMENTS ====================
        public async Task<List<GoalAttachment>> ListAttachmentsAsync(int goalId) =>
            await _repo.GetAttachmentsByGoalAsync(goalId);

        public async Task<GoalAttachment> GetAttachmentAsync(int attachmentId)
        {
            var attachment = await _repo.GetAttachmentByIdAsync(attachmentId);
            if (attachment == null)
                throw new KeyNotFoundException("Attachment not found");
            return attachment;
        }

        // ==================== COMMENTS ====================
        public async Task<ApiResponseDto> AddCommentAsync(
            int goalId,
            CreateCommentDto dto,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            try
            {
                var goal = await _repo.GetGoalByIdAsync(goalId);
                if (goal == null)
                {
                    return ApiResponseDto.ErrorResponse(ResponseMessages.Codes.GOAL_NOT_FOUND);
                }

                // NEW CODE:
                // Check if user can comment
                var canComment = await CanUserCommentOnGoalAsync(
                    goalId,
                    currentUserEmployeeMasterId,
                    currentUserRole
                );
                if (!canComment)
                {
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.COMMENT_ACCESS_DENIED,
                        "You do not have permission to comment on this goal"
                    );
                }

                // Check if goal is commentable (not completed/closed)
                // Check if goal is commentable (not completed/closed)
                var isCommentable = await IsGoalCommentableAsync(goalId);
                if (!isCommentable)
                {
                    Log.Warning("[AddCommentAsync] Goal {GoalId} is not commentable", goalId);
                    return ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.GOAL_COMMENT_BLOCKED,
                        "Cannot comment on completed or closed goals"
                    );
                }

                var comment = new GoalComment
                {
                    GoalId = goalId,
                    GoalComment1 = dto.Comment,
                    CommentedBy = currentUserEmployeeMasterId,
                    CommentedOn = DateTime.UtcNow,
                };
                await _repo.AddCommentAsync(comment);
                await _repo.SaveChangesAsync();

                var metadata = new
                {
                    GoalId = goalId,
                    CommentId = comment.Goalcommentid,
                    CommentedBy = currentUserEmployeeMasterId,
                };

                return ApiResponseDto.SuccessResponse(
                    ResponseMessages.Codes.COMMENT_ADDED_SUCCESS,
                    metadata
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error adding comment to goal {goalId}: {ex}");
                return ApiResponseDto.ErrorResponse(ResponseMessages.Codes.INTERNAL_SERVER_ERROR);
            }
        }

        public async Task<List<GoalCommentDto>> ListCommentsAsync(int goalId)
        {
            var comments = await _repo.GetCommentsByGoalAsync(goalId);
            var result = new List<GoalCommentDto>();

            foreach (var c in comments)
            {
                var commenterName = await GetEmployeeNameAsync(c.CommentedBy);
                var commenterRole = c.CommentedBy.HasValue
                    ? await _repo.GetUserRoleAsync(c.CommentedBy.Value)
                    : null;

                result.Add(
                    new GoalCommentDto
                    {
                        GoalCommentId = c.Goalcommentid,
                        GoalId = c.GoalId,
                        Comment = c.GoalComment1 ?? "",
                        CommentedByEmployeeMasterId = c.CommentedBy,
                        CommentedByName = commenterName,
                        CommentedByRole = commenterRole,
                        CommentedOn = c.CommentedOn,
                    }
                );
            }

            return result;
        }

        // ==================== DASHBOARD ====================
        public async Task<GoalDashboardSummaryDto> GetDashboardSummaryAsync(
            int currentUserEmployeeMasterId
        )
        {
            var completed = await _repo.QueryGoalsAsync(
                currentUserEmployeeMasterId,
                null,
                "completed",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                1,
                1_000_000
            );

            var all = await _repo.QueryGoalsAsync(
                currentUserEmployeeMasterId,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                1,
                1_000_000
            );

            var pending = all.Where(g => g.Goalstatus == "pending").ToList();
            var ongoing = all.Where(g =>
                    g.Goalstatus == "open"
                    || g.Goalstatus == "inprogress"
                    || g.Goalstatus == "reopened"
                )
                .ToList();
            var overdue = all.Where(g =>
                    g.Goalendat.HasValue
                    && g.Goalendat.Value < DateTime.UtcNow
                    && g.Goalstatus != "completed"
                    && g.Goalstatus != "closed"
                )
                .ToList();

            var pendingApprovals = await _repo.CountPendingApprovalsForUserAsync(
                currentUserEmployeeMasterId
            );

            return new GoalDashboardSummaryDto
            {
                Completed = completed.Count,
                Ongoing = ongoing.Count,
                Pending = pending.Count,
                Overdue = overdue.Count,
                PendingApprovals = pendingApprovals,
            };
        }

        public async Task<List<GoalSummaryDto>> GetOngoingAsync(
            string type,
            int currentUserEmployeeMasterId
        )
        {
            var goals = await _repo.QueryGoalsAsync(
                currentUserEmployeeMasterId,
                type,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                1,
                1_000_000
            );

            var ongoing = goals
                .Where(g =>
                    g.Goalstatus == "open"
                    || g.Goalstatus == "inprogress"
                    || g.Goalstatus == "reopened"
                )
                .ToList();

            var result = new List<GoalSummaryDto>();
            foreach (var g in ongoing)
            {
                var latestProgress = g
                    .Goalprogresslogs.OrderByDescending(p => p.UpdatedOn)
                    .FirstOrDefault();
                var isOverdue =
                    g.Goalendat.HasValue
                    && g.Goalendat.Value < DateTime.UtcNow
                    && g.Goalstatus != "completed";

                string? projectName = null;
                if (g.ProjectId.HasValue)
                {
                    var project = await _repo.GetProjectByIdAsync(g.ProjectId.Value);
                    projectName = project?.ProjectName;
                }

                var creatorName = await GetEmployeeNameAsync(g.CreatedBy);

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
                        GoalType = g.GoalType ?? "self",
                        Status = g.Goalstatus ?? "pending",
                        CreatedAt = g.Goalcreatedat,
                        EndAt = g.Goalendat,
                        ProgressPercent = latestProgress?.ProgressPercent ?? 0,
                        ProjectId = g.ProjectId,
                        ProjectName = projectName,
                        CreatedByEmployeeMasterId = g.CreatedBy,
                        CreatedByName = creatorName,
                        IsOverdue = isOverdue,
                    }
                );
            }

            return result;
        }

        // ==================== TIMELINE ====================
        public async Task<List<TimelineEventDto>> GetGoalTimelineAsync(
            int goalId,
            int currentUserEmployeeMasterId
        )
        {
            var goal = await _repo.GetGoalByIdAsync(goalId);
            if (goal == null)
                throw new KeyNotFoundException("Goal not found");

            var canView = await CanViewGoalAsync(goalId, currentUserEmployeeMasterId);
            if (!canView)
                throw new UnauthorizedAccessException("You cannot view this goal's timeline.");

            var events = new List<TimelineEventDto>();

            // Goal creation
            events.Add(
                new TimelineEventDto
                {
                    Type = "creation",
                    Timestamp = goal.Goalcreatedat ?? DateTime.UtcNow,
                    Description = "Goal created",
                    UserId = goal.CreatedBy,
                    UserName = await GetEmployeeNameAsync(goal.CreatedBy),
                    UserRole = goal.CreatedBy.HasValue
                        ? await _repo.GetUserRoleAsync(goal.CreatedBy.Value)
                        : null,
                }
            );

            // Progress logs
            var progressLogs = await _repo.GetProgressLogsByGoalAsync(goalId);
            foreach (var p in progressLogs)
            {
                events.Add(
                    new TimelineEventDto
                    {
                        Type = "progress",
                        Timestamp = p.UpdatedOn ?? DateTime.UtcNow,
                        Description = $"Progress updated to {p.ProgressPercent}%",
                        UserId = p.UpdatedBy,
                        UserName = await GetEmployeeNameAsync(p.UpdatedBy),
                        UserRole = p.UpdatedBy.HasValue
                            ? await _repo.GetUserRoleAsync(p.UpdatedBy.Value)
                            : null,
                        Metadata = new { ProgressPercent = p.ProgressPercent, Source = p.Source },
                    }
                );
            }

            // Approvals
            foreach (var a in goal.GoalApprovals)
            {
                string requestDescription = a.ApprovalType switch
                {
                    "task_acknowledgment" => "Task acknowledgment requested",
                    "completion" => "Completion approval requested",
                    "creation" => "Creation approval requested",
                    "delegation" => "Delegation approval requested",
                    "selfgoalactivation" => "Self goal activation requested",
                    "reopening" => "Reopen approval requested",
                    "closure" => "Goal Closure requested",
                    "reactivation" => "Goal Reactivation requested",
                    _ => $"{a.ApprovalType} requested",
                };

                events.Add(
                    new TimelineEventDto
                    {
                        Type = "approval",
                        Timestamp = a.RequestedOn ?? DateTime.UtcNow,
                        Description = requestDescription,
                        UserId = a.RequestedBy,
                        UserName = await GetEmployeeNameAsync(a.RequestedBy),
                        UserRole = a.RequestedBy.HasValue
                            ? await _repo.GetUserRoleAsync(a.RequestedBy.Value)
                            : null,
                        Metadata = new { ApprovalType = a.ApprovalType, Status = a.ApprovalStatus },
                    }
                );

                if (a.ApprovedOn.HasValue)
                {
                    string decisionDescription = a.ApprovalType switch
                    {
                        "task_acknowledgment" => $"Task acknowledgment {a.ApprovalStatus}",
                        "completion" => $"Completion {a.ApprovalStatus}",
                        "creation" => $"Creation {a.ApprovalStatus}",
                        "delegation" => $"Delegation {a.ApprovalStatus}",
                        "selfgoalactivation" => $"Self goal activation {a.ApprovalStatus}",
                        "reopening" => $"Reopen request {a.ApprovalStatus}",
                        "closure" => $"Closure request {a.ApprovalStatus}",
                        "reactivation" => $"Reactivation request {a.ApprovalStatus}",
                        _ => $"{a.ApprovalType} {a.ApprovalStatus}",
                    };

                    events.Add(
                        new TimelineEventDto
                        {
                            Type = "approval",
                            Timestamp = a.ApprovedOn.Value,
                            Description = decisionDescription,
                            UserId = a.ApprovedBy,
                            UserName = await GetEmployeeNameAsync(a.ApprovedBy),
                            UserRole = a.ApprovedBy.HasValue
                                ? await _repo.GetUserRoleAsync(a.ApprovedBy.Value)
                                : null,
                            Metadata = new
                            {
                                ApprovalType = a.ApprovalType,
                                Status = a.ApprovalStatus,
                            },
                        }
                    );
                }
            }

            // Comments
            foreach (var c in goal.GoalComments)
            {
                events.Add(
                    new TimelineEventDto
                    {
                        Type = "comment",
                        Timestamp = c.CommentedOn ?? DateTime.UtcNow,
                        Description = "Comment added",
                        UserId = c.CommentedBy,
                        UserName = await GetEmployeeNameAsync(c.CommentedBy),
                        UserRole = c.CommentedBy.HasValue
                            ? await _repo.GetUserRoleAsync(c.CommentedBy.Value)
                            : null,
                        Metadata = new { Comment = c.GoalComment1 },
                    }
                );
            }

            // Assignments
            foreach (var a in goal.GoalAssignments)
            {
                events.Add(
                    new TimelineEventDto
                    {
                        Type = "assignment",
                        Timestamp = a.AssignedOn ?? DateTime.UtcNow,
                        Description = $"Assigned to {await GetEmployeeNameAsync(a.AssignedTo)}",
                        UserId = a.AssignedBy,
                        UserName = await GetEmployeeNameAsync(a.AssignedBy),
                        UserRole = a.AssignedBy.HasValue
                            ? await _repo.GetUserRoleAsync(a.AssignedBy.Value)
                            : null,
                    }
                );
            }

            // Attachments
            foreach (var att in goal.GoalAttachments)
            {
                events.Add(
                    new TimelineEventDto
                    {
                        Type = "attachment",
                        Timestamp = att.AttachedOn ?? DateTime.UtcNow,
                        Description = $"Attachment added: {att.AttachmentTitle}",
                        UserId = att.AttachedBy,
                        UserName = await GetEmployeeNameAsync(att.AttachedBy),
                        UserRole = att.AttachedBy.HasValue
                            ? await _repo.GetUserRoleAsync(att.AttachedBy.Value)
                            : null,
                    }
                );
            }

            return events.OrderByDescending(e => e.Timestamp).ToList();
        }

        // ==================== PERMISSIONS & VALIDATION ====================
        public async Task<bool> CanMarkCompleteAsync(int goalId, int employeeMasterId)
        {
            var goal = await _repo.GetGoalByIdAsync(goalId);
            if (goal == null)
                return false;

            bool isParticipant = await _repo.IsGoalParticipantAsync(goalId, employeeMasterId);
            if (!isParticipant)
                return false;

            if (goal.Goalstatus != "open" && goal.Goalstatus != "inprogress")
                return false;

            var progress = await GetGoalProgressPercentAsync(goalId, employeeMasterId);
            if (progress < 100)
                return false;

            if (
                goal.Goalendat.HasValue
                && goal.Goalendat.Value < DateTime.UtcNow
                && goal.Goalstatus != "reopened"
            )
            {
                return false;
            }

            return true;
        }

        public async Task<bool> CanViewGoalAsync(int goalId, int employeeMasterId)
        {
            var goal = await _repo.GetGoalByIdAsync(goalId);
            if (goal == null)
                return false;

            // Get user role
            var userRole = await _repo.GetUserRoleAsync(employeeMasterId);

            // Leadership can view ANY goal
            if (userRole == "Leadership")
                return true;

            // Org goals visible to everyone
            if (goal.GoalType == "org")
                return true;

            // Creator can always view
            if (goal.CreatedBy == employeeMasterId)
                return true;

            // Assignees can view
            if (await _repo.IsUserAssignedToGoalAsync(goalId, employeeMasterId))
                return true;

            // Reporting managers can view their subordinates' self goals
            if (goal.GoalType == "self" && goal.CreatedBy.HasValue)
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
            if (userRole == "Department Head" && goal.GoalType == "team")
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
            if (goal.GoalType == "team" && goal.CreatedBy.HasValue)
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

        // ADD THIS METHOD to GoalModuleService.cs
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
            var isLeadership = currentUserRole == "Leadership";

            switch (goal.GoalType?.ToLower())
            {
                case "self":
                    // Self goals: Only creator and their manager can comment
                    if (isCreator)
                        return true;

                    // Check if user is the creator's manager
                    var creatorManagerId = await _repo.GetReportingManagerEmployeeMasterIdAsync(
                        goal.CreatedBy ?? 0
                    );
                    return creatorManagerId == currentUserEmployeeMasterId;

                case "team":
                    // Team goals: Creator, assignees, and managers can comment
                    if (isCreator || isAssignee)
                        return true;

                    // Check if user is a manager/dept head/leadership
                    if (
                        new[] { "Manager", "Department Head", "Leadership" }.Contains(
                            currentUserRole
                        )
                    )
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

                case "org":
                    // Org goals: Only creator and Leadership can comment
                    return isCreator || isLeadership;

                default:
                    return false;
            }
        }

        // ADD THESE 2 METHODS RIGHT AFTER CanCommentOnGoalAsync

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

                // Use repo method to check permission
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

                // Use repo method to check if goal is commentable
                var isCommentable = await _repo.IsGoalCommentableAsync(goalId);
                return isCommentable;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[IsGoalCommentableAsync] Error checking if commentable");
                return false;
            }
        }
    }
}
