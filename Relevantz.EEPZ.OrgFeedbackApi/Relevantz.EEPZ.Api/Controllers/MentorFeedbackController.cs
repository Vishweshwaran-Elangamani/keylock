using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/mentor-feedback")]
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

        [HttpPost]
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

        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(ApiResponseDto<MentorFeedbackResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<MentorFeedbackResponseDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponseDto<MentorFeedbackResponseDto>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetMentorFeedbackById(int id)
        {
            var result = await _service.GetMentorFeedbackByIdAsync(id);

            if (result == null)
            {
                _logger.LogWarning("Mentor feedback not found. TrackingId: {TrackingId}", id);
                return NotFound(ApiResponseDto<MentorFeedbackResponseDto>.ErrorResponse(
                    MessageConstants.MentorFeedbackNotFound));
            }

            return Ok(ApiResponseDto<MentorFeedbackResponseDto>.SuccessResponse(
                result,
                MessageConstants.MentorFeedbackRetrieved));
        }

        [HttpGet("mentor/{mentorEmployeeId:int}")]
        [ProducesResponseType(typeof(ApiResponseDto<List<MentorFeedbackResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<List<MentorFeedbackResponseDto>>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetFeedbackAboutMentor(int mentorEmployeeId)
        {
            var result = await _service.GetFeedbackAboutMeAsync(mentorEmployeeId);

            return Ok(ApiResponseDto<List<MentorFeedbackResponseDto>>.SuccessResponse(
                result,
                MessageConstants.FeedbackAboutMeRetrieved));
        }

        [HttpGet("mentee/{menteeEmployeeId:int}")]
        [ProducesResponseType(typeof(ApiResponseDto<List<MentorFeedbackResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<List<MentorFeedbackResponseDto>>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetFeedbackByMentee(int menteeEmployeeId)
        {
            var result = await _service.GetMyMentorFeedbackAsync(menteeEmployeeId);

            return Ok(ApiResponseDto<List<MentorFeedbackResponseDto>>.SuccessResponse(
                result,
                MessageConstants.MyMentorFeedbackRetrieved));
        }

        [HttpGet]
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

        [HttpPut("{id:int}")]
        [ProducesResponseType(typeof(ApiResponseDto<MentorFeedbackResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<MentorFeedbackResponseDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponseDto<MentorFeedbackResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponseDto<MentorFeedbackResponseDto>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> UpdateMentorFeedback(int id, [FromBody] UpdateMentorFeedbackRequestDto dto)
        {
            var result = await _service.UpdateMentorFeedbackAsync(id, dto);

            if (result == null)
            {
                _logger.LogWarning("Mentor feedback not found for update. TrackingId: {TrackingId}", id);
                return NotFound(ApiResponseDto<MentorFeedbackResponseDto>.ErrorResponse(
                    MessageConstants.MentorFeedbackNotFound));
            }

            return Ok(ApiResponseDto<MentorFeedbackResponseDto>.SuccessResponse(
                result,
                MessageConstants.MentorFeedbackUpdated));
        }

        [HttpPost("{id:int}/acknowledge")]
        [ProducesResponseType(typeof(ApiResponseDto<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<bool>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponseDto<bool>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> AcknowledgeMentorFeedback(int id)
        {
            var result = await _service.AcknowledgeMentorFeedbackAsync(id);

            if (!result)
            {
                _logger.LogWarning("Mentor feedback not found for acknowledge. TrackingId: {TrackingId}", id);
                return NotFound(ApiResponseDto<bool>.ErrorResponse(
                    MessageConstants.MentorFeedbackNotFound));
            }

            return Ok(ApiResponseDto<bool>.SuccessResponse(
                result,
                MessageConstants.MentorFeedbackAcknowledged));
        }

        [HttpDelete("{id:int}")]
        [ProducesResponseType(typeof(ApiResponseDto<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<bool>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponseDto<bool>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DeleteMentorFeedback(int id)
        {
            var result = await _service.DeleteMentorFeedbackAsync(id);

            if (!result)
            {
                _logger.LogWarning("Mentor feedback not found for delete. TrackingId: {TrackingId}", id);
                return NotFound(ApiResponseDto<bool>.ErrorResponse(
                    MessageConstants.MentorFeedbackNotFound));
            }

            return Ok(ApiResponseDto<bool>.SuccessResponse(
                result,
                MessageConstants.MentorFeedbackDeleted));
        }
    }
}
