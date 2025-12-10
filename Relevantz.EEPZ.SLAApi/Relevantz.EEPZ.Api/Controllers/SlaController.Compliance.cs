using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace eepzbackend.Controllers
{
    /// <summary>
    /// Partial class containing SLA compliance and reporting endpoints
    /// </summary>
    public partial class SlaController
    {
        /// <summary>
        /// Get compliance metrics for a specific department
        /// </summary>
        [HttpGet("compliance/department/{departmentId}")]
        public async Task<IActionResult> GetDepartmentCompliance(int departmentId, [FromQuery] string? period = null)
        {
            try
            {
                _logger.LogInformation("Getting compliance for department {DepartmentId}", departmentId);
                var result = await _slaService.GetDepartmentCompliance(departmentId, period);
                return result.Success ? Ok(result) : NotFound(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetDepartmentCompliance");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get compliance metrics for all departments
        /// </summary>
        [HttpGet("compliance/all")]
        public async Task<IActionResult> GetAllDepartmentCompliance([FromQuery] string? period = null)
        {
            try
            {
                _logger.LogInformation("Getting all compliance data");
                var result = await _slaService.GetAllDepartmentCompliance(period);
                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetAllDepartmentCompliance");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Calculate compliance metrics based on provided criteria
        /// </summary>
        [HttpPost("compliance/calculate")]
        public async Task<IActionResult> CalculateCompliance([FromBody] CalculateComplianceRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                _logger.LogInformation("Calculating compliance");
                var result = await _slaService.CalculateCompliance(request);
                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in CalculateCompliance");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
