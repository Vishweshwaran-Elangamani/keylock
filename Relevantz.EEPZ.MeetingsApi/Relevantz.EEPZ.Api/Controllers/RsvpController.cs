using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/Rsvp")]
    [Authorize]
    [Produces("application/json")]
    public class RsvpController : ControllerBase
    {
        private readonly IMeetingService _meetingService;
        private readonly IUserAuthenticationRepository _userAuthenticationRepository;
        private readonly ILogger<RsvpController> _logger;

        public RsvpController(
            IMeetingService meetingService,
            IUserAuthenticationRepository userAuthenticationRepository,
            ILogger<RsvpController> logger)
        {
            _meetingService = meetingService ?? throw new ArgumentNullException(nameof(meetingService));
            _userAuthenticationRepository = userAuthenticationRepository ?? throw new ArgumentNullException(nameof(userAuthenticationRepository));
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

            var employeeId = await GetEmployeeIdFromClaimsAsync(cancellationToken);

            _logger.LogInformation(
                "Fetching meeting invitations for employee {EmployeeId}. CorrelationId: {CorrelationId}",
                employeeId,
                correlationId);

            var result = await _meetingService.GetMyMeetingInvitationsAsync(employeeId, cancellationToken);

            Response.Headers.Add("X-Correlation-Id", correlationId);

            return Ok(ApiResponse<List<MeetingInvitationDto>>.SuccessResponse(
                result,
                AppConstants.ResponseMessages.InvitationsRetrievedSuccessfully,
                correlationId));
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

            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(
                        kvp => kvp.Key,
                        kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>()
                    );

                return BadRequest(ApiResponse<MeetingInvitationDto>.ErrorResponse(
                    AppConstants.ExceptionMessages.ValidationFailed,
                    correlationId,
                    errors));
            }

            var employeeId = await GetEmployeeIdFromClaimsAsync(cancellationToken);

            _logger.LogInformation(
                "Submitting RSVP for MeetingId {MeetingId} by employee {EmployeeId}. Status: {Status}. CorrelationId: {CorrelationId}",
                rsvpDto.MeetingId,
                employeeId,
                rsvpDto.RsvpStatus,
                correlationId);

            var result = await _meetingService.SubmitRsvpAsync(rsvpDto, employeeId, cancellationToken);

            Response.Headers.Add("X-Correlation-Id", correlationId);

            return Ok(ApiResponse<MeetingInvitationDto>.SuccessResponse(
                result,
                AppConstants.ResponseMessages.RsvpSubmittedSuccessfully,
                correlationId));
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

            if (meetingId <= 0)
            {
                return BadRequest(ApiResponse<MeetingInvitationDto>.ErrorResponse(
                    AppConstants.ExceptionMessages.InvalidMeetingId,
                    correlationId));
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(
                        kvp => kvp.Key,
                        kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>()
                    );

                return BadRequest(ApiResponse<MeetingInvitationDto>.ErrorResponse(
                    AppConstants.ExceptionMessages.ValidationFailed,
                    correlationId,
                    errors));
            }

            var employeeId = await GetEmployeeIdFromClaimsAsync(cancellationToken);

            var updatedRsvpDto = new RsvpResponseDto
            {
                MeetingId = meetingId,
                RsvpStatus = rsvpDto.RsvpStatus,
                RsvpComments = rsvpDto.RsvpComments
            };

            _logger.LogInformation(
                "Updating RSVP for MeetingId {MeetingId} by employee {EmployeeId}. Status: {Status}. CorrelationId: {CorrelationId}",
                meetingId,
                employeeId,
                rsvpDto.RsvpStatus,
                correlationId);

            var result = await _meetingService.SubmitRsvpAsync(updatedRsvpDto, employeeId, cancellationToken);

            Response.Headers.Add("X-Correlation-Id", correlationId);

            return Ok(ApiResponse<MeetingInvitationDto>.SuccessResponse(
                result,
                AppConstants.ResponseMessages.RsvpSubmittedSuccessfully,
                correlationId));
        }

        [HttpGet("pending-count")]
        [ProducesResponseType(typeof(ApiResponse<int>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ApiResponse<int>>> GetPendingRsvpCount(
            CancellationToken cancellationToken = default)
        {
            var correlationId = HttpContext.TraceIdentifier;

            var employeeId = await GetEmployeeIdFromClaimsAsync(cancellationToken);

            _logger.LogInformation(
                "Fetching pending RSVP count for employee {EmployeeId}. CorrelationId: {CorrelationId}",
                employeeId,
                correlationId);

            var count = await _meetingService.GetPendingRsvpCountAsync(employeeId, cancellationToken);

            Response.Headers.Add("X-Correlation-Id", correlationId);

            return Ok(ApiResponse<int>.SuccessResponse(
                count,
                AppConstants.ResponseMessages.PendingRsvpCountRetrievedSuccessfully,
                correlationId));
        }

        [HttpGet("meeting/{meetingId:int}/summary")]
        [Authorize(Roles = AppConstants.Roles.Manager)]
        [ProducesResponseType(typeof(ApiResponse<MeetingRsvpSummaryDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ApiResponse<MeetingRsvpSummaryDto>>> GetMeetingRsvpSummary(
            int meetingId,
            CancellationToken cancellationToken = default)
        {
            var correlationId = HttpContext.TraceIdentifier;

            if (meetingId <= 0)
            {
                return BadRequest(ApiResponse<MeetingRsvpSummaryDto>.ErrorResponse(
                    AppConstants.ExceptionMessages.InvalidMeetingId,
                    correlationId));
            }

            var managerId = await GetEmployeeIdFromClaimsAsync(cancellationToken);

            var result = await _meetingService.GetMeetingRsvpSummaryAsync(
                meetingId,
                managerId,
                AppConstants.Roles.Manager,
                cancellationToken);

            Response.Headers.Add("X-Correlation-Id", correlationId);

            return Ok(ApiResponse<MeetingRsvpSummaryDto>.SuccessResponse(
                result,
                AppConstants.ResponseMessages.RsvpSummaryRetrievedSuccessfully,
                correlationId));
        }

        private async Task<int> GetEmployeeIdFromClaimsAsync(CancellationToken cancellationToken = default)
        {
            var subClaim = User.FindFirst(AppConstants.ClaimTypes.Sub)
                           ?? User.FindFirst(ClaimTypes.NameIdentifier);

            if (subClaim == null || !int.TryParse(subClaim.Value, out int userId))
                throw new UnauthorizedAccessException(AppConstants.ExceptionMessages.UserIdNotFoundInToken);

            return await _userAuthenticationRepository.GetEmployeeIdByUserIdAsync(userId, cancellationToken);
        }
    }
}
