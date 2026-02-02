using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Business.Services.Interfaces;
using System;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
 
namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Authorize(Roles = "Department Head,Employee")]
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
 
        [HttpGet("throw")]
        [AllowAnonymous]
        public IActionResult Throw() => throw new InvalidOperationException("Boom from controller!");
 
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
 
                // Keep dynamic to match your current service contract.
                dynamic dyn = result;
                bool success = dyn?.success is bool s && s;
 
                if (!success)
                {
                    return StatusCode(404, result);
                }
 
                return StatusCode(200, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetApprovedNominationsByDeptHead for DeptHeadEmployeeId {DeptHeadEmployeeId}", deptHeadEmployeeId);
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
                bool success = dyn?.success is bool s && s;
 
                if (!success)
                {
                    return StatusCode(404, result);
                }
 
                return StatusCode(200, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetNominationDetails for NominationId {NominationId}", nominationId);
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
                bool success = dyn?.success is bool s && s;
 
                if (!success)
                {
                    return StatusCode(404, result);
                }
 
                return StatusCode(200, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetDepartmentStatistics for DeptHeadEmployeeId {DeptHeadEmployeeId}", deptHeadEmployeeId);
                return StatusCode(500, new { success = false, message = "Internal server error." });
            }
        }
    }
}
 