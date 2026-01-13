using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.Services.Interfaces;
using System.Security.Claims;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/Meeting")]
    [Authorize]
    [Produces("application/json")]
    public class MeetingController : ControllerBase
    {
        private readonly IMeetingService _meetingService;
        private readonly IUserAuthenticationRepository _userAuthRepo;
        private readonly ILogger<MeetingController> _logger;

        public MeetingController(
            IMeetingService meetingService,
            IUserAuthenticationRepository userAuthRepo,
            ILogger<MeetingController> logger)
        {
            _meetingService = meetingService ?? throw new ArgumentNullException(nameof(meetingService));
            _userAuthRepo = userAuthRepo ?? throw new ArgumentNullException(nameof(userAuthRepo));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpPost("schedule")]
        [Authorize(Roles = AppConstants.Roles.Manager)]
        [ProducesResponseType(typeof(ApiResponse<MeetingResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ApiResponse<MeetingResponseDto>>> ScheduleMeeting(
            [FromBody] ScheduleMeetingDto scheduleMeetingDto,
            CancellationToken cancellationToken = default)
        {
            var correlationId = HttpContext.TraceIdentifier;

            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(kvp => kvp.Key, kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>());
                return BadRequest(ApiResponse<MeetingResponseDto>.ErrorResponse(AppConstants.ExceptionMessages.ValidationFailed, correlationId, errors));
            }

            var employeeId = await _userAuthRepo.GetEmployeeIdByUserIdAsync(GetUserIdFromClaims(), cancellationToken);
            var role = GetRoleFromClaims();

            _logger.LogInformation("Scheduling meeting: {MeetingTitle} by employee {EmployeeId}. CorrelationId: {CorrelationId}",
                scheduleMeetingDto.MeetingTitle, employeeId, correlationId);

            var result = await _meetingService.ScheduleMeetingAsync(scheduleMeetingDto, employeeId, role, cancellationToken);

            Response.Headers.Add("X-Correlation-Id", correlationId);
            return Ok(ApiResponse<MeetingResponseDto>.SuccessResponse(result, AppConstants.ResponseMessages.MeetingScheduledSuccessfully, correlationId));
        }

        [HttpGet("my-meetings")]
        [Authorize(Roles = AppConstants.Roles.Employee + "," + AppConstants.Roles.Manager)]
        [ProducesResponseType(typeof(ApiResponse<List<MeetingResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ApiResponse<List<MeetingResponseDto>>>> GetMyMeetings(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20,
            CancellationToken cancellationToken = default)
        {
            var correlationId = HttpContext.TraceIdentifier;

            if (pageNumber < 1 || pageSize < 1 || pageSize > 100)
            {
                return BadRequest(ApiResponse<List<MeetingResponseDto>>.ErrorResponse(AppConstants.ExceptionMessages.InvalidPagination, correlationId));
            }

            var employeeId = await _userAuthRepo.GetEmployeeIdByUserIdAsync(GetUserIdFromClaims(), cancellationToken);
            var result = await _meetingService.GetMeetingsByManagerIdAsync(employeeId, cancellationToken);

            var paginatedResult = result
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            Response.Headers.Add("X-Correlation-Id", correlationId);
            Response.Headers.Add("X-Total-Count", result.Count.ToString());
            Response.Headers.Add("X-Page-Number", pageNumber.ToString());
            Response.Headers.Add("X-Page-Size", pageSize.ToString());

            return Ok(ApiResponse<List<MeetingResponseDto>>.SuccessResponse(paginatedResult, AppConstants.ResponseMessages.MeetingsRetrievedSuccessfully, correlationId));
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

            if (meetingId <= 0)
            {
                return BadRequest(ApiResponse<MeetingResponseDto>.ErrorResponse(AppConstants.ExceptionMessages.InvalidMeetingId, correlationId));
            }

            var result = await _meetingService.GetMeetingByIdAsync(meetingId, cancellationToken);

            if (result == null)
            {
                return NotFound(ApiResponse<MeetingResponseDto>.ErrorResponse(AppConstants.ExceptionMessages.MeetingNotFound, correlationId));
            }

            Response.Headers.Add("X-Correlation-Id", correlationId);
            return Ok(ApiResponse<MeetingResponseDto>.SuccessResponse(result, AppConstants.ResponseMessages.MeetingRetrievedSuccessfully, correlationId));
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

            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(kvp => kvp.Key, kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>());
                return BadRequest(ApiResponse<MeetingInvitationDto>.ErrorResponse(AppConstants.ExceptionMessages.ValidationFailed, correlationId, errors));
            }

            var employeeId = await _userAuthRepo.GetEmployeeIdByUserIdAsync(GetUserIdFromClaims(), cancellationToken);
            var result = await _meetingService.SubmitRsvpAsync(rsvpDto, employeeId, cancellationToken);

            Response.Headers.Add("X-Correlation-Id", correlationId);
            return Ok(ApiResponse<MeetingInvitationDto>.SuccessResponse(result, AppConstants.ResponseMessages.RsvpSubmittedSuccessfully, correlationId));
        }

        [HttpGet("invitations")]
        [ProducesResponseType(typeof(ApiResponse<List<MeetingInvitationDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ApiResponse<List<MeetingInvitationDto>>>> GetMyInvitations(
            CancellationToken cancellationToken = default)
        {
            var correlationId = HttpContext.TraceIdentifier;

            var employeeId = await _userAuthRepo.GetEmployeeIdByUserIdAsync(GetUserIdFromClaims(), cancellationToken);
            var result = await _meetingService.GetMyMeetingInvitationsAsync(employeeId, cancellationToken);

            Response.Headers.Add("X-Correlation-Id", correlationId);
            return Ok(ApiResponse<List<MeetingInvitationDto>>.SuccessResponse(result, AppConstants.ResponseMessages.InvitationsRetrievedSuccessfully, correlationId));
        }

        #region Private Helper Methods

        private int GetUserIdFromClaims()
        {
            var subClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (subClaim == null || !int.TryParse(subClaim.Value, out int userId))
            {
                throw new UnauthorizedAccessException(AppConstants.ExceptionMessages.UserIdNotFoundInToken);
            }

            return userId;
        }

        private string GetRoleFromClaims()
        {
            var roleClaim = User.FindFirst(AppConstants.ClaimTypes.MsRoleSchema) ?? 
                            User.FindFirst(ClaimTypes.Role) ?? 
                            User.FindFirst(AppConstants.ClaimTypes.Role);

            return roleClaim?.Value ?? AppConstants.Roles.Employee;
        }

        #endregion
    }
}
