 
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

        [HttpGet("api/lnd-sme/check")]

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

        [HttpPost("api/lnd-sme/apply")]

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
 
        /// <summary>Gets available SMEs for a specific skill with pagination and search.</summary>

[HttpGet("api/lnd-sme/available")]

public async Task<IActionResult> GetAvailableSmes([FromQuery] AvailableSmesRequestModel request)

{

    Log.Information(

        "GetAvailableSmes API called. SkillId={SkillId}, SearchTerm={SearchTerm}, Page={PageNumber}, PageSize={PageSize}",

        request.SkillId, request.SearchTerm ?? "none", request.PageNumber, request.PageSize

    );
 
    var result = await _smeService.GetAvailableSmes(

        request.SkillId,

        request.SearchTerm,

        request.PageNumber,

        request.PageSize 

    );
 
    if (result.Success)

    {

        Log.Information(

            "GetAvailableSmes API succeeded. SkillId={SkillId}, TotalCount={TotalCount}",

            request.SkillId, result.Data?.TotalCount ?? 0

        );

        return Ok(result);

    }

    else

    {

        Log.Warning(

            "GetAvailableSmes API failed. SkillId={SkillId}, Message={Message}",

            request.SkillId, result.Message

        );

        return BadRequest(result);

    }

}
 
        #endregion

    }

}
 



 