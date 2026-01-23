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
