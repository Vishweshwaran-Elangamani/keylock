using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace EepzBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Manager,Employee")]
    public class ManagerReviewController : ControllerBase
    {
        private readonly IManagerReviewService _service;

        public ManagerReviewController(IManagerReviewService service)
        {
            _service = service;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateManagerReview(CreateManagerReviewRequestDto dto)
        {
            var result = await _service.CreateReviewAsync(dto);
            return Ok(ApiResponseDto<ManagerReviewResponseDto>.SuccessResponse(result, "Manager review created successfully"));
        }

        [HttpGet("{reviewcommentId}")]
        public async Task<IActionResult> GetManagerReview(int reviewcommentId)
        {
            try
            {
                var result = await _service.GetReviewByIdAsync(reviewcommentId);
                return Ok(ApiResponseDto<ManagerReviewResponseDto>.SuccessResponse(result, "Manager review retrieved"));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponseDto<ManagerReviewResponseDto>.ErrorResponse(ex.Message));
            }
        }

        [HttpGet("manager/{managerEmployeeId}")]
        public async Task<IActionResult> GetReviewsByManager(int managerEmployeeId)
        {
            var result = await _service.GetMyReviewsAsync(managerEmployeeId);
            return Ok(ApiResponseDto<List<ManagerReviewResponseDto>>.SuccessResponse(result, "Reviews retrieved"));
        }

        [HttpGet("target/{targetEmployeeId}")]
        public async Task<IActionResult> GetReviewsForTarget(int targetEmployeeId)
        {
            var result = await _service.GetReviewsForMeAsync(targetEmployeeId);
            return Ok(ApiResponseDto<List<ManagerReviewResponseDto>>.SuccessResponse(result, "Reviews retrieved"));
        }

        [HttpPut("{reviewcommentId}")]
        public async Task<IActionResult> UpdateManagerReview(int reviewcommentId, UpdateManagerReviewRequestDto dto)
        {
            try
            {
                var result = await _service.UpdateReviewAsync(reviewcommentId, dto);
                return Ok(ApiResponseDto<ManagerReviewResponseDto>.SuccessResponse(result, "Manager review updated"));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponseDto<ManagerReviewResponseDto>.ErrorResponse(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponseDto<ManagerReviewResponseDto>.ErrorResponse(ex.Message));
            }
        }

        [HttpDelete("{reviewcommentId}")]
        public async Task<IActionResult> DeleteManagerReview(int reviewcommentId)
        {
            var result = await _service.DeleteReviewAsync(reviewcommentId);
            if (!result)
            {
                return NotFound(ApiResponseDto<bool>.ErrorResponse($"Review {reviewcommentId} not found or could not be deleted"));
            }
            return Ok(ApiResponseDto<bool>.SuccessResponse(true, "Manager review deleted"));
        }

        [HttpPost("{reviewcommentId}/submit")]
        public async Task<IActionResult> SubmitReview(int reviewcommentId)
        {
            try
            {
                var result = await _service.SubmitReviewAsync(reviewcommentId);
                return Ok(ApiResponseDto<bool>.SuccessResponse(result, "Manager review submitted"));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponseDto<bool>.ErrorResponse(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponseDto<bool>.ErrorResponse(ex.Message));
            }
        }

        [HttpPost("{reviewcommentId}/modify")]
        public async Task<IActionResult> ModifyReview(int reviewcommentId)
        {
            try
            {
                var result = await _service.ModifyReviewAsync(reviewcommentId);
                return Ok(ApiResponseDto<bool>.SuccessResponse(result, "Manager review set to Modified status"));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponseDto<bool>.ErrorResponse(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponseDto<bool>.ErrorResponse(ex.Message));
            }
        }

        [HttpPost("{reviewcommentId}/finalize")]
        public async Task<IActionResult> FinalizeReview(int reviewcommentId)
        {
            try
            {
                var result = await _service.FinalizeReviewAsync(reviewcommentId);

                if (!result)
                {
                    return StatusCode(StatusCodes.Status500InternalServerError,
                        ApiResponseDto<bool>.ErrorResponse("Failed to finalize review due to repository error"));
                }

                return Ok(ApiResponseDto<bool>.SuccessResponse(true, "Manager review finalized"));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponseDto<bool>.ErrorResponse(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponseDto<bool>.ErrorResponse(ex.Message));
            }
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllReviews([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
        {
            if (pageNumber <= 0 || pageSize <= 0 || pageSize > 100)
            {
                return BadRequest(ApiResponseDto<string>.ErrorResponse(
                    "Invalid pagination parameters. pageNumber must be > 0 and pageSize between 1 and 100."
                ));
            }

            var result = await _service.GetAllReviewsAsync(pageNumber, pageSize);
            return Ok(ApiResponseDto<List<ManagerReviewResponseDto>>.SuccessResponse(result, "All reviews retrieved"));
        }

        [HttpGet("status/{status}")]
        public async Task<IActionResult> GetReviewsByStatus(string status)
        {
            var result = await _service.GetReviewsByStatusAsync(status);
            return Ok(ApiResponseDto<List<ManagerReviewResponseDto>>.SuccessResponse(result, $"Reviews with status {status} retrieved"));
        }
    }
}
