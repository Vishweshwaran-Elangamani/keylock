
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.Services.Interfaces;


namespace EepzBackend.Controllers
{
     [ApiController]
    [Route("api/[controller]")]
    public class MentorFeedbackController : ControllerBase
    {
        private readonly IMentorFeedbackService _service;

        public MentorFeedbackController(IMentorFeedbackService service)
        {
            _service = service;
        }

        [HttpPost("create")]
        public async Task<ApiResponseDto<MentorFeedbackResponseDto>> CreateMentorFeedback(CreateMentorFeedbackRequestDto dto)
        {
            try
            {
                var result = await _service.CreateMentorFeedbackAsync(dto);
                return ApiResponseDto<MentorFeedbackResponseDto>.SuccessResponse(result, "Mentor feedback created");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<MentorFeedbackResponseDto>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpGet("{trackingId}")]
        public async Task<ApiResponseDto<MentorFeedbackResponseDto>> GetMentorFeedback(int trackingId)
        {
            try
            {
                var result = await _service.GetMentorFeedbackByIdAsync(trackingId);
                return ApiResponseDto<MentorFeedbackResponseDto>.SuccessResponse(result);
            }
            catch (Exception ex)
            {
                return ApiResponseDto<MentorFeedbackResponseDto>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpGet("about-me/{mentorEmployeeId}")]
        public async Task<ApiResponseDto<List<MentorFeedbackResponseDto>>> GetFeedbackAboutMe(int mentorEmployeeId)
        {
            try
            {
                var result = await _service.GetFeedbackAboutMeAsync(mentorEmployeeId);
                return ApiResponseDto<List<MentorFeedbackResponseDto>>.SuccessResponse(result);
            }
            catch (Exception ex)
            {
                return ApiResponseDto<List<MentorFeedbackResponseDto>>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpGet("my-feedback/{menteeEmployeeId}")]
        public async Task<ApiResponseDto<List<MentorFeedbackResponseDto>>> GetMyMentorFeedback(int menteeEmployeeId)
        {
            try
            {
                var result = await _service.GetMyMentorFeedbackAsync(menteeEmployeeId);
                return ApiResponseDto<List<MentorFeedbackResponseDto>>.SuccessResponse(result);
            }
            catch (Exception ex)
            {
                return ApiResponseDto<List<MentorFeedbackResponseDto>>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpGet("all")]
        public async Task<ApiResponseDto<List<MentorFeedbackResponseDto>>> GetAllMentorFeedback([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var result = await _service.GetAllMentorFeedbackAsync(pageNumber, pageSize);
                return ApiResponseDto<List<MentorFeedbackResponseDto>>.SuccessResponse(result);
            }
            catch (Exception ex)
            {
                return ApiResponseDto<List<MentorFeedbackResponseDto>>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpPut("{trackingId}")]
        public async Task<ApiResponseDto<MentorFeedbackResponseDto>> UpdateMentorFeedback(int trackingId, UpdateMentorFeedbackRequestDto dto)
        {
            try
            {
                var result = await _service.UpdateMentorFeedbackAsync(trackingId, dto);
                return ApiResponseDto<MentorFeedbackResponseDto>.SuccessResponse(result, "Mentor feedback updated");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<MentorFeedbackResponseDto>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpPost("{trackingId}/acknowledge")]
        public async Task<ApiResponseDto<bool>> AcknowledgeMentorFeedback(int trackingId)
        {
            try
            {
                var result = await _service.AcknowledgeMentorFeedbackAsync(trackingId);
                return ApiResponseDto<bool>.SuccessResponse(result, "Mentor feedback acknowledged");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<bool>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpDelete("{trackingId}")]
        public async Task<ApiResponseDto<bool>> DeleteMentorFeedback(int trackingId)
        {
            try
            {
                var result = await _service.DeleteMentorFeedbackAsync(trackingId);
                return ApiResponseDto<bool>.SuccessResponse(result, "Mentor feedback deleted");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<bool>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }
    }
}
