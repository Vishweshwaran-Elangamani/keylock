using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Core.IService;

namespace Relevantz.EEPZ.Api.Controllers
{
    /// <summary>
    /// Controller for managing goals
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class GoalsController : ControllerBase
    {
        private readonly IGoalService _goalService;
        private readonly ILogger<GoalsController> _logger;

        public GoalsController(IGoalService goalService, ILogger<GoalsController> logger)
        {
            _goalService = goalService;
            _logger = logger;
        }

        /// <summary>
        /// Get all goals segregated by type (Team Goals and Organization Level Goals)
        /// </summary>
        /// <returns>Segregated goals response</returns>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<SegregatedGoalsResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<SegregatedGoalsResponse>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetAllGoals()
        {
            var response = await _goalService.GetAllGoalsAsync();

            return Ok(ApiResponse<SegregatedGoalsResponse>.SuccessResponse(
                response,
                MessageConstants.GoalsRetrievedSuccessfully));
        }

        /// <summary>
        /// Get specific goal by ID
        /// </summary>
        /// <param name="goalId">The goal identifier</param>
        /// <returns>Project goal response</returns>
        [HttpGet("{goalId}")]
        [ProducesResponseType(typeof(ApiResponse<ProjectGoalResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<ProjectGoalResponse>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse<ProjectGoalResponse>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetGoalById(int goalId)
        {
            var response = await _goalService.GetGoalByIdAsync(goalId);

            if (response == null)
            {
                _logger.LogWarning("Goal with ID {GoalId} not found", goalId);
                return NotFound(ApiResponse<ProjectGoalResponse>.ErrorResponse(MessageConstants.GoalNotFound));
            }

            return Ok(ApiResponse<ProjectGoalResponse>.SuccessResponse(
                response,
                MessageConstants.GoalRetrievedSuccessfully));
        }

        /// <summary>
        /// Get all team goals (goals linked to projects)
        /// </summary>
        /// <returns>List of team goals</returns>
        [HttpGet("team")]
        [ProducesResponseType(typeof(ApiResponse<List<ProjectGoalResponse>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<List<ProjectGoalResponse>>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetTeamGoals()
        {
            var responses = await _goalService.GetTeamGoalsAsync();

            return Ok(ApiResponse<List<ProjectGoalResponse>>.SuccessResponse(
                responses,
                MessageConstants.TeamGoalsRetrievedSuccessfully));
        }

        /// <summary>
        /// Get all organization level goals (goals not linked to projects)
        /// </summary>
        /// <returns>List of organization level goals</returns>
        [HttpGet("organization-level")]
        [ProducesResponseType(typeof(ApiResponse<List<ProjectGoalResponse>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<List<ProjectGoalResponse>>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetOrganizationLevelGoals()
        {
            var responses = await _goalService.GetOrganizationLevelGoalsAsync();

            return Ok(ApiResponse<List<ProjectGoalResponse>>.SuccessResponse(
                responses,
                MessageConstants.OrganizationLevelGoalsRetrievedSuccessfully));
        }

        /// <summary>
        /// Get goals for a specific project
        /// </summary>
        /// <param name="id">The project identifier</param>
        /// <returns>List of project goals</returns>
        [HttpGet("project/{id}")]
        [ProducesResponseType(typeof(ApiResponse<List<ProjectGoalResponse>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<List<ProjectGoalResponse>>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetGoalsByProject(int id)
        {
            var responses = await _goalService.GetGoalsByProjectIdAsync(id);

            return Ok(ApiResponse<List<ProjectGoalResponse>>.SuccessResponse(
                responses,
                MessageConstants.ProjectGoalsRetrievedSuccessfully));
        }
    }
}
