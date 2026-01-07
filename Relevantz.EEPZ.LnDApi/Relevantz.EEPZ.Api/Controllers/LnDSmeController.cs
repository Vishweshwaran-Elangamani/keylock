using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.Services.Interface;
using Serilog;

namespace Relevantz.EEPZ.Api.Controllers.LnD
{
    /// <summary>
    /// SME Management - Applications and Directory
    /// </summary>
    [ApiController]
    [Route("api/lnd-sme")]
    [Authorize]
    public class LnDSmeController : BaseLnDController
    {
        #region Dependencies

        private readonly ILnDSmeService _smeService;

        public LnDSmeController(ILnDSmeService smeService)
        {
            _smeService = smeService;
        }

        #endregion 

        #region SME Status 

        /// <summary>Checks if the logged-in employee has active SME status for any skill.</summary>
        [HttpGet("check")]
        public async Task<IActionResult> CheckIfEmployeeIsSme()
        {
            var employeeId = GetCurrentEmployeeId();

            Log.Information("CheckIfEmployeeIsSme API called. EmployeeId={EmployeeId}", employeeId);

            var result = await _smeService.CheckIfEmployeeIsSme(employeeId);

            if (result.Success)
            {
                Log.Information(
                    "CheckIfEmployeeIsSme API succeeded. EmployeeId={EmployeeId}, IsSme={IsSme}",
                    employeeId, result.Data
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "CheckIfEmployeeIsSme API failed. EmployeeId={EmployeeId}, Message={Message}",
                    employeeId, result.Message
                );
                return BadRequest(result);
            }
        }

        #endregion

        #region SME Application

        /// <summary>Submits an SME application with supporting documents for approval.</summary>
        [HttpPost("apply")]
        public async Task<IActionResult> ApplyToBecomeSme([FromForm] BecomeSmeRequest request)
        {
            var employeeId = GetCurrentEmployeeId();

            Log.Information(
                "ApplyToBecomeSme API called. EmployeeId={EmployeeId}, SkillId={SkillId}",
                employeeId, request.SkillId
            );

            var result = await _smeService.ApplyToBecomeSme(employeeId, request);

            if (result.Success)
            {
                Log.Information(
                    "ApplyToBecomeSme API succeeded. EmployeeId={EmployeeId}, SkillId={SkillId}, ApprovalId={ApprovalId}",
                    employeeId, request.SkillId, result.Data
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "ApplyToBecomeSme API failed. EmployeeId={EmployeeId}, SkillId={SkillId}, Message={Message}",
                    employeeId, request.SkillId, result.Message
                );
                return BadRequest(result);
            }
        }

        #endregion

        #region SME Directory

        /// <summary>Gets paginated list of available SMEs for a specific skill with search capability.</summary>
        [HttpGet("available")]
        public async Task<IActionResult> GetAvailableSmes(
            [FromQuery] int skillId,
            [FromQuery] string? searchTerm,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10
        )
        {
            Log.Information(
                "GetAvailableSmes API called. SkillId={SkillId}, SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",
                skillId, searchTerm ?? "none", pageNumber, pageSize
            );

            var result = await _smeService.GetAvailableSmes(
                skillId,
                searchTerm,
                pageNumber,
                pageSize
            );

            if (result.Success)
            {
                Log.Information(
                    "GetAvailableSmes API succeeded. SkillId={SkillId}, TotalCount={TotalCount}",
                    skillId, result.Data?.TotalCount ?? 0
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "GetAvailableSmes API failed. SkillId={SkillId}, Message={Message}",
                    skillId, result.Message
                );
                return BadRequest(result);
            }
        }

        #endregion
    }
}
