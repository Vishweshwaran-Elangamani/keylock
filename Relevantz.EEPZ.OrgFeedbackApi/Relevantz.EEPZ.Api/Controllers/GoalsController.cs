using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/goals")]
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
        /// Retrieves all goals grouped into team and organization-level categories.
        /// </summary>
        /// <returns>
        /// ApiResponseDto containing SegregatedGoalsResponseDto with categorized goals.
        /// </returns>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponseDto<SegregatedGoalsResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<SegregatedGoalsResponseDto>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetAllGoals()
        {
            var response = await _goalService.GetAllGoalsAsync();

            return Ok(ApiResponseDto<SegregatedGoalsResponseDto>.SuccessResponse(
                response,
                MessageConstants.GoalsRetrievedSuccessfully));
        }

        /// <summary>
        /// Retrieves a specific goal using its unique identifier.
        /// </summary>
        /// <param name="goalId">Unique identifier of the goal.</param>
        /// <returns>
        /// ApiResponseDto containing ProjectGoalResponseDto representing the goal details.
        /// </returns>
        [HttpGet("{goalId:int}")]
        [ProducesResponseType(typeof(ApiResponseDto<ProjectGoalResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<ProjectGoalResponseDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponseDto<ProjectGoalResponseDto>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetGoalById(int goalId)
        {
            var response = await _goalService.GetGoalByIdAsync(goalId);

            if (response == null)
            {
                _logger.LogWarning("Goal not found. GoalId: {GoalId}", goalId);
                return NotFound(ApiResponseDto<ProjectGoalResponseDto>.ErrorResponse(MessageConstants.GoalNotFound));
            }

            return Ok(ApiResponseDto<ProjectGoalResponseDto>.SuccessResponse(
                response,
                MessageConstants.GoalRetrievedSuccessfully));
        }

        /// <summary>
        /// Retrieves all team-level goals.
        /// </summary>
        /// <returns>
        /// ApiResponseDto containing a list of ProjectGoalResponseDto for team goals.
        /// </returns>
        [HttpGet("team")]
        [ProducesResponseType(typeof(ApiResponseDto<List<ProjectGoalResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<List<ProjectGoalResponseDto>>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetTeamGoals()
        {
            var responses = await _goalService.GetTeamGoalsAsync();

            return Ok(ApiResponseDto<List<ProjectGoalResponseDto>>.SuccessResponse(
                responses,
                MessageConstants.TeamGoalsRetrievedSuccessfully));
        }

        /// <summary>
        /// Retrieves all organization-level goals.
        /// </summary>
        /// <returns>
        /// ApiResponseDto containing a list of ProjectGoalResponseDto for organization-level goals.
        /// </returns>
        [HttpGet("organization-level")]
        [ProducesResponseType(typeof(ApiResponseDto<List<ProjectGoalResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<List<ProjectGoalResponseDto>>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetOrganizationLevelGoals()
        {
            var responses = await _goalService.GetOrganizationLevelGoalsAsync();

            return Ok(ApiResponseDto<List<ProjectGoalResponseDto>>.SuccessResponse(
                responses,
                MessageConstants.OrganizationLevelGoalsRetrievedSuccessfully));
        }

        /// <summary>
        /// Retrieves all goals associated with a specific project.
        /// </summary>
        /// <param name="id">Unique identifier of the project.</param>
        /// <returns>
        /// ApiResponseDto containing a list of ProjectGoalResponseDto for the given project.
        /// </returns>
        [HttpGet("project/{id:int}")]
        [ProducesResponseType(typeof(ApiResponseDto<List<ProjectGoalResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<List<ProjectGoalResponseDto>>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetGoalsByProject(int id)
        {
            var responses = await _goalService.GetGoalsByProjectIdAsync(id);

            return Ok(ApiResponseDto<List<ProjectGoalResponseDto>>.SuccessResponse(
                responses,
                MessageConstants.ProjectGoalsRetrievedSuccessfully));
        }
    }
}
