using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
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
        [Authorize(Roles = AppConstants.Roles.HR)]
        public async Task<ActionResult<ApiResponse<PaginatedMomResponseDto>>> GetAllMomsForHR(
            [FromQuery] string? searchTerm = null,
            [FromQuery] string? meetingType = null,
            [FromQuery] int? departmentId = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            var correlationId = HttpContext.TraceIdentifier;

            if (pageNumber < 1 || pageSize < 1 || pageSize > 100)
            {
                return BadRequest(ApiResponse<PaginatedMomResponseDto>.ErrorResponse(
                    AppConstants.ExceptionMessages.InvalidPagination,
                    correlationId));
            }

            if (startDate.HasValue && endDate.HasValue && startDate.Value.Date > endDate.Value.Date)
            {
                return BadRequest(ApiResponse<PaginatedMomResponseDto>.ErrorResponse(
                    AppConstants.ExceptionMessages.InvalidDateRange,
                    correlationId));
            }

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

            Response.Headers.Add("X-Correlation-Id", correlationId);

            return Ok(ApiResponse<PaginatedMomResponseDto>.SuccessResponse(
                result,
                AppConstants.ResponseMessages.MomsRetrievedSuccessfully,
                correlationId));
        }
    }
}
