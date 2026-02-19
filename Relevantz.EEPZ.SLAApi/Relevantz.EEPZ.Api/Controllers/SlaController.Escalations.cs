using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common;

namespace eepzbackend.Controllers
{
    public partial class SlaController
    {
        /// <summary>
        /// Creates an escalation for the specified SLA.
        /// If query parameter <paramref name="level"/> is set to "dept-head", escalation is raised to department head; otherwise standard escalation is created.
        /// </summary>
        /// <param name="slaid">Unique identifier of the SLA.</param>
        /// <param name="level">Escalation level (normal | dept-head).</param>
        /// <param name="request">Escalation submission payload.</param>
        /// <returns>ApiResponse containing details of the created escalation.</returns>
        [HttpPost("{slaid:int}/escalations")]
        public async Task<IActionResult> SubmitEscalation(
     [FromRoute] int slaid,
     [FromQuery] string? level,
     [FromBody] SubmitSlaEscalationRequest request)
        {
            _logger.LogInformation(
                "START SubmitEscalation | SlaId: {SlaId} | Level: {Level} | UserId: {UserId} | CorrelationId: {CorrelationId}",
                slaid, level, UserId, CorrelationId);

            request.Slaid = slaid;
            request.SubmittedByEmployeeId = UserId;

            request.EscalationLevel = level?.ToLower() switch
            {
                "dept-head" => "DeptHead",
                "leadership" => "Leadership",
                _ => "L1"
            };

            var data = await _slaService.SubmitEscalation(request, UserId, level);

            _logger.LogInformation(
                "SUCCESS SubmitEscalation | SlaId: {SlaId} | EscalationId: {EscalationId} | CorrelationId: {CorrelationId}",
                slaid, data.EscalationId, CorrelationId);

            _logger.LogInformation(
                "END SubmitEscalation | SlaId: {SlaId} | CorrelationId: {CorrelationId}",
                slaid, CorrelationId);

            return Ok(new ApiResponse<EscalationResponse>
            {
                StatusCode = StatusCodes.Status200OK,
                Success = true,
                Message = ApiMessages.Success,
                Data = data,
                CorrelationId = CorrelationId
            });
        }

        /// <summary>
        /// Escalate SLA directly to Department Head (L2)
        /// </summary>
        [HttpPost("escalate-to-dept-head")]
        public async Task<IActionResult> EscalateToDeptHead([FromBody] SubmitSlaEscalationRequest request)
        {
            _logger.LogInformation(
                "START EscalateToDeptHead. SLA: {Slaid}, User: {UserId}, CorrelationId: {CorrelationId}",
                request.Slaid, UserId, CorrelationId);

            var result = await _slaService.EscalateToDeptHead(request, UserId);

            _logger.LogInformation(
                "SUCCESS EscalateToDeptHead. EscalationId: {EscalationId}, CorrelationId: {CorrelationId}",
                result.EscalationId, CorrelationId);

            return Ok(new ApiResponse<EscalationResponse>
            {
                StatusCode = StatusCodes.Status200OK,
                Success = true,
                Message = "Escalated to Department Head successfully",
                Data = result,
                CorrelationId = CorrelationId
            });
        }


        /// <summary>
        /// Retrieves all escalations associated with a given SLA.
        /// </summary>
        /// <param name="slaid">Unique identifier of the SLA.</param>
        /// <returns>ApiResponse containing list of escalation records.</returns>
        [HttpGet("{slaid:int}/escalations")]
        public async Task<IActionResult> GetSlaEscalations([FromRoute] int slaid)
        {
            _logger.LogInformation(
                "START GetSlaEscalations | SlaId: {SlaId} | CorrelationId: {CorrelationId}",
                slaid, CorrelationId);

            var data = await _slaService.GetSlaEscalations(slaid);

            _logger.LogInformation(
                "SUCCESS GetSlaEscalations | SlaId: {SlaId} | Count: {Count} | CorrelationId: {CorrelationId}",
                slaid, data.Count, CorrelationId);

            _logger.LogInformation(
                "END GetSlaEscalations | SlaId: {SlaId} | CorrelationId: {CorrelationId}",
                slaid, CorrelationId);

            return Ok(new ApiResponse<List<EscalationResponse>>
            {
                StatusCode = StatusCodes.Status200OK,
                Success = true,
                Message = ApiMessages.Success,
                Data = data,
                CorrelationId = CorrelationId
            });
        }


        /// <summary>
        /// Resolves an escalation using the authenticated user as resolver.
        /// </summary>
        /// <param name="request">Escalation resolution request payload.</param>
        /// <returns>ApiResponse confirming successful resolution.</returns>
        [HttpPut("escalations/resolve")]
        public async Task<IActionResult> ResolveEscalation([FromBody] ResolveEscalationRequest request)
        {
            _logger.LogInformation(
                "START ResolveEscalation | EscalationId: {EscalationId} | UserId: {UserId} | CorrelationId: {CorrelationId}",
                request.EscalationId, UserId, CorrelationId);

            var result = await _slaService.ResolveEscalation(request, UserId);

            _logger.LogInformation(
                "SUCCESS ResolveEscalation | EscalationId: {EscalationId} | CorrelationId: {CorrelationId}",
                request.EscalationId, CorrelationId);

            _logger.LogInformation(
                "END ResolveEscalation | EscalationId: {EscalationId} | CorrelationId: {CorrelationId}",
                request.EscalationId, CorrelationId);

            return Ok(new ApiResponse<string>
            {
                StatusCode = StatusCodes.Status200OK,
                Success = true,
                Message = ApiMessages.Success,
                Data = result,
                CorrelationId = CorrelationId
            });
        }


        /// <summary>
        /// Retrieves escalations assigned to the logged-in manager.
        /// </summary>
        /// <returns>ApiResponse containing escalations mapped to manager.</returns>
        [HttpGet("manager/escalations")]
        public async Task<IActionResult> GetManagerEscalations()
        {
            _logger.LogInformation("START GetManagerEscalations. ManagerId: {UserId}, CorrelationId: {CorrelationId}",
                UserId, CorrelationId);

            var data = await _slaService.GetManagerEscalations(UserId);

            _logger.LogInformation("SUCCESS GetManagerEscalations. CorrelationId: {CorrelationId}", CorrelationId);
            _logger.LogInformation("END GetManagerEscalations. CorrelationId: {CorrelationId}", CorrelationId);

            return Ok(new ApiResponse<List<EscalationResponse>>
            {
                StatusCode = StatusCodes.Status200OK,
                Success = true,
                Message = ApiMessages.Success,
                Data = data,
                CorrelationId = CorrelationId
            });
        }
    }
}
