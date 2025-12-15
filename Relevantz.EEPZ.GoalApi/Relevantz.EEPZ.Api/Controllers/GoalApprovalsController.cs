using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Enums;
using Relevantz.EEPZ.Core.Services.Interface;
using ILogger = Microsoft.Extensions.Logging.ILogger;

namespace Relevantz.EEPZ.Api.Controllers.Goals
{
    [Route("api/goal-approvals")]
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
        /// Request approval (creation, completion, reopening, delegation)
        /// </summary>
        [HttpPost("{goalId:int}")]
        public async Task<IActionResult> RequestApproval(
            int goalId,
            [FromBody] CreateApprovalRequestDto dto
        )
        {
            try
            {
                var userId = GetEmpMasterId();
                var role = GetUserRole();

                var result = await _service.RequestApprovalAsync(goalId, dto, userId, role);

                if (result.Success)
                {
                    return Ok(result);
                }

                return result.Code switch
                {
                    ResponseMessages.Codes.GOAL_NOT_FOUND => NotFound(result),
                    ResponseMessages.Codes.GOAL_ACCESS_DENIED => Forbid(result.Message),
                    ResponseMessages.Codes.GOAL_INVALID_STATUS => BadRequest(result),
                    ResponseMessages.Codes.APPROVAL_PROOF_REQUIRED => BadRequest(result),
                    ResponseMessages.Codes.APPROVAL_PROOF_INVALID => BadRequest(result),
                    ResponseMessages.Codes.APPROVAL_NO_MANAGER => BadRequest(result),
                    ResponseMessages.Codes.INVALID_REQUEST => BadRequest(result),
                    _ => BadRequest(result),
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error requesting approval for goal {GoalId} by User {UserId}",
                    goalId,
                    GetEmpMasterId()
                );
                var response = ApiResponseDto<int>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Approve or reject an approval request
        /// </summary>
        [HttpPut("{approvalId:int}")]
        [Authorize(
            Roles = $"{USER_ROLE.MANAGER},{USER_ROLE.DEPARTMENT_HEAD},{USER_ROLE.LEADERSHIP}"
        )]
        public async Task<IActionResult> DecideApproval(
            int approvalId,
            [FromBody] DecideApprovalDto dto
        )
        {
            try
            {
                var userId = GetEmpMasterId();
                var role = GetUserRole();

                var result = await _service.DecideApprovalAsync(approvalId, dto, userId, role);

                if (result.Success)
                {
                    return Ok(result);
                }

                return result.Code switch
                {
                    ResponseMessages.Codes.APPROVAL_NOT_FOUND => NotFound(result),
                    ResponseMessages.Codes.APPROVAL_ACCESS_DENIED => Forbid(result.Message),
                    ResponseMessages.Codes.APPROVAL_ALREADY_DECIDED => Conflict(result),
                    _ => BadRequest(result),
                };
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Get pending approvals for current user (manager/Department Head/Leadership)
        /// </summary>
        [HttpGet("pending")]
        [Authorize(
            Roles = $"{USER_ROLE.MANAGER},{USER_ROLE.DEPARTMENT_HEAD},{USER_ROLE.LEADERSHIP}"
        )]
        public async Task<IActionResult> PendingApprovals()
        {
            try
            {
                var userId = GetEmpMasterId();

                var approvals = await _service.GetPendingApprovalsAsync(userId);

                var response = ApiResponseDto<List<GoalApprovalDto>>.SuccessResponse(
                    ResponseMessages.Codes.APPROVAL_RETRIEVED_SUCCESS,
                    approvals,
                    new { PendingCount = approvals.Count, ApproverId = userId }
                );

                return Ok(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<List<GoalApprovalDto>>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Get all approvals that the current user is involved in (requested, approving, or goal participant)
        /// </summary>
        [HttpGet("my")]
        public async Task<IActionResult> GetMyApprovals([FromQuery] ApprovalQueryDto query)
        {
            try
            {
                var userId = GetEmpMasterId();
                var role = GetUserRole();

                var approvals = await _service.GetUserApprovalsAsync(query, userId, role);

                var response = ApiResponseDto<PagedApprovalsDto>.SuccessResponse(
                    ResponseMessages.Codes.APPROVAL_RETRIEVED_SUCCESS,
                    approvals,
                    new { UserId = userId, Role = role }
                );

                return Ok(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<PagedApprovalsDto>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }
    }
}
