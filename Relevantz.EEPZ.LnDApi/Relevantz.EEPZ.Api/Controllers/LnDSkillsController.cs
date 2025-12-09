using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.Services.Interface;

namespace Relevantz.EEPZ.Api.Controllers.LnD
{
    /// <summary>
    /// Employee Skills Management
    /// </summary>
    [ApiController]
    [Route("api/lnd-skills")]
    [Authorize]
    public class LnDSkillsController : BaseLnDController
    {
        private readonly ILnDService _lndService;

        public LnDSkillsController(ILnDService lndService)
        {
            _lndService = lndService;
        }

        /// <summary>
        /// Get list of subordinate employees with pagination and search
        /// </summary>
        [HttpGet("employees/subordinates")]
        public async Task<IActionResult> GetSubordinateEmployees(
            [FromQuery] string? searchTerm,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 12
        )
        {
            var managerId = GetCurrentEmployeeId();
            var result = await _lndService.GetSubordinateEmployees(
                managerId,
                searchTerm,
                pageNumber,
                pageSize
            );

            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Get all available skills for dropdown
        /// </summary>
        [HttpGet("all")]
        public async Task<IActionResult> GetAllSkills()
        {
            var result = await _lndService.GetAllSkills();

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("subordinates")]
        public async Task<IActionResult> GetSubordinateSkills(
            [FromQuery] int? employeeId,
            [FromQuery] string? searchTerm,
            [FromQuery] string? sortBy = LnDConstants.DEFAULTS.SORT_BY_EMPLOYEE_NAME,
            [FromQuery] int pageNumber = 1
        )
        {
            var managerId = GetCurrentEmployeeId();
            var result = await _lndService.GetSubordinateSkills(
                managerId,
                employeeId,
                searchTerm,
                sortBy,
                pageNumber,
                1_000_000
            );

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("record")]
        public async Task<IActionResult> RecordEmployeeSkill([FromBody] RecordSkillRequest request)
        {
            var managerId = GetCurrentEmployeeId();
            var result = await _lndService.RecordEmployeeSkill(managerId, request);

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("record-bulk")]
        public async Task<IActionResult> BulkRecordEmployeeSkills(
            [FromBody] BulkRecordSkillRequest request
        )
        {
            var managerId = GetCurrentEmployeeId();
            var result = await _lndService.BulkRecordEmployeeSkills(managerId, request);

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut("update-rating")]
        public async Task<IActionResult> UpdateEmployeeSkillRating(
            [FromBody] UpdateSkillRatingRequest request
        )
        {
            var managerId = GetCurrentEmployeeId();
            var result = await _lndService.UpdateEmployeeSkillRating(managerId, request);

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("{mapperId}")]
        public async Task<IActionResult> DeleteEmployeeSkill(int mapperId)
        {
            var managerId = GetCurrentEmployeeId();
            var result = await _lndService.DeleteEmployeeSkill(managerId, mapperId);

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("my-skills")]
        public async Task<IActionResult> GetMySkills(
            [FromQuery] string? searchTerm,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10
        )
        {
            var employeeId = GetCurrentEmployeeId();
            var result = await _lndService.GetMySkills(
                employeeId,
                searchTerm,
                pageNumber,
                pageSize
            );

            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
