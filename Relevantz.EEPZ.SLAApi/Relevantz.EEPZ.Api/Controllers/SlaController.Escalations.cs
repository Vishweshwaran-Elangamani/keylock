using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace eepzbackend.Controllers
{
    /// <summary>
    /// Partial class containing SLA escalation-related endpoints
    /// </summary>
    public partial class SlaController
    {
        /// <summary>
        /// Submit an escalation for an SLA
        /// </summary>
        [HttpPost("escalate")]
        public async Task<IActionResult> SubmitEscalation([FromBody] SubmitSlaEscalationRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                _logger.LogInformation("Submitting escalation for SLA {Slaid}", request.Slaid);
                var result = await _slaService.SubmitEscalation(request);
                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SubmitEscalation");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Escalate SLA to department head
        /// </summary>
        [HttpPost("escalate-to-dept-head")]
        public async Task<IActionResult> EscalateToDeptHead([FromBody] SubmitSlaEscalationRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                _logger.LogInformation("Escalating SLA {Slaid} to dept head", request.Slaid);
                var result = await _slaService.EscalateToDeptHead(request);
                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in EscalateToDeptHead");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get all escalations for a specific SLA
        /// </summary>
        [HttpGet("{slaid}/escalations")]
        public async Task<IActionResult> GetSlaEscalations(int slaid)
        {
            try
            {
                _logger.LogInformation("Getting escalations for SLA {Slaid}", slaid);
                var result = await _slaService.GetSlaEscalations(slaid);
                return result.Success ? Ok(result) : NotFound(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetSlaEscalations");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Resolve an escalation
        /// </summary>
        [HttpPut("escalation/resolve")]
        public async Task<IActionResult> ResolveEscalation([FromBody] ResolveEscalationRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                _logger.LogInformation("Resolving escalation {EscalationId}", request.EscalationId);
                var result = await _slaService.ResolveEscalation(request);
                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in ResolveEscalation");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get all escalations assigned to a manager
        /// </summary>
        [HttpGet("manager/{managerId}/escalations")]
        public async Task<IActionResult> GetManagerEscalations(int managerId)
        {
            try
            {
                _logger.LogInformation("Getting escalations for manager {ManagerId}", managerId);
                var result = await _slaService.GetManagerEscalations(managerId);
                return result.Success ? Ok(result) : NotFound(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetManagerEscalations");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
