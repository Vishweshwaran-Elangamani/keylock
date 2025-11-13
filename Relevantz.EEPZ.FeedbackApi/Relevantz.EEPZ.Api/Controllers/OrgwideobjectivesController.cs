using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using System.Text.Json.Serialization;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.DBContexts;

namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrgwideobjectivesController : ControllerBase
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<OrgwideobjectivesController> _logger;

        public OrgwideobjectivesController(EEPZDbContext context, ILogger<OrgwideobjectivesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get all organization-wide objectives
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<List<OrgObjectiveDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllObjectives()
        {
            try
            {
                _logger.LogInformation("Retrieving all organization-wide objectives");

                var objectives = await _context.Organizationwideobjectives
                    .OrderBy(o => o.Title)
                    .Select(o => new OrgObjectiveDto
                    {
                        ObjectiveId = o.ObjectiveId,
                        Title = o.Title,
                        Description = o.Description
                    })
                    .ToListAsync();

                return Ok(ApiResponse<List<OrgObjectiveDto>>.SuccessResponse(
                    objectives, 
                    "Organization objectives retrieved successfully."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving objectives");
                return StatusCode(500, ApiResponse<List<OrgObjectiveDto>>.ErrorResponse($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get objective by ID
        /// </summary>
        [HttpGet("{objectiveId}")]
        [ProducesResponseType(typeof(ApiResponse<OrgObjectiveDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<OrgObjectiveDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetObjectiveById(int objectiveId)
        {
            try
            {
                _logger.LogInformation("Retrieving objective with ID: {ObjectiveId}", objectiveId);

                var objective = await _context.Organizationwideobjectives
                    .FirstOrDefaultAsync(o => o.ObjectiveId == objectiveId);

                if (objective == null)
                {
                    return NotFound(ApiResponse<OrgObjectiveDto>.ErrorResponse("Objective not found."));
                }

                var response = new OrgObjectiveDto
                {
                    ObjectiveId = objective.ObjectiveId,
                    Title = objective.Title,
                    Description = objective.Description
                };

                return Ok(ApiResponse<OrgObjectiveDto>.SuccessResponse(response, "Objective retrieved successfully."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving objective");
                return StatusCode(500, ApiResponse<OrgObjectiveDto>.ErrorResponse($"Error: {ex.Message}"));
            }
        }
    }

    #region DTOs

    /// <summary>
    /// Organization-Wide Objective DTO
    /// </summary>
    public class OrgObjectiveDto
    {
        [JsonPropertyName("objectiveId")]
        public int ObjectiveId { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; }
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
