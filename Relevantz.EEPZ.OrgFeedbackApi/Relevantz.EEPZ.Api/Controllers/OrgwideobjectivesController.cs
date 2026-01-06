using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using Relevantz.EEPZ.Data.DBContexts;

namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrgwideobjectivesController : ControllerBase
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<OrgwideobjectivesController> _logger;
        private const string ORG_GOAL_TYPE = "org";

        public OrgwideobjectivesController(EEPZDbContext context, ILogger<OrgwideobjectivesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get all organization-wide objectives from Goals table
        /// Filters by GoalType = "Organization"
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<List<OrgObjectiveDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllObjectives()
        {
            try
            {
                _logger.LogInformation("Retrieving all organization-wide objectives from Goals table");

                var objectives = await _context.Goals
                    .Where(g => g.GoalType == ORG_GOAL_TYPE &&
                               (g.Goalstatus == "open" || g.Goalstatus == "inprogress"))
                    .OrderBy(g => g.GoalTitle)
                    .Select(g => new OrgObjectiveDto
                    {
                        ObjectiveId = g.GoalId,
                        Title = g.GoalTitle,
                        Description = g.GoalDescription,
                        GoalStatus = g.Goalstatus,
                        CreatedAt = g.Goalcreatedat,
                        EndDate = g.Goalendat
                    })
                    .ToListAsync();

                return Ok(ApiResponse<List<OrgObjectiveDto>>.SuccessResponse(
                    objectives,
                    $"Retrieved {objectives.Count} organization objectives successfully."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving organization objectives from Goals table");
                return StatusCode(500, ApiResponse<List<OrgObjectiveDto>>.ErrorResponse($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get all organization objectives (including all statuses) for dropdown
        /// </summary>
        [HttpGet("all")]
        [ProducesResponseType(typeof(ApiResponse<List<OrgObjectiveDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllObjectivesForDropdown()
        {
            try
            {
                _logger.LogInformation("Retrieving all organization objectives for dropdown");

                var objectives = await _context.Goals
                    .Where(g => g.GoalType == ORG_GOAL_TYPE)
                    .OrderByDescending(g => g.Goalcreatedat)
                    .Select(g => new OrgObjectiveDto
                    {
                        ObjectiveId = g.GoalId,
                        Title = g.GoalTitle,
                        Description = g.GoalDescription,
                        GoalStatus = g.Goalstatus,
                        CreatedAt = g.Goalcreatedat,
                        EndDate = g.Goalendat
                    })
                    .ToListAsync();

                return Ok(ApiResponse<List<OrgObjectiveDto>>.SuccessResponse(
                    objectives,
                    "Organization objectives retrieved successfully."));
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

                var objective = await _context.Goals
                    .Where(g => g.GoalId == objectiveId && g.GoalType == ORG_GOAL_TYPE)
                    .FirstOrDefaultAsync();

                if (objective == null)
                {
                    return NotFound(ApiResponse<OrgObjectiveDto>.ErrorResponse(
                        $"Organization objective with ID {objectiveId} not found."));
                }

                var response = new OrgObjectiveDto
                {
                    ObjectiveId = objective.GoalId,
                    Title = objective.GoalTitle,
                    Description = objective.GoalDescription,
                    GoalStatus = objective.Goalstatus,
                    CreatedAt = objective.Goalcreatedat,
                    EndDate = objective.Goalendat
                };

                return Ok(ApiResponse<OrgObjectiveDto>.SuccessResponse(
                    response,
                    "Objective retrieved successfully."));
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

                var objectives = await _context.Goals
                    .Where(g => g.GoalType == ORG_GOAL_TYPE &&
                               (g.Goalstatus == "open" || g.Goalstatus == "inprogress"))
                    .OrderBy(g => g.GoalTitle)
                    .Select(g => new OrgObjectiveDto
                    {
                        ObjectiveId = g.GoalId,
                        Title = g.GoalTitle,
                        Description = g.GoalDescription,
                        GoalStatus = g.Goalstatus
                    })
                    .ToListAsync();

                return Ok(ApiResponse<List<OrgObjectiveDto>>.SuccessResponse(
                    objectives,
                    $"Retrieved {objectives.Count} active objectives."));
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
        [HttpGet("status/{status}")]
        [ProducesResponseType(typeof(ApiResponse<List<OrgObjectiveDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetObjectivesByStatus(string status)
        {
            try
            {
                _logger.LogInformation("Retrieving objectives with status: {Status}", status);

                var validStatuses = new[] { "pending", "open", "inprogress", "completed", "closed", "expired", "reopened" };
                if (!validStatuses.Contains(status.ToLower()))
                {
                    return BadRequest(ApiResponse<List<OrgObjectiveDto>>.ErrorResponse(
                        $"Invalid status. Valid values: {string.Join(", ", validStatuses)}"));
                }

                var objectives = await _context.Goals
                    .Where(g => g.GoalType == ORG_GOAL_TYPE.ToLower() && g.Goalstatus == status.ToLower())
                    .OrderBy(g => g.GoalTitle)
                    .Select(g => new OrgObjectiveDto
                    {
                        ObjectiveId = g.GoalId,
                        Title = g.GoalTitle,
                        Description = g.GoalDescription,
                        GoalStatus = g.Goalstatus,
                        CreatedAt = g.Goalcreatedat,
                        EndDate = g.Goalendat
                    })
                    .ToListAsync();

                return Ok(ApiResponse<List<OrgObjectiveDto>>.SuccessResponse(
                    objectives,
                    $"Retrieved {objectives.Count} {status} objectives."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving objectives by status");
                return StatusCode(500, ApiResponse<List<OrgObjectiveDto>>.ErrorResponse($"Error: {ex.Message}"));
            }
        }
    }

    #region DTOs

    /// <summary>
    /// Organization-Wide Objective DTO (mapped from Goals table)
    /// </summary>
    public class OrgObjectiveDto
    {
        [JsonPropertyName("objectiveId")]
        public int ObjectiveId { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; }

        [JsonPropertyName("goalStatus")]
        public string GoalStatus { get; set; }

        [JsonPropertyName("createdAt")]
        public DateTime? CreatedAt { get; set; }

        [JsonPropertyName("endDate")]
        public DateTime? EndDate { get; set; }
    }

    /// <summary>
    /// Generic API Response wrapper
    /// </summary>
    public class ApiResponse<T>
    {
        [JsonPropertyName("isSuccess")]
        public bool IsSuccess { get; set; }

        [JsonPropertyName("message")]
        public string Message { get; set; }

        [JsonPropertyName("data")]
        public T Data { get; set; }

        [JsonPropertyName("errors")]
        public List<string> Errors { get; set; }

        public static ApiResponse<T> SuccessResponse(T data, string message = "Operation successful")
        {
            return new ApiResponse<T>
            {
                IsSuccess = true,
                Message = message,
                Data = data,
                Errors = null
            };
        }

        public static ApiResponse<T> ErrorResponse(string message, List<string> errors = null)
        {
            return new ApiResponse<T>
            {
                IsSuccess = false,
                Message = message,
                Data = default,
                Errors = errors ?? new List<string>()
            };
        }
    }

    #endregion
}
