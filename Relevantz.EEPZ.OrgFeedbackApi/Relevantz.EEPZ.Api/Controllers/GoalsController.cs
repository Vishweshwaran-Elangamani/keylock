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
        /// <returns>ApiResponseDto containing SegregatedGoalsResponseDto with categorized goals.</returns>
        // 200 OK: Goals retrieved successfully.
        // 500 InternalServerError: Unexpected server-side error.
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
        /// <returns>ApiResponseDto containing ProjectGoalResponseDto representing the goal details.</returns>
        // 200 OK: Goal found and returned.
        // 400 BadRequest: The provided goal ID is invalid (zero or negative).
        // 404 NotFound: No goal exists for the given ID.
        // 500 InternalServerError: Unexpected server-side error.
        [HttpGet("{goalId:int}")]
        [ProducesResponseType(typeof(ApiResponseDto<ProjectGoalResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<ProjectGoalResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponseDto<ProjectGoalResponseDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponseDto<ProjectGoalResponseDto>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetGoalById(int goalId)
        {
            // Use MessageConstants.InvalidIdProvided to keep invalid ID messages
            // consistent across all controllers.
            if (goalId <= 0)
            {
                _logger.LogWarning("Invalid goal ID provided: {GoalId}", goalId);
                return BadRequest(ApiResponseDto<ProjectGoalResponseDto>.ErrorResponse(
                    MessageConstants.InvalidIdProvided));
            }

            var response = await _goalService.GetGoalByIdAsync(goalId);

            if (response == null)
            {
                _logger.LogWarning("Goal not found. GoalId: {GoalId}", goalId);
                return NotFound(ApiResponseDto<ProjectGoalResponseDto>.ErrorResponse(
                    MessageConstants.GoalNotFound));
            }

            return Ok(ApiResponseDto<ProjectGoalResponseDto>.SuccessResponse(
                response,
                MessageConstants.GoalRetrievedSuccessfully));
        }

        /// <summary>
        /// Retrieves all team-level goals with pagination support.
        /// </summary>
        /// <param name="pageNumber">The page number to retrieve (default: 1).</param>
        /// <param name="pageSize">The number of records per page (default: 20).</param>
        /// <returns>ApiResponseDto containing a paginated list of ProjectGoalResponseDto for team goals.</returns>
        // 200 OK: Team goals retrieved successfully.
        // 500 InternalServerError: Unexpected server-side error.
        [HttpGet("team")]
        [ProducesResponseType(typeof(ApiResponseDto<List<ProjectGoalResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<List<ProjectGoalResponseDto>>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetTeamGoals(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            var responses = await _goalService.GetTeamGoalsAsync(pageNumber, pageSize);

            return Ok(ApiResponseDto<List<ProjectGoalResponseDto>>.SuccessResponse(
                responses,
                MessageConstants.TeamGoalsRetrievedSuccessfully));
        }

        /// <summary>
        /// Retrieves all organization-level goals.
        /// </summary>
        /// <returns>ApiResponseDto containing a list of ProjectGoalResponseDto for organization-level goals.</returns>
        // 200 OK: Organization-level goals retrieved successfully.
        // 500 InternalServerError: Unexpected server-side error.
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
        /// Validates the project ID before querying to avoid unnecessary
        /// database calls for clearly invalid inputs.
        /// </summary>
        /// <param name="id">Unique identifier of the project.</param>
        /// <returns>ApiResponseDto containing a list of ProjectGoalResponseDto for the given project.</returns>
        // 200 OK: Project goals retrieved successfully.
        // 400 BadRequest: The provided project ID is invalid (zero or negative).
        // 500 InternalServerError: Unexpected server-side error.
        [HttpGet("project/{id:int}")]
        [ProducesResponseType(typeof(ApiResponseDto<List<ProjectGoalResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<List<ProjectGoalResponseDto>>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponseDto<List<ProjectGoalResponseDto>>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetGoalsByProject(int id)
        {
            // Use MessageConstants.InvalidIdProvided to keep invalid ID messages
            // consistent across all controllers.
            if (id <= 0)
            {
                _logger.LogWarning("Invalid project ID provided: {ProjectId}", id);
                return BadRequest(ApiResponseDto<List<ProjectGoalResponseDto>>.ErrorResponse(
                    MessageConstants.InvalidIdProvided));
            }

            var responses = await _goalService.GetGoalsByProjectIdAsync(id);

            return Ok(ApiResponseDto<List<ProjectGoalResponseDto>>.SuccessResponse(
                responses,
                MessageConstants.ProjectGoalsRetrievedSuccessfully));
        }
    }
}
