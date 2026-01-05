using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs;

namespace eepzbackend.Controllers
{
    /// <summary>
    /// Partial class containing administrative/HR operations
    /// </summary>
    public partial class MomController
    {
        /// <summary>
        /// Get all MOMs with filtering and pagination (HR only)
        /// </summary>
        [HttpGet("all-moms")]
        // [Authorize(Roles = "HR")]
        public async Task<ActionResult<PaginatedMomResponseDto>> GetAllMomsForHR(
            [FromQuery] string? searchTerm = null,
            [FromQuery] string? meetingType = null,
            [FromQuery] int? departmentId = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var employeeId = GetEmployeeIdFromClaims();
                var role = GetRoleFromClaims();

                var result = await _momService.GetAllMomsForHRAsync(
                    employeeId,
                    role,
                    searchTerm,
                    meetingType,
                    departmentId,
                    startDate,
                    endDate,
                    pageNumber,
                    pageSize);

                return Ok(new { success = true, data = result });
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
    }
}
