using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Business.Services.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace PerformanceManagement.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class DepartmentHeadNominationController : ControllerBase
    {
        private readonly IDepartmentHeadNominationService _service;
        private readonly ILogger<DepartmentHeadNominationController> _logger;

        public DepartmentHeadNominationController(
            IDepartmentHeadNominationService service,
            ILogger<DepartmentHeadNominationController> logger
        )
        {
            _service = service;
            _logger = logger;
        }

        [HttpGet("depthead/{deptHeadEmployeeId}/approved-nominations")]
        public async Task<IActionResult> GetApprovedNominationsByDeptHead(
            [FromRoute][Range(1, int.MaxValue)] int deptHeadEmployeeId)
        {
            try
            {
                var result = await _service.GetApprovedNominationsByDeptHeadAsync(deptHeadEmployeeId);

                if (result == null)
                {
                    return NotFound(new { success = false, message = "No approved nominations found." });
                }

                dynamic dyn = result;
                bool success = dyn.success != null && (bool)dyn.success;

                if (!success)
                {
                    return NotFound(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DH_APPROVED_NOMINATIONS] Error occurred.");
                return StatusCode(500, new { success = false, message = "Internal server error." });
            }
        }

        [HttpGet("nomination-details/{nominationId}")]
        public async Task<IActionResult> GetNominationDetails(
            [FromRoute][Range(1, int.MaxValue, ErrorMessage = "Nomination ID must be a positive integer.")]
            int nominationId)
        {
            try
            {
                var result = await _service.GetNominationDetailsAsync(nominationId);

                if (result == null)
                {
                    return NotFound(new { success = false, message = "Nomination not found." });
                }

                dynamic dyn = result;
                bool success = dyn.success != null && (bool)dyn.success;

                if (!success)
                {
                    return NotFound(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DH_NOMINATION_DETAILS] Error occurred.");
                return StatusCode(500, new { success = false, message = "Internal server error." });
            }
        }

        [HttpGet("depthead/{deptHeadEmployeeId}/statistics")]
        public async Task<IActionResult> GetDepartmentStatistics(
            [FromRoute][Range(1, int.MaxValue, ErrorMessage = "Employee ID must be a positive integer.")]
            int deptHeadEmployeeId)
        {
            try
            {
                var result = await _service.GetDepartmentStatisticsAsync(deptHeadEmployeeId);

                if (result == null)
                {
                    return NotFound(new { success = false, message = "Statistics not found." });
                }

                dynamic dyn = result;
                bool success = dyn.success != null && (bool)dyn.success;

                if (!success)
                {
                    return NotFound(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DH_STATISTICS] Error occurred.");
                return StatusCode(500, new { success = false, message = "Internal server error." });
            }
        }
    }
}
