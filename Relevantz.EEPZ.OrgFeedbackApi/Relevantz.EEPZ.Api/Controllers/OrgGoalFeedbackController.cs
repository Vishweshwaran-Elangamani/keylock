using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace Relevantz.EEPZ.Api.Controllers
{
    /// <summary>
    /// Controller for managing organization goal feedback operations
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class OrgGoalFeedbackController : ControllerBase
    {
        private readonly IOrgGoalFeedbackService _service;
        private readonly ILogger<OrgGoalFeedbackController> _logger;

        public OrgGoalFeedbackController(
            IOrgGoalFeedbackService service,
            ILogger<OrgGoalFeedbackController> logger)
        {
            _service = service;
            _logger = logger;
        }

        /// <summary>
        /// Create new organization goal feedback
        /// </summary>
        /// <param name="dto">Organization goal feedback creation request</param>
        /// <returns>Created organization goal feedback response</returns>
        [HttpPost("create")]
        [ProducesResponseType(typeof(ApiResponseDto<OrgGoalFeedbackResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<OrgGoalFeedbackResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponseDto<OrgGoalFeedbackResponseDto>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> CreateOrgGoalFeedback([FromBody] CreateOrgGoalFeedbackRequestDto dto)
        {
            var result = await _service.CreateOrgGoalFeedbackAsync(dto);
            
            return Ok(ApiResponseDto<OrgGoalFeedbackResponseDto>.SuccessResponse(
                result,
                MessageConstants.OrgGoalFeedbackCreated));
        }

        /// <summary>
        /// Get organization goal feedback by ID
        /// </summary>
        /// <param name="id">Feedback identifier</param>
        /// <returns>Organization goal feedback details</returns>
        [HttpGet("feedback/{id}")]
        [ProducesResponseType(typeof(ApiResponseDto<OrgGoalFeedbackResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<OrgGoalFeedbackResponseDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponseDto<OrgGoalFeedbackResponseDto>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetOrgGoalFeedback(int id)
        {
            var result = await _service.GetOrgGoalFeedbackByIdAsync(id);

            if (result == null)
            {
                _logger.LogWarning("Organization goal feedback with ID {FeedbackId} not found", id);
                return NotFound(ApiResponseDto<OrgGoalFeedbackResponseDto>.ErrorResponse(
                    MessageConstants.OrgGoalFeedbackNotFound));
            }

            return Ok(ApiResponseDto<OrgGoalFeedbackResponseDto>.SuccessResponse(
                result,
                MessageConstants.OrgGoalFeedbackRetrieved));
        }

        /// <summary>
        /// Get all feedback for a specific organization goal
        /// </summary>
        /// <param name="organizationObjectiveId">Organization objective identifier</param>
        /// <returns>List of feedback for the organization goal</returns>
        [HttpGet("goal/{organizationObjectiveId}")]
        [ProducesResponseType(typeof(ApiResponseDto<List<OrgGoalFeedbackResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<List<OrgGoalFeedbackResponseDto>>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetFeedbackByOrgGoal(int organizationObjectiveId)
        {
            var result = await _service.GetFeedbackByOrgGoalAsync(organizationObjectiveId);

            return Ok(ApiResponseDto<List<OrgGoalFeedbackResponseDto>>.SuccessResponse(
                result,
                MessageConstants.OrgGoalFeedbackByGoalRetrieved));
        }

        /// <summary>
        /// Get all organization goal feedback with pagination
        /// </summary>
        /// <param name="pageNumber">Page number (default: 1)</param>
        /// <param name="pageSize">Page size (default: 20)</param>
        /// <returns>Paginated list of organization goal feedback</returns>
        [HttpGet("feedback")]
        [ProducesResponseType(typeof(ApiResponseDto<List<OrgGoalFeedbackResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<List<OrgGoalFeedbackResponseDto>>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetAllOrgGoalFeedback(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            var result = await _service.GetAllOrgGoalFeedbackAsync(pageNumber, pageSize);

            return Ok(ApiResponseDto<List<OrgGoalFeedbackResponseDto>>.SuccessResponse(
                result,
                MessageConstants.AllOrgGoalFeedbackRetrieved));
        }

        /// <summary>
        /// Update existing organization goal feedback
        /// </summary>
        /// <param name="id">Feedback identifier</param>
        /// <param name="dto">Organization goal feedback update request</param>
        /// <returns>Updated organization goal feedback response</returns>
        [HttpPut("feedback/{id}")]
        [ProducesResponseType(typeof(ApiResponseDto<OrgGoalFeedbackResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<OrgGoalFeedbackResponseDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponseDto<OrgGoalFeedbackResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponseDto<OrgGoalFeedbackResponseDto>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> UpdateOrgGoalFeedback(
            int id,
            [FromBody] UpdateOrgGoalFeedbackRequestDto dto)
        {
            var result = await _service.UpdateOrgGoalFeedbackAsync(id, dto);

            if (result == null)
            {
                _logger.LogWarning("Cannot update - Organization goal feedback with ID {FeedbackId} not found", id);
                return NotFound(ApiResponseDto<OrgGoalFeedbackResponseDto>.ErrorResponse(
                    MessageConstants.OrgGoalFeedbackNotFound));
            }

            return Ok(ApiResponseDto<OrgGoalFeedbackResponseDto>.SuccessResponse(
                result,
                MessageConstants.OrgGoalFeedbackUpdated));
        }

        /// <summary>
        /// Delete organization goal feedback
        /// </summary>
        /// <param name="id">Feedback identifier</param>
        /// <returns>Deletion status</returns>
        [HttpDelete("feedback/{id}")]
        [ProducesResponseType(typeof(ApiResponseDto<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<bool>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponseDto<bool>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DeleteOrgGoalFeedback(int id)
        {
            var result = await _service.DeleteOrgGoalFeedbackAsync(id);

            if (!result)
            {
                _logger.LogWarning("Cannot delete - Organization goal feedback with ID {FeedbackId} not found", id);
                return NotFound(ApiResponseDto<bool>.ErrorResponse(
                    MessageConstants.OrgGoalFeedbackNotFound));
            }

            return Ok(ApiResponseDto<bool>.SuccessResponse(
                result,
                MessageConstants.OrgGoalFeedbackDeleted));
        }
    }
}
