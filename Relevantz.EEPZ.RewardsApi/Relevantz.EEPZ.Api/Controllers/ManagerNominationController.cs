
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
    [Produces("application/json")]
    public class ManagerNominationController : ControllerBase
    {
        private readonly IManagerNominationService _managerNominationService;
        private readonly ILogger<ManagerNominationController> _logger;

        /// <summary>
        /// Creates a new instance of <see cref="ManagerNominationController"/>.
        /// </summary>
        /// <param name="managerNominationService">Domain service for manager nomination flows.</param>
        /// <param name="logger">Structured logger instance.</param>
        public ManagerNominationController(
            IManagerNominationService managerNominationService,
            ILogger<ManagerNominationController> logger)
        {
            _managerNominationService = managerNominationService;
            _logger = logger;
        }

        /// <summary>
        /// Gets the list of reward types visible to managers for creating nominations.
        /// </summary>
        /// <remarks>
        /// Returns only reward types that are currently available/configured for manager nominations.
        /// </remarks>
        /// <response code="200">Reward types were fetched successfully.</response>
        /// <response code="500">An unexpected error occurred while fetching reward types.</response>
        [HttpGet("reward-types")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
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

        /// <summary>
        /// Gets all active nomination opportunities available to the current manager.
        /// </summary>
        /// <remarks>
        /// The result may be filtered at the service/repository layer based on business rules
        /// (e.g., deadlines, visibility, manager eligibility).
        /// </remarks>
        /// <response code="200">Opportunities were fetched successfully.</response>
        /// <response code="500">An unexpected error occurred while fetching opportunities.</response>
        [HttpGet("opportunities")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
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

        /// <summary>
        /// Gets all active nomination opportunities for a specific reward type.
        /// </summary>
        /// <param name="rewardTypeId">Unique identifier of the reward type.</param>
        /// <response code="200">Opportunities for the specified reward type were fetched successfully.</response>
        /// <response code="400">The provided rewardTypeId is invalid.</response>
        /// <response code="500">An unexpected error occurred while fetching opportunities by reward type.</response>
        [HttpGet("opportunities/{rewardTypeId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetOpportunitiesByRewardType([FromRoute] int rewardTypeId)
        {
            try
            {
                if (rewardTypeId <= 0)
                {
                    return BadRequest(new { success = false, message = "rewardTypeId must be greater than zero." });
                }

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

        /// <summary>
        /// Gets nomination parameter definitions for the given reward type.
        /// </summary>
        /// <param name="rewardTypeId">Unique identifier of the reward type to fetch parameter schema for.</param>
        /// <response code="200">Nomination parameters were fetched successfully.</response>
        /// <response code="400">The provided rewardTypeId is invalid.</response>
        /// <response code="500">An unexpected error occurred while fetching nomination parameters.</response>
        [HttpGet("parameters/{rewardTypeId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetNominationParameters([FromRoute] int rewardTypeId)
        {
            try
            {
                if (rewardTypeId <= 0)
                {
                    return BadRequest(new { success = false, message = "rewardTypeId must be greater than zero." });
                }

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

        /// <summary>
        /// Gets direct/indirect team members for a manager to nominate from.
        /// </summary>
        /// <param name="managerId">Manager's employee identifier.</param>
        /// <response code="200">Team members were fetched successfully.</response>
        /// <response code="400">The provided managerId is invalid.</response>
        /// <response code="500">An unexpected error occurred while fetching team members.</response>
        [HttpGet("team/{managerId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetTeamMembers([FromRoute] int managerId)
        {
            try
            {
                if (managerId <= 0)
                {
                    return BadRequest(new { success = false, message = "managerId must be greater than zero." });
                }

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

        /// <summary>
        /// Submits a new nomination on behalf of a manager.
        /// </summary>
        /// <remarks>
        /// Validations (eligibility, duplicates, window constraints) are performed in the service layer.
        /// </remarks>
        /// <param name="request">Nomination payload, including nominee and parameter values.</param>
        /// <response code="200">Nomination was submitted successfully.</response>
        /// <response code="400">The request payload is invalid.</response>
        /// <response code="403">The caller is not authorized to submit this nomination.</response>
        /// <response code="500">An unexpected error occurred while submitting the nomination.</response>
        [HttpPost("submit")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
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

        /// <summary>
        /// Gets nominations submitted for an employee (regardless of who nominated).
        /// </summary>
        /// <param name="employeeId">Employee’s identifier.</param>
        /// <response code="200">Employee nominations were fetched successfully.</response>
        /// <response code="400">The provided employeeId is invalid.</response>
        /// <response code="500">An unexpected error occurred while fetching employee nominations.</response>
        [HttpGet("employee-nominations/{employeeId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetEmployeeNominations([FromRoute] int employeeId)
        {
            try
            {
                if (employeeId <= 0)
                {
                    return BadRequest(new { success = false, message = "employeeId must be greater than zero." });
                }

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

        /// <summary>
        /// Gets nominations submitted by a specific manager.
        /// </summary>
        /// <param name="managerId">Manager’s employee identifier.</param>
        /// <response code="200">Manager nominations were fetched successfully.</response>
        /// <response code="400">The provided managerId is invalid.</response>
        /// <response code="500">An unexpected error occurred while fetching manager nominations.</response>
        [HttpGet("my-nominations/{managerId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetMyNominations([FromRoute] int managerId)
        {
            try
            {
                if (managerId <= 0)
                {
                    return BadRequest(new { success = false, message = "managerId must be greater than zero." });
                }

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

        /// <summary>
        /// Gets full details for a specific nomination.
        /// </summary>
        /// <param name="nominationId">Nomination identifier.</param>
        /// <response code="200">Nomination details were fetched successfully.</response>
        /// <response code="400">The provided nominationId is invalid.</response>
        /// <response code="500">An unexpected error occurred while fetching nomination details.</response>
        [HttpGet("nomination-details/{nominationId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetNomination([FromRoute] int nominationId)
        {
            try
            {
                if (nominationId <= 0)
                {
                    return BadRequest(new { success = false, message = "nominationId must be greater than zero." });
                }

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
        /// Maps anonymous service response to <see cref="IActionResult"/>. If a 'statusCode' field is present, that code is used.
        /// </summary>
        /// <param name="response">Anonymous/DTO response from service layer.</param>
        /// <returns>Action result with the specified or default HTTP status code.</returns>
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
