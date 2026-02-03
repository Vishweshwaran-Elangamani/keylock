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
    public class GoalProgressService : IGoalProgressService
    {
        private readonly IGoalProgressRepository _repo;
        private readonly IBaseGoalRepository _baseRepo;
        private readonly IGoalRepository _goalRepo;
        private readonly IBaseGoalService _baseService;
        private readonly IWebHostEnvironment _environment;
        private readonly IValidator<UpdateChecklistStatusModel> _updateChecklistStatusValidator;
        private readonly IValidator<UpdateProgressPercentageModel> _updateProgressPercentageModelValidator;
        private readonly IMapper _mapper;

        public GoalProgressService(
            IGoalProgressRepository repo,
            IBaseGoalRepository baseRepo,
            IGoalRepository goalRepository,
            IBaseGoalService baseService,
            IWebHostEnvironment environment,
            IValidator<UpdateChecklistStatusModel> updateChecklistStatusValidator,
            IValidator<UpdateProgressPercentageModel> updateProgressPercentageModelValidator,
            IMapper mapper
        )
        {
            _repo = repo;
            _baseRepo = baseRepo;
            _goalRepo = goalRepository;
            _baseService = baseService;
            _environment = environment;
            _updateChecklistStatusValidator = updateChecklistStatusValidator;
            _updateProgressPercentageModelValidator = updateProgressPercentageModelValidator;
            _mapper = mapper;

            Log.Debug("GoalProgressService initialized.");
        }

        public async Task<ApiResponseModel> UpdateChecklistStatus(
            int goalId,
            UpdateChecklistStatusModel updateDetails,
            int currentUserEmployeeMasterId
        )
        {
            Log.Information(
                "UpdateChecklistStatus START | GoalId={GoalId} | UserId={UserId} | ChecklistId={ChecklistId} | IsCompleted={IsCompleted}",
                goalId,
                currentUserEmployeeMasterId,
                updateDetails?.ChecklistId,
                updateDetails?.IsCompleted
            );

            var validationResult = await _updateChecklistStatusValidator.ValidateAsync(
                updateDetails
            );
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                Log.Warning(
                    "UpdateChecklistStatus VALIDATION_FAILED | GoalId={GoalId} | UserId={UserId} | Errors={Errors}",
                    goalId,
                    currentUserEmployeeMasterId,
                    string.Join("; ", errors)
                );
                throw new BadRequestException("VALIDATION_FAILED", string.Join("; ", errors));
            }

            var goal = await _baseRepo.GetGoalById(goalId);
            if (goal == null)
            {
                Log.Warning("UpdateChecklistStatus FAILED | Goal not found | GoalId={GoalId}", goalId);
                throw new GoalNotFoundException(goalId);
            }

            var assignment = await _baseRepo.GetGoalAssignment(
                goalId,
                currentUserEmployeeMasterId
            );
            if (assignment?.IsAcknowledged == true)
            {
                Log.Warning(
                    "UpdateChecklistStatus BLOCKED | Tasks acknowledged | GoalId={GoalId} | UserId={UserId}",
                    goalId,
                    currentUserEmployeeMasterId
                );
                throw new BusinessRuleException(
                    ResponseMessages.Codes.CHECKLIST_LOCKED,
                    "Your tasks have been acknowledged. You cannot modify the checklist."
                );
            }

            var checklistItem = await _repo.GetChecklistItem(updateDetails.ChecklistId);
            if (checklistItem == null || checklistItem.GoalId != goalId)
            {
                Log.Warning(
                    "UpdateChecklistStatus FAILED | Checklist not found or mismatched | ChecklistId={ChecklistId} | GoalId={GoalId}",
                    updateDetails.ChecklistId,
                    goalId
                );
                throw new ChecklistNotFoundException(updateDetails.ChecklistId);
            }

            await _repo.SetChecklistProgress(
                updateDetails.ChecklistId,
                currentUserEmployeeMasterId,
                updateDetails.IsCompleted
            );

            Log.Information(
                "UpdateChecklistStatus | Progress updated | GoalId={GoalId} | ChecklistId={ChecklistId} | UserId={UserId} | Completed={Completed}",
                goalId,
                updateDetails.ChecklistId,
                currentUserEmployeeMasterId,
                updateDetails.IsCompleted
            );

            await _baseRepo.SaveChanges();

            if (updateDetails.IsCompleted && goal.Goalstatus == GOAL_STATUS.OPEN)
            {
                goal.Goalstatus = GOAL_STATUS.IN_PROGRESS;
                await _goalRepo.UpdateGoal(goal);

                Log.Information(
                    "UpdateChecklistStatus | Goal status moved to IN_PROGRESS | GoalId={GoalId}",
                    goalId
                );
            }

            var completed = await _baseRepo.CountCompletedForUser(
                goalId,
                currentUserEmployeeMasterId
            );
            var total = await _baseRepo.CountTotalForUser(goalId, currentUserEmployeeMasterId);
            var percent = total == 0 ? 0 : (int)Math.Round((double)completed / total * 100);

            Log.Information(
                "UpdateChecklistStatus | Computed Progress | GoalId={GoalId} | UserId={UserId} | Completed={Completed} | Total={Total} | Percent={Percent}",
                goalId,
                currentUserEmployeeMasterId,
                completed,
                total,
                percent
            );

            if (percent < 100)
            {
                var pendingApprovals = await _repo.GetPendingApprovalsForGoalAndUser(
                    goalId,
                    currentUserEmployeeMasterId,
                    new[] { APPROVAL_TYPE.TASK_ACKNOWLEDGMENT, "completion" }
                );

                foreach (var approval in pendingApprovals)
                {
                    approval.ApprovalStatus = APPROVAL_STATUS.REJECTED;
                }

                if (pendingApprovals.Any())
                {
                    Log.Information(
                        "UpdateChecklistStatus | Rejecting pending approvals due to progress < 100 | GoalId={GoalId} | UserId={UserId} | RejectedCount={Count}",
                        goalId,
                        currentUserEmployeeMasterId,
                        pendingApprovals.Count
                    );

                    await _baseRepo.SaveChanges();

                    await _repo.AddProgressLog(
                        new Goalprogresslog
                        {
                            GoalId = goalId,
                            UpdatedBy = currentUserEmployeeMasterId,
                            UpdatedOn = DateTime.UtcNow,
                            ProgressPercent = percent,
                            Source = PROGRESS_SOURCE.AUTO,
                        }
                    );
                }
            }

            await _repo.AddProgressLog(
                new Goalprogresslog
                {
                    GoalId = goalId,
                    UpdatedBy = currentUserEmployeeMasterId,
                    UpdatedOn = DateTime.UtcNow,
                    ProgressPercent = percent,
                    Source = PROGRESS_SOURCE.AUTO,
                }
            );

            if (percent == 100 && goal.Goalstatus == GOAL_STATUS.OPEN)
            {
                goal.Goalstatus = GOAL_STATUS.IN_PROGRESS;
                await _goalRepo.UpdateGoal(goal);

                Log.Information(
                    "UpdateChecklistStatus | Goal status moved to IN_PROGRESS at 100% | GoalId={GoalId}",
                    goalId
                );
            }

            await _baseRepo.SaveChanges();

            var metadata = new
            {
                GoalId = goalId,
                ChecklistId = updateDetails.ChecklistId,
                IsCompleted = updateDetails.IsCompleted,
                NewProgress = percent,
                UpdatedBy = currentUserEmployeeMasterId,
                StatusChanged = goal.Goalstatus == GOAL_STATUS.IN_PROGRESS
                    && updateDetails.IsCompleted,
            };

            Log.Information(
                "UpdateChecklistStatus END | GoalId={GoalId} | ChecklistId={ChecklistId} | NewProgress={NewProgress} | StatusChanged={StatusChanged}",
                goalId,
                updateDetails.ChecklistId,
                percent,
                metadata.StatusChanged
            );

            return ApiResponseModel.SuccessResponse(
                ResponseMessages.Codes.CHECKLIST_TOGGLED_SUCCESS,
                metadata
            );
        }

        public async Task<ApiResponseModel> UpdateProgressPercentage(
            int goalId,
            UpdateProgressPercentageModel updateDetails,
            int currentUserEmployeeMasterId
        )
        {
            Log.Information(
                "UpdateProgressPercentage START | GoalId={GoalId} | UserId={UserId} | Percent={Percent} | Source={Source}",
                goalId,
                currentUserEmployeeMasterId,
                updateDetails?.ProgressPercent,
                updateDetails?.Source
            );

            var validationResult = await _updateProgressPercentageModelValidator.ValidateAsync(
                updateDetails
            );
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                Log.Warning(
                    "UpdateProgressPercentage VALIDATION_FAILED | GoalId={GoalId} | UserId={UserId} | Errors={Errors}",
                    goalId,
                    currentUserEmployeeMasterId,
                    string.Join("; ", errors)
                );
                throw new BadRequestException("VALIDATION_FAILED", string.Join("; ", errors));
            }

            var goal = await _baseRepo.GetGoalById(goalId);
            if (goal == null)
            {
                Log.Warning("UpdateProgressPercentage FAILED | Goal not found | GoalId={GoalId}", goalId);
                throw new GoalNotFoundException(goalId);
            }

            var role = await _baseRepo.GetUserRole(currentUserEmployeeMasterId);
            if (
                !(
                    role == USER_ROLE.MANAGER
                    || role == USER_ROLE.DEPARTMENT_HEAD
                    || role == USER_ROLE.LEADERSHIP
                )
            )
            {
                Log.Warning(
                    "UpdateProgressPercentage FORBIDDEN | GoalId={GoalId} | UserId={UserId} | Role={Role}",
                    goalId,
                    currentUserEmployeeMasterId,
                    role
                );
                throw new ForbiddenException(ResponseMessages.Codes.PROGRESS_UPDATE_DENIED);
            }

            await _repo.AddProgressLog(
                new Goalprogresslog
                {
                    GoalId = goalId,
                    UpdatedBy = currentUserEmployeeMasterId,
                    UpdatedOn = DateTime.UtcNow,
                    ProgressPercent = updateDetails.ProgressPercent,
                    Source = updateDetails.Source,
                }
            );

            await _baseRepo.SaveChanges();

            var metadata = new
            {
                GoalId = goalId,
                ProgressPercent = updateDetails.ProgressPercent,
                Source = updateDetails.Source,
                UpdatedBy = currentUserEmployeeMasterId,
            };

            Log.Information(
                "UpdateProgressPercentage END | GoalId={GoalId} | Percent={Percent} | Source={Source}",
                goalId,
                updateDetails.ProgressPercent,
                updateDetails.Source
            );

            return ApiResponseModel.SuccessResponse(
                ResponseMessages.Codes.GOAL_PROGRESS_UPDATED,
                metadata
            );
        }

        public async Task<int> GetGoalProgressPercent(int goalId, int forEmployeeMasterId)
        {
            Log.Information(
                "GetGoalProgressPercent START | GoalId={GoalId} | ForUserId={UserId}",
                goalId,
                forEmployeeMasterId
            );

            var latestLog = await _baseRepo.GetLatestProgressLog(goalId);

            if (latestLog != null && latestLog.Source == PROGRESS_SOURCE.MANUAL)
            {
                var manual = latestLog.ProgressPercent ?? 0;
                Log.Information(
                    "GetGoalProgressPercent | Source=MANUAL | Percent={Percent}",
                    manual
                );
                return manual;
            }
            else
            {
                var completed = await _baseRepo.CountCompletedForUser(
                    goalId,
                    forEmployeeMasterId
                );
                var total = await _baseRepo.CountTotalForUser(goalId, forEmployeeMasterId);
                var percent = total == 0 ? 0 : (int)Math.Round((double)completed / total * 100);

                Log.Information(
                    "GetGoalProgressPercent | Source=AUTO | Completed={Completed} | Total={Total} | Percent={Percent}",
                    completed,
                    total,
                    percent
                );

                return percent;
            }
        }

        public async Task<int> GetTeamGoalProgressForManager(
            int goalId,
            int managerEmployeeMasterId
        )
        {
            Log.Information(
                "GetTeamGoalProgressForManager START | GoalId={GoalId} | ManagerId={ManagerId}",
                goalId,
                managerEmployeeMasterId
            );

            var goal = await _baseRepo.GetGoalById(goalId);
            if (goal == null)
                throw new GoalNotFoundException(goalId);

            if (goal.GoalType != GOAL_TYPE.TEAM)
            {
                var solo = await GetGoalProgressPercent(goalId, managerEmployeeMasterId);
                Log.Information(
                    "GetTeamGoalProgressForManager | Non-team goal -> returning user progress | Progress={Progress}",
                    solo
                );
                return solo;
            }

            var assignees = await _baseRepo.GetAssignees(goalId);
            if (!assignees.Any())
            {
                Log.Information("GetTeamGoalProgressForManager | No assignees -> 0");
                return 0;
            }

            var subordinates = await _baseRepo.GetSubordinateEmployeeMasterIds(
                managerEmployeeMasterId
            );

            var relevantAssignees = assignees
                .Where(a => a.AssignedTo.HasValue && subordinates.Contains(a.AssignedTo.Value))
                .ToList();

            if (!relevantAssignees.Any())
            {
                Log.Information("GetTeamGoalProgressForManager | No relevant assignees -> 0");
                return 0;
            }

            int totalProgress = 0;
            foreach (var assignee in relevantAssignees)
            {
                var progress = await GetGoalProgressPercent(
                    goalId,
                    assignee.AssignedTo!.Value
                );
                totalProgress += progress;
            }

            var avg = totalProgress / relevantAssignees.Count;

            Log.Information(
                "GetTeamGoalProgressForManager END | Count={Count} | AverageProgress={Average}",
                relevantAssignees.Count,
                avg
            );

            return avg;
        }

        public async Task<int> GetDependentProgress(int goalId, int userId)
        {
            Log.Information(
                "GetDependentProgress START | GoalId={GoalId} | UserId={UserId}",
                goalId,
                userId
            );

            var goal = await _baseRepo.GetGoalById(goalId);
            if (goal == null)
                throw new GoalNotFoundException(goalId);

            var ownProgress = await CalculateUserOwnProgress(goalId, userId);
            var subordinates = await _repo.GetSubordinatesAssignedToGoal(goalId, userId);

            if (!subordinates.Any())
            {
                Log.Information(
                    "GetDependentProgress | No subordinates -> OwnProgress={Own}",
                    ownProgress
                );
                return ownProgress;
            }

            var subordinateProgressList = new List<int>();
            foreach (var subId in subordinates)
            {
                var subProgress = await GetDependentProgress(goalId, subId);
                subordinateProgressList.Add(subProgress);
            }

            var teamProgress = subordinateProgressList.Any()
                ? (int)subordinateProgressList.Average()
                : 0;
            var userRole = await _baseRepo.GetUserRole(userId);
            var (ownWeight, teamWeight) = GetWeightsForRole(userRole);

            var cascadingProgress = (ownProgress * ownWeight + teamProgress * teamWeight) / 100;

            Log.Information(
                "GetDependentProgress END | GoalId={GoalId} | UserId={UserId} | Own={Own} | Team={Team} | Weights=({OwnW},{TeamW}) | Cascading={Cascading}",
                goalId,
                userId,
                ownProgress,
                teamProgress,
                ownWeight,
                teamWeight,
                cascadingProgress
            );

            return cascadingProgress;
        }

        public async Task<GoalProgressHierarchyModel> FetchGoalProgressTree(
            int goalId,
            int userId
        )
        {
            Log.Information(
                "FetchGoalProgressTree START | GoalId={GoalId} | UserId={UserId}",
                goalId,
                userId
            );

            var user = await _baseRepo.GetEmployeeDetailsByMasterId(userId);
            if (user == null)
                throw new UserNotFoundException(userId);

            var goal = await _baseRepo.GetGoalById(goalId);
            if (goal == null)
                throw new GoalNotFoundException(goalId);

            var ownProgress = await CalculateUserOwnProgress(goalId, userId);
            var ownItems = await _repo.GetUserOwnChecklistItems(goalId, userId);
            var ownItemsCompleted = await _repo.CountUserOwnCompletedItems(goalId, userId);

            var subordinateIds = await _repo.GetSubordinatesAssignedToGoal(goalId, userId);
            var subordinateDetails = await BuildSubordinateProgressList(
                goalId,
                subordinateIds
            );

            int? teamProgress = null;
            if (subordinateDetails.Any())
            {
                var subordinateProgressList = new List<int>();

                foreach (var subId in subordinateIds)
                {
                    var subUser = await _baseRepo.GetEmployeeDetailsByMasterId(subId);

                    if (subUser != null)
                    {
                        var subProgress = await GetDependentProgress(goalId, subId);
                        subordinateProgressList.Add(subProgress);

                        var subItems = await _repo.GetUserOwnChecklistItems(goalId, subId);
                        var subItemsCompleted = await _repo.CountUserOwnCompletedItems(
                            goalId,
                            subId
                        );

                        subordinateDetails.Add(
                            new SubordinateProgressModel
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

            var userRole = await _baseRepo.GetUserRole(userId);
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

            var model = new GoalProgressHierarchyModel
            {
                GoalId = goalId,
                UserId = userId,
                UserName = GetFullName(user),
                Role = user.Role?.RoleName,
                OwnProgress = ownProgress,
                TeamProgress = teamProgress,
                CascadingProgress = cascadingProgress,
                OwnWeight = ownWeight,
                TeamWeight = teamWeight,
                OwnItemCount = ownItems.Count,
                OwnItemsCompleted = ownItemsCompleted,
                Subordinates = subordinateDetails,
            };

            Log.Information(
                "FetchGoalProgressTree END | GoalId={GoalId} | UserId={UserId} | Own={Own} | Team={Team} | Cascading={Cascading} | OwnItems={OwnItems} | OwnCompleted={OwnCompleted} | Subs={Subs}",
                goalId,
                userId,
                model.OwnProgress,
                model.TeamProgress,
                model.CascadingProgress,
                model.OwnItemCount,
                model.OwnItemsCompleted,
                model.Subordinates?.Count ?? 0
            );

            return model;
        }

        //HELPER METHODS 

        private async Task<int> CalculateUserOwnProgress(int goalId, int userId)
        {
            Log.Debug(
                "CalculateUserOwnProgress START | GoalId={GoalId} | UserId={UserId}",
                goalId,
                userId
            );

            var userItems = await _repo.GetUserOwnChecklistItems(goalId, userId);

            if (!userItems.Any())
            {
                Log.Debug("CalculateUserOwnProgress | No items -> 0");
                return 0;
            }

            var completedCount = await _repo.CountUserOwnCompletedItems(goalId, userId);
            var percent = (int)Math.Round((double)completedCount / userItems.Count * 100);

            Log.Debug(
                "CalculateUserOwnProgress END | Items={Items} | Completed={Completed} | Percent={Percent}",
                userItems.Count,
                completedCount,
                percent
            );

            return percent;
        }

        private (int ownWeight, int teamWeight) GetWeightsForRole(string? role)
        {
            if (string.IsNullOrWhiteSpace(role))
            {
                Log.Debug("GetWeightsForRole | Null/Empty role -> default 50/50");
                return (50, 50);
            }

            var normalized = role.Trim().ToLower().Replace(" ", "");

            // Deconstruct into named locals
            var (ownWeight, teamWeight) = normalized switch
            {
                "employee" => (100, 0),
                "manager" => (50, 50),
                "departmenthead" => (30, 70),
                "leadership" => (20, 80),
                _ => (50, 50),
            };

            Log.Debug(
                "GetWeightsForRole | Role={Role} | Normalized={Normalized} | Weights=({Own},{Team})",
                role,
                normalized,
                ownWeight,
                teamWeight
            );

            return (ownWeight, teamWeight);
        }

        private async Task<List<SubordinateProgressModel>> BuildSubordinateProgressList(
            int goalId,
            List<int> subordinateIds
        )
        {
            Log.Debug(
                "BuildSubordinateProgressList START | GoalId={GoalId} | SubIdsCount={Count}",
                goalId,
                subordinateIds?.Count ?? 0
            );

            var subordinateDetails = new List<SubordinateProgressModel>();

            if (!subordinateIds.Any())
                return subordinateDetails;

            foreach (var subId in subordinateIds)
            {
                var subUser = await _baseRepo.GetEmployeeDetailsByMasterId(subId);

                if (subUser != null)
                {
                    var subProgress = await GetDependentProgress(goalId, subId);
                    var subItems = await _repo.GetUserOwnChecklistItems(goalId, subId);
                    var subItemsCompleted = await _repo.CountUserOwnCompletedItems(
                        goalId,
                        subId
                    );

                    subordinateDetails.Add(
                        new SubordinateProgressModel
                        {
                            UserId = subId,
                            UserName = GetFullName(subUser),
                            Role = subUser.Role?.RoleName,
                            Progress = subProgress,
                            ItemCount = subItems.Count,
                            ItemsCompleted = subItemsCompleted,
                        }
                    );
                }
            }

            Log.Debug(
                "BuildSubordinateProgressList END | GoalId={GoalId} | SubordinateCount={Count}",
                goalId,
                subordinateDetails.Count
            );

            return subordinateDetails;
        }

        private string GetFullName(Employeedetailsmaster employeeDetails)
        {
            var profile = employeeDetails.Employee?.Userprofile;
            if (profile == null)
            {
                Log.Debug("GetFullName | Missing profile -> 'Unknown'");
                return "Unknown";
            }

            var fullName = $"{profile.FirstName} {profile.LastName}".Trim();

            Log.Debug("GetFullName | Resolved={FullName}", fullName);

            return fullName;
        }
    }
}