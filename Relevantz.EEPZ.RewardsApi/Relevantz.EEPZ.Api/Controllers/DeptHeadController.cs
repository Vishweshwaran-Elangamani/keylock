using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Business.Services.Interfaces;

namespace PerformanceManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DepartmentHeadNominationController : ControllerBase
    {
        private readonly IDepartmentHeadNominationService _service;
        private readonly ILogger<DepartmentHeadNominationController> _logger;

        public DepartmentHeadNominationController(
            IDepartmentHeadNominationService service,
            ILogger<DepartmentHeadNominationController> logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpGet("depthead/{deptHeadEmployeeId}/approved-nominations")]
        public async Task<IActionResult> GetApprovedNominationsByDeptHead(int deptHeadEmployeeId)
        {
            try
            {
                var result = await _service.GetApprovedNominationsByDeptHeadAsync(deptHeadEmployeeId);
                
                var success = (bool)((dynamic)result).success;
                
                if (!success)
                {
                    return NotFound(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"[DH_APPROVED_NOMINATIONS] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("nomination-details/{nominationId}")]
        public async Task<IActionResult> GetNominationDetails(int nominationId)
        {
            try
            {
                var result = await _service.GetNominationDetailsAsync(nominationId);
                
                var success = (bool)((dynamic)result).success;
                
                if (!success)
                {
                    return NotFound(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"[DH_NOMINATION_DETAILS] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("depthead/{deptHeadEmployeeId}/statistics")]
        public async Task<IActionResult> GetDepartmentStatistics(int deptHeadEmployeeId)
        {
            try
            {
                var result = await _service.GetDepartmentStatisticsAsync(deptHeadEmployeeId);
                
                var success = (bool)((dynamic)result).success;
                
                if (!success)
                {
                    return NotFound(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"[DH_STATISTICS] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
