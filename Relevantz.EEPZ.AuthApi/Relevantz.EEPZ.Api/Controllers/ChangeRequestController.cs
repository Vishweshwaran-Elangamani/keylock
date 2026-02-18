using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Globalization;
using System.Linq;
using System.Security.Claims;
using Relevantz.EEPZ.Common.Constants;

namespace Relevantz.EEPZ.Api.Controllers
{
    /// <summary>
    /// Provides endpoints for submitting, processing, viewing,
    /// and managing user change requests within the system.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChangeRequestController : ControllerBase
    {
        private readonly IChangeRequestService _changeRequestService;

        /// <summary>
        /// Initializes a new instance of <see cref="ChangeRequestController"/>.
        /// </summary>
        /// <param name="changeRequestService">Service that handles change request operations.</param>
        public ChangeRequestController(IChangeRequestService changeRequestService)
        {
            _changeRequestService = changeRequestService;
        }

        // ---------------------------------------------------------------------
        // Helpers
        // ---------------------------------------------------------------------

        /// <summary>
        /// Tries to read a positive integer user id from the NameIdentifier claim.
        /// Returns true only when present and valid (> 0).
        /// </summary>
        private bool TryGetUserId(out int userId)
        {
            userId = default;

            var claimValue = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(claimValue))
                return false;

            if (!int.TryParse(claimValue, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed))
                return false;

            if (parsed <= 0)
                return false;

            userId = parsed;
            return true;
        }

        /// <summary>
        /// Standardized unauthorized response when the identity is missing/invalid.
        /// </summary>
        private IActionResult UnauthorizedIdentityResponse()
        {
            return Unauthorized(ApiResponseDto<string>.FailureResponse(
                message: "User identity is missing or invalid.",
                errors: new List<string> { "NameIdentifier claim not found or invalid." }
            ));
        }

        /// <summary>
        /// Standardized bad request response from ModelState errors.
        /// </summary>
        private IActionResult ValidationProblemResponse()
        {
            var errors = ModelState.Values
                                   .SelectMany(v => v.Errors)
                                   .Select(e => string.IsNullOrWhiteSpace(e.ErrorMessage) ? e.Exception?.Message ?? "Validation error" : e.ErrorMessage)
                                   .ToList();

            return BadRequest(ApiResponseDto<string>.FailureResponse(
                message: "Validation failed.",
                errors: errors
            ));
        }

        // ---------------------------------------------------------------------
        // Actions
        // ---------------------------------------------------------------------

        /// <summary>
        /// Submits a new change request for the logged-in user.
        /// </summary>
        /// <param name="request">The change request details submitted by the user.</param>
        /// <returns>
        /// 200 OK if created successfully,
        /// 400 Bad Request if validation fails,
        /// 401 Unauthorized if user id claim is missing/invalid.
        /// </returns>
        [HttpPost("submit")]
        public async Task<IActionResult> SubmitChangeRequest([FromBody] ChangeRequestDto request)
        {
            if (!TryGetUserId(out var userId))
                return UnauthorizedIdentityResponse();

            if (!ModelState.IsValid)
                return ValidationProblemResponse();

            var result = await _changeRequestService.SubmitChangeRequestAsync(userId, request);
            return Ok(ApiResponseDto<ChangeRequestResponseDto>.SuccessResponse(result, Constants.Messages.ChangeRequestSubmitted));
        }

        /// <summary>
        /// Processes a pending change request (approve or reject).
        /// Admin only.
        /// </summary>
        /// <param name="request">Payload containing request ID and decision information.</param>
        /// <returns>
        /// 200 OK on success,
        /// 400 Bad Request if validation fails,
        /// 401 Unauthorized if admin id claim is missing/invalid.
        /// </returns>
        [Authorize(Roles = "Admin")]
        [HttpPost("process")]
        public async Task<IActionResult> ProcessChangeRequest([FromBody] ProcessChangeRequestDto request)
        {
            if (!TryGetUserId(out var adminUserId))
                return UnauthorizedIdentityResponse();

            if (!ModelState.IsValid)
                return ValidationProblemResponse();

            var result = await _changeRequestService.ProcessChangeRequestAsync(request, adminUserId);
            return Ok(ApiResponseDto<ChangeRequestResponseDto>.SuccessResponse(result, Constants.Messages.ChangeRequestProcessed));
        }

        /// <summary>
        /// Retrieves all pending change requests.
        /// Admin only.
        /// </summary>
        /// <returns>
        /// 200 OK with a list of pending change requests.
        /// </returns>
        [Authorize(Roles = "Admin")]
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingRequests()
        {
            var result = await _changeRequestService.GetPendingRequestsAsync();
            return Ok(ApiResponseDto<List<ChangeRequestResponseDto>>.SuccessResponse(result, "Pending requests retrieved successfully"));
        }

        /// <summary>
        /// Retrieves all change requests submitted by the logged-in user.
        /// </summary>
        /// <returns>
        /// 200 OK with the user's change request history,
        /// 401 Unauthorized if user id claim is missing/invalid.
        /// </returns>
        [HttpGet("my-requests")]
        public async Task<IActionResult> GetMyChangeRequests()
        {
            if (!TryGetUserId(out var userId))
                return UnauthorizedIdentityResponse();

            var result = await _changeRequestService.GetUserChangeRequestsAsync(userId);
            return Ok(ApiResponseDto<List<ChangeRequestResponseDto>>.SuccessResponse(result, "User change requests retrieved successfully"));
        }

        /// <summary>
        /// Retrieves all change requests in the system.
        /// Admin only.
        /// </summary>
        /// <returns>
        /// 200 OK with the full change request list.
        /// </returns>
        [Authorize(Roles = "Admin")]
        [HttpGet("all")]
        public async Task<IActionResult> GetAllChangeRequests()
        {
            var result = await _changeRequestService.GetAllChangeRequestsAsync();
            return Ok(ApiResponseDto<List<ChangeRequestResponseDto>>.SuccessResponse(result, "All change requests retrieved successfully"));
        }

        /// <summary>
        /// Cancels a specific change request submitted by the logged-in user.
        /// </summary>
        /// <param name="id">The identifier of the request to cancel.</param>
        /// <returns>
        /// 200 OK if cancelled successfully,
        /// 401 Unauthorized if user id claim is missing/invalid.
        /// </returns>
        [HttpDelete("cancel/{id}")]
        public async Task<IActionResult> CancelChangeRequest(int id)
        {
            if (!TryGetUserId(out var userId))
                return UnauthorizedIdentityResponse();

            var result = await _changeRequestService.CancelChangeRequestAsync(userId, id);
            return Ok(ApiResponseDto<bool>.SuccessResponse(result, "Change request cancelled successfully"));
        }

        /// <summary>
        /// Checks whether the logged-in user has any pending change requests.
        /// </summary>
        /// <returns>
        /// 200 OK with the pending request details or null if none exists,
        /// 401 Unauthorized if user id claim is missing/invalid.
        /// </returns>
        [HttpGet("has-pending")]
        public async Task<IActionResult> HasPendingRequest()
        {
            if (!TryGetUserId(out var userId))
                return UnauthorizedIdentityResponse();

            var result = await _changeRequestService.HasPendingRequestAsync(userId);
            if (result != null)
            {
                return Ok(ApiResponseDto<ChangeRequestResponseDto?>.SuccessResponse(result, "Pending request found"));
            }

            return Ok(ApiResponseDto<ChangeRequestResponseDto?>.SuccessResponse(null, "No pending request found"));
        }
    }
}