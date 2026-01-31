using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace Relevantz.EEPZ.Api.Controllers
{
    /// <summary>
    /// Endpoints used by managers to discover opportunities, fetch parameters,
    /// view teams and nominations, and submit new nominations.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Authorize(Roles = "Manager")]
    [Produces("application/json")]
    public class ManagerNominationController : ControllerBase
    {
        private readonly IManagerNominationService _managerNominationService;
        private readonly ILogger<ManagerNominationController> _logger;

        public ManagerNominationController(
            IManagerNominationService managerNominationService,
            ILogger<ManagerNominationController> logger)
        {
            _managerNominationService = managerNominationService;
            _logger = logger;
        }

        [HttpGet("reward-types")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetRewardTypes()
        {
            _logger.LogInformation("[GET_REWARD_TYPES] Request received");
            var res = await _managerNominationService.GetRewardTypesAsync();
            return ToActionResult(res);
        }

        [HttpGet("opportunities")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetOpportunities()
        {
            _logger.LogInformation("[GET_OPPORTUNITIES] Request received");
            var res = await _managerNominationService.GetOpportunitiesAsync();
            return ToActionResult(res);
        }

        [HttpGet("opportunities/{rewardTypeId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetOpportunitiesByRewardType([FromRoute] int rewardTypeId)
        {
            if (rewardTypeId <= 0)
            {
                return BadRequest(new { success = false, message = "rewardTypeId must be greater than zero." });
            }

            _logger.LogInformation("[GET_OPPORTUNITIES_BY_REWARD] Request received for RewardTypeId: {RewardTypeId}", rewardTypeId);
            var res = await _managerNominationService.GetOpportunitiesByRewardTypeAsync(rewardTypeId);
            return ToActionResult(res);
        }

        [HttpGet("parameters/{rewardTypeId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetNominationParameters([FromRoute] int rewardTypeId)
        {
            if (rewardTypeId <= 0)
            {
                return BadRequest(new { success = false, message = "rewardTypeId must be greater than zero." });
            }

            _logger.LogInformation("[GET_PARAMETERS] Request received for RewardTypeId: {RewardTypeId}", rewardTypeId);
            var res = await _managerNominationService.GetNominationParametersAsync(rewardTypeId);
            return ToActionResult(res);
        }

        [HttpGet("team/{managerId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetTeamMembers([FromRoute] int managerId)
        {
            if (managerId <= 0)
            {
                return BadRequest(new { success = false, message = "managerId must be greater than zero." });
            }

            _logger.LogInformation("[GET_TEAM_MEMBERS] Request received for ManagerId: {ManagerId}", managerId);
            var res = await _managerNominationService.GetTeamMembersAsync(managerId);
            return ToActionResult(res);
        }

        [HttpPost("submit")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> CreateNomination(
            [FromBody] Relevantz.EEPZ.Common.DTOs.Request.NominationSubmitDto request)
        {
            _logger.LogInformation("[SUBMIT_NOMINATION] Request received for NomineeEmployeeId: {NomineeId}", request?.NomineeEmployeeId);

            if (request is null)
                return BadRequest(new { success = false, message = "Payload is required" });

            var res = await _managerNominationService.SubmitNominationAsync(request);
            return ToActionResult(res);
        }

        [HttpGet("employee-nominations/{employeeId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetEmployeeNominations([FromRoute] int employeeId)
        {
            if (employeeId <= 0)
            {
                return BadRequest(new { success = false, message = "employeeId must be greater than zero." });
            }

            _logger.LogInformation("[GET_EMPLOYEE_NOMINATIONS] Request received for EmployeeId: {EmployeeId}", employeeId);
            var res = await _managerNominationService.GetEmployeeNominationsAsync(employeeId);
            return ToActionResult(res);
        }

        [HttpGet("my-nominations/{managerId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetMyNominations([FromRoute] int managerId)
        {
            if (managerId <= 0)
            {
                return BadRequest(new { success = false, message = "managerId must be greater than zero." });
            }

            _logger.LogInformation("[GET_MY_NOMINATIONS] Request received for ManagerId: {ManagerId}", managerId);
            var res = await _managerNominationService.GetMyNominationsAsync(managerId);
            return ToActionResult(res);
        }

        [HttpGet("nomination-details/{nominationId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetNomination([FromRoute] int nominationId)
        {
            if (nominationId <= 0)
            {
                return BadRequest(new { success = false, message = "nominationId must be greater than zero." });
            }

            _logger.LogInformation("[GET_NOMINATION_DETAILS] Request received for NominationId: {NominationId}", nominationId);
            var res = await _managerNominationService.GetNominationDetailsAsync(nominationId);
            return ToActionResult(res);
        }

        private IActionResult ToActionResult(object response)
        {
            if (response == null)
                return StatusCode(500, new { success = false, message = "Null response" });

            var type = response.GetType();
            var statusProp = type.GetProperty("statusCode") ?? type.GetProperty("StatusCode");
            var code = 200;

            if (statusProp != null)
            {
                var val = statusProp.GetValue(response);
                if (val is int i) code = i;
                else if (val != null && int.TryParse(val.ToString(), out var parsed)) code = parsed;
            }

            return StatusCode(code, response);
        }
    }
}