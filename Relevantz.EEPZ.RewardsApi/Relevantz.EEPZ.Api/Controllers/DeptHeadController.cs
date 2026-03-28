using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Core.IService;
using System;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [ApiVersion("1.0")]
    // [Authorize(Roles = "Department Head,Employee")]
    [Route("api/[controller]")]
    [Route("api/v{version:apiVersion}/[controller]")]
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



        /// <summary>
        /// Provides the list of employees along with their reward details approved by HR 
        /// </summary>
        /// 
        [HttpGet("depthead/{deptHeadEmployeeId:int}/approved-nominations")]
        public async Task<IActionResult> GetApprovedNominationsByDeptHead(
            [FromRoute][Range(1, int.MaxValue)] int deptHeadEmployeeId)
        {
            try
            {
                var result = await _service.GetApprovedNominationsByDeptHeadAsync(deptHeadEmployeeId);

                if (!result.Success)
                    return NotFound(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error in GetApprovedNominationsByDeptHead for DeptHeadEmployeeId {DeptHeadEmployeeId}",
                    deptHeadEmployeeId);

                return StatusCode(500, new { success = false, message = "Internal server error." });
            }
        }
    /// <summary>
    /// 
    /// </summary>
    /// <param name="nominationId"></param>
    /// <returns></returns>
        [HttpGet("nomination-details/{nominationId:int}")]
        public async Task<IActionResult> GetNominationDetails(
            [FromRoute][Range(1, int.MaxValue)] int nominationId)
        {
            try
            {
                var result = await _service.GetNominationDetailsAsync(nominationId);

                if (!result.Success)
                    return NotFound(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetNominationDetails for NominationId {NominationId}", nominationId);
                return StatusCode(500, new { success = false, message = "Internal server error." });
            }
        }
/// <summary>
/// Endpoint is used to list the reward count (card like details)
/// </summary>
/// <param name="deptHeadEmployeeId"></param>
/// <returns></returns>
        [HttpGet("depthead/{deptHeadEmployeeId:int}/statistics")]
        public async Task<IActionResult> GetDepartmentStatistics(
            [FromRoute][Range(1, int.MaxValue)] int deptHeadEmployeeId)
        {
            try
            {
                var result = await _service.GetDepartmentStatisticsAsync(deptHeadEmployeeId);

                if (!result.Success)
                    return NotFound(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error in GetDepartmentStatistics for DeptHeadEmployeeId {DeptHeadEmployeeId}",
                    deptHeadEmployeeId);

                return StatusCode(500, new { success = false, message = "Internal server error." });
            }
        }
    }
}