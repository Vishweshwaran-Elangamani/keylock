using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Core.Services.Interface;
using Serilog;

namespace Relevantz.EEPZ.Api.Controllers.LnD
{
    /// <summary>
    /// Employee Skills Management
    /// </summary>
    [ApiController]
    [Authorize]
    public class LnDEmployeeSkillsController : BaseLnDController
    {
        #region Dependencies

        private readonly ILnDEmployeeSkillService _employeeSkillService;

        public LnDEmployeeSkillsController(ILnDEmployeeSkillService employeeSkillService)
        {
            _employeeSkillService = employeeSkillService;
        }

        #endregion

        #region Skill Retrieval

        /// <summary>
        /// Gets all available skills for dropdown selection
        /// </summary>
        [HttpGet("api/lnd-skills/all")]
        public async Task<IActionResult> GetAllSkills()
        {
            Log.Information("GetAllSkills API called");

            var result = await _employeeSkillService.GetAllSkills();

            if (result.Success)
            {
                Log.Information(
                    "GetAllSkills API succeeded. SkillCount={Count}",
                    result.Data?.Count ?? 0
                );
                return Ok(result);
            }
            else
            {
                Log.Warning("GetAllSkills API failed. Message={Message}", result.Message);
                return BadRequest(result);
            }
        }

        /// <summary>
        /// Gets paginated skills for the logged-in employee
        /// </summary>
        [HttpGet("api/lnd-skills/my-skills")]
        public async Task<IActionResult> GetMySkills([FromQuery] MySkillsRequestModel request)
        {
            var employeeId = GetCurrentEmployeeId();

            Log.Information(
                "GetMySkills API called. EmployeeId={EmployeeId}, SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",
                employeeId,
                request.SearchTerm ?? "none",
                request.PageNumber,
                request.PageSize
            );

            var result = await _employeeSkillService.GetMySkills(employeeId, request);

            if (result.Success)
            {
                Log.Information(
                    "GetMySkills API succeeded. EmployeeId={EmployeeId}, TotalCount={TotalCount}",
                    employeeId,
                    result.Data?.TotalCount ?? 0
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "GetMySkills API failed. EmployeeId={EmployeeId}, Message={Message}",
                    employeeId,
                    result.Message
                );
                return BadRequest(result);
            }
        }

        /// <summary>
        /// Gets skills for subordinate employees with optional employee filter and search
        /// </summary>
        [HttpGet("api/lnd-skills/subordinates")]
        public async Task<IActionResult> GetSubordinateSkills(
            [FromQuery] SubordinateSkillsRequestModel request
        )
        {
            var managerId = GetCurrentEmployeeId();

            Log.Information(
                "GetSubordinateSkills API called. ManagerId={ManagerId}, EmployeeId={EmployeeId}, SearchTerm={SearchTerm}, SortBy={SortBy}, Page={PageNumber}",
                managerId,
                request.EmployeeId?.ToString() ?? "all",
                request.SearchTerm ?? "none",
                request.SortBy,
                request.PageNumber
            );

            var result = await _employeeSkillService.GetSubordinateSkills(managerId, request);

            if (result.Success)
            {
                Log.Information(
                    "GetSubordinateSkills API succeeded. ManagerId={ManagerId}, TotalCount={TotalCount}",
                    managerId,
                    result.Data?.TotalCount ?? 0
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "GetSubordinateSkills API failed. ManagerId={ManagerId}, Message={Message}",
                    managerId,
                    result.Message
                );
                return BadRequest(result);
            }
        }

        #endregion

        #region Employee Management

        /// <summary>
        /// Gets paginated list of subordinate employees with search capability
        /// </summary>
        [HttpGet("api/lnd-skills/employees/subordinates")]
        public async Task<IActionResult> GetSubordinateEmployees(
            [FromQuery] SubordinateEmployeesRequestModel request
        )
        {
            var managerId = GetCurrentEmployeeId();

            Log.Information(
                "GetSubordinateEmployees API called. ManagerId={ManagerId}, SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",
                managerId,
                request.SearchTerm ?? "none",
                request.PageNumber,
                request.PageSize
            );

            var result = await _employeeSkillService.GetSubordinateEmployees(managerId, request);

            if (result.Success)
            {
                Log.Information(
                    "GetSubordinateEmployees API succeeded. ManagerId={ManagerId}, TotalCount={TotalCount}",
                    managerId,
                    result.Data?.TotalCount ?? 0
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "GetSubordinateEmployees API failed. ManagerId={ManagerId}, Message={Message}",
                    managerId,
                    result.Message
                );
                return BadRequest(result);
            }
        }

