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
    #region Response Models

    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public string? CorrelationId { get; set; }
        public DateTime Timestamp { get; set; }
        public Dictionary<string, string[]>? Errors { get; set; }

        public static ApiResponse<T> SuccessResponse(T data, string message = "Success", string? correlationId = null)
        {
            return new ApiResponse<T>
            {
                Success = true,
                Message = message,
                Data = data,
                CorrelationId = correlationId,
                Timestamp = DateTime.UtcNow
            };
        }

        public static ApiResponse<T> ErrorResponse(string message, string? correlationId = null, Dictionary<string, string[]>? errors = null)
        {
            return new ApiResponse<T>
            {
                Success = false,
                Message = message,
                CorrelationId = correlationId,
                Errors = errors,
                Timestamp = DateTime.UtcNow
            };
        }
    }

    #endregion

    [ApiController]
    [Route("api/Meeting")]
    [Authorize]
    [Produces("application/json")]
    public class MeetingController : ControllerBase
    {
        private readonly IMeetingService _meetingService;
        private readonly EEPZDbContext _context;
        private readonly ILogger<MeetingController> _logger;

        public MeetingController(
            IMeetingService meetingService,
            EEPZDbContext context,
            ILogger<MeetingController> logger)
        {
            _meetingService = meetingService ?? throw new ArgumentNullException(nameof(meetingService));
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpPost("schedule")]
        [Authorize(Roles = "Manager")]
        [ProducesResponseType(typeof(ApiResponse<MeetingResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ApiResponse<MeetingResponseDto>>> ScheduleMeeting(
            [FromBody] ScheduleMeetingDto scheduleMeetingDto,
            CancellationToken cancellationToken = default)
        {
            var correlationId = HttpContext.TraceIdentifier;
            var stopwatch = Stopwatch.StartNew();

            try
            {
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid model state for ScheduleMeeting. CorrelationId: {CorrelationId}", correlationId);
                    var errors = ModelState
                        .Where(x => x.Value?.Errors.Count > 0)
                        .ToDictionary(
                            kvp => kvp.Key,
                            kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>()
                        );
                    return BadRequest(ApiResponse<MeetingResponseDto>.ErrorResponse("Validation failed", correlationId, errors));
                }

                var employeeId = await GetEmployeeIdFromUserIdAsync(cancellationToken);
                var role = GetRoleFromClaims();

                _logger.LogInformation(
                    "Scheduling meeting: {MeetingTitle} by employee {EmployeeId}. CorrelationId: {CorrelationId}",
                    scheduleMeetingDto.MeetingTitle,
                    employeeId,
                    correlationId);

                var result = await _meetingService.ScheduleMeetingAsync(
                    scheduleMeetingDto,
                    employeeId,
                    role,
                    cancellationToken);

                stopwatch.Stop();
                _logger.LogInformation(
                    "Meeting scheduled successfully in {ElapsedMs}ms. MeetingId: {MeetingId}, CorrelationId: {CorrelationId}",
                    stopwatch.ElapsedMilliseconds,
                    result.MeetingId,
                    correlationId);

                Response.Headers.Add("X-Correlation-Id", correlationId);
                return Ok(ApiResponse<MeetingResponseDto>.SuccessResponse(
                    result,
                    "Meeting scheduled successfully",
                    correlationId));
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized access in ScheduleMeeting. CorrelationId: {CorrelationId}", correlationId);
                return StatusCode(StatusCodes.Status403Forbidden,
                    ApiResponse<MeetingResponseDto>.ErrorResponse(ex.Message, correlationId));
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid argument in ScheduleMeeting. CorrelationId: {CorrelationId}", correlationId);
                return BadRequest(ApiResponse<MeetingResponseDto>.ErrorResponse(ex.Message, correlationId));
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Invalid operation in ScheduleMeeting. CorrelationId: {CorrelationId}", correlationId);
                return BadRequest(ApiResponse<MeetingResponseDto>.ErrorResponse(ex.Message, correlationId));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in ScheduleMeeting. CorrelationId: {CorrelationId}", correlationId);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    ApiResponse<MeetingResponseDto>.ErrorResponse("An unexpected error occurred", correlationId));
            }
        }

        [HttpGet("my-meetings")]
        [Authorize(Roles = "Employee,Manager")]
        [ProducesResponseType(typeof(ApiResponse<List<MeetingResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ApiResponse<List<MeetingResponseDto>>>> GetMyMeetings(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20,
            CancellationToken cancellationToken = default)
        {
            var correlationId = HttpContext.TraceIdentifier;
            var stopwatch = Stopwatch.StartNew();

            try
            {
                if (pageNumber < 1 || pageSize < 1 || pageSize > 100)
                {
                    _logger.LogWarning(
                        "Invalid pagination parameters. PageNumber: {PageNumber}, PageSize: {PageSize}, CorrelationId: {CorrelationId}",
                        pageNumber,
                        pageSize,
                        correlationId);
                    return BadRequest(ApiResponse<List<MeetingResponseDto>>.ErrorResponse(
                        "PageNumber must be >= 1 and PageSize must be between 1 and 100",
                        correlationId));
                }

                var employeeId = await GetEmployeeIdFromUserIdAsync(cancellationToken);

                _logger.LogInformation(
                    "Fetching meetings for employee {EmployeeId}. CorrelationId: {CorrelationId}",
                    employeeId,
                    correlationId);

                var result = await _meetingService.GetMeetingsByManagerIdAsync(employeeId, cancellationToken);

                var paginatedResult = result
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                stopwatch.Stop();
                _logger.LogInformation(
                    "Retrieved {Count} meetings in {ElapsedMs}ms. CorrelationId: {CorrelationId}",
                    paginatedResult.Count,
                    stopwatch.ElapsedMilliseconds,
                    correlationId);

                Response.Headers.Add("X-Correlation-Id", correlationId);
                Response.Headers.Add("X-Total-Count", result.Count.ToString());
                Response.Headers.Add("X-Page-Number", pageNumber.ToString());
                Response.Headers.Add("X-Page-Size", pageSize.ToString());

                return Ok(ApiResponse<List<MeetingResponseDto>>.SuccessResponse(
                    paginatedResult,
                    "Meetings retrieved successfully",
                    correlationId));
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized access in GetMyMeetings. CorrelationId: {CorrelationId}", correlationId);
                return StatusCode(StatusCodes.Status403Forbidden,
                    ApiResponse<List<MeetingResponseDto>>.ErrorResponse(ex.Message, correlationId));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in GetMyMeetings. CorrelationId: {CorrelationId}", correlationId);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    ApiResponse<List<MeetingResponseDto>>.ErrorResponse("An unexpected error occurred", correlationId));
            }
        }

        [HttpGet("{meetingId:int}")]
        [ProducesResponseType(typeof(ApiResponse<MeetingResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ApiResponse<MeetingResponseDto>>> GetMeetingById(
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
                    return BadRequest(ApiResponse<MeetingResponseDto>.ErrorResponse("Invalid meeting ID", correlationId));
                }

                _logger.LogInformation("Fetching meeting by ID: {MeetingId}. CorrelationId: {CorrelationId}", meetingId, correlationId);

                var result = await _meetingService.GetMeetingByIdAsync(meetingId, cancellationToken);

                if (result == null)
                {
                    _logger.LogWarning("Meeting not found: {MeetingId}. CorrelationId: {CorrelationId}", meetingId, correlationId);
                    return NotFound(ApiResponse<MeetingResponseDto>.ErrorResponse("Meeting not found", correlationId));
                }

                stopwatch.Stop();
                _logger.LogInformation(
                    "Meeting retrieved successfully in {ElapsedMs}ms. MeetingId: {MeetingId}, CorrelationId: {CorrelationId}",
                    stopwatch.ElapsedMilliseconds,
                    meetingId,
                    correlationId);

                Response.Headers.Add("X-Correlation-Id", correlationId);
                return Ok(ApiResponse<MeetingResponseDto>.SuccessResponse(result, "Meeting retrieved successfully", correlationId));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in GetMeetingById for ID: {MeetingId}. CorrelationId: {CorrelationId}", meetingId, correlationId);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    ApiResponse<MeetingResponseDto>.ErrorResponse("An unexpected error occurred", correlationId));
            }
        }

        [HttpGet("one-on-one-reports")]
        [Authorize(Roles = "Manager")]
        [ProducesResponseType(typeof(ApiResponse<OneOnOneReportDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ApiResponse<OneOnOneReportDto>>> GetOneOnOneReports(
            [FromQuery] int? employeeId = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            CancellationToken cancellationToken = default)
        {
            var correlationId = HttpContext.TraceIdentifier;
            var stopwatch = Stopwatch.StartNew();

            try
            {
                if (startDate.HasValue && endDate.HasValue && startDate.Value > endDate.Value)
                {
                    _logger.LogWarning(
                        "Invalid date range. StartDate: {StartDate}, EndDate: {EndDate}, CorrelationId: {CorrelationId}",
                        startDate,
                        endDate,
                        correlationId);
                    return BadRequest(ApiResponse<OneOnOneReportDto>.ErrorResponse(
                        "Start date cannot be after end date",
                        correlationId));
                }

                var managerId = await GetEmployeeIdFromUserIdAsync(cancellationToken);
                var role = GetRoleFromClaims();

                _logger.LogInformation(
                    "Generating one-on-one report for manager {ManagerId}. EmployeeId: {EmployeeId}, StartDate: {StartDate}, EndDate: {EndDate}, CorrelationId: {CorrelationId}",
                    managerId,
                    employeeId,
                    startDate,
                    endDate,
                    correlationId);

                var result = await _meetingService.GetOneOnOneReportsAsync(
                    managerId,
                    role,
                    employeeId,
                    startDate,
                    endDate,
                    cancellationToken);

                stopwatch.Stop();
                _logger.LogInformation(
                    "One-on-one report generated successfully in {ElapsedMs}ms. CorrelationId: {CorrelationId}",
                    stopwatch.ElapsedMilliseconds,
                    correlationId);

                Response.Headers.Add("X-Correlation-Id", correlationId);
                return Ok(ApiResponse<OneOnOneReportDto>.SuccessResponse(
                    result,
                    "One-on-one report generated successfully",
                    correlationId));
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized access in GetOneOnOneReports. CorrelationId: {CorrelationId}", correlationId);
                return StatusCode(StatusCodes.Status403Forbidden,
                    ApiResponse<OneOnOneReportDto>.ErrorResponse(ex.Message, correlationId));
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid argument in GetOneOnOneReports. CorrelationId: {CorrelationId}", correlationId);
                return BadRequest(ApiResponse<OneOnOneReportDto>.ErrorResponse(ex.Message, correlationId));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in GetOneOnOneReports. CorrelationId: {CorrelationId}", correlationId);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    ApiResponse<OneOnOneReportDto>.ErrorResponse("An unexpected error occurred", correlationId));
            }
        }

        [HttpGet("one-on-one-summary")]
        [Authorize(Roles = "Manager")]
        [ProducesResponseType(typeof(ApiResponse<OneOnOneSummaryDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ApiResponse<OneOnOneSummaryDto>>> GetOneOnOneSummary(
            CancellationToken cancellationToken = default)
        {
            var correlationId = HttpContext.TraceIdentifier;
            var stopwatch = Stopwatch.StartNew();

            try
            {
                var managerId = await GetEmployeeIdFromUserIdAsync(cancellationToken);
                var role = GetRoleFromClaims();

                _logger.LogInformation(
                    "Generating one-on-one summary for manager {ManagerId}. CorrelationId: {CorrelationId}",
                    managerId,
                    correlationId);

                var result = await _meetingService.GetOneOnOneSummaryAsync(managerId, role, cancellationToken);

                stopwatch.Stop();
                _logger.LogInformation(
                    "One-on-one summary generated successfully in {ElapsedMs}ms. CorrelationId: {CorrelationId}",
                    stopwatch.ElapsedMilliseconds,
                    correlationId);

                Response.Headers.Add("X-Correlation-Id", correlationId);
                return Ok(ApiResponse<OneOnOneSummaryDto>.SuccessResponse(
                    result,
                    "One-on-one summary generated successfully",
                    correlationId));
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized access in GetOneOnOneSummary. CorrelationId: {CorrelationId}", correlationId);
                return StatusCode(StatusCodes.Status403Forbidden,
                    ApiResponse<OneOnOneSummaryDto>.ErrorResponse(ex.Message, correlationId));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in GetOneOnOneSummary. CorrelationId: {CorrelationId}", correlationId);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    ApiResponse<OneOnOneSummaryDto>.ErrorResponse("An unexpected error occurred", correlationId));
            }
        }

        [HttpPost("rsvp")]
        [ProducesResponseType(typeof(ApiResponse<MeetingInvitationDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
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

                var employeeId = await GetEmployeeIdFromUserIdAsync(cancellationToken);

                _logger.LogInformation(
                    "Submitting RSVP for meeting {MeetingId} by employee {EmployeeId}. CorrelationId: {CorrelationId}",
                    rsvpDto.MeetingId,
                    employeeId,
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
                return StatusCode(StatusCodes.Status403Forbidden,
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

        [HttpGet("invitations")]
        [ProducesResponseType(typeof(ApiResponse<List<MeetingInvitationDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ApiResponse<List<MeetingInvitationDto>>>> GetMyInvitations(
            CancellationToken cancellationToken = default)
        {
            var correlationId = HttpContext.TraceIdentifier;
            var stopwatch = Stopwatch.StartNew();

            try
            {
                var employeeId = await GetEmployeeIdFromUserIdAsync(cancellationToken);

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
                _logger.LogWarning(ex, "Unauthorized access in GetMyInvitations. CorrelationId: {CorrelationId}", correlationId);
                return StatusCode(StatusCodes.Status403Forbidden,
                    ApiResponse<List<MeetingInvitationDto>>.ErrorResponse(ex.Message, correlationId));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in GetMyInvitations. CorrelationId: {CorrelationId}", correlationId);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    ApiResponse<List<MeetingInvitationDto>>.ErrorResponse("An unexpected error occurred", correlationId));
            }
        }

        [HttpGet("{meetingId:int}/rsvp-summary")]
        [Authorize(Roles = "Manager")]
        [ProducesResponseType(typeof(ApiResponse<MeetingRsvpSummaryDto>), StatusCodes.Status200OK)]
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

                var managerId = await GetEmployeeIdFromUserIdAsync(cancellationToken);
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
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in GetMeetingRsvpSummary. MeetingId: {MeetingId}, CorrelationId: {CorrelationId}", meetingId, correlationId);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    ApiResponse<MeetingRsvpSummaryDto>.ErrorResponse("An unexpected error occurred", correlationId));
            }
        }

        [HttpGet("pending-rsvp-count")]
        [ProducesResponseType(typeof(ApiResponse<int>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ApiResponse<int>>> GetPendingRsvpCount(
            CancellationToken cancellationToken = default)
        {
            var correlationId = HttpContext.TraceIdentifier;

            try
            {
                var employeeId = await GetEmployeeIdFromUserIdAsync(cancellationToken);

                _logger.LogInformation(
                    "Fetching pending RSVP count for employee {EmployeeId}. CorrelationId: {CorrelationId}",
                    employeeId,
                    correlationId);

                var result = await _meetingService.GetPendingRsvpCountAsync(employeeId, cancellationToken);

                Response.Headers.Add("X-Correlation-Id", correlationId);
                return Ok(ApiResponse<int>.SuccessResponse(result, "Pending RSVP count retrieved successfully", correlationId));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in GetPendingRsvpCount. CorrelationId: {CorrelationId}", correlationId);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    ApiResponse<int>.ErrorResponse("An unexpected error occurred", correlationId));
            }
        }

        #region Private Helper Methods

        private async Task<int> GetEmployeeIdFromUserIdAsync(CancellationToken cancellationToken = default)
        {
            try
            {
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

                return userAuth.EmployeeId;
            }
            catch (Exception ex) when (!(ex is UnauthorizedAccessException))
            {
                _logger.LogError(ex, "Error retrieving EmployeeId from user context");
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
