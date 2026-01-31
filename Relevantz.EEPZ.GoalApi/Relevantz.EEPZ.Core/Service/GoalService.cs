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
        }

        public async Task<ApiResponseModel<int>> CreateGoal(
            CreateGoalModel goal,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            var validationResult = await _createGoalValidator.ValidateAsync(goal);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                throw new BadRequestException("VALIDATION_FAILED", string.Join("; ", errors));
            }

            if (!_baseService.CanCreate(currentUserRole, goal.GoalType))
            {
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
            return goal.GoalId;
        }

        public async Task<List<GoalSummaryModel>> QueryGoals(
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

            return result;
        }

        private async Task<int> CalculatePersonalProgress(int goalId, int userId)
        {
            var goal = await _baseRepo.GetGoalById(goalId);
            if (goal == null)
                return 0;

            var userItems = goal.GoalChecklists.Where(c => c.AddedFor == userId).ToList();

            if (!userItems.Any())
                return 0;

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

            return (int)Math.Round((double)completedCount / userItems.Count * 100);
        }

        public async Task<ApiResponseModel> UpdateGoal(
            int goalId,
            UpdateGoalModel goalDetails,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            var validationResult = await _updateGoalValidator.ValidateAsync(goalDetails);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                throw new BadRequestException("VALIDATION_FAILED", string.Join("; ", errors));
            }

            var goal = await _baseRepo.GetGoalById(goalId);
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

            return ApiResponseModel.SuccessResponse(
                ResponseMessages.Codes.GOAL_UPDATED_SUCCESS,
                metadata
            );
        }

        private async Task RecalculateProgress(int goalId, int userId)
        {
            var goal = await _baseRepo.GetGoalById(goalId);
            if (goal == null)
                return;

            var checklists = await _baseRepo.GetChecklistItemsByGoalId(goalId);

            if (checklists == null || !checklists.Any())
            {
                await _repo.UpdateGoalProgress(goalId, 0, userId);
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
            }
        }

        public async Task<List<AssigneeModel>> GetAssignees(int goalId)
        {
            return await GetAssigneesWithDetails(goalId);
        }

        private async Task<List<AssigneeModel>> GetAssigneesWithDetails(int goalId)
        {
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

            return result;
        }

        public async Task<ApiResponseModel> Assign(
            int goalId,
            AssignGoalModel assignmentDetails,
            int currentUserEmployeeMasterId,
            string currentUserRole
        )
        {
            var validationResult = await _assignGoalValidator.ValidateAsync(assignmentDetails);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                throw new BadRequestException("VALIDATION_FAILED", string.Join("; ", errors));
            }

            var goal = await _baseRepo.GetGoalById(goalId);
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

            return ApiResponseModel.SuccessResponse(
                ResponseMessages.Codes.ASSIGNMENT_SUCCESS,
                metadata
            );
        }

        public async Task<List<ProjectModel>> GetUserProjects(int employeeMasterId)
        {
            var userRole = await _baseRepo.GetUserRole(employeeMasterId);

            if (userRole == USER_ROLE.LEADERSHIP)
            {
                var allProjects = await _repo.GetAllProjects();
                return _mapper.Map<List<ProjectModel>>(allProjects);
            }

            var employeeDetails = await _baseRepo.GetEmployeeDetailsByMasterId(
                employeeMasterId
            );
            if (employeeDetails == null)
            {
                return new List<ProjectModel>();
            }

            var employeeId = employeeDetails.EmployeeId;
            var userProjects = await _repo.GetUserProjectsByEmployeeId(employeeId);

            return _mapper.Map<List<ProjectModel>>(userProjects);
        }

        public async Task<List<ProjectModel>> GetAllProjects()
        {
            var allProjects = await _repo.GetAllProjects();
            return _mapper.Map<List<ProjectModel>>(allProjects);
        }

        public async Task<ProjectModel> GetProject(int projectId)
        {
            var project = await _repo.GetProject(projectId);
            if (project == null)
                throw new ProjectNotFoundException(projectId);

            var projectModel = _mapper.Map<ProjectModel>(project);
            projectModel.Employees = await _interactionRepo.GetProjectEmployees(projectId);

            return projectModel;
        }

        // HELPER METHODS

        private string? GetShortDescription(string? description)
        {
            if (string.IsNullOrWhiteSpace(description))
                return null;

            return description.Length > 80 ? description.Substring(0, 80) + "..." : description;
        }

        private async Task<int> CalculateGoalProgress(
            int goalId,
            int currentUserEmployeeMasterId
        )
        {
            var latestLog = await _baseRepo.GetLatestProgressLog(goalId);

            if (latestLog != null && latestLog.Source == PROGRESS_SOURCE.MANUAL)
            {
                return latestLog.ProgressPercent ?? 0;
            }

            var allChecklistItems = await _baseRepo.GetChecklistItemsByGoalId(goalId);

            if (allChecklistItems == null || !allChecklistItems.Any())
            {
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

            return (int)Math.Round((double)completedCount / allChecklistItems.Count * 100);
        }

        private async Task<string?> GetProjectName(int? projectId)
        {
            if (!projectId.HasValue)
                return null;

            var project = await _baseRepo.GetProjectById(projectId.Value);
            return project?.ProjectName;
        }

        private bool IsGoalOverdue(Goal goal)
        {
            return goal.Goalendat.HasValue
                && goal.Goalendat.Value < DateTime.UtcNow
                && goal.Goalstatus != GOAL_STATUS.COMPLETED
                && goal.Goalstatus != GOAL_STATUS.CLOSED;
        }

        private bool CanAssignGoal(Goal goal, int userId, string userRole)
        {
            return (userRole == USER_ROLE.MANAGER || userRole == USER_ROLE.DEPARTMENT_HEAD)
                && goal.GoalType == GOAL_TYPE.TEAM
                && goal.CreatedBy == userId
                && goal.Goalstatus == GOAL_STATUS.OPEN;
        }
    }
}