        #endregion

        #region Skill Modifications

        /// <summary>
        /// Records a single skill rating for an employee
        /// </summary>
        [HttpPost("api/lnd-skills/record")]
        public async Task<IActionResult> RecordEmployeeSkill(
            [FromBody] RecordSkillRequestModel request
        )
        {
            var managerId = GetCurrentEmployeeId();

            Log.Information(
                "RecordEmployeeSkill API called. ManagerId={ManagerId}, EmployeeId={EmployeeId}, SkillId={SkillId}, Rating={Rating}",
                managerId,
                request.EmployeeId,
                request.SkillId,
                request.Rating
            );

            var result = await _employeeSkillService.RecordEmployeeSkill(managerId, request);

            if (result.Success)
            {
                Log.Information(
                    "RecordEmployeeSkill API succeeded. ManagerId={ManagerId}, EmployeeId={EmployeeId}, SkillId={SkillId}",
                    managerId,
                    request.EmployeeId,
                    request.SkillId
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "RecordEmployeeSkill API failed. ManagerId={ManagerId}, Message={Message}",
                    managerId,
                    result.Message
                );
                return BadRequest(result);
            }
        }

        /// <summary>
        /// Records multiple skill ratings for an employee in a single transaction
        /// </summary>
        [HttpPost("api/lnd-skills/record-bulk")]
        public async Task<IActionResult> BulkRecordEmployeeSkills(
            [FromBody] BulkRecordSkillRequestModel request
        )
        {
            var managerId = GetCurrentEmployeeId();

            Log.Information(
                "BulkRecordEmployeeSkills API called. ManagerId={ManagerId}, EmployeeId={EmployeeId}, SkillCount={Count}",
                managerId,
                request.EmployeeId,
                request.Skills?.Count ?? 0
            );

            var result = await _employeeSkillService.BulkRecordEmployeeSkills(managerId, request);

            if (result.Success)
            {
                Log.Information(
                    "BulkRecordEmployeeSkills API succeeded. ManagerId={ManagerId}, EmployeeId={EmployeeId}, ProcessedCount={Count}",
                    managerId,
                    request.EmployeeId,
                    request.Skills?.Count ?? 0
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "BulkRecordEmployeeSkills API failed. ManagerId={ManagerId}, Message={Message}",
                    managerId,
                    result.Message
                );
                return BadRequest(result);
            }
        }

        /// <summary>
        /// Updates an existing employee skill rating
        /// </summary>
        [HttpPut("api/lnd-skills/rating")]
        public async Task<IActionResult> UpdateEmployeeSkillRating(
            [FromBody] UpdateSkillRatingRequestModel request
        )
        {
            var managerId = GetCurrentEmployeeId();

            Log.Information(
                "UpdateEmployeeSkillRating API called. ManagerId={ManagerId}, MapperId={MapperId}, NewRating={NewRating}",
                managerId,
                request.MapperId,
                request.Rating
            );

            var result = await _employeeSkillService.UpdateEmployeeSkillRating(managerId, request);

            if (result.Success)
            {
                Log.Information(
                    "UpdateEmployeeSkillRating API succeeded. ManagerId={ManagerId}, MapperId={MapperId}, NewRating={NewRating}",
                    managerId,
                    request.MapperId,
                    request.Rating
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "UpdateEmployeeSkillRating API failed. ManagerId={ManagerId}, MapperId={MapperId}, Message={Message}",
                    managerId,
                    request.MapperId,
                    result.Message
                );
                return BadRequest(result);
            }
        }

        /// <summary>
        /// Deletes an employee skill mapping by mapper ID
        /// </summary>
        [HttpDelete("api/lnd-skills/{Id}")]
        public async Task<IActionResult> DeleteEmployeeSkill(int Id)
        {
            var managerId = GetCurrentEmployeeId();

            Log.Information(
                "DeleteEmployeeSkill API called. ManagerId={ManagerId}, MapperId={MapperId}",
                managerId,
                Id
            );

            var result = await _employeeSkillService.DeleteEmployeeSkill(managerId, Id);

            if (result.Success)
            {
                Log.Information(
                    "DeleteEmployeeSkill API succeeded. ManagerId={ManagerId}, MapperId={MapperId}",
                    managerId,
                    Id
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "DeleteEmployeeSkill API failed. ManagerId={ManagerId}, MapperId={MapperId}, Message={Message}",
                    managerId,
                    Id,
                    result.Message
                );
                return BadRequest(result);
            }
        }

        #endregion
    }
}
