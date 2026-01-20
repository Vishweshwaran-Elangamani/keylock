using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/rsvp")]
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

        // ✅ GET api/rsvp/my-invitations
        [HttpGet("my-invitations")]
        [ProducesResponseType(typeof(ApiResponse<List<MeetingInvitationDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ApiResponse<List<MeetingInvitationDto>>>> GetMyMeetingInvitationsAsync(
            CancellationToken cancellationToken = default)
        {
            var correlationId = HttpContext.TraceIdentifier;

            var employeeId = await GetEmployeeIdAsync(cancellationToken);

            _logger.LogInformation(
                "Fetching meeting invitations for employee {EmployeeId}. CorrelationId={CorrelationId}",
                employeeId,
                correlationId);

            var result = await _meetingService.GetMyMeetingInvitationsAsync(employeeId, cancellationToken);

            Response.Headers.Add("X-Correlation-Id", correlationId);

            return Ok(ApiResponse<List<MeetingInvitationDto>>.SuccessResponse(
                result,
                AppConstants.ResponseMessages.InvitationsRetrievedSuccessfully,
                correlationId));
        }

        // ✅ POST api/rsvp
        // renamed from "submit" -> clean REST
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<MeetingInvitationDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ApiResponse<MeetingInvitationDto>>> SubmitRsvpAsync(
            [FromBody] RsvpResponseDto rsvpDto,
            CancellationToken cancellationToken = default)
        {
            var correlationId = HttpContext.TraceIdentifier;

            if (rsvpDto == null)
            {
                return BadRequest(ApiResponse<MeetingInvitationDto>.ErrorResponse(
                    AppConstants.ExceptionMessages.ValidationFailed,
                    correlationId));
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(
                        kvp => kvp.Key,
                        kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>());

                return BadRequest(ApiResponse<MeetingInvitationDto>.ErrorResponse(
                    AppConstants.ExceptionMessages.ValidationFailed,
                    correlationId,
                    errors));
            }

            var employeeId = await GetEmployeeIdAsync(cancellationToken);

            _logger.LogInformation(
                "Submitting RSVP for MeetingId={MeetingId}, EmployeeId={EmployeeId}, Status={Status}. CorrelationId={CorrelationId}",
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

        // ✅ PUT api/rsvp/{meetingId}
        // Fix: Async suffix + clean route
        [HttpPut("{meetingId:int}")]
        [ProducesResponseType(typeof(ApiResponse<MeetingInvitationDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ApiResponse<MeetingInvitationDto>>> UpdateRsvpAsync(
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

            if (rsvpDto == null)
            {
                return BadRequest(ApiResponse<MeetingInvitationDto>.ErrorResponse(
                    AppConstants.ExceptionMessages.ValidationFailed,
                    correlationId));
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(
                        kvp => kvp.Key,
                        kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>());

                return BadRequest(ApiResponse<MeetingInvitationDto>.ErrorResponse(
                    AppConstants.ExceptionMessages.ValidationFailed,
                    correlationId,
                    errors));
            }

            var employeeId = await GetEmployeeIdAsync(cancellationToken);

            // Ensure meetingId from route is used (avoid mismatch / tampering)
            var updatedDto = new RsvpResponseDto
            {
                MeetingId = meetingId,
                RsvpStatus = rsvpDto.RsvpStatus,
                RsvpComments = rsvpDto.RsvpComments
            };

            _logger.LogInformation(
                "Updating RSVP for MeetingId={MeetingId}, EmployeeId={EmployeeId}, Status={Status}. CorrelationId={CorrelationId}",
                meetingId,
                employeeId,
                updatedDto.RsvpStatus,
                correlationId);

            var result = await _meetingService.SubmitRsvpAsync(updatedDto, employeeId, cancellationToken);

            Response.Headers.Add("X-Correlation-Id", correlationId);

            return Ok(ApiResponse<MeetingInvitationDto>.SuccessResponse(
                result,
                AppConstants.ResponseMessages.RsvpUpdatedSuccessfully,
                correlationId));
        }

        // ✅ GET api/rsvp/pending-count
        [HttpGet("pending-count")]
        [ProducesResponseType(typeof(ApiResponse<int>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ApiResponse<int>>> GetPendingRsvpCountAsync(
            CancellationToken cancellationToken = default)
        {
            var correlationId = HttpContext.TraceIdentifier;

            var employeeId = await GetEmployeeIdAsync(cancellationToken);

            _logger.LogInformation(
                "Fetching pending RSVP count for employee {EmployeeId}. CorrelationId={CorrelationId}",
                employeeId,
                correlationId);

            var count = await _meetingService.GetPendingRsvpCountAsync(employeeId, cancellationToken);

            Response.Headers.Add("X-Correlation-Id", correlationId);

            return Ok(ApiResponse<int>.SuccessResponse(
                count,
                AppConstants.ResponseMessages.PendingRsvpCountRetrievedSuccessfully,
                correlationId));
        }

        // ✅ GET api/rsvp/{meetingId}/summary
        // Fix comment: Use "{meeting:int}/summary" if prefix exists
        [HttpGet("{meetingId:int}/summary")]
        [Authorize(Roles = AppConstants.Roles.Manager)]
        [ProducesResponseType(typeof(ApiResponse<MeetingRsvpSummaryDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ApiResponse<MeetingRsvpSummaryDto>>> GetMeetingRsvpSummaryAsync(
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

            var managerId = await GetEmployeeIdAsync(cancellationToken);

            // Role should not be hardcoded ideally. But service needs role param now.
            var role = ClaimsUtility.GetRole(User);

            var result = await _meetingService.GetMeetingRsvpSummaryAsync(
                meetingId,
                managerId,
                role,
                cancellationToken);

            Response.Headers.Add("X-Correlation-Id", correlationId);

            return Ok(ApiResponse<MeetingRsvpSummaryDto>.SuccessResponse(
                result,
                AppConstants.ResponseMessages.MeetingRsvpSummaryRetrievedSuccessfully,
                correlationId));
        }

        #region Private (EmployeeId Resolver)

        private async Task<int> GetEmployeeIdAsync(CancellationToken cancellationToken)
        {
            var userId = ClaimsUtility.GetUserId(User);
            return await _userAuthenticationRepository.GetEmployeeIdByUserIdAsync(userId, cancellationToken);
        }

        #endregion
    }
}
