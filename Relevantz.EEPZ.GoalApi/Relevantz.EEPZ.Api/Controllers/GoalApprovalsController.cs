using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Enums;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Core.Services.Interface;
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
        }

        /// <summary>
        /// Creates a new approval request for a specific goal.
        /// </summary>
        [HttpPost("api/goal-approvals/{goalId}")]
        public async Task<IActionResult> CreateApprovalRequest(
            int goalId,
            [FromBody] CreateApprovalRequestModel request
        )
        {
            var userId = GetEmpMasterId();
            var role = GetUserRole();

            var result = await _service.CreateApprovalRequestAsync(goalId, request, userId, role);

            return Ok(result);
        }

        /// <summary>
        /// Closes a pending approval request for a specific goal approval ID.
        /// </summary>
        [HttpPut("api/goal-approvals/{approvalId}")]
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

            var result = await _service.ClosePendingApprovalAsync(approvalId, desicion, userId, role);

            return Ok(result);
        }

        /// <summary>
        /// Retrieves all pending approval requests assigned to the current user.
        /// </summary>
        [HttpGet("api/goal-approvals/pending")]
        [Authorize(
            Roles = $"{USER_ROLE.MANAGER},{USER_ROLE.DEPARTMENT_HEAD},{USER_ROLE.LEADERSHIP}"
        )]
        public async Task<IActionResult> PendingApprovals()
        {
            var userId = GetEmpMasterId();

            var approvals = await _service.GetPendingApprovalsAsync(userId);

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
        [HttpGet("api/goal-approvals/query")]
        public async Task<IActionResult> GetUserApprovals([FromQuery] ApprovalQueryModel query)
        {
            var userId = GetEmpMasterId();
            var role = GetUserRole();

            var approvals = await _service.GetUserApprovalsAsync(query, userId, role);

            var response = ApiResponseModel<PagedApprovalsModel>.SuccessResponse(
                ResponseMessages.Codes.APPROVAL_RETRIEVED_SUCCESS,
                approvals,
                new { UserId = userId, Role = role }
            );

            return Ok(response);
        }
    }
}
