using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace EepzBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ManagerReviewController : ControllerBase
    {
        private readonly IManagerReviewService _service;

        public ManagerReviewController(IManagerReviewService service)
        {
            _service = service;
        }

        [HttpPost("create")]
        public async Task<ApiResponseDto<ManagerReviewResponseDto>> CreateManagerReview(CreateManagerReviewRequestDto dto)
        {
            try
            {
                var result = await _service.CreateReviewAsync(dto);
                return ApiResponseDto<ManagerReviewResponseDto>.SuccessResponse(result, "Manager review created successfully");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<ManagerReviewResponseDto>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpGet("{reviewcommentId}")]
        public async Task<ApiResponseDto<ManagerReviewResponseDto>> GetManagerReview(int reviewcommentId)
        {
            try
            {
                var result = await _service.GetReviewByIdAsync(reviewcommentId);
                return ApiResponseDto<ManagerReviewResponseDto>.SuccessResponse(result, "Manager review retrieved");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<ManagerReviewResponseDto>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpGet("manager/{managerEmployeeId}")]
        public async Task<ApiResponseDto<List<ManagerReviewResponseDto>>> GetReviewsByManager(int managerEmployeeId)
        {
            try
            {
                var result = await _service.GetMyReviewsAsync(managerEmployeeId);
                return ApiResponseDto<List<ManagerReviewResponseDto>>.SuccessResponse(result, "Reviews retrieved");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<List<ManagerReviewResponseDto>>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpGet("target/{targetEmployeeId}")]
        public async Task<ApiResponseDto<List<ManagerReviewResponseDto>>> GetReviewsForTarget(int targetEmployeeId)
        {
            try
            {
                var result = await _service.GetReviewsForMeAsync(targetEmployeeId); 
                return ApiResponseDto<List<ManagerReviewResponseDto>>.SuccessResponse(result, "Reviews retrieved");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<List<ManagerReviewResponseDto>>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpPut("{reviewcommentId}")]
        public async Task<ApiResponseDto<ManagerReviewResponseDto>> UpdateManagerReview(int reviewcommentId, UpdateManagerReviewRequestDto dto)
        {
            try
            {
                var result = await _service.UpdateReviewAsync(reviewcommentId, dto);
                return ApiResponseDto<ManagerReviewResponseDto>.SuccessResponse(result, "Manager review updated");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<ManagerReviewResponseDto>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpDelete("{reviewcommentId}")]
        public async Task<ApiResponseDto<bool>> DeleteManagerReview(int reviewcommentId)
        {
            try
            {
                var result = await _service.DeleteReviewAsync(reviewcommentId);
                return ApiResponseDto<bool>.SuccessResponse(result, "Manager review deleted");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<bool>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpPost("{reviewcommentId}/submit")]
        public async Task<ApiResponseDto<bool>> SubmitReview(int reviewcommentId)
        {
            try
            {
                var result = await _service.SubmitReviewAsync(reviewcommentId);
                return ApiResponseDto<bool>.SuccessResponse(result, "Manager review submitted");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<bool>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpPost("{reviewcommentId}/modify")]
        public async Task<ApiResponseDto<bool>> ModifyReview(int reviewcommentId)
        {
            try
            {
                var result = await _service.ModifyReviewAsync(reviewcommentId);
                return ApiResponseDto<bool>.SuccessResponse(result, "Manager review set to Modified status");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<bool>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpPost("{reviewcommentId}/finalize")]
        public async Task<ApiResponseDto<bool>> FinalizeReview(int reviewcommentId)
        {
            try
            {
                var result = await _service.FinalizeReviewAsync(reviewcommentId);
                return ApiResponseDto<bool>.SuccessResponse(result, "Manager review finalized");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<bool>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpGet("all")]
        public async Task<ApiResponseDto<List<ManagerReviewResponseDto>>> GetAllReviews([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var result = await _service.GetAllReviewsAsync(pageNumber, pageSize);
                return ApiResponseDto<List<ManagerReviewResponseDto>>.SuccessResponse(result, "All reviews retrieved");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<List<ManagerReviewResponseDto>>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpGet("status/{status}")]
        public async Task<ApiResponseDto<List<ManagerReviewResponseDto>>> GetReviewsByStatus(string status)
        {
            try
            {
                var result = await _service.GetReviewsByStatusAsync(status);
                return ApiResponseDto<List<ManagerReviewResponseDto>>.SuccessResponse(result, $"Reviews with status {status} retrieved");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<List<ManagerReviewResponseDto>>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }
    }
}
