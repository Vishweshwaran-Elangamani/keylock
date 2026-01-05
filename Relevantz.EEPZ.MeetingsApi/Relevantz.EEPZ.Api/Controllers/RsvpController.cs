using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.DBContexts;

namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/Rsvp")]
    [Authorize]
    [Produces("application/json")]
    public class RsvpController : ControllerBase
    {
        private readonly IMeetingService _meetingService;
        private readonly EEPZDbContext _context;
        private readonly ILogger<RsvpController> _logger;

        public RsvpController(
            IMeetingService meetingService,
            EEPZDbContext context,
            ILogger<RsvpController> logger)
        {
            _meetingService = meetingService ?? throw new ArgumentNullException(nameof(meetingService));
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpGet("my-invitations")]
        [ProducesResponseType(typeof(ApiResponse<List<MeetingInvitationDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ApiResponse<List<MeetingInvitationDto>>>> GetMyMeetingInvitations(
            CancellationToken cancellationToken = default)
        {
            var correlationId = HttpContext.TraceIdentifier;
            var stopwatch = Stopwatch.StartNew();

            try
            {
                var employeeId = await GetEmployeeIdFromClaimsAsync(cancellationToken);

                _logger.LogInformation(
                    "Fetching meeting invitations for employee {EmployeeId}. CorrelationId: {CorrelationId}",
                    employeeId,
                    correlationId);

                var result = await _meetingService.GetMyMeetingInvitationsAsync(employeeId, cancellationToken);

                stopwatch.Stop();
                _logger.LogInformation(
                    "Retrieved {Count} invitations in {ElapsedMs}ms. CorrelationId: {CorrelationId}",
                    result.Count,
                    stopwatch.ElapsedMilliseconds,
                    correlationId);

                Response.Headers.Add("X-Correlation-Id", correlationId);
                return Ok(ApiResponse<List<MeetingInvitationDto>>.SuccessResponse(
                    result,
                    "Invitations retrieved successfully",
                    correlationId));
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized access in GetMyMeetingInvitations. CorrelationId: {CorrelationId}", correlationId);
                return StatusCode(StatusCodes.Status401Unauthorized,
                    ApiResponse<List<MeetingInvitationDto>>.ErrorResponse(ex.Message, correlationId));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in GetMyMeetingInvitations. CorrelationId: {CorrelationId}", correlationId);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    ApiResponse<List<MeetingInvitationDto>>.ErrorResponse("An unexpected error occurred", correlationId));
            }
        }

        [HttpPost("submit")]
        [ProducesResponseType(typeof(ApiResponse<MeetingInvitationDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ApiResponse<MeetingInvitationDto>>> SubmitRsvp(
            [FromBody] RsvpResponseDto rsvpDto,
            CancellationToken cancellationToken = default)
        {
            var correlationId = HttpContext.TraceIdentifier;
            var stopwatch = Stopwatch.StartNew();

            try
            {
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid model state for SubmitRsvp. CorrelationId: {CorrelationId}", correlationId);
                    var errors = ModelState
                        .Where(x => x.Value?.Errors.Count > 0)
                        .ToDictionary(
                            kvp => kvp.Key,
                            kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>()
                        );
                    return BadRequest(ApiResponse<MeetingInvitationDto>.ErrorResponse("Validation failed", correlationId, errors));
                }

                var employeeId = await GetEmployeeIdFromClaimsAsync(cancellationToken);

                _logger.LogInformation(
                    "Submitting RSVP for meeting {MeetingId} by employee {EmployeeId}. Status: {Status}, CorrelationId: {CorrelationId}",
                    rsvpDto.MeetingId,
                    employeeId,
                    rsvpDto.RsvpStatus,
                    correlationId);

                var result = await _meetingService.SubmitRsvpAsync(rsvpDto, employeeId, cancellationToken);

                stopwatch.Stop();
                _logger.LogInformation(
                    "RSVP submitted successfully in {ElapsedMs}ms. MeetingId: {MeetingId}, CorrelationId: {CorrelationId}",
                    stopwatch.ElapsedMilliseconds,
                    rsvpDto.MeetingId,
                    correlationId);

                Response.Headers.Add("X-Correlation-Id", correlationId);
                return Ok(ApiResponse<MeetingInvitationDto>.SuccessResponse(
                    result,
                    "RSVP submitted successfully",
                    correlationId));
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized access in SubmitRsvp. CorrelationId: {CorrelationId}", correlationId);
                return StatusCode(StatusCodes.Status401Unauthorized,
                    ApiResponse<MeetingInvitationDto>.ErrorResponse(ex.Message, correlationId));
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid argument in SubmitRsvp. CorrelationId: {CorrelationId}", correlationId);
                return BadRequest(ApiResponse<MeetingInvitationDto>.ErrorResponse(ex.Message, correlationId));
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Invalid operation in SubmitRsvp. CorrelationId: {CorrelationId}", correlationId);
                return BadRequest(ApiResponse<MeetingInvitationDto>.ErrorResponse(ex.Message, correlationId));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in SubmitRsvp. CorrelationId: {CorrelationId}", correlationId);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    ApiResponse<MeetingInvitationDto>.ErrorResponse("An unexpected error occurred", correlationId));
            }
        }

        [HttpPut("{meetingId:int}/update")]
        [ProducesResponseType(typeof(ApiResponse<MeetingInvitationDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ApiResponse<MeetingInvitationDto>>> UpdateRsvp(
            int meetingId,
            [FromBody] RsvpResponseDto rsvpDto,
            CancellationToken cancellationToken = default)
        {
            var correlationId = HttpContext.TraceIdentifier;
            var stopwatch = Stopwatch.StartNew();

            try
            {
                if (meetingId <= 0)
                {
                    _logger.LogWarning("Invalid meetingId: {MeetingId}. CorrelationId: {CorrelationId}", meetingId, correlationId);
                    return BadRequest(ApiResponse<MeetingInvitationDto>.ErrorResponse("Invalid meeting ID", correlationId));
                }

                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid model state for UpdateRsvp. CorrelationId: {CorrelationId}", correlationId);
                    var errors = ModelState
                        .Where(x => x.Value?.Errors.Count > 0)
                        .ToDictionary(
                            kvp => kvp.Key,
                            kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>()
                        );
                    return BadRequest(ApiResponse<MeetingInvitationDto>.ErrorResponse("Validation failed", correlationId, errors));
                }

                var employeeId = await GetEmployeeIdFromClaimsAsync(cancellationToken);

                var updatedRsvpDto = new RsvpResponseDto
                {
                    MeetingId = meetingId,
                    RsvpStatus = rsvpDto.RsvpStatus,
                    RsvpComments = rsvpDto.RsvpComments
                };

                _logger.LogInformation(
                    "Updating RSVP for meeting {MeetingId} by employee {EmployeeId}. Status: {Status}, CorrelationId: {CorrelationId}",
                    meetingId,
                    employeeId,
                    rsvpDto.RsvpStatus,
                    correlationId);

                var result = await _meetingService.SubmitRsvpAsync(updatedRsvpDto, employeeId, cancellationToken);

                stopwatch.Stop();
                _logger.LogInformation(
                    "RSVP updated successfully in {ElapsedMs}ms. MeetingId: {MeetingId}, CorrelationId: {CorrelationId}",
                    stopwatch.ElapsedMilliseconds,
                    meetingId,
                    correlationId);

                Response.Headers.Add("X-Correlation-Id", correlationId);
                return Ok(ApiResponse<MeetingInvitationDto>.SuccessResponse(
                    result,
                    "RSVP updated successfully",
                    correlationId));
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized access in UpdateRsvp. CorrelationId: {CorrelationId}", correlationId);
                return StatusCode(StatusCodes.Status401Unauthorized,
                    ApiResponse<MeetingInvitationDto>.ErrorResponse(ex.Message, correlationId));
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid argument in UpdateRsvp. CorrelationId: {CorrelationId}", correlationId);
                return BadRequest(ApiResponse<MeetingInvitationDto>.ErrorResponse(ex.Message, correlationId));
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Invalid operation in UpdateRsvp. CorrelationId: {CorrelationId}", correlationId);
                return BadRequest(ApiResponse<MeetingInvitationDto>.ErrorResponse(ex.Message, correlationId));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in UpdateRsvp. CorrelationId: {CorrelationId}", correlationId);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    ApiResponse<MeetingInvitationDto>.ErrorResponse("An unexpected error occurred", correlationId));
            }
        }

        [HttpGet("pending-count")]
        [ProducesResponseType(typeof(ApiResponse<int>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ApiResponse<int>>> GetPendingRsvpCount(
            CancellationToken cancellationToken = default)
        {
            var correlationId = HttpContext.TraceIdentifier;
            var stopwatch = Stopwatch.StartNew();

            try
            {
                var employeeId = await GetEmployeeIdFromClaimsAsync(cancellationToken);

                _logger.LogInformation(
                    "Fetching pending RSVP count for employee {EmployeeId}. CorrelationId: {CorrelationId}",
                    employeeId,
                    correlationId);

                var count = await _meetingService.GetPendingRsvpCountAsync(employeeId, cancellationToken);

                stopwatch.Stop();
                _logger.LogInformation(
                    "Pending RSVP count retrieved in {ElapsedMs}ms. Count: {Count}, CorrelationId: {CorrelationId}",
                    stopwatch.ElapsedMilliseconds,
                    count,
                    correlationId);

                Response.Headers.Add("X-Correlation-Id", correlationId);
                return Ok(ApiResponse<int>.SuccessResponse(
                    count,
                    "Pending RSVP count retrieved successfully",
                    correlationId));
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized access in GetPendingRsvpCount. CorrelationId: {CorrelationId}", correlationId);
                return StatusCode(StatusCodes.Status401Unauthorized,
                    ApiResponse<int>.ErrorResponse(ex.Message, correlationId));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in GetPendingRsvpCount. CorrelationId: {CorrelationId}", correlationId);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    ApiResponse<int>.ErrorResponse("An unexpected error occurred", correlationId));
            }
        }

        [HttpGet("meeting/{meetingId:int}/summary")]
        [Authorize(Roles = "Manager")]
        [ProducesResponseType(typeof(ApiResponse<MeetingRsvpSummaryDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ApiResponse<MeetingRsvpSummaryDto>>> GetMeetingRsvpSummary(
            int meetingId,
            CancellationToken cancellationToken = default)
        {
            var correlationId = HttpContext.TraceIdentifier;
            var stopwatch = Stopwatch.StartNew();

            try
            {
                if (meetingId <= 0)
                {
                    _logger.LogWarning("Invalid meetingId: {MeetingId}. CorrelationId: {CorrelationId}", meetingId, correlationId);
                    return BadRequest(ApiResponse<MeetingRsvpSummaryDto>.ErrorResponse("Invalid meeting ID", correlationId));
                }

                var managerId = await GetEmployeeIdFromClaimsAsync(cancellationToken);
                var role = GetRoleFromClaims();

                _logger.LogInformation(
                    "Fetching RSVP summary for meeting {MeetingId} by manager {ManagerId}. CorrelationId: {CorrelationId}",
                    meetingId,
                    managerId,
                    correlationId);

                var result = await _meetingService.GetMeetingRsvpSummaryAsync(
                    meetingId,
                    managerId,
                    role,
                    cancellationToken);

                stopwatch.Stop();
                _logger.LogInformation(
                    "RSVP summary retrieved successfully in {ElapsedMs}ms. MeetingId: {MeetingId}, CorrelationId: {CorrelationId}",
                    stopwatch.ElapsedMilliseconds,
                    meetingId,
                    correlationId);

                Response.Headers.Add("X-Correlation-Id", correlationId);
                return Ok(ApiResponse<MeetingRsvpSummaryDto>.SuccessResponse(
                    result,
                    "RSVP summary retrieved successfully",
                    correlationId));
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized access in GetMeetingRsvpSummary. MeetingId: {MeetingId}, CorrelationId: {CorrelationId}", meetingId, correlationId);
                return StatusCode(StatusCodes.Status403Forbidden,
                    ApiResponse<MeetingRsvpSummaryDto>.ErrorResponse(ex.Message, correlationId));
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Invalid operation in GetMeetingRsvpSummary. MeetingId: {MeetingId}, CorrelationId: {CorrelationId}", meetingId, correlationId);
                return NotFound(ApiResponse<MeetingRsvpSummaryDto>.ErrorResponse(ex.Message, correlationId));
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid argument in GetMeetingRsvpSummary. CorrelationId: {CorrelationId}", correlationId);
                return BadRequest(ApiResponse<MeetingRsvpSummaryDto>.ErrorResponse(ex.Message, correlationId));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in GetMeetingRsvpSummary. MeetingId: {MeetingId}, CorrelationId: {CorrelationId}", meetingId, correlationId);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    ApiResponse<MeetingRsvpSummaryDto>.ErrorResponse("An unexpected error occurred", correlationId));
            }
        }

        #region Private Helper Methods

        private async Task<int> GetEmployeeIdFromClaimsAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var employeeIdClaim = User.FindFirst("empId");

                if (employeeIdClaim != null && int.TryParse(employeeIdClaim.Value, out int employeeId))
                {
                    _logger.LogDebug("EmployeeId found in empId claim: {EmployeeId}", employeeId);
                    return employeeId;
                }

                var subClaim = User.FindFirst("sub") ?? User.FindFirst(ClaimTypes.NameIdentifier);

                if (subClaim == null || !int.TryParse(subClaim.Value, out int userId))
                {
                    _logger.LogWarning("User ID not found in token claims");
                    throw new UnauthorizedAccessException("User ID not found in token");
                }

                var userAuth = await _context.Userauthentications
                    .AsNoTracking()
                    .Where(u => u.UserId == userId)
                    .Select(u => new { u.EmployeeId })
                    .FirstOrDefaultAsync(cancellationToken);

                if (userAuth == null)
                {
                    _logger.LogWarning("No user authentication record found for UserId: {UserId}", userId);
                    throw new UnauthorizedAccessException($"No user authentication record found for UserId {userId}");
                }

                if (userAuth.EmployeeId <= 0)
                {
                    _logger.LogWarning("EmployeeId not mapped for UserId: {UserId}", userId);
                    throw new UnauthorizedAccessException($"EmployeeId not mapped for UserId {userId}");
                }

                _logger.LogDebug("EmployeeId retrieved from database: {EmployeeId}", userAuth.EmployeeId);
                return userAuth.EmployeeId;
            }
            catch (Exception ex) when (!(ex is UnauthorizedAccessException))
            {
                _logger.LogError(ex, "Error retrieving EmployeeId from claims");
                throw;
            }
        }

        private string GetRoleFromClaims()
        {
            var roleClaim = User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")
                ?? User.FindFirst(ClaimTypes.Role)
                ?? User.FindFirst("role");

            if (roleClaim != null)
            {
                _logger.LogDebug("Role found in claims: {Role}", roleClaim.Value);
                return roleClaim.Value;
            }

            _logger.LogWarning("No role claim found, defaulting to Employee");
            return "Employee";
        }

        #endregion
    }
}
