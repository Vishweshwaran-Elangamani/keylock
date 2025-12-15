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
    public class GoalProgressService : IGoalProgressService
    {
        private readonly IGoalProgressRepository _repo;
        private readonly IBaseGoalRepository _baseRepo;
        private readonly IGoalRepository _goalRepo;
        private readonly IBaseGoalService _baseService;
        private readonly IWebHostEnvironment _environment;

        public GoalProgressService(
            IGoalProgressRepository repo,
            IBaseGoalRepository baseRepo,
            IGoalRepository goalRepository,
            IBaseGoalService baseService,
            IWebHostEnvironment environment
        )
        {
            _repo = repo;
            _baseRepo = baseRepo;
            _goalRepo = goalRepository;
            _baseService = baseService;
            _environment = environment;
        }

        public async Task<ApiResponseDto> ToggleChecklistAsync(
            int goalId,
            ToggleChecklistDto dto,
            int currentUserEmployeeMasterId
        )
        {
            try
            {
                var goal = await _baseRepo.GetGoalByIdAsync(goalId);
                if (goal == null)
                {
                    return ApiResponseDto.ErrorResponse(ResponseMessages.Codes.GOAL_NOT_FOUND);
                }

                // Check if user is acknowledged and block toggling
                var assignment = await _baseRepo.GetGoalAssignmentAsync(
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

                await _baseRepo.SaveChangesAsync();

                // Auto-transition from "open" to "inprogress" when user starts working
                if (dto.IsCompleted && goal.Goalstatus == GOAL_STATUS.OPEN)
                {
                    goal.Goalstatus = GOAL_STATUS.IN_PROGRESS;
                    await _goalRepo.UpdateGoalAsync(goal);

                    Log.Information(
                        "[ToggleChecklist] Goal {GoalId} transitioned from 'open' to 'inprogress'",
                        goalId
                    );
                }

                // Recalculate progress
                var completed = await _baseRepo.CountCompletedForUserAsync(
                    goalId,
                    currentUserEmployeeMasterId
                );
                var total = await _baseRepo.CountTotalForUserAsync(
                    goalId,
                    currentUserEmployeeMasterId
                );
                var percent = total == 0 ? 0 : (int)Math.Round((double)completed / total * 100);

                // Auto-revoke pending approvals if progress drops below 100%
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

                        // Log the auto-revoke event
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

                // Add progress log
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

                // Keep status as "inprogress" even at 100%
                // Status only changes to "completed" after approval
                if (percent == 100 && goal.Goalstatus == GOAL_STATUS.OPEN)
                {
                    goal.Goalstatus = GOAL_STATUS.IN_PROGRESS;
                    await _goalRepo.UpdateGoalAsync(goal);
                }

                await _baseRepo.SaveChangesAsync();

                var metadata = new
                {
                    GoalId = goalId,
                    ChecklistId = dto.ChecklistId,
                    IsCompleted = dto.IsCompleted,
                    NewProgress = percent,
                    UpdatedBy = currentUserEmployeeMasterId,
                    StatusChanged = goal.Goalstatus == GOAL_STATUS.IN_PROGRESS && dto.IsCompleted,
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
                var goal = await _baseRepo.GetGoalByIdAsync(goalId);
                if (goal == null)
                {
                    return ApiResponseDto.ErrorResponse(ResponseMessages.Codes.GOAL_NOT_FOUND);
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

                await _baseRepo.SaveChangesAsync();

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
                return 0;

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

        public async Task<int> GetCascadingProgressAsync(int goalId, int userId)
        {
            var goal = await _baseRepo.GetGoalByIdAsync(goalId);
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
            var userRole = await _baseRepo.GetUserRoleAsync(userId);
            var (ownWeight, teamWeight) = GetWeightsForRole(userRole);

            var cascadingProgress = (ownProgress * ownWeight + teamProgress * teamWeight) / 100;
            return cascadingProgress;
        }

        public async Task<GoalProgressHierarchyDto> GetProgressHierarchyAsync(
            int goalId,
            int userId
        )
        {
            var user = await _baseRepo.GetEmployeeDetailsByMasterIdAsync(userId);
            if (user == null)
                throw new KeyNotFoundException("User not found");

            var goal = await _baseRepo.GetGoalByIdAsync(goalId);
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
                    var subUser = await _baseRepo.GetEmployeeDetailsByMasterIdAsync(subId);

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
                "departmenthead" => (30, 70),
                "leadership" => (20, 80),
                _ => (50, 50),
            };
        }
    }
}
