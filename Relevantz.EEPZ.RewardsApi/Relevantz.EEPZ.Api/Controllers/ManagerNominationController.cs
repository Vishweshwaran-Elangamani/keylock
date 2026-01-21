using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
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
        public async Task<IActionResult> GetRewardTypes()
        {
            try
            {
                _logger.LogInformation("[GET_REWARD_TYPES] Request received");
                var res = await _managerNominationService.GetRewardTypesAsync();
                return ToActionResult(res);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET_REWARD_TYPES] Unhandled error");
                return StatusCode(500, new { success = false, message = "Unexpected error while fetching reward types." });
            }
        }

        [HttpGet("opportunities")]
        public async Task<IActionResult> GetOpportunities()
        {
            try
            {
                _logger.LogInformation("[GET_OPPORTUNITIES] Request received");
                var res = await _managerNominationService.GetOpportunitiesAsync();
                return ToActionResult(res);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET_OPPORTUNITIES] Unhandled error");
                return StatusCode(500, new { success = false, message = "Unexpected error while fetching opportunities." });
            }
        }

        [HttpGet("opportunities/{rewardTypeId:int}")]
        public async Task<IActionResult> GetOpportunitiesByRewardType([FromRoute] int rewardTypeId)
        {
            try
            {
                _logger.LogInformation("[GET_OPPORTUNITIES_BY_REWARD] Request received for RewardTypeId: {RewardTypeId}", rewardTypeId);
                var res = await _managerNominationService.GetOpportunitiesByRewardTypeAsync(rewardTypeId);
                return ToActionResult(res);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET_OPPORTUNITIES_BY_REWARD] Unhandled error for RewardTypeId: {RewardTypeId}", rewardTypeId);
                return StatusCode(500, new { success = false, message = "Unexpected error while fetching opportunities by reward type." });
            }
        }

        [HttpGet("parameters/{rewardTypeId:int}")]
        public async Task<IActionResult> GetNominationParameters([FromRoute] int rewardTypeId)
        {
            try
            {
                _logger.LogInformation("[GET_PARAMETERS] Request received for RewardTypeId: {RewardTypeId}", rewardTypeId);
                var res = await _managerNominationService.GetNominationParametersAsync(rewardTypeId);
                return ToActionResult(res);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET_PARAMETERS] Unhandled error for RewardTypeId: {RewardTypeId}", rewardTypeId);
                return StatusCode(500, new { success = false, message = "Unexpected error while fetching nomination parameters." });
            }
        }

        [HttpGet("team/{managerId:int}")]
        public async Task<IActionResult> GetTeamMembers([FromRoute] int managerId)
        {
            try
            {
                _logger.LogInformation("[GET_TEAM_MEMBERS] Request received for ManagerId: {ManagerId}", managerId);
                var res = await _managerNominationService.GetTeamMembersAsync(managerId);
                return ToActionResult(res);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET_TEAM_MEMBERS] Unhandled error for ManagerId: {ManagerId}", managerId);
                return StatusCode(500, new { success = false, message = "Unexpected error while fetching team members." });
            }
        }

        [HttpPost("submit")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateNomination(
            [FromBody] Relevantz.EEPZ.Common.DTOs.Request.NominationSubmitDto request)
        {
            try
            {
                _logger.LogInformation("[SUBMIT_NOMINATION] Request received for NomineeEmployeeId: {NomineeId}", request?.NomineeEmployeeId);

                if (request is null)
                    return BadRequest(new { success = false, message = "Payload is required" });

                var res = await _managerNominationService.SubmitNominationAsync(request);
                return ToActionResult(res);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[SUBMIT_NOMINATION] Unhandled error for NomineeEmployeeId: {NomineeId}", request?.NomineeEmployeeId);
                return StatusCode(500, new { success = false, message = "Unexpected error while submitting nomination." });
            }
        }

        [HttpGet("employee-nominations/{employeeId:int}")]
        public async Task<IActionResult> GetEmployeeNominations([FromRoute] int employeeId)
        {
            try
            {
                _logger.LogInformation("[GET_EMPLOYEE_NOMINATIONS] Request received for EmployeeId: {EmployeeId}", employeeId);
                var res = await _managerNominationService.GetEmployeeNominationsAsync(employeeId);
                return ToActionResult(res);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET_EMPLOYEE_NOMINATIONS] Unhandled error for EmployeeId: {EmployeeId}", employeeId);
                return StatusCode(500, new { success = false, message = "Unexpected error while fetching employee nominations." });
            }
        }

        [HttpGet("my-nominations/{managerId:int}")]
        public async Task<IActionResult> GetMyNominations([FromRoute] int managerId)
        {
            try
            {
                _logger.LogInformation("[GET_MY_NOMINATIONS] Request received for ManagerId: {ManagerId}", managerId);
                var res = await _managerNominationService.GetMyNominationsAsync(managerId);
                return ToActionResult(res);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET_MY_NOMINATIONS] Unhandled error for ManagerId: {ManagerId}", managerId);
                return StatusCode(500, new { success = false, message = "Unexpected error while fetching your nominations." });
            }
        }

        [HttpGet("nomination-details/{nominationId:int}")]
        public async Task<IActionResult> GetNomination([FromRoute] int nominationId)
        {
            try
            {
                _logger.LogInformation("[GET_NOMINATION_DETAILS] Request received for NominationId: {NominationId}", nominationId);
                var res = await _managerNominationService.GetNominationDetailsAsync(nominationId);
                return ToActionResult(res);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GET_NOMINATION_DETAILS] Unhandled error for NominationId: {NominationId}", nominationId);
                return StatusCode(500, new { success = false, message = "Unexpected error while fetching nomination details." });
            }
        }

        /// <summary>
        /// Maps anonymous service response to IActionResult. If 'statusCode' exists, uses it.
        /// </summary>
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
