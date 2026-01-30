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
        }

        public async Task<ApiResponseModel> UpdateChecklistStatusAsync(
            int goalId,
            UpdateChecklistStatusModel updateDetails,
            int currentUserEmployeeMasterId
        )
        {
            var validationResult = await _updateChecklistStatusValidator.ValidateAsync(
                updateDetails
            );
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

            var assignment = await _baseRepo.GetGoalAssignmentAsync(
                goalId,
                currentUserEmployeeMasterId
            );
            if (assignment?.IsAcknowledged == true)
            {
                throw new BusinessRuleException(
                    ResponseMessages.Codes.CHECKLIST_LOCKED,
                    "Your tasks have been acknowledged. You cannot modify the checklist."
                );
            }

            var checklistItem = await _repo.GetChecklistItemAsync(updateDetails.ChecklistId);
            if (checklistItem == null || checklistItem.GoalId != goalId)
            {
                throw new ChecklistNotFoundException(updateDetails.ChecklistId);
            }

            await _repo.SetChecklistProgressAsync(
                updateDetails.ChecklistId,
                currentUserEmployeeMasterId,
                updateDetails.IsCompleted
            );

            await _baseRepo.SaveChangesAsync();

            if (updateDetails.IsCompleted && goal.Goalstatus == GOAL_STATUS.OPEN)
            {
                goal.Goalstatus = GOAL_STATUS.IN_PROGRESS;
                await _goalRepo.UpdateGoalAsync(goal);
            }

            var completed = await _baseRepo.CountCompletedForUserAsync(
                goalId,
                currentUserEmployeeMasterId
            );
            var total = await _baseRepo.CountTotalForUserAsync(goalId, currentUserEmployeeMasterId);
            var percent = total == 0 ? 0 : (int)Math.Round((double)completed / total * 100);

            if (percent < 100)
            {
                var pendingApprovals = await _repo.GetPendingApprovalsForGoalAndUserAsync(
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
                    await _baseRepo.SaveChangesAsync();

                    await _repo.AddProgressLogAsync(
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

            await _repo.AddProgressLogAsync(
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
                await _goalRepo.UpdateGoalAsync(goal);
            }

            await _baseRepo.SaveChangesAsync();

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

            return ApiResponseModel.SuccessResponse(
                ResponseMessages.Codes.CHECKLIST_TOGGLED_SUCCESS,
                metadata
            );
        }

        public async Task<ApiResponseModel> UpdateProgressPercentageAsync(
            int goalId,
            UpdateProgressPercentageModel updateDetails,
            int currentUserEmployeeMasterId
        )
        {
            var validationResult = await _updateProgressPercentageModelValidator.ValidateAsync(
                updateDetails
            );
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

            var role = await _baseRepo.GetUserRoleAsync(currentUserEmployeeMasterId);
            if (
                !(
                    role == USER_ROLE.MANAGER
                    || role == USER_ROLE.DEPARTMENT_HEAD
                    || role == USER_ROLE.LEADERSHIP
                )
            )
            {
                throw new ForbiddenException(ResponseMessages.Codes.PROGRESS_UPDATE_DENIED);
            }

            await _repo.AddProgressLogAsync(
                new Goalprogresslog
                {
                    GoalId = goalId,
                    UpdatedBy = currentUserEmployeeMasterId,
                    UpdatedOn = DateTime.UtcNow,
                    ProgressPercent = updateDetails.ProgressPercent,
                    Source = updateDetails.Source,
                }
            );

            await _baseRepo.SaveChangesAsync();

            var metadata = new
            {
                GoalId = goalId,
                ProgressPercent = updateDetails.ProgressPercent,
                Source = updateDetails.Source,
                UpdatedBy = currentUserEmployeeMasterId,
            };

            return ApiResponseModel.SuccessResponse(
                ResponseMessages.Codes.GOAL_PROGRESS_UPDATED,
                metadata
            );
        }

        public async Task<int> GetGoalProgressPercentAsync(int goalId, int forEmployeeMasterId)
        {
            var latestLog = await _baseRepo.GetLatestProgressLogAsync(goalId);

            if (latestLog != null && latestLog.Source == PROGRESS_SOURCE.MANUAL)
            {
                return latestLog.ProgressPercent ?? 0;
            }
            else
            {
                var completed = await _baseRepo.CountCompletedForUserAsync(
                    goalId,
                    forEmployeeMasterId
                );
                var total = await _baseRepo.CountTotalForUserAsync(goalId, forEmployeeMasterId);
                return total == 0 ? 0 : (int)Math.Round((double)completed / total * 100);
            }
        }

        public async Task<int> GetTeamGoalProgressForManagerAsync(
            int goalId,
            int managerEmployeeMasterId
        )
        {
            var goal = await _baseRepo.GetGoalByIdAsync(goalId);
            if (goal == null)
                throw new GoalNotFoundException(goalId);

            if (goal.GoalType != GOAL_TYPE.TEAM)
                return await GetGoalProgressPercentAsync(goalId, managerEmployeeMasterId);

            var assignees = await _baseRepo.GetAssigneesAsync(goalId);
            if (!assignees.Any())
                return 0;

            var subordinates = await _baseRepo.GetSubordinateEmployeeMasterIdsAsync(
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

        public async Task<int> GetDependentProgressAsync(int goalId, int userId)
        {
            var goal = await _baseRepo.GetGoalByIdAsync(goalId);
            if (goal == null)
                throw new GoalNotFoundException(goalId);

            var ownProgress = await CalculateUserOwnProgressAsync(goalId, userId);
            var subordinates = await _repo.GetSubordinatesAssignedToGoalAsync(goalId, userId);

            if (!subordinates.Any())
            {
                return ownProgress;
            }

            var subordinateProgressList = new List<int>();
            foreach (var subId in subordinates)
            {
                var subProgress = await GetDependentProgressAsync(goalId, subId);
                subordinateProgressList.Add(subProgress);
            }

            var teamProgress = subordinateProgressList.Any()
                ? (int)subordinateProgressList.Average()
                : 0;
            var userRole = await _baseRepo.GetUserRoleAsync(userId);
            var (ownWeight, teamWeight) = GetWeightsForRole(userRole);

            var cascadingProgress = (ownProgress * ownWeight + teamProgress * teamWeight) / 100;
            return cascadingProgress;
        }

        public async Task<GoalProgressHierarchyModel> FetchGoalProgressTreeAsync(
            int goalId,
            int userId
        )
        {
            var user = await _baseRepo.GetEmployeeDetailsByMasterIdAsync(userId);
            if (user == null)
                throw new UserNotFoundException(userId);

            var goal = await _baseRepo.GetGoalByIdAsync(goalId);
            if (goal == null)
                throw new GoalNotFoundException(goalId);

            var ownProgress = await CalculateUserOwnProgressAsync(goalId, userId);
            var ownItems = await _repo.GetUserOwnChecklistItemsAsync(goalId, userId);
            var ownItemsCompleted = await _repo.CountUserOwnCompletedItemsAsync(goalId, userId);

            var subordinateIds = await _repo.GetSubordinatesAssignedToGoalAsync(goalId, userId);
            var subordinateDetails = await BuildSubordinateProgressListAsync(
                goalId,
                subordinateIds
            );

            int? teamProgress = null;
            if (subordinateDetails.Any())
            {
                var subordinateProgressList = new List<int>();

                foreach (var subId in subordinateIds)
                {
                    var subUser = await _baseRepo.GetEmployeeDetailsByMasterIdAsync(subId);

                    if (subUser != null)
                    {
                        var subProgress = await GetDependentProgressAsync(goalId, subId);
                        subordinateProgressList.Add(subProgress);

                        var subItems = await _repo.GetUserOwnChecklistItemsAsync(goalId, subId);
                        var subItemsCompleted = await _repo.CountUserOwnCompletedItemsAsync(
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

            var userRole = await _baseRepo.GetUserRoleAsync(userId);
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

            return new GoalProgressHierarchyModel
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
        }

        //HELPER METHODS 

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
                "departmenthead" => (30, 70),
                "leadership" => (20, 80),
                _ => (50, 50),
            };
        }


        private async Task<List<SubordinateProgressModel>> BuildSubordinateProgressListAsync(
            int goalId,
            List<int> subordinateIds
        )
        {
            var subordinateDetails = new List<SubordinateProgressModel>();

            if (!subordinateIds.Any())
                return subordinateDetails;

            foreach (var subId in subordinateIds)
            {
                var subUser = await _baseRepo.GetEmployeeDetailsByMasterIdAsync(subId);

                if (subUser != null)
                {
                    var subProgress = await GetDependentProgressAsync(goalId, subId);
                    var subItems = await _repo.GetUserOwnChecklistItemsAsync(goalId, subId);
                    var subItemsCompleted = await _repo.CountUserOwnCompletedItemsAsync(
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

            return subordinateDetails;
        }


        private string GetFullName(Employeedetailsmaster employeeDetails)
        {
            var profile = employeeDetails.Employee?.Userprofile;
            if (profile == null)
                return "Unknown";

            return $"{profile.FirstName} {profile.LastName}".Trim();
        }
    }
}
