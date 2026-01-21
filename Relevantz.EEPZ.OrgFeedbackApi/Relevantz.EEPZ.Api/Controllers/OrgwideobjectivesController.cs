using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;

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

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponseDto<List<OrgObjectiveResponseDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllObjectives()
        {
            _logger.LogInformation("Retrieving all organization-wide objectives");

            var objectives = await _service.GetAllObjectivesAsync();

            return Ok(ApiResponseDto<List<OrgObjectiveResponseDto>>.SuccessResponse(
                objectives,
                "Organization objectives retrieved successfully"));
        }

        [HttpGet("dropdown")]
        [ProducesResponseType(typeof(ApiResponseDto<List<OrgObjectiveResponseDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllObjectivesForDropdown()
        {
            _logger.LogInformation("Retrieving all organization objectives for dropdown");

            var objectives = await _service.GetAllObjectivesForDropdownAsync();

            return Ok(ApiResponseDto<List<OrgObjectiveResponseDto>>.SuccessResponse(
                objectives,
                "Organization objectives retrieved successfully"));
        }

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
                    $"Organization objective with ID {objectiveId} not found"));
            }

            return Ok(ApiResponseDto<OrgObjectiveResponseDto>.SuccessResponse(
                objective,
                "Objective retrieved successfully"));
        }

        [HttpGet("active")]
        [ProducesResponseType(typeof(ApiResponseDto<List<OrgObjectiveResponseDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetActiveObjectives()
        {
            _logger.LogInformation("Retrieving active organization objectives");

            var objectives = await _service.GetActiveObjectivesAsync();

            return Ok(ApiResponseDto<List<OrgObjectiveResponseDto>>.SuccessResponse(
                objectives,
                "Active objectives retrieved successfully"));
        }

        [HttpGet("status/{status}")]
        [ProducesResponseType(typeof(ApiResponseDto<List<OrgObjectiveResponseDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetObjectivesByStatus(string status)
        {
            _logger.LogInformation("Retrieving objectives with status: {Status}", status);

            var objectives = await _service.GetObjectivesByStatusAsync(status);

            return Ok(ApiResponseDto<List<OrgObjectiveResponseDto>>.SuccessResponse(
                objectives,
                $"Objectives with status '{status}' retrieved successfully"));
        }
    }
}
