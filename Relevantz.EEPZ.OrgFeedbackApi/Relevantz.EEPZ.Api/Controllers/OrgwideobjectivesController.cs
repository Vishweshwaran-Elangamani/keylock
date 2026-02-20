using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Constants;
using Microsoft.AspNetCore.Authorization;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/orgwide-objectives")]
    [Authorize]
    public class OrgwideObjectivesController : ControllerBase
    {
        private readonly IOrgwideObjectivesService _service;
        private readonly ILogger<OrgwideObjectivesController> _logger;

        public OrgwideObjectivesController(
            IOrgwideObjectivesService service,
            ILogger<OrgwideObjectivesController> logger)
        {
            _service = service;
            _logger = logger;
        }

        /// <summary>
        /// Retrieves all organization-wide objectives.
        /// </summary>
        /// <returns>ApiResponseDto containing a list of OrgObjectiveResponseDto representing all objectives.</returns>
        // 200 OK: Objectives retrieved successfully.
        // 500 InternalServerError: Unexpected server-side error.
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponseDto<List<OrgObjectiveResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<List<OrgObjectiveResponseDto>>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetAllObjectives()
        {
            _logger.LogInformation("Retrieving all organization-wide objectives");

            var objectives = await _service.GetAllObjectivesAsync();

            return Ok(ApiResponseDto<List<OrgObjectiveResponseDto>>.SuccessResponse(
                objectives,
                MessageConstants.OrganizationObjectivesRetrieved));
        }

        /// <summary>
        /// Retrieves organization-wide objectives formatted for dropdown usage.
        /// Returns an empty list when no objectives are found; clients should
        /// display an appropriate empty state message in the UI.
        /// </summary>
        /// <returns>ApiResponseDto containing a list of OrgObjectiveResponseDto for dropdown display.</returns>
        // 200 OK: Objectives retrieved successfully (may return empty list).
        // 500 InternalServerError: Unexpected server-side error.
        [HttpGet("dropdown")]
        [ProducesResponseType(typeof(ApiResponseDto<List<OrgObjectiveResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<List<OrgObjectiveResponseDto>>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetAllObjectivesForDropdown()
        {
            _logger.LogInformation("Retrieving all organization objectives for dropdown");

            var objectives = await _service.GetAllObjectivesForDropdownAsync();

            return Ok(ApiResponseDto<List<OrgObjectiveResponseDto>>.SuccessResponse(
                objectives,
                MessageConstants.OrganizationObjectivesRetrieved));
        }

        /// <summary>
        /// Retrieves a specific organization-wide objective by its unique identifier.
        /// Returns 400 BadRequest for invalid IDs (zero or negative) to distinguish
        /// clearly invalid input from a valid ID that simply has no matching record.
        /// </summary>
        /// <param name="objectiveId">Unique identifier of the objective.</param>
        /// <returns>ApiResponseDto containing OrgObjectiveResponseDto representing the objective details.</returns>
        // 200 OK: Objective found and returned.
        // 400 BadRequest: The provided objective ID is invalid (zero or negative).
        // 404 NotFound: No objective exists for the given ID.
        // 500 InternalServerError: Unexpected server-side error.
        [HttpGet("{objectiveId:int}")]
        [ProducesResponseType(typeof(ApiResponseDto<OrgObjectiveResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<OrgObjectiveResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponseDto<OrgObjectiveResponseDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponseDto<OrgObjectiveResponseDto>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetObjectiveById(int objectiveId)
        {
            // Return 400 for invalid IDs instead of treating them as not found (404)
            // so clients can distinguish between bad input and a missing record.
            if (objectiveId <= 0)
            {
                _logger.LogWarning("Invalid objective ID provided: {ObjectiveId}", objectiveId);
                return BadRequest(ApiResponseDto<OrgObjectiveResponseDto>.ErrorResponse(
                    MessageConstants.InvalidIdProvided));
            }

            _logger.LogInformation("Retrieving organization objective with ID: {ObjectiveId}", objectiveId);

            var objective = await _service.GetObjectiveByIdAsync(objectiveId);

            if (objective == null)
            {
                _logger.LogWarning("Organization objective not found. ObjectiveId: {ObjectiveId}", objectiveId);
                return NotFound(ApiResponseDto<OrgObjectiveResponseDto>.ErrorResponse(
                    MessageConstants.OrganizationObjectiveNotFound));
            }

            return Ok(ApiResponseDto<OrgObjectiveResponseDto>.SuccessResponse(
                objective,
                MessageConstants.OrganizationObjectiveRetrieved));
        }

        /// <summary>
        /// Retrieves all active organization-wide objectives.
        /// </summary>
        /// <returns>ApiResponseDto containing a list of OrgObjectiveResponseDto for active objectives.</returns>
        // 200 OK: Active objectives retrieved successfully.
        // 500 InternalServerError: Unexpected server-side error.
        [HttpGet("active")]
        [ProducesResponseType(typeof(ApiResponseDto<List<OrgObjectiveResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<List<OrgObjectiveResponseDto>>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetActiveObjectives()
        {
            _logger.LogInformation("Retrieving active organization objectives");

            var objectives = await _service.GetActiveObjectivesAsync();

            return Ok(ApiResponseDto<List<OrgObjectiveResponseDto>>.SuccessResponse(
                objectives,
                MessageConstants.ActiveObjectivesRetrieved));
        }

        /// <summary>
        /// Retrieves organization-wide objectives filtered by status.
        /// Returns 400 BadRequest for null, empty, or unrecognized status values
        /// so clients receive a clear error instead of an unexplained empty list.
        /// </summary>
        /// <param name="status">Status value used to filter objectives.</param>
        /// <returns>ApiResponseDto containing a list of OrgObjectiveResponseDto matching the specified status.</returns>
        // 200 OK: Objectives for the given status retrieved successfully.
        // 400 BadRequest: Status is null, empty, or not a recognized value.
        // 500 InternalServerError: Unexpected server-side error.
        [HttpGet("objective/{status}")]
        [ProducesResponseType(typeof(ApiResponseDto<List<OrgObjectiveResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<List<OrgObjectiveResponseDto>>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponseDto<List<OrgObjectiveResponseDto>>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetObjectivesByStatus(string status)
        {
            // Return 400 for invalid status instead of an empty list
            // so clients know the input was rejected rather than no data existing.
            if (string.IsNullOrWhiteSpace(status))
            {
                _logger.LogWarning("Empty status provided for objective search");
                return BadRequest(ApiResponseDto<List<OrgObjectiveResponseDto>>.ErrorResponse(
                    MessageConstants.InvalidStatusProvided));
            }

            _logger.LogInformation("Retrieving objectives with status: {Status}", status);

            try
            {
                var objectives = await _service.GetObjectivesByStatusAsync(status);

                return Ok(ApiResponseDto<List<OrgObjectiveResponseDto>>.SuccessResponse(
                    objectives,
                    MessageConstants.ObjectivesByStatusRetrieved));
            }
            catch (ArgumentException ex)
            {
                // Service throws ArgumentException when status is not in the valid set.
                // Convert to 400 BadRequest with a clear error message for the client.
                _logger.LogWarning(ex, "Invalid status value provided: {Status}", status);
                return BadRequest(ApiResponseDto<List<OrgObjectiveResponseDto>>.ErrorResponse(
                    MessageConstants.InvalidStatusProvided));
            }
        }
    }
}
