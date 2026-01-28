using FluentValidation;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Exceptions;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Data.Repository.Interface;

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
            IValidator<GoalQueryModel> goalQueryValidator
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
        }

        public async Task<ApiResponseModel<int>> CreateGoalAsync(
            CreateGoalModel dto,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            var validationResult = await _createGoalValidator.ValidateAsync(dto);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                throw new BadRequestException("VALIDATION_FAILED", string.Join("; ", errors));
            }

            if (!_baseService.CanCreate(currentUserRole, dto.GoalType))
            {
                throw new ForbiddenException(
                    ResponseMessages.Codes.ROLE_INSUFFICIENT,
                    $"Role '{currentUserRole}' not permitted to create '{dto.GoalType}' goals."
                );
            }

            var validChecklistItems = dto
                .Checklist.Where(c => !string.IsNullOrWhiteSpace(c.Title))
                .ToList();

            if (dto.GoalType == GOAL_TYPE.SELF)
            {
                foreach (var item in validChecklistItems)
                {
                    item.AddedForEmployeeMasterId = currentUserEmployeeMasterId;
                }
            }

            if (dto.ProjectId.HasValue && dto.ProjectId.Value > 0)
            {
                var isInProject = await _repo.IsEmployeeInProjectAsync(
                    currentUserEmployeeMasterId,
                    dto.ProjectId.Value
                );

                if (!isInProject)
                {
                    throw new ForbiddenException(
                        ResponseMessages.Codes.PROJECT_NOT_MEMBER,
                        "You are not a member of the selected project."
                    );
                }
            }

            if (dto.GoalType == GOAL_TYPE.SELF)
            {
                if (
                    dto.AssignedToEmployeeMasterIds.Count != 1
                    || dto.AssignedToEmployeeMasterIds[0] != currentUserEmployeeMasterId
                )
                {
                    dto.AssignedToEmployeeMasterIds = new List<int> { currentUserEmployeeMasterId };
                }
            }

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
                    throw new BusinessRuleException(
                        ResponseMessages.Codes.GOAL_ASSIGNEE_INVALID,
                        $"Invalid assignees: {string.Join(", ", invalidAssignments)}. You can only assign goals to your direct subordinates."
                    );
                }
            }

            var goalId = await CreateGoalInternalAsync(
                dto,
                currentUserEmployeeMasterId,
                currentUserRole,
                validChecklistItems
            );

            var metadata = new
            {
                GoalId = goalId,
                GoalType = dto.GoalType,
                RequiresApproval = currentUserRole != USER_ROLE.LEADERSHIP,
                AssigneeCount = dto.AssignedToEmployeeMasterIds?.Count ?? 0,
                ChecklistItemCount = validChecklistItems.Count,
            };

            return ApiResponseModel<int>.SuccessResponse(
                ResponseMessages.Codes.GOAL_CREATED_SUCCESS,
                goalId,
                metadata
            );
        }


        private async Task<int> CreateGoalInternalAsync(
            CreateGoalModel dto,
            int currentUserEmployeeMasterId,
            string currentUserRole,
            List<ChecklistItemModel> validChecklistItems
        )
        {
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

        public async Task<List<GoalSummaryModel>> QueryGoalsAsync(
            GoalQueryModel query,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            var validationResult = await _goalQueryValidator.ValidateAsync(query);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                throw new BadRequestException("VALIDATION_FAILED", string.Join("; ", errors));
            }

            var goals = await _repo.QueryGoalsAsync(
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

            foreach (var g in goals)
            {
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

                var hasPendingApproval = g.GoalApprovals.Any(a =>
                    a.RequestedBy == currentUserEmployeeMasterId
                    && a.ApprovalType == APPROVAL_TYPE.TASK_ACKNOWLEDGMENT
                    && a.ApprovalStatus == APPROVAL_STATUS.PENDING
                );

                var isAcknowledged = g
                    .GoalAssignments.Where(a => a.AssignedTo == currentUserEmployeeMasterId)
                    .Any(a => a.IsAcknowledged == true);

                var assignees = new List<AssigneeModel>();
                if (g.GoalType == GOAL_TYPE.TEAM)
                {
                    assignees = await GetAssigneesWithDetailsAsync(g.GoalId);
                }

                result.Add(
                    new GoalSummaryModel
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

            return result;
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
                var hasProgress = await _baseRepo.ChecklistHasProgressAsync(
                    item.ChecklistId,
                    userId
                );
                if (hasProgress)
                {
                    completedCount++;
                }
            }

            return (int)Math.Round((double)completedCount / userItems.Count * 100);
        }

        public async Task<ApiResponseModel> UpdateGoalAsync(
            int goalId,
            UpdateGoalModel dto,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            var validationResult = await _updateGoalValidator.ValidateAsync(dto);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                throw new BadRequestException("VALIDATION_FAILED", string.Join("; ", errors));
            }

            var goal = await _baseRepo.GetGoalByIdAsync(goalId);
            if (goal == null)
            {
                throw new GoalNotFoundException(goalId);
            }

            if (goal.GoalType == GOAL_TYPE.ORG && currentUserRole != USER_ROLE.LEADERSHIP)
            {
                throw new GoalAccessDeniedException();
            }

            if (goal.GoalType != GOAL_TYPE.ORG && goal.CreatedBy != currentUserEmployeeMasterId)
            {
                throw new GoalAccessDeniedException();
            }

            if (dto.Checklist != null && dto.Checklist.Any())
            {
                var existingChecklists = await _baseRepo.GetChecklistItemsByGoalIdAsync(goalId);

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

                foreach (var existingItem in existingChecklists)
                {
                    if (completedChecklistIds.Contains(existingItem.ChecklistId))
                    {
                        continue;
                    }

                    await _repo.DeleteChecklistItemAsync(existingItem.ChecklistId);
                }

                foreach (var dtoItem in dto.Checklist)
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
                    await _repo.AddChecklistItemAsync(newItem);
                }

                await RecalculateProgressAsync(goalId, currentUserEmployeeMasterId);
            }

            if (!string.IsNullOrWhiteSpace(dto.Title))
                goal.GoalTitle = dto.Title;
            if (dto.Description != null)
                goal.GoalDescription = dto.Description;
            if (dto.Deadline.HasValue)
                goal.Goalendat = dto.Deadline;

            await _repo.UpdateGoalAsync(goal);
            await _baseRepo.SaveChangesAsync();

            var metadata = new { GoalId = goalId, UpdatedBy = currentUserEmployeeMasterId };

            return ApiResponseModel.SuccessResponse(
                ResponseMessages.Codes.GOAL_UPDATED_SUCCESS,
                metadata
            );
        }

        private async Task RecalculateProgressAsync(int goalId, int userId)
        {
            var goal = await _baseRepo.GetGoalByIdAsync(goalId);
            if (goal == null)
                return;

            var checklists = await _baseRepo.GetChecklistItemsByGoalIdAsync(goalId);

            if (checklists == null || !checklists.Any())
            {
                await _repo.UpdateGoalProgressAsync(goalId, 0, userId);
                return;
            }

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

            var newProgress = totalItems > 0 ? (decimal)completedCount / totalItems * 100 : 0;

            await _repo.UpdateGoalProgressAsync(goalId, newProgress, userId);

            if (newProgress < 100 && goal.Goalstatus == GOAL_STATUS.COMPLETED)
            {
                goal.Goalstatus = GOAL_STATUS.IN_PROGRESS;
                await _repo.UpdateGoalAsync(goal);
            }
        }

        public async Task<List<AssigneeModel>> GetAssigneesAsync(int goalId)
        {
            return await GetAssigneesWithDetailsAsync(goalId);
        }

        private async Task<List<AssigneeModel>> GetAssigneesWithDetailsAsync(int goalId)
        {
            var assignments = await _baseRepo.GetAssigneesAsync(goalId);
            var result = new List<AssigneeModel>();

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

        public async Task<ApiResponseModel> AssignAsync(
            int goalId,
            AssignGoalModel dto,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            var validationResult = await _assignGoalValidator.ValidateAsync(dto);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                throw new BadRequestException("VALIDATION_FAILED", string.Join("; ", errors));
            }

            var goal = await _baseRepo.GetGoalByIdAsync(goalId);
            if (goal == null)
            {
                throw new GoalNotFoundException(goalId);
            }

            if (goal.GoalType != GOAL_TYPE.TEAM)
            {
                throw new AccessDeniedException(
                    ResponseMessages.Codes.ASSIGNMENT_ACCESS_DENIED,
                    "Only team goals support delegation."
                );
            }

            if (!USER_ROLE.CanAssignGoals(currentUserRole))
            {
                throw new AccessDeniedException(
                    ResponseMessages.Codes.ASSIGNMENT_ACCESS_DENIED,
                    "Only managers/dept heads can assign goals."
                );
            }

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
                throw new AccessDeniedException(
                    ResponseMessages.Codes.ASSIGNMENT_ACCESS_DENIED,
                    "Only the goal creator or assigned participants can delegate this goal."
                );
            }

            var subordinates = await _baseRepo.GetSubordinateEmployeeMasterIdsAsync(
                currentUserEmployeeMasterId
            );
            var invalidAssignments = dto.AssignedToEmployeeMasterIds.Except(subordinates).ToList();
            if (invalidAssignments.Any())
            {
                throw new BusinessRuleException(
                    ResponseMessages.Codes.ASSIGNMENT_INVALID_SUBORDINATE,
                    $"Invalid assignees: {string.Join(", ", invalidAssignments)}. You can only assign goals to your direct subordinates."
                );
            }

            var duplicateAssignees = dto
                .AssignedToEmployeeMasterIds.Intersect(existingAssigneeIds)
                .ToList();

            if (duplicateAssignees.Any())
            {
                throw new ConflictException(
                    ResponseMessages.Codes.ASSIGNMENT_DUPLICATE,
                    $"The following users are already assigned to this goal: {string.Join(", ", duplicateAssignees)}"
                );
            }

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

            return ApiResponseModel.SuccessResponse(
                ResponseMessages.Codes.ASSIGNMENT_SUCCESS,
                metadata
            );
        }

        public async Task<List<ProjectModel>> GetUserProjectsAsync(int employeeMasterId)
        {
            var userRole = await _baseRepo.GetUserRoleAsync(employeeMasterId);

            if (userRole == USER_ROLE.LEADERSHIP)
            {
                var allProjects = await _repo.GetAllProjectsAsync();
                return allProjects
                    .Select(p => new ProjectModel
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

            var employeeDetails = await _baseRepo.GetEmployeeDetailsByMasterIdAsync(
                employeeMasterId
            );
            if (employeeDetails == null)
            {
                return new List<ProjectModel>();
            }

            var employeeId = employeeDetails.EmployeeId;

            var userProjects = await _repo.GetUserProjectsByEmployeeIdAsync(employeeId);

            return userProjects
                .Select(p => new ProjectModel
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

        public async Task<List<ProjectModel>> GetAllProjectsAsync()
        {
            var allProjects = await _repo.GetAllProjectsAsync();
            return allProjects
                .Select(p => new ProjectModel
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

        public async Task<ProjectModel> GetProjectAsync(int projectId)
        {
            var project = await _repo.GetProjectAsync(projectId);
            if (project == null)
                throw new ProjectNotFoundException(projectId);

            var employees = await _interactionRepo.GetProjectEmployeesAsync(projectId);

            return new ProjectModel
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
