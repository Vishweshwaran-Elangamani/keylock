using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.Services.Interfaces;
using System.Security.Claims;

namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public partial class MomController : ControllerBase
    {
        private readonly IMomService _momService;

        public MomController(IMomService momService)
        {
            _momService = momService;
        }

        /// <summary>
        /// Create a new MOM
        /// </summary>
        [HttpPost("create")]
        public async Task<ActionResult<ApiResponse<MomResponseDto>>> CreateMom([FromBody] CreateMomDto createMomDto)
        {
            var correlationId = HttpContext.TraceIdentifier;

            var employeeId = GetEmployeeIdFromClaims();
            var role = GetRoleFromClaims();

            var result = await _momService.CreateMomAsync(createMomDto, employeeId, role);

            Response.Headers.Add("X-Correlation-Id", correlationId);

            return Ok(ApiResponse<MomResponseDto>.SuccessResponse(
                result,
                AppConstants.ResponseMessages.MomCreatedSuccessfully,
                correlationId));
        }

        /// <summary>
        /// Update an existing MOM
        /// </summary>
        [HttpPut("update")]
        public async Task<ActionResult<ApiResponse<MomResponseDto>>> UpdateMom([FromBody] UpdateMomDto updateMomDto)
        {
            var correlationId = HttpContext.TraceIdentifier;

            var employeeId = GetEmployeeIdFromClaims();
            var role = GetRoleFromClaims();

            var result = await _momService.UpdateMomAsync(updateMomDto, employeeId, role);

            Response.Headers.Add("X-Correlation-Id", correlationId);

            return Ok(ApiResponse<MomResponseDto>.SuccessResponse(
                result,
                AppConstants.ResponseMessages.MomUpdatedSuccessfully,
                correlationId));
        }

        /// <summary>
        /// Get MOMs submitted by the current user
        /// </summary>
        [HttpGet("my-moms")]
        [Authorize(Roles = AppConstants.Roles.Manager + "," + AppConstants.Roles.Employee)]
        public async Task<ActionResult<ApiResponse<List<MomResponseDto>>>> GetMyMoms()
        {
            var correlationId = HttpContext.TraceIdentifier;

            var employeeId = GetEmployeeIdFromClaims();
            var result = await _momService.GetMomsSubmittedByEmployeeAsync(employeeId);

            Response.Headers.Add("X-Correlation-Id", correlationId);

            return Ok(ApiResponse<List<MomResponseDto>>.SuccessResponse(
                result,
                AppConstants.ResponseMessages.MomsRetrievedSuccessfully,
                correlationId));
        }

        /// <summary>
        /// Get a specific MOM by ID
        /// </summary>
        [HttpGet("{momId:int}")]
        public async Task<ActionResult<ApiResponse<MomResponseDto>>> GetMomById(int momId)
        {
            var correlationId = HttpContext.TraceIdentifier;

            if (momId <= 0)
            {
                return BadRequest(ApiResponse<MomResponseDto>.ErrorResponse(
                    AppConstants.ExceptionMessages.InvalidArgument,
                    correlationId));
            }

            var result = await _momService.GetMomByIdAsync(momId);

            if (result == null)
            {
                return NotFound(ApiResponse<MomResponseDto>.ErrorResponse(
                    AppConstants.ExceptionMessages.MomNotFound,
                    correlationId));
            }

            Response.Headers.Add("X-Correlation-Id", correlationId);

            return Ok(ApiResponse<MomResponseDto>.SuccessResponse(
                result,
                AppConstants.ResponseMessages.MomRetrievedSuccessfully,
                correlationId));
        }

        /// <summary>
        /// Delete a MOM
        /// </summary>
        [HttpDelete("{momId:int}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteMom(int momId)
        {
            var correlationId = HttpContext.TraceIdentifier;

            if (momId <= 0)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(
                    AppConstants.ExceptionMessages.InvalidArgument,
                    correlationId));
            }

            var employeeId = GetEmployeeIdFromClaims();
            var role = GetRoleFromClaims();

            var result = await _momService.DeleteMomAsync(momId, employeeId, role);

            if (!result)
            {
                return NotFound(ApiResponse<object>.ErrorResponse(
                    AppConstants.ExceptionMessages.MomNotFound,
                    correlationId));
            }

            Response.Headers.Add("X-Correlation-Id", correlationId);

            return Ok(ApiResponse<object>.SuccessResponse(
                null,
                AppConstants.ResponseMessages.MomDeletedSuccessfully,
                correlationId));
        }

        #region Private Helper Methods

        /// <summary>
        /// Extract employee ID from JWT claims
        /// </summary>
        private int GetEmployeeIdFromClaims()
        {
            var employeeIdClaim = User.FindFirst(AppConstants.ClaimTypes.EmployeeId);

            if (employeeIdClaim != null && int.TryParse(employeeIdClaim.Value, out int employeeId))
                return employeeId;

            var subClaim = User.FindFirst(AppConstants.ClaimTypes.Sub) ??
                           User.FindFirst(ClaimTypes.NameIdentifier);

            if (subClaim != null && int.TryParse(subClaim.Value, out int subId))
                return subId;

            throw new UnauthorizedAccessException(AppConstants.ExceptionMessages.UserIdNotFoundInToken);
        }

        /// <summary>
        /// Extract role from JWT claims
        /// </summary>
        private string GetRoleFromClaims()
        {
            var roleClaim =
                User.FindFirst(AppConstants.ClaimTypes.MsRoleSchema) ??
                User.FindFirst(ClaimTypes.Role) ??
                User.FindFirst(AppConstants.ClaimTypes.Role);

            return roleClaim?.Value ?? AppConstants.Roles.Employee;
        }

        #endregion
    }
}
