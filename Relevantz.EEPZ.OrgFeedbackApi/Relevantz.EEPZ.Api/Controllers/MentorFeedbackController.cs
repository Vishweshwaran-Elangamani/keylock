using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace Relevantz.EEPZ.Api.Controllers
{
    /// <summary>
    /// Controller for managing mentor feedback operations
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class MentorFeedbackController : ControllerBase
    {
        private readonly IMentorFeedbackService _service;
        private readonly ILogger<MentorFeedbackController> _logger;

        public MentorFeedbackController(
            IMentorFeedbackService service,
            ILogger<MentorFeedbackController> logger)
        {
            _service = service;
            _logger = logger;
        }

        /// <summary>
        /// Create new mentor feedback
        /// </summary>
        /// <param name="dto">Mentor feedback creation request</param>
        /// <returns>Created mentor feedback response</returns>
        [HttpPost("create")]
        [ProducesResponseType(typeof(ApiResponseDto<MentorFeedbackResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<MentorFeedbackResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponseDto<MentorFeedbackResponseDto>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> CreateMentorFeedback([FromBody] CreateMentorFeedbackRequestDto dto)
        {
            var result = await _service.CreateMentorFeedbackAsync(dto);

            return Ok(ApiResponseDto<MentorFeedbackResponseDto>.SuccessResponse(
                result,
                MessageConstants.MentorFeedbackCreated));
        }

        /// <summary>
        /// Get mentor feedback by tracking ID
        /// </summary>
        /// <param name="id">Tracking identifier</param>
        /// <returns>Mentor feedback details</returns>
        [HttpGet("track/{id}")]
        [ProducesResponseType(typeof(ApiResponseDto<MentorFeedbackResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<MentorFeedbackResponseDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponseDto<MentorFeedbackResponseDto>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetMentorFeedback(int id)
        {
            var result = await _service.GetMentorFeedbackByIdAsync(id);

            if (result == null)
            {
                _logger.LogWarning("Mentor feedback with tracking ID {TrackingId} not found", id);
                return NotFound(ApiResponseDto<MentorFeedbackResponseDto>.ErrorResponse(
                    MessageConstants.MentorFeedbackNotFound));
            }

            return Ok(ApiResponseDto<MentorFeedbackResponseDto>.SuccessResponse(
                result,
                MessageConstants.MentorFeedbackRetrieved));
        }

        /// <summary>
        /// Get all feedback received by a mentor
        /// </summary>
        /// <param name="mentorEmployeeId">Mentor employee identifier</param>
        /// <returns>List of feedback received about the mentor</returns>
        [HttpGet("about-me/{mentorEmployeeId}")]
        [ProducesResponseType(typeof(ApiResponseDto<List<MentorFeedbackResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<List<MentorFeedbackResponseDto>>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetFeedbackAboutMe(int mentorEmployeeId)
        {
            var result = await _service.GetFeedbackAboutMeAsync(mentorEmployeeId);

            return Ok(ApiResponseDto<List<MentorFeedbackResponseDto>>.SuccessResponse(
                result,
                MessageConstants.FeedbackAboutMeRetrieved));
        }

        /// <summary>
        /// Get all feedback given by a mentee
        /// </summary>
        /// <param name="menteeEmployeeId">Mentee employee identifier</param>
        /// <returns>List of feedback given by the mentee</returns>
        [HttpGet("my-feedback/{menteeEmployeeId}")]
        [ProducesResponseType(typeof(ApiResponseDto<List<MentorFeedbackResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<List<MentorFeedbackResponseDto>>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetMyMentorFeedback(int menteeEmployeeId)
        {
            var result = await _service.GetMyMentorFeedbackAsync(menteeEmployeeId);

            return Ok(ApiResponseDto<List<MentorFeedbackResponseDto>>.SuccessResponse(
                result,
                MessageConstants.MyMentorFeedbackRetrieved));
        }

        /// <summary>
        /// Get all mentor feedback with pagination
        /// </summary>
        /// <param name="pageNumber">Page number (default: 1)</param>
        /// <param name="pageSize">Page size (default: 20)</param>
        /// <returns>Paginated list of mentor feedback</returns>
        [HttpGet("all")]
        [ProducesResponseType(typeof(ApiResponseDto<List<MentorFeedbackResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<List<MentorFeedbackResponseDto>>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetAllMentorFeedback(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            var result = await _service.GetAllMentorFeedbackAsync(pageNumber, pageSize);

            return Ok(ApiResponseDto<List<MentorFeedbackResponseDto>>.SuccessResponse(
                result,
                MessageConstants.AllMentorFeedbackRetrieved));
        }

        /// <summary>
        /// Update existing mentor feedback
        /// </summary>
        /// <param name="id">Tracking identifier</param>
        /// <param name="dto">Mentor feedback update request</param>
        /// <returns>Updated mentor feedback response</returns>
        [HttpPut("track/{id}")]
        [ProducesResponseType(typeof(ApiResponseDto<MentorFeedbackResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<MentorFeedbackResponseDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponseDto<MentorFeedbackResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponseDto<MentorFeedbackResponseDto>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> UpdateMentorFeedback(
            int id,
            [FromBody] UpdateMentorFeedbackRequestDto dto)
        {
            var result = await _service.UpdateMentorFeedbackAsync(id, dto);

            if (result == null)
            {
                _logger.LogWarning("Cannot update - Mentor feedback with tracking ID {TrackingId} not found", id);
                return NotFound(ApiResponseDto<MentorFeedbackResponseDto>.ErrorResponse(
                    MessageConstants.MentorFeedbackNotFound));
            }

            return Ok(ApiResponseDto<MentorFeedbackResponseDto>.SuccessResponse(
                result,
                MessageConstants.MentorFeedbackUpdated));
        }

        /// <summary>
        /// Acknowledge mentor feedback
        /// </summary>
        /// <param name="id">Tracking identifier</param>
        /// <returns>Acknowledgement status</returns>
        [HttpPost("track/{id}/acknowledge")]
        [ProducesResponseType(typeof(ApiResponseDto<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<bool>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponseDto<bool>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> AcknowledgeMentorFeedback(int id)
        {
            var result = await _service.AcknowledgeMentorFeedbackAsync(id);

            if (!result)
            {
                _logger.LogWarning("Cannot acknowledge - Mentor feedback with tracking ID {TrackingId} not found", id);
                return NotFound(ApiResponseDto<bool>.ErrorResponse(
                    MessageConstants.MentorFeedbackNotFound));
            }

            return Ok(ApiResponseDto<bool>.SuccessResponse(
                result,
                MessageConstants.MentorFeedbackAcknowledged));
        }

        /// <summary>
        /// Delete mentor feedback
        /// </summary>
        /// <param name="id">Tracking identifier</param>
        /// <returns>Deletion status</returns>
        [HttpDelete("track/{id}")]
        [ProducesResponseType(typeof(ApiResponseDto<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<bool>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponseDto<bool>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DeleteMentorFeedback(int id)
        {
            var result = await _service.DeleteMentorFeedbackAsync(id);

            if (!result)
            {
                _logger.LogWarning("Cannot delete - Mentor feedback with tracking ID {TrackingId} not found", id);
                return NotFound(ApiResponseDto<bool>.ErrorResponse(
                    MessageConstants.MentorFeedbackNotFound));
            }

            return Ok(ApiResponseDto<bool>.SuccessResponse(
                result,
                MessageConstants.MentorFeedbackDeleted));
        }
    }
}
