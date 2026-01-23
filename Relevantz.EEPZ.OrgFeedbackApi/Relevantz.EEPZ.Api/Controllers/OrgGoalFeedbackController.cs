using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/org-goal-feedback")]
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

        [HttpPost]
        [ProducesResponseType(typeof(ApiResponseDto<OrgGoalFeedbackResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<OrgGoalFeedbackResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponseDto<OrgGoalFeedbackResponseDto>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> CreateOrgGoalFeedback([FromBody] CreateOrgGoalFeedbackRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponseDto<OrgGoalFeedbackResponseDto>.ErrorResponse(
                    MessageConstants.ValidationError));
            }
            var result = await _service.CreateOrgGoalFeedbackAsync(dto);

            return Ok(ApiResponseDto<OrgGoalFeedbackResponseDto>.SuccessResponse(
                result,
                MessageConstants.OrgGoalFeedbackCreated));
        }

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

        [HttpGet("goal/{goalId:int}")]
        [ProducesResponseType(typeof(ApiResponseDto<List<OrgGoalFeedbackResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<List<OrgGoalFeedbackResponseDto>>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetFeedbackByGoal(int goalId)
        {
            var result = await _service.GetFeedbackByOrgGoalAsync(goalId);

            return Ok(ApiResponseDto<List<OrgGoalFeedbackResponseDto>>.SuccessResponse(
                result,
                MessageConstants.OrgGoalFeedbackByGoalRetrieved));
        }

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
