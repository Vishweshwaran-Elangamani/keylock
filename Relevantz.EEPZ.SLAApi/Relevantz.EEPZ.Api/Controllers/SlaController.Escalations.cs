using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace eepzbackend.Controllers
{
    public partial class SlaController
    {
        [HttpPost("escalate")]
        public async Task<IActionResult> SubmitEscalation([FromBody] SubmitSlaEscalationRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _logger.LogInformation("Submitting escalation for SLA {Slaid}", request.Slaid);
            var result = await _slaService.SubmitEscalation(request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("escalate-to-dept-head")]
        public async Task<IActionResult> EscalateToDeptHead([FromBody] SubmitSlaEscalationRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _logger.LogInformation("Escalating SLA {Slaid} to dept head", request.Slaid);
            var result = await _slaService.EscalateToDeptHead(request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{slaid}/escalations")]
        public async Task<IActionResult> GetSlaEscalations(int slaid)
        {
            _logger.LogInformation("Getting escalations for SLA {Slaid}", slaid);
            var result = await _slaService.GetSlaEscalations(slaid);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpPut("escalation/resolve")]
        public async Task<IActionResult> ResolveEscalation([FromBody] ResolveEscalationRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _logger.LogInformation("Resolving escalation {EscalationId}", request.EscalationId);
            var result = await _slaService.ResolveEscalation(request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("manager/{managerId}/escalations")]
        public async Task<IActionResult> GetManagerEscalations(int managerId)
        {
            _logger.LogInformation("Getting escalations for manager {ManagerId}", managerId);
            var result = await _slaService.GetManagerEscalations(managerId);
            return result.Success ? Ok(result) : NotFound(result);
        }
    }
}
