using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;

namespace eepzbackend.Controllers
{
    /// <summary>
    /// Partial class containing action item management operations
    /// </summary>
    public partial class MomController
    {
        /// <summary>
        /// Update the status of an action item
        /// </summary>
        [HttpPatch("action-items/{actionItemId}/status")]
        public async Task<ActionResult<ApiResponse<object>>> UpdateActionItemStatus(
            int actionItemId,
            [FromBody] string status)
        {
            var correlationId = HttpContext.TraceIdentifier;

            var employeeId = GetEmployeeIdFromClaims();

            var result = await _momService.UpdateActionItemStatusAsync(actionItemId, status, employeeId);

            Response.Headers.Add("X-Correlation-Id", correlationId);

            if (!result)
            {
                return NotFound(ApiResponse<object>.ErrorResponse(
                    AppConstants.ExceptionMessages.ActionItemNotFound,
                    correlationId));
            }

            return Ok(ApiResponse<object>.SuccessResponse(
                null,
                AppConstants.ResponseMessages.ActionItemUpdatedSuccessfully,
                correlationId));
        }

        /// <summary>
        /// Get action items assigned to the current user
        /// </summary>
        [HttpGet("action-items/my-tasks")]
        public async Task<ActionResult<ApiResponse<List<ActionItemResponseDto>>>> GetMyActionItems()
        {
            var correlationId = HttpContext.TraceIdentifier;

            var employeeId = GetEmployeeIdFromClaims();
            var result = await _momService.GetMyActionItemsAsync(employeeId);

            Response.Headers.Add("X-Correlation-Id", correlationId);

            return Ok(ApiResponse<List<ActionItemResponseDto>>.SuccessResponse(
                result,
                AppConstants.ResponseMessages.ActionItemsRetrievedSuccessfully,
                correlationId));
        }

        /// <summary>
        /// Get action items assigned by the current user
        /// </summary>
        [HttpGet("action-items/assigned-by-me")]
        public async Task<ActionResult<ApiResponse<List<ActionItemResponseDto>>>> GetActionItemsAssignedByMe()
        {
            var correlationId = HttpContext.TraceIdentifier;

            var employeeId = GetEmployeeIdFromClaims();
            var result = await _momService.GetActionItemsAssignedByMeAsync(employeeId);

            Response.Headers.Add("X-Correlation-Id", correlationId);

            return Ok(ApiResponse<List<ActionItemResponseDto>>.SuccessResponse(
                result,
                AppConstants.ResponseMessages.ActionItemsRetrievedSuccessfully,
                correlationId));
        }

        /// <summary>
        /// Get overdue action items for the current user
        /// </summary>
        [HttpGet("action-items/overdue")]
        public async Task<ActionResult<ApiResponse<List<ActionItemResponseDto>>>> GetOverdueActionItems()
        {
            var correlationId = HttpContext.TraceIdentifier;

            var employeeId = GetEmployeeIdFromClaims();
            var result = await _momService.GetOverdueActionItemsAsync(employeeId);

            Response.Headers.Add("X-Correlation-Id", correlationId);

            return Ok(ApiResponse<List<ActionItemResponseDto>>.SuccessResponse(
                result,
                AppConstants.ResponseMessages.ActionItemsRetrievedSuccessfully,
                correlationId));
        }
    }
}
