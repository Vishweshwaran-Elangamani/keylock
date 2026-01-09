using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Enums;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Data.Repository.Interface;
using Serilog;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class GoalApprovalsService : IGoalApprovalsService
    {
        private readonly IGoalApprovalsRepository _repo;
        private readonly IBaseGoalRepository _baseRepo;
        private readonly IGoalAttachmentRepository _attachmentRepo;
        private readonly IGoalRepository _goalRepo;
        private readonly IBaseGoalService _baseService;
        private readonly IWebHostEnvironment _environment;

        public GoalApprovalsService(
            IGoalApprovalsRepository repo,
            IBaseGoalRepository baseRepo,
            IGoalAttachmentRepository attachmentRepo,
            IGoalRepository goalRepository,
            IBaseGoalService baseService,
            IWebHostEnvironment environment
        )
        {
            _repo = repo;
            _baseRepo = baseRepo;
            _attachmentRepo = attachmentRepo;
            _goalRepo = goalRepository;
            _baseService = baseService;
            _environment = environment;
        }

        public async Task<ApiResponseModel<int>> RequestApprovalAsync(
            int goalId,
            CreateApprovalRequestModel dto,
            int requesterEmployeeMasterId,
            string requesterRole
        )
        {
            try
            {
                var goal = await _baseRepo.GetGoalByIdAsync(goalId);
                if (goal == null)
                {
                    return ApiResponseModel<int>.ErrorResponse(ResponseMessages.Codes.GOAL_NOT_FOUND);
                }

                if (dto.ApprovalType == APPROVAL_TYPE.COMPLETION)
                {
                    if (
                        requesterRole == USER_ROLE.LEADERSHIP
                        && (goal.GoalType?.ToLower() == GOAL_TYPE.ORG)
                    )
                    {
                        var autoApproval = new GoalApproval
                        {
                            GoalId = goalId,
                            ApprovalType = APPROVAL_TYPE.COMPLETION,
                            RequestedBy = requesterEmployeeMasterId,
                            RequestedOn = DateTime.UtcNow,
                            ApprovedBy = requesterEmployeeMasterId,
                            ApprovalStatus = APPROVAL_STATUS.APPROVED,
                            ApprovedOn = DateTime.UtcNow,
                        };

                        await _repo.AddApprovalAsync(autoApproval);
                        goal.Goalstatus = GOAL_STATUS.COMPLETED;
                        await _baseRepo.SaveChangesAsync();

                        return ApiResponseModel<int>.SuccessResponse(
                            ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                            autoApproval.ApprovalId
                        );
                    }

                    if (
                        requesterRole == USER_ROLE.LEADERSHIP
                        && (goal.GoalType?.ToLower() == GOAL_TYPE.SELF)
                    )
                    {
                        var autoApproval = new GoalApproval
                        {
                            GoalId = goalId,
                            ApprovalType = APPROVAL_TYPE.COMPLETION,
                            RequestedBy = requesterEmployeeMasterId,
                            RequestedOn = DateTime.UtcNow,
                            ApprovedBy = requesterEmployeeMasterId,
                            ApprovalStatus = APPROVAL_STATUS.APPROVED,
                            ApprovedOn = DateTime.UtcNow,
                        };

                        await _repo.AddApprovalAsync(autoApproval);
                        goal.Goalstatus = GOAL_STATUS.COMPLETED;
                        await _baseRepo.SaveChangesAsync();

                        return ApiResponseModel<int>.SuccessResponse(
                            ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                            autoApproval.ApprovalId
                        );
                    }

                    var managerId = await _baseRepo.GetReportingManagerEmployeeMasterIdAsync(
                        requesterEmployeeMasterId
                    );
                    if (!managerId.HasValue)
                    {
                        return ApiResponseModel<int>.ErrorResponse(
                            ResponseMessages.Codes.APPROVAL_NO_MANAGER,
                            "Cannot submit approval: No reporting manager found"
                        );
                    }

                    var approval = new GoalApproval
                    {
                        GoalId = goalId,
                        ApprovalType = APPROVAL_TYPE.COMPLETION,

                        RequestedBy = requesterEmployeeMasterId,
                        RequestedOn = DateTime.UtcNow,
                        ApprovedBy = managerId.Value,
                        ApprovalStatus = APPROVAL_STATUS.PENDING,
                    };

                    await _repo.AddApprovalAsync(approval);
                    await _baseRepo.SaveChangesAsync();

                    return ApiResponseModel<int>.SuccessResponse(
                        ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                        approval.ApprovalId
                    );
                }

                if (dto.ApprovalType == APPROVAL_TYPE.CLOSURE)
                {
                    if (goal.CreatedBy != requesterEmployeeMasterId)
                    {
                        return ApiResponseModel<int>.ErrorResponse(
                            ResponseMessages.Codes.GOAL_ACCESS_DENIED,
                            "Only goal creator can request closure"
                        );
                    }

                    if (
                        new[]
                        {
                            GOAL_STATUS.CLOSED,
                            GOAL_STATUS.COMPLETED,
                            GOAL_STATUS.CANCELLED,
                        }.Contains(goal.Goalstatus?.ToLower() ?? "")
                    )
                    {
                        return ApiResponseModel<int>.ErrorResponse(
                            ResponseMessages.Codes.GOAL_INVALID_STATUS,
                            "Goal is already completed or closed"
                        );
                    }

                    if (
                        requesterRole == USER_ROLE.LEADERSHIP
                        && (goal.GoalType?.ToLower() == GOAL_TYPE.ORG)
                    )
                    {
                        var autoApproval = new GoalApproval
                        {
                            GoalId = goalId,
                            ApprovalType = APPROVAL_TYPE.COMPLETION,
                            RequestedBy = requesterEmployeeMasterId,
                            RequestedOn = DateTime.UtcNow,
                            ApprovedBy = requesterEmployeeMasterId,
                            ApprovalStatus = APPROVAL_STATUS.APPROVED,
                            ApprovedOn = DateTime.UtcNow,
                        };

                        await _repo.AddApprovalAsync(autoApproval);
                        goal.Goalstatus = GOAL_STATUS.CLOSED;

                        await _baseRepo.SaveChangesAsync();

                        return ApiResponseModel<int>.SuccessResponse(
                            ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                            autoApproval.ApprovalId
                        );
                    }

                    var managerId = await _baseRepo.GetReportingManagerEmployeeMasterIdAsync(
                        requesterEmployeeMasterId
                    );
                    if (!managerId.HasValue)
                    {
                        return ApiResponseModel<int>.ErrorResponse(
                            ResponseMessages.Codes.APPROVAL_NO_MANAGER,
                            "No manager found to approve closure"
                        );
                    }

                    var approval = new GoalApproval
                    {
                        GoalId = goalId,
                        ApprovalType = APPROVAL_TYPE.CLOSURE,
                        RequestedBy = requesterEmployeeMasterId,
                        RequestedOn = DateTime.UtcNow,
                        ApprovedBy = managerId.Value,
                        ApprovalStatus = APPROVAL_STATUS.PENDING,
                    };

                    await _repo.AddApprovalAsync(approval);
                    await _baseRepo.SaveChangesAsync();

                    return ApiResponseModel<int>.SuccessResponse(
                        ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                        approval.ApprovalId
                    );
                }

                if (dto.ApprovalType == APPROVAL_TYPE.REOPENING)
                {
                    if (!goal.Goalendat.HasValue || goal.Goalendat.Value >= DateTime.UtcNow)
                    {
                        return ApiResponseModel<int>.ErrorResponse(
                            ResponseMessages.Codes.GOAL_INVALID_STATUS,
                            "Goal is not overdue"
                        );
                    }

                    if (
                        goal.CreatedBy != requesterEmployeeMasterId
                        && !await _baseRepo.IsUserAssignedToGoalAsync(
                            goalId,
                            requesterEmployeeMasterId
                        )
                    )
                    {
                        return ApiResponseModel<int>.ErrorResponse(
                            ResponseMessages.Codes.GOAL_ACCESS_DENIED,
                            "Only goal creator or assignees can request reopening"
                        );
                    }

                    var managerId = await _baseRepo.GetReportingManagerEmployeeMasterIdAsync(
                        requesterEmployeeMasterId
                    );
                    if (!managerId.HasValue)
                    {
                        return ApiResponseModel<int>.ErrorResponse(
                            ResponseMessages.Codes.APPROVAL_NO_MANAGER,
                            "No manager found to approve reopening"
                        );
                    }

                    var approval = new GoalApproval
                    {
                        GoalId = goalId,
                        ApprovalType = APPROVAL_TYPE.REOPENING,
                        RequestedBy = requesterEmployeeMasterId,
                        RequestedOn = DateTime.UtcNow,
                        ApprovedBy = managerId.Value,
                        ApprovalStatus = APPROVAL_STATUS.PENDING,
                    };

                    await _repo.AddApprovalAsync(approval);
                    await _baseRepo.SaveChangesAsync();

                    return ApiResponseModel<int>.SuccessResponse(
                        ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                        approval.ApprovalId
                    );
                }

                if (dto.ApprovalType == APPROVAL_TYPE.REACTIVATION)
                {
                    if (goal.CreatedBy != requesterEmployeeMasterId)
                    {
                        return ApiResponseModel<int>.ErrorResponse(
                            ResponseMessages.Codes.GOAL_ACCESS_DENIED,
                            "Only goal creator can request reactivation"
                        );
                    }

                    if (
                        !new[] { GOAL_STATUS.CLOSED, GOAL_STATUS.COMPLETED }.Contains(
                            goal.Goalstatus?.ToLower() ?? ""
                        )
                    )
                    {
                        return ApiResponseModel<int>.ErrorResponse(
                            ResponseMessages.Codes.GOAL_INVALID_STATUS,
                            "Only closed or completed goals can be reactivated"
                        );
                    }

                    if (
                        requesterRole == USER_ROLE.LEADERSHIP
                        && (goal.GoalType?.ToLower() == GOAL_TYPE.ORG)
                    )
                    {
                        var autoApproval = new GoalApproval
                        {
                            GoalId = goalId,
                            ApprovalType = APPROVAL_TYPE.REACTIVATION,

                            RequestedBy = requesterEmployeeMasterId,
                            RequestedOn = DateTime.UtcNow,
                            ApprovedBy = requesterEmployeeMasterId,
                            ApprovalStatus = APPROVAL_STATUS.APPROVED,
                            ApprovedOn = DateTime.UtcNow,
                        };

                        await _repo.AddApprovalAsync(autoApproval);
                        goal.Goalstatus = GOAL_STATUS.REOPENED;
                        await _baseRepo.SaveChangesAsync();

                        return ApiResponseModel<int>.SuccessResponse(
                            ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                            autoApproval.ApprovalId
                        );
                    }

                    var managerId = await _baseRepo.GetReportingManagerEmployeeMasterIdAsync(
                        requesterEmployeeMasterId
                    );
                    if (!managerId.HasValue)
                    {
                        return ApiResponseModel<int>.ErrorResponse(
                            ResponseMessages.Codes.APPROVAL_NO_MANAGER,
                            "No manager found to approve reactivation"
                        );
                    }

                    var approval = new GoalApproval
                    {
                        GoalId = goalId,
                        ApprovalType = APPROVAL_TYPE.REACTIVATION,
                        RequestedBy = requesterEmployeeMasterId,
                        RequestedOn = DateTime.UtcNow,
                        ApprovedBy = managerId.Value,
                        ApprovalStatus = APPROVAL_STATUS.PENDING,
                    };

                    await _repo.AddApprovalAsync(approval);
                    await _baseRepo.SaveChangesAsync();

                    return ApiResponseModel<int>.SuccessResponse(
                        ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                        approval.ApprovalId
                    );
                }

                var approverId = dto.ApprovalType switch
                {
                    "creation" or "selfgoalactivation" or "delegation" or "task_acknowledgment" =>
                        await _baseRepo.GetReportingManagerEmployeeMasterIdAsync(
                            requesterEmployeeMasterId
                        ),
                    _ => throw new InvalidOperationException(
                        $"Unknown approval type: {dto.ApprovalType}"
                    ),
                };

                if (!approverId.HasValue)
                {
                    return ApiResponseModel<int>.ErrorResponse(
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
                    ApprovalStatus = APPROVAL_STATUS.PENDING,
                };

                await _repo.AddApprovalAsync(standardApproval);
                await _baseRepo.SaveChangesAsync();

                return ApiResponseModel<int>.SuccessResponse(
                    ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                    standardApproval.ApprovalId
                );
            }
            catch (Exception ex)
            {
                return ApiResponseModel<int>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
            }
        }

        public async Task<ApiResponseModel> DecideApprovalAsync(
            int approvalId,
            DecideApprovalModel dto,
            int approverEmployeeMasterId,
            string approverRole
        )
        {
            try
            {
                var approval = await _repo.GetApprovalByIdAsync(approvalId);
                if (approval == null)
                {
                    return ApiResponseModel.ErrorResponse(ResponseMessages.Codes.APPROVAL_NOT_FOUND);
                }

                var goal = approval.Goal;

                if (!approval.ApprovedBy.HasValue)
                {
                    return ApiResponseModel.ErrorResponse(
                        ResponseMessages.Codes.APPROVAL_NOT_FOUND,
                        "This approval request is malformed (no approver assigned)."
                    );
                }

                if (approval.ApprovedBy.Value != approverEmployeeMasterId)
                {
                    return ApiResponseModel.ErrorResponse(
                        ResponseMessages.Codes.APPROVAL_ACCESS_DENIED,
                        $"You are not authorized to approve this request. This approval is assigned to employee ID {approval.ApprovedBy.Value}."
                    );
                }

                if (approval.ApprovalStatus != APPROVAL_STATUS.PENDING)
                {
                    return ApiResponseModel.ErrorResponse(
                        ResponseMessages.Codes.APPROVAL_ALREADY_DECIDED,
                        $"This approval has already been {approval.ApprovalStatus}. Decision was made on {approval.ApprovedOn:yyyy-MM-dd HH:mm}."
                    );
                }

                if (
                    dto.Decision != APPROVAL_STATUS.APPROVED
                    && dto.Decision != APPROVAL_STATUS.REJECTED
                )
                {
                    return ApiResponseModel.ErrorResponse(
                        ResponseMessages.Codes.APPROVAL_INVALID_DECISION,
                        $"Invalid decision: '{dto.Decision}'. Must be 'approved' or 'rejected'."
                    );
                }

                approval.ApprovalStatus = dto.Decision;
                approval.ApprovedOn = DateTime.UtcNow;
                await _repo.UpdateApprovalAsync(approval);

                if (
                    approval.ApprovalType == APPROVAL_TYPE.COMPLETION
                    || approval.ApprovalType == APPROVAL_TYPE.TASK_ACKNOWLEDGMENT
                )
                {
                    if (dto.Decision == APPROVAL_STATUS.REJECTED)
                    {
                        await _attachmentRepo.UnmarkProofAttachmentsAsync(approvalId);
                    }
                }

                if (dto.Decision == APPROVAL_STATUS.APPROVED)
                {
                    switch (approval.ApprovalType)
                    {
                        case APPROVAL_TYPE.CREATION:
                        case APPROVAL_TYPE.SELF_GOAL_ACTIVATION:

                            goal.Goalstatus = GOAL_STATUS.OPEN;

                            await _goalRepo.UpdateGoalAsync(goal);
                            break;

                        case APPROVAL_TYPE.DELEGATION:

                            goal.Goalstatus = GOAL_STATUS.OPEN;
                            await _goalRepo.UpdateGoalAsync(goal);
                            break;

                        case APPROVAL_TYPE.COMPLETION:
                            var requesterRole = approval.RequestedBy.HasValue
                                ? await _baseRepo.GetUserRoleAsync(approval.RequestedBy.Value)
                                : null;

                            bool shouldCompleteGoal = false;

                            if (goal.GoalType == GOAL_TYPE.SELF)
                            {
                                shouldCompleteGoal = true;
                            }
                            else if (goal.GoalType == GOAL_TYPE.TEAM)
                            {
                                shouldCompleteGoal =
                                    requesterRole == USER_ROLE.MANAGER
                                    || requesterRole == USER_ROLE.DEPARTMENT_HEAD
                                    || requesterRole == USER_ROLE.LEADERSHIP;

                                if (shouldCompleteGoal)
                                {
                                    bool isCreator = goal.CreatedBy == approval.RequestedBy;
                                    bool isAssignedManager =
                                        await _baseRepo.IsUserAssignedToGoalAsync(
                                            goal.GoalId,
                                            approval.RequestedBy.Value
                                        );

                                    if (!isCreator && !isAssignedManager)
                                    {
                                        shouldCompleteGoal = false;
                                    }
                                }
                            }
                            else if (goal.GoalType == GOAL_TYPE.ORG)
                            {
                                shouldCompleteGoal = requesterRole == USER_ROLE.LEADERSHIP;
                            }

                            if (shouldCompleteGoal)
                            {
                                goal.Goalstatus = GOAL_STATUS.COMPLETED;

                                await _goalRepo.UpdateGoalAsync(goal);
                            }
                            break;

                        case APPROVAL_TYPE.TASK_ACKNOWLEDGMENT:

                            if (approval.RequestedBy.HasValue)
                            {
                                var assignment = await _baseRepo.GetGoalAssignmentAsync(
                                    goal.GoalId,
                                    approval.RequestedBy.Value
                                );

                                if (assignment != null)
                                {
                                    assignment.IsAcknowledged = true;
                                    assignment.AcknowledgedOn = DateTime.UtcNow;
                                    assignment.AcknowledgedBy = approverEmployeeMasterId;
                                    await _goalRepo.UpdateGoalAssignmentAsync(assignment);

                                    Log.Information(
                                        "[DecideApproval] Employee {EmployeeId} acknowledged for goal {GoalId} by {ApproverId}",
                                        approval.RequestedBy.Value,
                                        goal.GoalId,
                                        approverEmployeeMasterId
                                    );
                                }
                            }
                            break;

                        case APPROVAL_TYPE.REOPENING:

                            if (!dto.NewDeadline.HasValue)
                            {
                                return ApiResponseModel.ErrorResponse(
                                    ResponseMessages.Codes.INVALID_REQUEST,
                                    "New deadline is required to approve reopening request",
                                    new[] { "Please enter a deadline date" }
                                );
                            }

                            if (dto.NewDeadline.Value <= DateTime.UtcNow)
                            {
                                return ApiResponseModel.ErrorResponse(
                                    ResponseMessages.Codes.INVALID_REQUEST,
                                    "New deadline must be in the future",
                                    new[]
                                    {
                                        $"Deadline must be after {DateTime.UtcNow:yyyy-MM-dd HH:mm}",
                                    }
                                );
                            }

                            goal.Goalendat = dto.NewDeadline.Value;
                            goal.Goalstatus = GOAL_STATUS.REOPENED;

                            goal.ReopenedBy = approval.RequestedBy;
                            goal.ReopenedOn = DateTime.UtcNow;
                            await _goalRepo.UpdateGoalAsync(goal);
                            break;

                        case APPROVAL_TYPE.CLOSURE:

                            goal.Goalstatus = GOAL_STATUS.CLOSED;

                            goal.ClosedBy = approverEmployeeMasterId;
                            goal.ClosedOn = DateTime.UtcNow;
                            await _goalRepo.UpdateGoalAsync(goal);
                            break;

                        case APPROVAL_TYPE.REACTIVATION:
                            goal.Goalstatus = GOAL_STATUS.OPEN;
                            await _goalRepo.UpdateGoalAsync(goal);
                            break;

                        default:
                            return ApiResponseModel.ErrorResponse(
                                ResponseMessages.Codes.INTERNAL_SERVER_ERROR,
                                $"Unknown approval type: {approval.ApprovalType}"
                            );
                    }
                }
                else
                {
                    switch (approval.ApprovalType)
                    {
                        case APPROVAL_TYPE.CREATION:
                        case APPROVAL_TYPE.SELF_GOAL_ACTIVATION:

                            goal.Goalstatus = GOAL_STATUS.CLOSED;
                            await _goalRepo.UpdateGoalAsync(goal);
                            break;

                        case APPROVAL_TYPE.DELEGATION:
                            break;

                        case APPROVAL_TYPE.COMPLETION:
                        case APPROVAL_TYPE.TASK_ACKNOWLEDGMENT:

                            if (
                                !(
                                    goal.Goalstatus == GOAL_STATUS.IN_PROGRESS
                                    || goal.Goalstatus == GOAL_STATUS.OPEN
                                )
                            )
                            {
                                goal.Goalstatus = GOAL_STATUS.IN_PROGRESS;
                                await _goalRepo.UpdateGoalAsync(goal);
                            }
                            break;

                        case APPROVAL_TYPE.REOPENING:

                            goal.ReopenUntil = null;
                            await _goalRepo.UpdateGoalAsync(goal);
                            break;

                        case APPROVAL_TYPE.CLOSURE:
                            break;

                        case APPROVAL_TYPE.REACTIVATION:

                            break;
                    }
                }

                await _baseRepo.SaveChangesAsync();

                var metadata = new
                {
                    ApprovalId = approvalId,
                    GoalId = goal.GoalId,
                    Decision = dto.Decision,
                    ApprovalType = approval.ApprovalType,
                    ApprovedBy = approverEmployeeMasterId,
                    ApprovedOn = approval.ApprovedOn,
                };

                return ApiResponseModel.SuccessResponse(
                    ResponseMessages.Codes.APPROVAL_DECIDED_SUCCESS,
                    metadata
                );
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[DecideApproval] Error deciding approval {ApprovalId}", approvalId);
                return ApiResponseModel.ErrorResponse(ResponseMessages.Codes.INTERNAL_SERVER_ERROR);
            }
        }

        public async Task<List<GoalApprovalModel>> GetPendingApprovalsAsync(
            int approverEmployeeMasterId
        )
        {
            var approvals = await _repo.GetPendingApprovalsForApproverAsync(
                approverEmployeeMasterId
            );
            var result = new List<GoalApprovalModel>();

            foreach (var a in approvals)
            {
                var requesterName = await _baseService.GetEmployeeNameAsync(a.RequestedBy);

                var allAttachments = a
                    .Goal?.GoalAttachments.Select(att => new GoalAttachmentModel
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

                List<GoalAttachmentModel>? proofAttachments = null;
                if (
                    a.ApprovalType == APPROVAL_TYPE.COMPLETION
                    || a.ApprovalType == APPROVAL_TYPE.TASK_ACKNOWLEDGMENT
                )
                {
                    proofAttachments = allAttachments
                        ?.Where(att =>
                            att.LinkedApprovalId == a.ApprovalId && att.IsProofOfCompletion
                        )
                        .ToList();
                }

                result.Add(
                    new GoalApprovalModel
                    {
                        ApprovalId = a.ApprovalId,
                        GoalId = a.GoalId,
                        GoalTitle = a.Goal?.GoalTitle ?? "",
                        ApprovalType = a.ApprovalType ?? "",
                        RequestedByEmployeeMasterId = a.RequestedBy,
                        RequestedByName = requesterName,
                        RequestedOn = a.RequestedOn,
                        ApprovalStatus = a.ApprovalStatus ?? APPROVAL_STATUS.PENDING,
                        AllAttachments = allAttachments,
                        ProofAttachments = proofAttachments,
                        ReopenUntil = a.Goal?.ReopenUntil,
                    }
                );
            }
            return result;
        }

        public async Task<PagedApprovalsModel> GetUserApprovalsAsync(
            ApprovalQueryModel query,
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
                            ga.ApprovalStatus == APPROVAL_STATUS.PENDING
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

            // Map to Models
            var approvalModels = new List<UserGoalApprovalModel>();
            foreach (var ga in approvals)
            {
                var dto = await MapToUserGoalApprovalModel(ga, userId, userRole);
                approvalModels.Add(dto);
            }

            // Calculate summary counts
            var summary = await CalculateApprovalSummaryOptimized(userId, userRole);

            // Calculate pagination info
            var totalPages = (int)Math.Ceiling((double)totalCount / query.PageSize);

            return new PagedApprovalsModel
            {
                Items = approvalModels,
                TotalCount = totalCount,
                Page = query.Page,
                PageSize = query.PageSize,
                TotalPages = totalPages,
                HasNextPage = query.Page < totalPages,
                HasPreviousPage = query.Page > 1,
                Summary = summary,
            };
        }

        private async Task<ApprovalSummaryModel> CalculateApprovalSummaryOptimized(
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
                baseQuery.Where(ga =>
                    ga.ApprovalStatus == APPROVAL_STATUS.PENDING && ga.RequestedBy == userId
                )
            );

            var toReview = await _repo.CountAsync(
                baseQuery.Where(ga =>
                    ga.ApprovalStatus == APPROVAL_STATUS.PENDING
                    && ga.ApprovedBy == userId
                    && ga.RequestedBy != userId
                )
            );

            var myRequests = await _repo.CountAsync(
                baseQuery.Where(ga => ga.RequestedBy == userId)
            );

            var history = await _repo.CountAsync(
                baseQuery.Where(ga => ga.ApprovalStatus != APPROVAL_STATUS.PENDING)
            );

            var total = await _repo.CountAsync(baseQuery);

            return new ApprovalSummaryModel
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
                return APPROVAL_USER_ROLE.REQUESTER;

            if (approval.ApprovedBy == userId)
                return APPROVAL_USER_ROLE.APPROVER;

            if (approval.Goal?.CreatedBy == userId)
                return APPROVAL_USER_ROLE.GOAL_CREATOR;

            if (approval.Goal?.GoalAssignments?.Any(ga => ga.AssignedTo == userId) == true)
                return APPROVAL_USER_ROLE.GOAL_ASSIGNEE;

            if (
                approval.ApprovalStatus == APPROVAL_STATUS.PENDING
                && CanUserApproveTypeInMemory(approval.ApprovalType, userRole)
            )
                return APPROVAL_USER_ROLE.POTENTIAL_APPROVER;

            return APPROVAL_USER_ROLE.OBSERVER;
        }

        private bool CanUserApproveTypeInMemory(string approvalType, string userRole)
        {
            return approvalType switch
            {
                APPROVAL_TYPE.CREATION or APPROVAL_TYPE.SELF_GOAL_ACTIVATION =>
                    USER_ROLE.APPROVAL_AUTHORITIES.Contains(userRole),

                APPROVAL_TYPE.COMPLETION or APPROVAL_TYPE.TASK_ACKNOWLEDGMENT =>
                    USER_ROLE.APPROVAL_AUTHORITIES.Contains(userRole),

                APPROVAL_TYPE.REOPENING => USER_ROLE.APPROVAL_AUTHORITIES.Contains(userRole),

                APPROVAL_TYPE.DELEGATION => new[]
                {
                    USER_ROLE.DEPARTMENT_HEAD,
                    USER_ROLE.LEADERSHIP,
                }.Contains(userRole),

                _ => false,
            };
        }

        private bool CanUserMakeDecision(GoalApproval approval, int userId, string userRole)
        {
            return approval.ApprovalStatus == APPROVAL_STATUS.PENDING
                && approval.ApprovedBy == userId
                && CanUserApproveTypeInMemory(approval.ApprovalType, userRole)
                && approval.RequestedBy != userId;
        }

        private async Task<UserGoalApprovalModel> MapToUserGoalApprovalModel(
            GoalApproval approval,
            int userId,
            string userRole
        )
        {
            var requesterName = await _baseService.GetEmployeeNameAsync(approval.RequestedBy);
            var approverName = await _baseService.GetEmployeeNameAsync(approval.ApprovedBy);
            var goalCreatorName = await _baseService.GetEmployeeNameAsync(approval.Goal?.CreatedBy);

            // Get goal assignees
            var goalAssignees = new List<AssigneeModel>();
            if (approval.Goal?.GoalAssignments != null)
            {
                foreach (var assignment in approval.Goal.GoalAssignments)
                {
                    if (assignment.AssignedTo.HasValue)
                    {
                        var assigneeName = await _baseService.GetEmployeeNameAsync(
                            assignment.AssignedTo
                        );
                        var assigneeRole = assignment.AssignedTo.HasValue
                            ? await _baseRepo.GetUserRoleAsync(assignment.AssignedTo.Value)
                            : null;

                        goalAssignees.Add(
                            new AssigneeModel
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
            var allAttachments = new List<GoalAttachmentModel>();
            var proofAttachments = new List<GoalAttachmentModel>();

            if (approval.Goal?.GoalAttachments != null)
            {
                foreach (var att in approval.Goal.GoalAttachments)
                {
                    var attacherName = await _baseService.GetEmployeeNameAsync(att.AttachedBy);

                    var attachmentModel = new GoalAttachmentModel
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

                    allAttachments.Add(attachmentModel);

                    if (
                        att.IsProofOfCompletion
                        ?? true && att.LinkedApprovalId == approval.ApprovalId
                    )
                    {
                        proofAttachments.Add(attachmentModel);
                    }
                }
            }

            var dto = new UserGoalApprovalModel
            {
                ApprovalId = approval.ApprovalId,
                GoalId = approval.GoalId,
                GoalTitle = approval.Goal?.GoalTitle ?? "",
                ApprovalType = approval.ApprovalType ?? "",
                RequestedByEmployeeMasterId = approval.RequestedBy,
                RequestedByName = requesterName,
                RequestedOn = approval.RequestedOn,
                ApprovalStatus = approval.ApprovalStatus ?? APPROVAL_STATUS.PENDING,
                ReopenUntil = approval.Goal?.ReopenUntil,

                // Approver information
                ApproverEmployeeMasterId = approval.ApprovedBy,
                ApproverName = approverName,
                ApproverRole = approval.ApprovedBy.HasValue
                    ? await _baseRepo.GetUserRoleAsync(approval.ApprovedBy.Value)
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
                approval.ApprovalStatus == APPROVAL_STATUS.PENDING
                && CanUserApproveTypeInMemory(approval.ApprovalType, userRole)
                && approval.RequestedBy != userId
            )
                contexts.Add("You can review this request");

            return contexts.Any() ? string.Join("; ", contexts) : "Related to your goals or team";
        }
    }
}
