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
            var result = await _service.GetReviewByIdAsync(reviewcommentId);
            return Ok(ApiResponseDto<ManagerReviewResponseDto>.SuccessResponse(result, "Manager review retrieved"));
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
            var result = await _service.UpdateReviewAsync(reviewcommentId, dto);
            return Ok(ApiResponseDto<ManagerReviewResponseDto>.SuccessResponse(result, "Manager review updated"));
        }

        [HttpDelete("{reviewcommentId}")]
        public async Task<IActionResult> DeleteManagerReview(int reviewcommentId)
        {
            var result = await _service.DeleteReviewAsync(reviewcommentId);
            return Ok(ApiResponseDto<bool>.SuccessResponse(result, "Manager review deleted"));
        }

        [HttpPost("{reviewcommentId}/submit")]
        public async Task<IActionResult> SubmitReview(int reviewcommentId)
        {
            var result = await _service.SubmitReviewAsync(reviewcommentId);
            return Ok(ApiResponseDto<bool>.SuccessResponse(result, "Manager review submitted"));
        }

        [HttpPost("{reviewcommentId}/modify")]
        public async Task<IActionResult> ModifyReview(int reviewcommentId)
        {
            var result = await _service.ModifyReviewAsync(reviewcommentId);
            return Ok(ApiResponseDto<bool>.SuccessResponse(result, "Manager review set to Modified status"));
        }

        [HttpPost("{reviewcommentId}/finalize")]
        public async Task<IActionResult> FinalizeReview(int reviewcommentId)
        {
            var result = await _service.FinalizeReviewAsync(reviewcommentId);
            return Ok(ApiResponseDto<bool>.SuccessResponse(result, "Manager review finalized"));
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllReviews([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
        {
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
