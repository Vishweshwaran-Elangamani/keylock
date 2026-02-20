using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/org-goal-feedback")]
    [Authorize]
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
        /// Creates a new organization goal feedback entry.
        /// </summary>
        /// <param name="dto">The organization goal feedback creation request payload.</param>
        /// <returns>The created organization goal feedback record.</returns>
        // 201 Created: Feedback created successfully.
        // 400 BadRequest: Validation failed on the request payload.
        // 500 InternalServerError: Unexpected server-side error.
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponseDto<OrgGoalFeedbackResponseDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponseDto<OrgGoalFeedbackResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponseDto<OrgGoalFeedbackResponseDto>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> CreateOrgGoalFeedback([FromBody] CreateOrgGoalFeedbackRequestDto dto)
        {
            var result = await _service.CreateOrgGoalFeedbackAsync(dto);

            // CreatedAtAction can be used here once a named GET by ID route is available.
            // For now returning 201 with the standard response envelope.
            return StatusCode(
                StatusCodes.Status201Created,
                ApiResponseDto<OrgGoalFeedbackResponseDto>.SuccessResponse(
                    result,
                    MessageConstants.OrgGoalFeedbackCreated));
        }

        /// <summary>
        /// Retrieves a specific organization goal feedback entry by its ID.
        /// </summary>
        /// <param name="id">The unique identifier of the feedback record.</param>
        /// <returns>The organization goal feedback record if found.</returns>
        // 200 OK: Feedback found and returned.
        // 404 NotFound: No feedback record exists for the given ID.
        // 500 InternalServerError: Unexpected server-side error.
        [HttpGet("feedback/{id:int}")]
        [ProducesResponseType(typeof(ApiResponseDto<OrgGoalFeedbackResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<OrgGoalFeedbackResponseDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponseDto<OrgGoalFeedbackResponseDto>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetOrgGoalFeedbackById(int id)
        {
            var result = await _service.GetOrgGoalFeedbackByIdAsync(id);

            if (result == null)
            {
                _logger.LogWarning("Organization goal feedback not found. FeedbackId: {FeedbackId}", id);
                return NotFound(ApiResponseDto<OrgGoalFeedbackResponseDto>.ErrorResponse(
                    MessageConstants.OrgGoalFeedbackNotFound));
            }

            return Ok(ApiResponseDto<OrgGoalFeedbackResponseDto>.SuccessResponse(
                result,
                MessageConstants.OrgGoalFeedbackRetrieved));
        }

        /// <summary>
        /// Retrieves all feedback entries for a specific organization goal with pagination.
        /// </summary>
        /// <param name="goalId">The unique identifier of the organization goal.</param>
        /// <param name="pageNumber">The page number to retrieve (default: 1).</param>
        /// <param name="pageSize">The number of records per page (default: 20).</param>
        /// <returns>Paginated list of feedback records for the given goal.</returns>
        // 200 OK: Feedback list returned (may be empty if no records exist).
        // 400 BadRequest: The provided goal ID is invalid (zero or negative).
        // 500 InternalServerError: Unexpected server-side error.
        [HttpGet("goal/{goalId:int}")]
        [ProducesResponseType(typeof(ApiResponseDto<List<OrgGoalFeedbackResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<List<OrgGoalFeedbackResponseDto>>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponseDto<List<OrgGoalFeedbackResponseDto>>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetFeedbackByGoal(
            int goalId,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            if (goalId <= 0)
            {
                _logger.LogWarning("Invalid goal ID provided: {GoalId}", goalId);

                // Use MessageConstants.InvalidIdProvided instead of hardcoded string
                // to keep all invalid ID messages consistent across controllers.
                return BadRequest(ApiResponseDto<List<OrgGoalFeedbackResponseDto>>.ErrorResponse(
                    MessageConstants.InvalidIdProvided));
            }

            var result = await _service.GetFeedbackByOrgGoalAsync(goalId, pageNumber, pageSize);

            return Ok(ApiResponseDto<List<OrgGoalFeedbackResponseDto>>.SuccessResponse(
                result,
                MessageConstants.OrgGoalFeedbackByGoalRetrieved));
        }

        /// <summary>
        /// Retrieves all organization goal feedback entries with pagination support.
        /// </summary>
        /// <param name="pageNumber">The page number to retrieve (default: 1).</param>
        /// <param name="pageSize">The number of records per page (default: 20).</param>
        /// <returns>Paginated list of all organization goal feedback records.</returns>
        // 200 OK: Feedback list returned successfully.
        // 500 InternalServerError: Unexpected server-side error.
        [HttpGet]
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
        /// Updates an existing organization goal feedback entry by its ID.
        /// Only feedback in Submitted status can be updated.
        /// </summary>
        /// <param name="id">The unique identifier of the feedback record.</param>
        /// <param name="dto">The update request payload.</param>
        /// <returns>The updated organization goal feedback record.</returns>
        // 200 OK: Feedback updated successfully.
        // 400 BadRequest: Validation failed or feedback is not in an editable status.
        // 404 NotFound: No feedback record exists for the given ID.
        // 500 InternalServerError: Unexpected server-side error.
        [HttpPut("feedback/{id:int}")]
        [ProducesResponseType(typeof(ApiResponseDto<OrgGoalFeedbackResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<OrgGoalFeedbackResponseDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponseDto<OrgGoalFeedbackResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponseDto<OrgGoalFeedbackResponseDto>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> UpdateOrgGoalFeedback(int id, [FromBody] UpdateOrgGoalFeedbackRequestDto dto)
        {
            var result = await _service.UpdateOrgGoalFeedbackAsync(id, dto);

            if (result == null)
            {
                _logger.LogWarning("Org goal feedback not found for update. FeedbackId: {FeedbackId}", id);
                return NotFound(ApiResponseDto<OrgGoalFeedbackResponseDto>.ErrorResponse(
                    MessageConstants.OrgGoalFeedbackNotFound));
            }

            return Ok(ApiResponseDto<OrgGoalFeedbackResponseDto>.SuccessResponse(
                result,
                MessageConstants.OrgGoalFeedbackUpdated));
        }

        /// <summary>
        /// Deletes an organization goal feedback entry by its ID.
        /// Only feedback in Submitted status can be deleted.
        /// </summary>
        /// <param name="id">The unique identifier of the feedback record.</param>
        /// <returns>True if deleted successfully.</returns>
        // 200 OK: Feedback deleted successfully.
        // 404 NotFound: No feedback record exists for the given ID.
        // 500 InternalServerError: Unexpected server-side error.
        [HttpDelete("feedback/{id:int}")]
        [ProducesResponseType(typeof(ApiResponseDto<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<bool>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponseDto<bool>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DeleteOrgGoalFeedback(int id)
        {
            var result = await _service.DeleteOrgGoalFeedbackAsync(id);

            if (!result)
            {
                _logger.LogWarning("Org goal feedback not found for delete. FeedbackId: {FeedbackId}", id);
                return NotFound(ApiResponseDto<bool>.ErrorResponse(
                    MessageConstants.OrgGoalFeedbackNotFound));
            }

            return Ok(ApiResponseDto<bool>.SuccessResponse(
                result,
                MessageConstants.OrgGoalFeedbackDeleted));
        }
    }
}
