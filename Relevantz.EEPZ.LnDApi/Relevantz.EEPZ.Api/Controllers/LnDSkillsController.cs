using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.Services.Interface;
using Serilog;

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
        #region Dependencies

        private readonly ILnDEmployeeSkillService _employeeSkillService;

        public LnDSkillsController(ILnDEmployeeSkillService employeeSkillService)
        {
            _employeeSkillService = employeeSkillService;
        }

        #endregion

        #region Skill Retrieval

        /// <summary>Gets all available skills for dropdown selection.</summary>
        [HttpGet("all")]
        public async Task<IActionResult> GetAllSkills()
        {
            Log.Information("GetAllSkills API called");

            var result = await _employeeSkillService.GetAllSkills();

            if (result.Success)
            {
                Log.Information("GetAllSkills API succeeded. SkillCount={Count}", result.Data?.Count ?? 0);
                return Ok(result);
            }
            else
            {
                Log.Warning("GetAllSkills API failed. Message={Message}", result.Message);
                return BadRequest(result);
            }
        } 
        /// <summary>Gets paginated skills for the logged-in employee.</summary>
        [HttpGet("my-skills")]
        public async Task<IActionResult> GetMySkills(
            [FromQuery] string? searchTerm,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10
        )
        {
            var employeeId = GetCurrentEmployeeId();

            Log.Information(
                "GetMySkills API called. EmployeeId={EmployeeId}, SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",
                employeeId, searchTerm ?? "none", pageNumber, pageSize
            );

            var result = await _employeeSkillService.GetMySkills(
                employeeId,
                searchTerm,
                pageNumber,
                pageSize
            );

            if (result.Success)
            {
                Log.Information(
                    "GetMySkills API succeeded. EmployeeId={EmployeeId}, TotalCount={TotalCount}",
                    employeeId, result.Data?.TotalCount ?? 0
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "GetMySkills API failed. EmployeeId={EmployeeId}, Message={Message}",
                    employeeId, result.Message
                );
                return BadRequest(result);
            }
        }

        /// <summary>Gets skills for subordinate employees with optional employee filter and search.</summary>
        [HttpGet("subordinates")]
        public async Task<IActionResult> GetSubordinateSkills(
            [FromQuery] int? employeeId,
            [FromQuery] string? searchTerm,
            [FromQuery] string? sortBy = LnDConstants.DEFAULTS.SORT_BY_EMPLOYEE_NAME,
            [FromQuery] int pageNumber = 1
        )
        {
            var managerId = GetCurrentEmployeeId();

            Log.Information(
                "GetSubordinateSkills API called. ManagerId={ManagerId}, EmployeeId={EmployeeId}, SearchTerm={SearchTerm}, SortBy={SortBy}, Page={PageNumber}",
                managerId, employeeId?.ToString() ?? "all", searchTerm ?? "none", sortBy, pageNumber
            );

            var result = await _employeeSkillService.GetSubordinateSkills(
                managerId,
                employeeId,
                searchTerm,
                sortBy,
                pageNumber,
                1_000_000
            );

            if (result.Success)
            {
                Log.Information(
                    "GetSubordinateSkills API succeeded. ManagerId={ManagerId}, TotalCount={TotalCount}",
                    managerId, result.Data?.TotalCount ?? 0
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "GetSubordinateSkills API failed. ManagerId={ManagerId}, Message={Message}",
                    managerId, result.Message
                );
                return BadRequest(result);
            }
        }

        #endregion

        #region Employee Management

        /// <summary>Gets paginated list of subordinate employees with search capability.</summary>
        [HttpGet("employees/subordinates")]
        public async Task<IActionResult> GetSubordinateEmployees(
            [FromQuery] string? searchTerm,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 12
        )
        {
            var managerId = GetCurrentEmployeeId();

            Log.Information(
                "GetSubordinateEmployees API called. ManagerId={ManagerId}, SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",
                managerId, searchTerm ?? "none", pageNumber, pageSize
            );

            var result = await _employeeSkillService.GetSubordinateEmployees(
                managerId,
                searchTerm,
                pageNumber,
                pageSize
            );

            if (result.Success)
            {
                Log.Information(
                    "GetSubordinateEmployees API succeeded. ManagerId={ManagerId}, TotalCount={TotalCount}",
                    managerId, result.Data?.TotalCount ?? 0
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "GetSubordinateEmployees API failed. ManagerId={ManagerId}, Message={Message}",
                    managerId, result.Message
                );
                return BadRequest(result);
            }
        }

        #endregion

        #region Skill Modifications

        /// <summary>Records a single skill rating for an employee.</summary>
        [HttpPost("record")]
        public async Task<IActionResult> RecordEmployeeSkill([FromBody] RecordSkillRequest request)
        {
            var managerId = GetCurrentEmployeeId();

            Log.Information(
                "RecordEmployeeSkill API called. ManagerId={ManagerId}, EmployeeId={EmployeeId}, SkillId={SkillId}, Rating={Rating}",
                managerId, request.EmployeeId, request.SkillId, request.Rating
            );

            var result = await _employeeSkillService.RecordEmployeeSkill(managerId, request);

            if (result.Success)
            {
                Log.Information(
                    "RecordEmployeeSkill API succeeded. ManagerId={ManagerId}, EmployeeId={EmployeeId}, SkillId={SkillId}",
                    managerId, request.EmployeeId, request.SkillId
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "RecordEmployeeSkill API failed. ManagerId={ManagerId}, Message={Message}",
                    managerId, result.Message
                );
                return BadRequest(result);
            }
        }

        /// <summary>Records multiple skill ratings for an employee in a single transaction.</summary>
        [HttpPost("record-bulk")]
        public async Task<IActionResult> BulkRecordEmployeeSkills(
            [FromBody] BulkRecordSkillRequest request
        )
        {
            var managerId = GetCurrentEmployeeId();

            Log.Information(
                "BulkRecordEmployeeSkills API called. ManagerId={ManagerId}, EmployeeId={EmployeeId}, SkillCount={Count}",
                managerId, request.EmployeeId, request.Skills?.Count ?? 0
            );

            var result = await _employeeSkillService.BulkRecordEmployeeSkills(managerId, request);

            if (result.Success)
            {
                Log.Information(
                    "BulkRecordEmployeeSkills API succeeded. ManagerId={ManagerId}, EmployeeId={EmployeeId}, ProcessedCount={Count}",
                    managerId, request.EmployeeId, request.Skills?.Count ?? 0
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "BulkRecordEmployeeSkills API failed. ManagerId={ManagerId}, Message={Message}",
                    managerId, result.Message
                );
                return BadRequest(result);
            }
        }

        /// <summary>Updates an existing employee skill rating.</summary>
        [HttpPut("update-rating")]
        public async Task<IActionResult> UpdateEmployeeSkillRating(
            [FromBody] UpdateSkillRatingRequest request
        )
        {
            var managerId = GetCurrentEmployeeId();

            Log.Information(
                "UpdateEmployeeSkillRating API called. ManagerId={ManagerId}, MapperId={MapperId}, NewRating={NewRating}",
                managerId, request.MapperId, request.Rating
            );

            var result = await _employeeSkillService.UpdateEmployeeSkillRating(managerId, request);

            if (result.Success)
            {
                Log.Information(
                    "UpdateEmployeeSkillRating API succeeded. ManagerId={ManagerId}, MapperId={MapperId}, NewRating={NewRating}",
                    managerId, request.MapperId, request.Rating
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "UpdateEmployeeSkillRating API failed. ManagerId={ManagerId}, MapperId={MapperId}, Message={Message}",
                    managerId, request.MapperId, result.Message
                );
                return BadRequest(result);
            }
        }

        /// <summary>Deletes an employee skill mapping by mapper ID.</summary>
        [HttpDelete("{mapperId}")]
        public async Task<IActionResult> DeleteEmployeeSkill(int mapperId)
        {
            var managerId = GetCurrentEmployeeId();

            Log.Information(
                "DeleteEmployeeSkill API called. ManagerId={ManagerId}, MapperId={MapperId}",
                managerId, mapperId
            );

            var result = await _employeeSkillService.DeleteEmployeeSkill(managerId, mapperId);

            if (result.Success)
            {
                Log.Information(
                    "DeleteEmployeeSkill API succeeded. ManagerId={ManagerId}, MapperId={MapperId}",
                    managerId, mapperId
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "DeleteEmployeeSkill API failed. ManagerId={ManagerId}, MapperId={MapperId}, Message={Message}",
                    managerId, mapperId, result.Message
                );
                return BadRequest(result);
            }
        }

        #endregion
    }
}
