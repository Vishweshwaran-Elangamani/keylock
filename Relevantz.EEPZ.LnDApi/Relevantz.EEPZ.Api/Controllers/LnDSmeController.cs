using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.Services.Interface;

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
        private readonly ILnDService _lndService;

        public LnDSmeController(ILnDService lndService)
        {
            _lndService = lndService;  
        }

        [HttpGet("check")]    
        public async Task<IActionResult> CheckIfEmployeeIsSme()
        {
            var employeeId = GetCurrentEmployeeId();
            var result = await _lndService.CheckIfEmployeeIsSme(employeeId);

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("apply")]    
        public async Task<IActionResult> ApplyToBecomeSme([FromForm] BecomeSmeRequest request)
        {
            var employeeId = GetCurrentEmployeeId();
            var result = await _lndService.ApplyToBecomeSme(employeeId, request);

            return result.Success ? Ok(result) : BadRequest(result);
        }    

        [HttpGet("available")]
        public async Task<IActionResult> GetAvailableSmes(
            [FromQuery] int skillId,
            [FromQuery] string? searchTerm,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10
        )
        {
            var result = await _lndService.GetAvailableSmes(
                skillId,
                searchTerm,
                pageNumber,
                pageSize
            );

            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
