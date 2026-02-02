using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Core.Services.Interface;
using Serilog;
using ILogger = Microsoft.Extensions.Logging.ILogger;

namespace Relevantz.EEPZ.Api.Controllers.Goals
{
    /// <summary>
    /// Controller for managing goal approval workflows, including creating requests, closing approvals,
    /// retrieving pending approvals, and querying user-specific approvals.
    /// </summary>
    public class GoalApprovalsController : BaseGoalController
    {
        protected new readonly IGoalApprovalsService _service;
        protected readonly IBaseGoalService _baseService;

        public GoalApprovalsController(
            IGoalApprovalsService service,
            IBaseGoalService baseService,
            ILogger<GoalApprovalsController> logger
        )
            : base(baseService, logger)
        {
            _service = service;
            _baseService = baseService;

            Log.Debug("GoalApprovalsController initialized.");
        }

        /// <summary>
        /// Creates a new approval request for a specific goal.
        /// </summary>
        [HttpPost("api/goals/{goalId}")]
        public async Task<IActionResult> CreateApprovalRequest(
            int goalId,
            [FromBody] CreateApprovalRequestModel request
        )
        {
            var userId = GetEmpMasterId();
            var role = GetUserRole();

            Log.Information(
                "CreateApprovalRequest START | GoalId={GoalId} | UserId={UserId} | Role={Role}",
                goalId,
                userId,
                role
            );

            var result = await _service.CreateApprovalRequest(goalId, request, userId, role);

            Log.Information(
                "CreateApprovalRequest END | GoalId={GoalId} | UserId={UserId} | Success={Success}",
                goalId,
                userId,
                result.Success
            );

            return Ok(result);
        }

        /// <summary>
        /// Closes a pending approval request for a specific goal approval ID.
        /// </summary>
        [HttpPut("api/goals/approval/{approvalId}")]
        [Authorize(
            Roles = $"{USER_ROLE.MANAGER},{USER_ROLE.DEPARTMENT_HEAD},{USER_ROLE.LEADERSHIP}"
        )]
        public async Task<IActionResult> ClosePendingApproval(
            int approvalId,
            [FromBody] ApprovalDesicionModel desicion
        )
        {
            var userId = GetEmpMasterId();
            var role = GetUserRole();

            Log.Information(
                "ClosePendingApproval START | ApprovalId={ApprovalId} | UserId={UserId} | Role={Role} | Decision={Decision}",
                approvalId,
                userId,
                role
            );

            var result = await _service.ClosePendingApproval(
                approvalId,
                desicion,
                userId,
                role
            );

            Log.Information(
                "ClosePendingApproval END | ApprovalId={ApprovalId} | UserId={UserId} | Success={Success}",
                approvalId,
                userId,
                result.Success
            );

            return Ok(result);
        }

        /// <summary>
        /// Retrieves all pending approval requests assigned to the current user.
        /// </summary>
        [HttpGet("api/goals/pending")]
        [Authorize(
            Roles = $"{USER_ROLE.MANAGER},{USER_ROLE.DEPARTMENT_HEAD},{USER_ROLE.LEADERSHIP}"
        )]
        public async Task<IActionResult> PendingApprovals()
        {
            var userId = GetEmpMasterId();

            Log.Information(
                "PendingApprovals START | ApproverId={ApproverId}",
                userId
            );

            var approvals = await _service.GetPendingApprovals(userId);

            Log.Information(
                "PendingApprovals END | ApproverId={ApproverId} | PendingCount={PendingCount}",
                userId,
                approvals.Count
            );

            var response = ApiResponseModel<List<GoalApprovalModel>>.SuccessResponse(
                ResponseMessages.Codes.APPROVAL_RETRIEVED_SUCCESS,
                approvals,
                new { PendingCount = approvals.Count, ApproverId = userId }
            );

            return Ok(response);
        }

        /// <summary>
        /// Retrieves approvals for the current user based on query filters.
        /// </summary>
        [HttpGet("api/goals/fetch-approvals")]
        public async Task<IActionResult> GetUserApprovals([FromQuery] ApprovalQueryModel query)
        {
            var userId = GetEmpMasterId();
            var role = GetUserRole();

            Log.Information(
                "GetUserApprovals START | UserId={UserId} | Role={Role} | Filters={@Query}",
                userId,
                role,
                query
            );

            var approvals = await _service.GetUserApprovals(query, userId, role);

            Log.Information(
                "GetUserApprovals END | UserId={UserId} | Role={Role} | TotalCount={TotalCount}",
                userId,
                role,
                approvals?.TotalCount
            );

            var response = ApiResponseModel<PagedApprovalsModel>.SuccessResponse(
                ResponseMessages.Codes.APPROVAL_RETRIEVED_SUCCESS,
                approvals,
                new { UserId = userId, Role = role }
            );

            return Ok(response);
        }
    }
}