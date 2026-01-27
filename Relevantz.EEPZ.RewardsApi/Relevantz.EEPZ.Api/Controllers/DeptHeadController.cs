
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Business.Services.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Authorize(Roles = "Department Head,Employee")] 
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
        
[HttpGet("throw")]
[AllowAnonymous] 
public IActionResult Throw() => throw new InvalidOperationException("Boom from controller!");


        [HttpGet("depthead/{deptHeadEmployeeId}/approved-nominations")]
        public async Task<IActionResult> GetApprovedNominationsByDeptHead(
            [FromRoute][Range(1, int.MaxValue)] int deptHeadEmployeeId)
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

        [HttpGet("nomination-details/{nominationId}")]
        public async Task<IActionResult> GetNominationDetails(
            [FromRoute][Range(1, int.MaxValue, ErrorMessage = "Nomination ID must be a positive integer.")]
            int nominationId)
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

        [HttpGet("depthead/{deptHeadEmployeeId}/statistics")]
        public async Task<IActionResult> GetDepartmentStatistics(
            [FromRoute][Range(1, int.MaxValue, ErrorMessage = "Employee ID must be a positive integer.")]
            int deptHeadEmployeeId)
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
    }
}
