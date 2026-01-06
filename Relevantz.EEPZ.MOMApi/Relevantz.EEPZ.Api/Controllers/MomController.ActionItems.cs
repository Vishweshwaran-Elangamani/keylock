using Microsoft.AspNetCore.Mvc;
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
        public async Task<ActionResult> UpdateActionItemStatus(int actionItemId, [FromBody] string status)
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();

                var result = await _momService.UpdateActionItemStatusAsync(actionItemId, status, employeeId);

                if (!result)
                    return NotFound(new { success = false, message = "Action item not found" });

                return Ok(new { success = true, message = "Action item status updated successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get action items assigned to the current user
        /// </summary>
        [HttpGet("action-items/my-tasks")]
        public async Task<ActionResult<List<ActionItemResponseDto>>> GetMyActionItems()
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var result = await _momService.GetMyActionItemsAsync(employeeId);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get action items assigned by the current user
        /// </summary>
        [HttpGet("action-items/assigned-by-me")]
        public async Task<ActionResult<List<ActionItemResponseDto>>> GetActionItemsAssignedByMe()
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var result = await _momService.GetActionItemsAssignedByMeAsync(employeeId);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get overdue action items for the current user
        /// </summary>
        [HttpGet("action-items/overdue")]
        public async Task<ActionResult<List<ActionItemResponseDto>>> GetOverdueActionItems()
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var result = await _momService.GetOverdueActionItemsAsync(employeeId);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}
