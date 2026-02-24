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
    [ApiVersion("1.0")]
    [Route("api/[controller]")]
    [Route("api/v{version:apiVersion}/[controller]")]
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


        /// <summary>
        /// fetch the reward type on manager 
        /// </summary>
        /// <returns></returns>
        /// 

        [HttpGet("reward-types")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetRewardTypes()
        {
            _logger.LogInformation("[GET_REWARD_TYPES] Request received");
            var res = await _managerNominationService.GetRewardTypesAsync();
            return ToActionResult(res);
        }


        /// <summary>
        ///feth the opertunities 
        /// </summary>
        /// <returns></returns>
        // [HttpGet("opportunities")]
        // [ProducesResponseType(StatusCodes.Status200OK)]
        // [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        // public async Task<IActionResult> GetOpportunities()
        // {
        //     _logger.LogInformation("[GET_OPPORTUNITIES] Request received");
        //     var res = await _managerNominationService.GetOpportunitiesAsync();
        //     return ToActionResult(res);
        // }
        /// <summary>
        /// fetch oprtunity for that reward 
        /// </summary>
        /// <param name="rewardTypeId"></param>
        /// <returns></returns>
        // [HttpGet("opportunities/{rewardTypeId:int}")]
        // [ProducesResponseType(StatusCodes.Status200OK)]
        // [ProducesResponseType(StatusCodes.Status400BadRequest)]
        // [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        // public async Task<IActionResult> GetOpportunitiesByRewardType([FromRoute] int rewardTypeId)
        // {
        //     if (rewardTypeId <= 0)
        //     {
        //         return BadRequest(new { success = false, message = "rewardTypeId must be greater than zero." });
        //     }

        //     _logger.LogInformation("[GET_OPPORTUNITIES_BY_REWARD] Request received for RewardTypeId: {RewardTypeId}", rewardTypeId);
        //     var res = await _managerNominationService.GetOpportunitiesByRewardTypeAsync(rewardTypeId);
        //     return ToActionResult(res);
        // }



        ///<summary>
        ///feteches the parameters for a reward type
        ///</summary>
        
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
        /// <summary>
        /// 
        /// </summary>
        /// <param name="managerId"></param>
        /// <returns></returns>


        /// <summary>
        /// get the tem member of the manager 
        /// </summary>
        /// <param name="managerId"></param>
        /// <returns></returns>
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
        /// <summary>
        /// nominate the employee 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
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
        /// <summary>
        /// 
        /// </summary>
        /// <param name="employeeId"></param>
        /// <returns></returns>
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
        /// <summary>
        /// view all nominations 
        /// </summary>
        /// <param name="managerId"></param>
        /// <returns></returns>
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
        /// <summary>
        /// view detailed justfication and comment after manager submited 
        /// </summary>
        /// <param name="nominationId"></param>
        /// <returns></returns>
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