using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace eepzbackend.Controllers
{
    public partial class SlaController
    {
        [HttpGet("compliance/department/{departmentId}")]
        public async Task<IActionResult> GetDepartmentCompliance(int departmentId, [FromQuery] string? period = null)
        {
            _logger.LogInformation("Getting compliance for department {DepartmentId}", departmentId);
            var result = await _slaService.GetDepartmentCompliance(departmentId, period);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpGet("compliance/all")]
        public async Task<IActionResult> GetAllDepartmentCompliance([FromQuery] string? period = null)
        {
            _logger.LogInformation("Getting all compliance data");
            var result = await _slaService.GetAllDepartmentCompliance(period);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("compliance/calculate")]
        public async Task<IActionResult> CalculateCompliance([FromBody] CalculateComplianceRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _logger.LogInformation("Calculating compliance");
            var result = await _slaService.CalculateCompliance(request);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
