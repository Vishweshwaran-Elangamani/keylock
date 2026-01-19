using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;

namespace eepzbackend.Controllers
{
    /// <summary>
    /// Partial class containing MOM sharing operations
    /// </summary>
    public partial class MomController
    {
        /// <summary>
        /// Share a MOM with other employees
        /// </summary>
        [HttpPost("share")]
        public async Task<ActionResult<ApiResponse<List<MomSharingResponseDto>>>> ShareMom([FromBody] ShareMomDto shareMomDto)
        {
            var correlationId = HttpContext.TraceIdentifier;

            var employeeId = GetEmployeeIdFromClaims();
            var result = await _momService.ShareMomAsync(shareMomDto, employeeId);

            Response.Headers.Add("X-Correlation-Id", correlationId);

            return Ok(ApiResponse<List<MomSharingResponseDto>>.SuccessResponse(
                result,
                AppConstants.ResponseMessages.MomSharedSuccessfully,
                correlationId));
        }

        /// <summary>
        /// Get MOMs shared by the current user
        /// </summary>
        [HttpGet("shared-by-me")]
        public async Task<ActionResult<ApiResponse<List<MomSharingResponseDto>>>> GetMomsSharedByMe()
        {
            var correlationId = HttpContext.TraceIdentifier;

            var employeeId = GetEmployeeIdFromClaims();
            var result = await _momService.GetMomsSharedByEmployeeAsync(employeeId);

            Response.Headers.Add("X-Correlation-Id", correlationId);

            return Ok(ApiResponse<List<MomSharingResponseDto>>.SuccessResponse(
                result,
                AppConstants.ResponseMessages.SharedMomsRetrievedSuccessfully,
                correlationId));
        }

        /// <summary>
        /// Get MOMs shared with the current user
        /// </summary>
        [HttpGet("shared-with-me")]
        public async Task<ActionResult<ApiResponse<List<MomResponseDto>>>> GetMomsSharedWithMe()
        {
            var correlationId = HttpContext.TraceIdentifier;

            var employeeId = GetEmployeeIdFromClaims();
            var result = await _momService.GetMomsSharedWithEmployeeAsync(employeeId);

            Response.Headers.Add("X-Correlation-Id", correlationId);

            return Ok(ApiResponse<List<MomResponseDto>>.SuccessResponse(
                result,
                AppConstants.ResponseMessages.SharedMomsRetrievedSuccessfully,
                correlationId));
        }
    }
}
