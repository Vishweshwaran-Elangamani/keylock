using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Models;


namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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
        /// Get all organization-wide objectives from Goals table
        /// Filters by GoalType = "org"
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<List<OrgObjectiveDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllObjectives()
        {
            try
            {
                _logger.LogInformation("Retrieving all organization-wide objectives");

                var response = await _service.GetAllObjectivesAsync();
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving organization objectives");
                return StatusCode(500, ApiResponse<List<OrgObjectiveDto>>.ErrorResponse($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get all organization objectives for dropdown
        /// </summary>
        [HttpGet("objective")]
        [ProducesResponseType(typeof(ApiResponse<List<OrgObjectiveDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllObjectivesForDropdown()
        {
            try
            {
                _logger.LogInformation("Retrieving all organization objectives for dropdown");

                var response = await _service.GetAllObjectivesForDropdownAsync();
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving objectives for dropdown");
                return StatusCode(500, ApiResponse<List<OrgObjectiveDto>>.ErrorResponse($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get objective by ID from Goals table
        /// </summary>
        [HttpGet("{objectiveId}")]
        [ProducesResponseType(typeof(ApiResponse<OrgObjectiveDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<OrgObjectiveDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetObjectiveById(int objectiveId)
        {
            try
            {
                _logger.LogInformation("Retrieving organization objective with ID: {ObjectiveId}", objectiveId);

                var response = await _service.GetObjectiveByIdAsync(objectiveId);
                return response.IsSuccess ? Ok(response) : NotFound(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving objective by ID");
                return StatusCode(500, ApiResponse<OrgObjectiveDto>.ErrorResponse($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get active organization objectives (for feedback submission dropdown)
        /// </summary>
        [HttpGet("active")]
        [ProducesResponseType(typeof(ApiResponse<List<OrgObjectiveDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetActiveObjectives()
        {
            try
            {
                _logger.LogInformation("Retrieving active organization objectives");

                var response = await _service.GetActiveObjectivesAsync();
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active objectives");
                return StatusCode(500, ApiResponse<List<OrgObjectiveDto>>.ErrorResponse($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get organization objectives by status
        /// </summary>
        [HttpGet("objective/{status}")]
        [ProducesResponseType(typeof(ApiResponse<List<OrgObjectiveDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetObjectivesByStatus(string status)
        {
            try
            {
                _logger.LogInformation("Retrieving objectives with status: {Status}", status);

                var response = await _service.GetObjectivesByStatusAsync(status);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving objectives by status");
                return StatusCode(500, ApiResponse<List<OrgObjectiveDto>>.ErrorResponse($"Error: {ex.Message}"));
            }
        }
    }
}
