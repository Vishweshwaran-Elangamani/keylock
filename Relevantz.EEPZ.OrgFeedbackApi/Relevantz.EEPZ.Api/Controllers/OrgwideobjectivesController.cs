using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Constants;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/orgwide-objectives")]
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
        /// <returns>
        /// ApiResponseDto containing a list of OrgObjectiveResponseDto representing all objectives.
        /// </returns>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponseDto<List<OrgObjectiveResponseDto>>), StatusCodes.Status200OK)]
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
        /// </summary>
        /// <returns>
        /// ApiResponseDto containing a list of OrgObjectiveResponseDto for dropdown display.
        /// </returns>
        [HttpGet("dropdown")]
        [ProducesResponseType(typeof(ApiResponseDto<List<OrgObjectiveResponseDto>>), StatusCodes.Status200OK)]
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
        /// </summary>
        /// <param name="objectiveId">Unique identifier of the objective.</param>
        /// <returns>
        /// ApiResponseDto containing OrgObjectiveResponseDto representing the objective details.
        /// </returns>
        [HttpGet("{objectiveId:int}")]
        [ProducesResponseType(typeof(ApiResponseDto<OrgObjectiveResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<OrgObjectiveResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetObjectiveById(int objectiveId)
        {
            _logger.LogInformation("Retrieving organization objective with ID: {ObjectiveId}", objectiveId);

            var objective = await _service.GetObjectiveByIdAsync(objectiveId);

            if (objective == null)
            {
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
        /// <returns>
        /// ApiResponseDto containing a list of OrgObjectiveResponseDto for active objectives.
        /// </returns>
        [HttpGet("active")]
        [ProducesResponseType(typeof(ApiResponseDto<List<OrgObjectiveResponseDto>>), StatusCodes.Status200OK)]
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
        /// </summary>
        /// <param name="status">Status value used to filter objectives.</param>
        /// <returns>
        /// ApiResponseDto containing a list of OrgObjectiveResponseDto matching the specified status.
        /// </returns>
        [HttpGet("objective/{status}")]
        [ProducesResponseType(typeof(ApiResponseDto<List<OrgObjectiveResponseDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetObjectivesByStatus(string status)
        {
            _logger.LogInformation("Retrieving objectives with status: {Status}", status);

            var objectives = await _service.GetObjectivesByStatusAsync(status);

            return Ok(ApiResponseDto<List<OrgObjectiveResponseDto>>.SuccessResponse(
                objectives,
                MessageConstants.ObjectivesByStatusRetrieved));
        }
    }
}
