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
    public class GoalApprovalsService : IGoalApprovalsService
    {
        private readonly IGoalApprovalsRepository _repo;
        private readonly IBaseGoalRepository _baseRepo;
        private readonly IGoalAttachmentRepository _attachmentRepo;
        private readonly IGoalRepository _goalRepo;
        private readonly IBaseGoalService _baseService;
        private readonly IWebHostEnvironment _environment;
        private readonly IValidator<CreateApprovalRequestModel> _createApprovalValidator;
        private readonly IValidator<ApprovalDesicionModel> _approvalDecisionValidator;
        private readonly IValidator<ApprovalQueryModel> _approvalQueryValidator;
        private readonly IMapper _mapper;

        public GoalApprovalsService(
            IGoalApprovalsRepository repo,
            IBaseGoalRepository baseRepo,
            IGoalAttachmentRepository attachmentRepo,
            IGoalRepository goalRepository,
            IBaseGoalService baseService,
            IWebHostEnvironment environment,
            IValidator<CreateApprovalRequestModel> createApprovalValidator,
            IValidator<ApprovalDesicionModel> approvalDecisionValidator,
            IValidator<ApprovalQueryModel> approvalQueryValidator,
            IMapper mapper
        )
        {
            _repo = repo;
            _baseRepo = baseRepo;
            _attachmentRepo = attachmentRepo;
            _goalRepo = goalRepository;
            _baseService = baseService;
            _environment = environment;
            _createApprovalValidator = createApprovalValidator;
            _approvalDecisionValidator = approvalDecisionValidator;
            _approvalQueryValidator = approvalQueryValidator;
            _mapper = mapper;

            Log.Debug("GoalApprovalsService initialized.");
        }

        public async Task<ApiResponseModel<int>> CreateApprovalRequest(
            int goalId,
            CreateApprovalRequestModel approvalRequestDetails,
            int requesterEmployeeMasterId,
            string requesterRole
        )
        {
            Log.Information(
                "CreateApprovalRequest START | GoalId={GoalId} | RequestedBy={RequesterId} | Role={Role} | Type={ApprovalType}",
                goalId,
                requesterEmployeeMasterId,
                requesterRole,
                approvalRequestDetails?.ApprovalType
            );

            var validationResult = await _createApprovalValidator.ValidateAsync(
                approvalRequestDetails
            );
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                Log.Warning(
                    "CreateApprovalRequest VALIDATION_FAILED | GoalId={GoalId} | Errors={Errors}",
                    goalId,
                    string.Join("; ", errors)
                );
                throw new BadRequestException("VALIDATION_FAILED", string.Join("; ", errors));
            }

            var goal = await _baseRepo.GetGoalById(goalId);
            if (goal == null)
            {
                Log.Warning("CreateApprovalRequest | Goal not found | GoalId={GoalId}", goalId);
                throw new GoalNotFoundException(goalId);
            }

            if (approvalRequestDetails.ApprovalType == APPROVAL_TYPE.COMPLETION)
            {
                Log.Information("CreateApprovalRequest | Branch=COMPLETION");

                if (
                    requesterRole == USER_ROLE.LEADERSHIP
                    && (goal.GoalType?.ToLower() == GOAL_TYPE.ORG)
                )
                {
                    Log.Information("CreateApprovalRequest | Auto-approve COMPLETION for ORG by LEADERSHIP");
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

                    await _repo.AddApproval(autoApproval);
                    goal.Goalstatus = GOAL_STATUS.COMPLETED;
                    await _baseRepo.SaveChanges();

                    Log.Information(
                        "CreateApprovalRequest END | AutoApproved COMPLETION | ApprovalId={ApprovalId}",
                        autoApproval.ApprovalId
                    );
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
                    Log.Information("CreateApprovalRequest | Auto-approve COMPLETION for SELF by LEADERSHIP");
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

                    await _repo.AddApproval(autoApproval);
                    goal.Goalstatus = GOAL_STATUS.COMPLETED;
                    await _baseRepo.SaveChanges();

                    Log.Information(
                        "CreateApprovalRequest END | AutoApproved COMPLETION SELF | ApprovalId={ApprovalId}",
                        autoApproval.ApprovalId
                    );
                    return ApiResponseModel<int>.SuccessResponse(
                        ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                        autoApproval.ApprovalId
                    );
                }

                var managerId = await _baseRepo.GetReportingManagerEmployeeMasterId(
                    requesterEmployeeMasterId
                );
                if (!managerId.HasValue)
                {
                    Log.Warning(
                        "CreateApprovalRequest | No manager found for COMPLETION | RequesterId={RequesterId}",
                        requesterEmployeeMasterId
                    );
                    throw new BusinessRuleException(
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

                await _repo.AddApproval(approval);
                await _baseRepo.SaveChanges();

                Log.Information(
                    "CreateApprovalRequest END | COMPLETION created PENDING | ApprovalId={ApprovalId}",
                    approval.ApprovalId
                );

                return ApiResponseModel<int>.SuccessResponse(
                    ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                    approval.ApprovalId
                );
            }

            if (approvalRequestDetails.ApprovalType == APPROVAL_TYPE.CLOSURE)
            {
                Log.Information("CreateApprovalRequest | Branch=CLOSURE");

                if (goal.CreatedBy != requesterEmployeeMasterId)
                {
                    Log.Warning(
                        "CreateApprovalRequest | CLOSURE denied | Not goal creator | GoalId={GoalId} | RequesterId={RequesterId}",
                        goalId,
                        requesterEmployeeMasterId
                    );
                    throw new GoalAccessDeniedException();
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
                    Log.Warning(
                        "CreateApprovalRequest | CLOSURE invalid status | Status={Status}",
                        goal.Goalstatus
                    );
                    throw new BusinessRuleException(
                        ResponseMessages.Codes.GOAL_INVALID_STATUS,
                        "Goal is already completed or closed"
                    );
                }

                if (
                    requesterRole == USER_ROLE.LEADERSHIP
                    && (goal.GoalType?.ToLower() == GOAL_TYPE.ORG)
                )
                {
                    Log.Information("CreateApprovalRequest | Auto-approve CLOSURE for ORG by LEADERSHIP");
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

                    await _repo.AddApproval(autoApproval);
                    goal.Goalstatus = GOAL_STATUS.CLOSED;

                    await _baseRepo.SaveChanges();

                    Log.Information(
                        "CreateApprovalRequest END | AutoApproved CLOSURE | ApprovalId={ApprovalId}",
                        autoApproval.ApprovalId
                    );

                    return ApiResponseModel<int>.SuccessResponse(
                        ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                        autoApproval.ApprovalId
                    );
                }

                var managerId = await _baseRepo.GetReportingManagerEmployeeMasterId(
                    requesterEmployeeMasterId
                );
                if (!managerId.HasValue)
                {
                    Log.Warning(
                        "CreateApprovalRequest | CLOSURE | No manager found | RequesterId={RequesterId}",
                        requesterEmployeeMasterId
                    );
                    throw new BusinessRuleException(
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

                await _repo.AddApproval(approval);
                await _baseRepo.SaveChanges();

                Log.Information(
                    "CreateApprovalRequest END | CLOSURE created PENDING | ApprovalId={ApprovalId}",
                    approval.ApprovalId
                );

                return ApiResponseModel<int>.SuccessResponse(
                    ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                    approval.ApprovalId
                );
            }

            if (approvalRequestDetails.ApprovalType == APPROVAL_TYPE.REOPENING)
            {
                Log.Information("CreateApprovalRequest | Branch=REOPENING");

                if (!goal.Goalendat.HasValue || goal.Goalendat.Value >= DateTime.UtcNow)
                {
                    Log.Warning("CreateApprovalRequest | REOPENING denied | Goal not overdue");
                    throw new BusinessRuleException(
                        ResponseMessages.Codes.GOAL_INVALID_STATUS,
                        "Goal is not overdue"
                    );
                }

                if (
                    goal.CreatedBy != requesterEmployeeMasterId
                    && !await _baseRepo.IsUserAssignedToGoal(goalId, requesterEmployeeMasterId)
                )
                {
                    Log.Warning(
                        "CreateApprovalRequest | REOPENING denied | Not creator/assignee | GoalId={GoalId} | RequesterId={RequesterId}",
                        goalId,
                        requesterEmployeeMasterId
                    );
                    throw new GoalAccessDeniedException();
                }

                var managerId = await _baseRepo.GetReportingManagerEmployeeMasterId(
                    requesterEmployeeMasterId
                );
                if (!managerId.HasValue)
                {
                    Log.Warning(
                        "CreateApprovalRequest | REOPENING | No manager found | RequesterId={RequesterId}",
                        requesterEmployeeMasterId
                    );
                    throw new BusinessRuleException(
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

                await _repo.AddApproval(approval);
                await _baseRepo.SaveChanges();

                Log.Information(
                    "CreateApprovalRequest END | REOPENING created PENDING | ApprovalId={ApprovalId}",
                    approval.ApprovalId
                );

                return ApiResponseModel<int>.SuccessResponse(
                    ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                    approval.ApprovalId
                );
            }

            if (approvalRequestDetails.ApprovalType == APPROVAL_TYPE.REACTIVATION)
            {
                Log.Information("CreateApprovalRequest | Branch=REACTIVATION");

                if (goal.CreatedBy != requesterEmployeeMasterId)
                {
                    Log.Warning(
                        "CreateApprovalRequest | REACTIVATION denied | Not goal creator | GoalId={GoalId} | RequesterId={RequesterId}",
                        goalId,
                        requesterEmployeeMasterId
                    );
                    throw new GoalAccessDeniedException();
                }

                if (
                    !new[] { GOAL_STATUS.CLOSED, GOAL_STATUS.COMPLETED }.Contains(
                        goal.Goalstatus?.ToLower() ?? ""
                    )
                )
                {
                    Log.Warning(
                        "CreateApprovalRequest | REACTIVATION invalid status | Status={Status}",
                        goal.Goalstatus
                    );
                    throw new BusinessRuleException(
                        ResponseMessages.Codes.GOAL_INVALID_STATUS,
                        "Only closed or completed goals can be reactivated"
                    );
                }

                if (
                    requesterRole == USER_ROLE.LEADERSHIP
                    && (goal.GoalType?.ToLower() == GOAL_TYPE.ORG)
                )
                {
                    Log.Information("CreateApprovalRequest | Auto-approve REACTIVATION for ORG by LEADERSHIP");
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

                    await _repo.AddApproval(autoApproval);
                    goal.Goalstatus = GOAL_STATUS.REOPENED;
                    await _baseRepo.SaveChanges();

                    Log.Information(
                        "CreateApprovalRequest END | AutoApproved REACTIVATION | ApprovalId={ApprovalId}",
                        autoApproval.ApprovalId
                    );

                    return ApiResponseModel<int>.SuccessResponse(
                        ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                        autoApproval.ApprovalId
                    );
                }

                var managerId = await _baseRepo.GetReportingManagerEmployeeMasterId(
                    requesterEmployeeMasterId
                );
                if (!managerId.HasValue)
                {
                    Log.Warning(
                        "CreateApprovalRequest | REACTIVATION | No manager found | RequesterId={RequesterId}",
                        requesterEmployeeMasterId
                    );
                    throw new BusinessRuleException(
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

                await _repo.AddApproval(approval);
                await _baseRepo.SaveChanges();

                Log.Information(
                    "CreateApprovalRequest END | REACTIVATION created PENDING | ApprovalId={ApprovalId}",
                    approval.ApprovalId
                );

                return ApiResponseModel<int>.SuccessResponse(
                    ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                    approval.ApprovalId
                );
            }

            Log.Information(
                "CreateApprovalRequest | Branch=STANDARD | Type={Type}",
                approvalRequestDetails.ApprovalType
            );

            var approverId = approvalRequestDetails.ApprovalType switch
            {
                "creation" or "selfgoalactivation" or "delegation" or "task_acknowledgment" =>
                    await _baseRepo.GetReportingManagerEmployeeMasterId(
                        requesterEmployeeMasterId
                    ),
                _ => throw new BadRequestException(
                    ResponseMessages.Codes.INVALID_REQUEST,
                    $"Unknown approval type: {approvalRequestDetails.ApprovalType}"
                ),
            };

            if (!approverId.HasValue)
            {
                Log.Warning(
                    "CreateApprovalRequest | STANDARD | No manager found | RequesterId={RequesterId}",
                    requesterEmployeeMasterId
                );
                throw new BusinessRuleException(
                    ResponseMessages.Codes.APPROVAL_NO_MANAGER,
                    "Cannot submit approval: No reporting manager found"
                );
            }

            var standardApproval = new GoalApproval
            {
                GoalId = goalId,
                ApprovalType = approvalRequestDetails.ApprovalType,
                RequestedBy = requesterEmployeeMasterId,
                RequestedOn = DateTime.UtcNow,
                ApprovedBy = approverId.Value,
                ApprovalStatus = APPROVAL_STATUS.PENDING,
            };

            await _repo.AddApproval(standardApproval);
            await _baseRepo.SaveChanges();

            Log.Information(
                "CreateApprovalRequest END | STANDARD created PENDING | ApprovalId={ApprovalId}",
                standardApproval.ApprovalId
            );

            return ApiResponseModel<int>.SuccessResponse(
                ResponseMessages.Codes.APPROVAL_REQUESTED_SUCCESS,
                standardApproval.ApprovalId
            );
        }

        public async Task<ApiResponseModel> ClosePendingApproval(
            int approvalId,
            ApprovalDesicionModel approvalDesicionDetails,
            int approverEmployeeMasterId,
            string approverRole
        )
        {
            Log.Information(
                "ClosePendingApproval START | ApprovalId={ApprovalId} | ApproverId={ApproverId} | Role={Role} | Decision={Decision}",
                approvalId,
                approverEmployeeMasterId,
                approverRole,
                approvalDesicionDetails?.Decision
            );

            var validationResult = await _approvalDecisionValidator.ValidateAsync(
                approvalDesicionDetails
            );
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                Log.Warning(
                    "ClosePendingApproval VALIDATION_FAILED | ApprovalId={ApprovalId} | Errors={Errors}",
                    approvalId,
                    string.Join("; ", errors)
                );
                throw new BadRequestException("VALIDATION_FAILED", string.Join("; ", errors));
            }

            var approval = await _repo.GetApprovalById(approvalId);
            if (approval == null)
            {
                Log.Warning("ClosePendingApproval | Approval not found | ApprovalId={ApprovalId}", approvalId);
                throw new ApprovalNotFoundException(approvalId);
            }

            var goal = approval.Goal;

            if (!approval.ApprovedBy.HasValue)
            {
                Log.Warning("ClosePendingApproval | Malformed approval (no approver assigned) | ApprovalId={ApprovalId}", approvalId);
                throw new BadRequestException(
                    ResponseMessages.Codes.APPROVAL_NOT_FOUND,
                    "This approval request is malformed (no approver assigned)."
                );
            }

            if (approval.ApprovedBy.Value != approverEmployeeMasterId)
            {
                Log.Warning(
                    "ClosePendingApproval | Approver mismatch | ApprovalId={ApprovalId} | ExpectedApproverId={Expected} | Actual={Actual}",
                    approvalId,
                    approval.ApprovedBy.Value,
                    approverEmployeeMasterId
                );
                throw new ApprovalAccessDeniedException();
            }

            if (approval.ApprovalStatus != APPROVAL_STATUS.PENDING)
            {
                Log.Warning(
                    "ClosePendingApproval | Already decided | ApprovalId={ApprovalId} | Status={Status}",
                    approvalId,
                    approval.ApprovalStatus
                );
                throw new ConflictException(
                    ResponseMessages.Codes.APPROVAL_ALREADY_DECIDED,
                    $"This approval has already been {approval.ApprovalStatus}. Decision was made on {approval.ApprovedOn:yyyy-MM-dd HH:mm}."
                );
            }

            approval.ApprovalStatus = approvalDesicionDetails.Decision;
            approval.ApprovedOn = DateTime.UtcNow;
            await _repo.UpdateApproval(approval);

            Log.Information(
                "ClosePendingApproval | Status updated | ApprovalId={ApprovalId} | NewStatus={Status}",
                approvalId,
                approval.ApprovalStatus
            );

            if (
                approval.ApprovalType == APPROVAL_TYPE.COMPLETION
                || approval.ApprovalType == APPROVAL_TYPE.TASK_ACKNOWLEDGMENT
            )
            {
                if (approvalDesicionDetails.Decision == APPROVAL_STATUS.REJECTED)
                {
                    Log.Information(
                        "ClosePendingApproval | Unmarking proof attachments | ApprovalId={ApprovalId}",
                        approvalId
                    );
                    await _attachmentRepo.UnmarkProofAttachments(approvalId);
                }
            }

            if (approvalDesicionDetails.Decision == APPROVAL_STATUS.APPROVED)
            {
                Log.Information(
                    "ClosePendingApproval | Processing APPROVED branch | Type={Type}",
                    approval.ApprovalType
                );

                switch (approval.ApprovalType)
                {
                    case APPROVAL_TYPE.CREATION:
                    case APPROVAL_TYPE.SELF_GOAL_ACTIVATION:
                        goal.Goalstatus = GOAL_STATUS.OPEN;
                        await _goalRepo.UpdateGoal(goal);
                        Log.Information("ClosePendingApproval | Goal OPENED | GoalId={GoalId}", goal.GoalId);
                        break;

                    case APPROVAL_TYPE.DELEGATION:
                        goal.Goalstatus = GOAL_STATUS.OPEN;
                        await _goalRepo.UpdateGoal(goal);
                        Log.Information("ClosePendingApproval | Goal OPENED (Delegation) | GoalId={GoalId}", goal.GoalId);
                        break;

                    case APPROVAL_TYPE.COMPLETION:
                        var requesterRole = approval.RequestedBy.HasValue
                            ? await _baseRepo.GetUserRole(approval.RequestedBy.Value)
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
                                bool isAssignedManager = await _baseRepo.IsUserAssignedToGoal(
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

                        Log.Information(
                            "ClosePendingApproval | COMPLETION decision | GoalType={GoalType} | RequesterRole={RequesterRole} | ShouldComplete={ShouldComplete}",
                            goal.GoalType,
                            requesterRole,
                            shouldCompleteGoal
                        );

                        if (shouldCompleteGoal)
                        {
                            goal.Goalstatus = GOAL_STATUS.COMPLETED;
                            await _goalRepo.UpdateGoal(goal);
                            Log.Information("ClosePendingApproval | Goal COMPLETED | GoalId={GoalId}", goal.GoalId);
                        }
                        break;

                    case APPROVAL_TYPE.TASK_ACKNOWLEDGMENT:
                        if (approval.RequestedBy.HasValue)
                        {
                            var assignment = await _baseRepo.GetGoalAssignment(
                                goal.GoalId,
                                approval.RequestedBy.Value
                            );

                            if (assignment != null)
                            {
                                assignment.IsAcknowledged = true;
                                assignment.AcknowledgedOn = DateTime.UtcNow;
                                assignment.AcknowledgedBy = approverEmployeeMasterId;
                                await _goalRepo.UpdateGoalAssignment(assignment);
                                Log.Information(
                                    "ClosePendingApproval | Assignment acknowledged | GoalId={GoalId} | AssigneeId={AssigneeId}",
                                    goal.GoalId,
                                    approval.RequestedBy.Value
                                );
                            }
                        }
                        break;

                    case APPROVAL_TYPE.REOPENING:
                        if (!approvalDesicionDetails.NewDeadline.HasValue)
                        {
                            Log.Warning("ClosePendingApproval | REOPENING missing NewDeadline");
                            throw new BadRequestException(
                                ResponseMessages.Codes.INVALID_REQUEST,
                                "New deadline is required to approve reopening request"
                            );
                        }

                        if (approvalDesicionDetails.NewDeadline.Value <= DateTime.UtcNow)
                        {
                            Log.Warning(
                                "ClosePendingApproval | REOPENING invalid NewDeadline | NewDeadline={NewDeadline}",
                                approvalDesicionDetails.NewDeadline.Value
                            );
                            throw new BadRequestException(
                                ResponseMessages.Codes.INVALID_REQUEST,
                                $"New deadline must be in the future. Deadline must be after {DateTime.UtcNow:yyyy-MM-dd HH:mm}"
                            );
                        }

                        goal.Goalendat = approvalDesicionDetails.NewDeadline.Value;
                        goal.Goalstatus = GOAL_STATUS.REOPENED;
                        goal.ReopenedBy = approval.RequestedBy;
                        goal.ReopenedOn = DateTime.UtcNow;
                        await _goalRepo.UpdateGoal(goal);
                        Log.Information(
                            "ClosePendingApproval | Goal REOPENED | GoalId={GoalId} | NewDeadline={NewDeadline}",
                            goal.GoalId,
                            goal.Goalendat
                        );
                        break;

                    case APPROVAL_TYPE.CLOSURE:
                        goal.Goalstatus = GOAL_STATUS.CLOSED;
                        goal.ClosedBy = approverEmployeeMasterId;
                        goal.ClosedOn = DateTime.UtcNow;
                        await _goalRepo.UpdateGoal(goal);
                        Log.Information("ClosePendingApproval | Goal CLOSED | GoalId={GoalId}", goal.GoalId);
                        break;

                    case APPROVAL_TYPE.REACTIVATION:
                        goal.Goalstatus = GOAL_STATUS.OPEN;
                        await _goalRepo.UpdateGoal(goal);
                        Log.Information("ClosePendingApproval | Goal OPENED (Reactivation) | GoalId={GoalId}", goal.GoalId);
                        break;

                    default:
                        Log.Warning("ClosePendingApproval | Unknown approval type | Type={Type}", approval.ApprovalType);
                        throw new InternalServerException(
                            ResponseMessages.Codes.INTERNAL_SERVER_ERROR,
                            $"Unknown approval type: {approval.ApprovalType}"
                        );
                }
            }
            else
            {
                Log.Information(
                    "ClosePendingApproval | Processing REJECTED branch | Type={Type}",
                    approval.ApprovalType
                );

                switch (approval.ApprovalType)
                {
                    case APPROVAL_TYPE.CREATION:
                    case APPROVAL_TYPE.SELF_GOAL_ACTIVATION:
                        goal.Goalstatus = GOAL_STATUS.CLOSED;
                        await _goalRepo.UpdateGoal(goal);
                        Log.Information("ClosePendingApproval | Goal CLOSED (Creation/SelfActivation rejected) | GoalId={GoalId}", goal.GoalId);
                        break;

                    case APPROVAL_TYPE.DELEGATION:
                        Log.Information("ClosePendingApproval | Delegation rejected - no goal status change.");
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
                            await _goalRepo.UpdateGoal(goal);
                            Log.Information("ClosePendingApproval | Goal set to IN_PROGRESS after rejection | GoalId={GoalId}", goal.GoalId);
                        }
                        break;

                    case APPROVAL_TYPE.REOPENING:
                        goal.ReopenUntil = null;
                        await _goalRepo.UpdateGoal(goal);
                        Log.Information("ClosePendingApproval | ReopenUntil cleared after rejection | GoalId={GoalId}", goal.GoalId);
                        break;

                    case APPROVAL_TYPE.CLOSURE:
                        Log.Information("ClosePendingApproval | Closure rejected - no goal status change.");
                        break;

                    case APPROVAL_TYPE.REACTIVATION:
                        Log.Information("ClosePendingApproval | Reactivation rejected - no goal status change.");
                        break;
                }
            }

            await _baseRepo.SaveChanges();

            var metadata = new
            {
                ApprovalId = approvalId,
                GoalId = goal.GoalId,
                Decision = approvalDesicionDetails.Decision,
                ApprovalType = approval.ApprovalType,
                ApprovedBy = approverEmployeeMasterId,
                ApprovedOn = approval.ApprovedOn,
            };

            Log.Information(
                "ClosePendingApproval END | ApprovalId={ApprovalId} | GoalId={GoalId} | Decision={Decision} | Type={Type}",
                approvalId,
                goal.GoalId,
                approvalDesicionDetails.Decision,
                approval.ApprovalType
            );

            return ApiResponseModel.SuccessResponse(
                ResponseMessages.Codes.APPROVAL_DECIDED_SUCCESS,
                metadata
            );
        }

        public async Task<List<GoalApprovalModel>> GetPendingApprovals(
            int approverEmployeeMasterId
        )
        {
            Log.Information(
                "GetPendingApprovals START | ApproverId={ApproverId}",
                approverEmployeeMasterId
            );

            var approvals = await _repo.GetPendingApprovalsForApprover(
                approverEmployeeMasterId
            );
            var result = new List<GoalApprovalModel>();

            foreach (var approval in approvals)
            {
                var approvalModel = _mapper.Map<GoalApprovalModel>(approval);
                approvalModel.RequestedByName = await _baseService.GetEmployeeName(
                    approval.RequestedBy
                );

                var (allAttachments, proofAttachments) = await MapAttachmentsForApproval(
                    approval
                );
                approvalModel.AllAttachments = allAttachments;
                approvalModel.ProofAttachments = proofAttachments;

                result.Add(approvalModel);
            }

            Log.Information(
                "GetPendingApprovals END | ApproverId={ApproverId} | Count={Count}",
                approverEmployeeMasterId,
                result.Count
            );

            return result;
        }

        private async Task<(List<GoalAttachmentModel>, List<GoalAttachmentModel>?)> MapAttachmentsForApproval(GoalApproval approval)
        {
            Log.Debug(
                "MapAttachmentsForApproval START | ApprovalId={ApprovalId} | Type={Type}",
                approval?.ApprovalId,
                approval?.ApprovalType
            );

            var allAttachments = new List<GoalAttachmentModel>();
            List<GoalAttachmentModel>? proofAttachments = null;

            if (approval.Goal?.GoalAttachments != null)
            {
                foreach (var att in approval.Goal.GoalAttachments)
                {
                    var attachmentModel = _mapper.Map<GoalAttachmentModel>(att);
                    allAttachments.Add(attachmentModel);
                }

                if (
                    approval.ApprovalType == APPROVAL_TYPE.COMPLETION
                    || approval.ApprovalType == APPROVAL_TYPE.TASK_ACKNOWLEDGMENT
                )
                {
                    proofAttachments = allAttachments
                        .Where(att =>
                            att.LinkedApprovalId == approval.ApprovalId && att.IsProofOfCompletion
                        )
                        .ToList();
                }
            }

            Log.Debug(
                "MapAttachmentsForApproval END | ApprovalId={ApprovalId} | All={AllCount} | Proof={ProofCount}",
                approval?.ApprovalId,
                allAttachments.Count,
                proofAttachments?.Count ?? 0
            );

            return (allAttachments, proofAttachments);
        }

        public async Task<PagedApprovalsModel> GetUserApprovals(
            ApprovalQueryModel query,
            int userId,
            string userRole
        )
        {
            Log.Information(
                "GetUserApprovals START | UserId={UserId} | Role={Role} | Query={@Query}",
                userId,
                userRole,
                query
            );

            var validationResult = await _approvalQueryValidator.ValidateAsync(query);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                Log.Warning(
                    "GetUserApprovals VALIDATION_FAILED | UserId={UserId} | Errors={Errors}",
                    userId,
                    string.Join("; ", errors)
                );
                throw new BadRequestException("VALIDATION_FAILED", string.Join("; ", errors));
            }

            var baseQuery = _repo
                .GetGoalApprovalsQueryable()
                .Where(ga =>
                    ga.RequestedBy == userId
                    || ga.ApprovedBy == userId
                    || ga.Goal.CreatedBy == userId
                    || ga.Goal.GoalAssignments.Any(assignment => assignment.AssignedTo == userId)
                );

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

            if (!string.IsNullOrEmpty(query.Search))
            {
                var searchTerm = query.Search.ToLower();
                baseQuery = baseQuery.Where(ga => ga.Goal.GoalTitle.ToLower().Contains(searchTerm));
            }

            var totalCount = await _repo.Count(baseQuery);

            var approvals = await _repo.GetPaged(
                baseQuery.OrderByDescending(ga => ga.RequestedOn),
                query.Page,
                query.PageSize
            );

            var approvalModels = new List<UserGoalApprovalModel>();
            foreach (var ga in approvals)
            {
                var approvalDesicionDetails = await MapToUserGoalApprovalModel(
                    ga,
                    userId,
                    userRole
                );
                approvalModels.Add(approvalDesicionDetails);
            }

            var summary = await CalculateApprovalSummaryOptimized(userId, userRole);

            var totalPages = (int)Math.Ceiling((double)totalCount / query.PageSize);

            Log.Information(
                "GetUserApprovals END | UserId={UserId} | Returned={Count} | TotalCount={Total} | Page={Page} | TotalPages={TotalPages}",
                userId,
                approvalModels.Count,
                totalCount,
                query.Page,
                totalPages
            );

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
            Log.Debug(
                "CalculateApprovalSummaryOptimized START | UserId={UserId} | Role={Role}",
                userId,
                userRole
            );

            var baseQuery = _repo
                .GetGoalApprovalsQueryable()
                .Where(ga =>
                    ga.RequestedBy == userId
                    || ga.ApprovedBy == userId
                    || ga.Goal.CreatedBy == userId
                    || ga.Goal.GoalAssignments.Any(assignment => assignment.AssignedTo == userId)
                );

            var myPending = await _repo.Count(
                baseQuery.Where(ga =>
                    ga.ApprovalStatus == APPROVAL_STATUS.PENDING && ga.RequestedBy == userId
                )
            );

            var toReview = await _repo.Count(
                baseQuery.Where(ga =>
                    ga.ApprovalStatus == APPROVAL_STATUS.PENDING
                    && ga.ApprovedBy == userId
                    && ga.RequestedBy != userId
                )
            );

            var myRequests = await _repo.Count(
                baseQuery.Where(ga => ga.RequestedBy == userId)
            );

            var history = await _repo.Count(
                baseQuery.Where(ga => ga.ApprovalStatus != APPROVAL_STATUS.PENDING)
            );

            var total = await _repo.Count(baseQuery);

            Log.Debug(
                "CalculateApprovalSummaryOptimized END | UserId={UserId} | MyPending={MyPending} | ToReview={ToReview} | MyRequests={MyRequests} | History={History} | Total={Total}",
                userId,
                myPending,
                toReview,
                myRequests,
                history,
                total
            );

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
            var role = APPROVAL_USER_ROLE.OBSERVER;

            if (approval.RequestedBy == userId)
                role = APPROVAL_USER_ROLE.REQUESTER;
            else if (approval.ApprovedBy == userId)
                role = APPROVAL_USER_ROLE.APPROVER;
            else if (approval.Goal?.CreatedBy == userId)
                role = APPROVAL_USER_ROLE.GOAL_CREATOR;
            else if (approval.Goal?.GoalAssignments?.Any(ga => ga.AssignedTo == userId) == true)
                role = APPROVAL_USER_ROLE.GOAL_ASSIGNEE;
            else if (
                approval.ApprovalStatus == APPROVAL_STATUS.PENDING
                && CanUserApproveTypeInMemory(approval.ApprovalType, userRole)
            )
                role = APPROVAL_USER_ROLE.POTENTIAL_APPROVER;

            Log.Debug(
                "DetermineUserRoleInApproval | ApprovalId={ApprovalId} | UserId={UserId} | ResultRole={ResultRole}",
                approval?.ApprovalId,
                userId,
                role
            );

            return role;
        }

        private bool CanUserApproveTypeInMemory(string approvalType, string userRole)
        {
            var result = approvalType switch
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

            Log.Debug(
                "CanUserApproveTypeInMemory | ApprovalType={Type} | UserRole={Role} | Result={Result}",
                approvalType,
                userRole,
                result
            );

            return result;
        }

        private bool CanUserMakeDecision(GoalApproval approval, int userId, string userRole)
        {
            var can =
                approval.ApprovalStatus == APPROVAL_STATUS.PENDING
                && approval.ApprovedBy == userId
                && CanUserApproveTypeInMemory(approval.ApprovalType, userRole)
                && approval.RequestedBy != userId;

            Log.Debug(
                "CanUserMakeDecision | ApprovalId={ApprovalId} | UserId={UserId} | Result={Result}",
                approval?.ApprovalId,
                userId,
                can
            );

            return can;
        }

        private async Task<UserGoalApprovalModel> MapToUserGoalApprovalModel(
            GoalApproval approval,
            int userId,
            string userRole
        )
        {
            Log.Debug(
                "MapToUserGoalApprovalModel START | ApprovalId={ApprovalId} | UserId={UserId}",
                approval?.ApprovalId,
                userId
            );

            var model = _mapper.Map<UserGoalApprovalModel>(approval);
            model.RequestedByName = await _baseService.GetEmployeeName(approval.RequestedBy);
            model.ApproverName = await _baseService.GetEmployeeName(approval.ApprovedBy);
            model.GoalCreatedByName = await _baseService.GetEmployeeName(
                approval.Goal?.CreatedBy
            );

            if (approval.ApprovedBy.HasValue)
            {
                model.ApproverRole = await _baseRepo.GetUserRole(approval.ApprovedBy.Value);
            }

            model.GoalAssignees = await MapGoalAssignees(approval.Goal?.GoalAssignments);

            var (allAttachments, proofAttachments) = await MapAllAttachments(approval);
            model.AllAttachments = allAttachments;
            model.ProofAttachments = proofAttachments;

            model.UserRole = DetermineUserRoleInApproval(approval, userId, userRole);
            model.CanMakeDecision = CanUserMakeDecision(approval, userId, userRole);
            model.UserContext = GenerateUserContext(approval, userId, userRole);

            Log.Debug(
                "MapToUserGoalApprovalModel END | ApprovalId={ApprovalId} | UserId={UserId} | AllAttachments={All} | ProofAttachments={Proof}",
                approval?.ApprovalId,
                userId,
                model.AllAttachments?.Count ?? 0,
                model.ProofAttachments?.Count ?? 0
            );

            return model;
        }

        private async Task<List<AssigneeModel>> MapGoalAssignees(
            ICollection<GoalAssignment>? assignments
        )
        {
            Log.Debug(
                "MapGoalAssignees START | AssignmentsIn={Count}",
                assignments?.Count ?? 0
            );

            var assignees = new List<AssigneeModel>();

            if (assignments != null)
            {
                foreach (var assignment in assignments)
                {
                    if (assignment.AssignedTo.HasValue)
                    {
                        var assignee = _mapper.Map<AssigneeModel>(assignment);

                        assignee.Name = await _baseService.GetEmployeeName(
                            assignment.AssignedTo
                        );
                        assignee.Role = await _baseRepo.GetUserRole(
                            assignment.AssignedTo.Value
                        );

                        assignees.Add(assignee);
                    }
                }
            }

            Log.Debug("MapGoalAssignees END | AssigneesOut={Count}", assignees.Count);

            return assignees;
        }

        private async Task<(List<GoalAttachmentModel>, List<GoalAttachmentModel>)> MapAllAttachments(GoalApproval approval)
        {
            Log.Debug(
                "MapAllAttachments START | ApprovalId={ApprovalId}",
                approval?.ApprovalId
            );

            var allAttachments = new List<GoalAttachmentModel>();
            var proofAttachments = new List<GoalAttachmentModel>();

            if (approval.Goal?.GoalAttachments != null)
            {
                foreach (var att in approval.Goal.GoalAttachments)
                {
                    var attachmentModel = _mapper.Map<GoalAttachmentModel>(att);

                    attachmentModel.AttachedByName = await _baseService.GetEmployeeName(
                        att.AttachedBy
                    );

                    allAttachments.Add(attachmentModel);

                    if (
                        (att.IsProofOfCompletion ?? true)
                        && att.LinkedApprovalId == approval.ApprovalId
                    )
                    {
                        proofAttachments.Add(attachmentModel);
                    }
                }
            }

            Log.Debug(
                "MapAllAttachments END | ApprovalId={ApprovalId} | All={AllCount} | Proof={ProofCount}",
                approval?.ApprovalId,
                allAttachments.Count,
                proofAttachments.Count
            );

            return (allAttachments, proofAttachments);
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

            var final = contexts.Any() ? string.Join("; ", contexts) : "Related to your goals or team";

            Log.Debug(
                "GenerateUserContext | ApprovalId={ApprovalId} | UserId={UserId} | Context='{Context}'",
                approval?.ApprovalId,
                userId,
                final
            );

            return final;
        }
    }
}