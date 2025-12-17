using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace EepzBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrgGoalFeedbackController : ControllerBase
    {
        private readonly IOrgGoalFeedbackService _service;

        public OrgGoalFeedbackController(IOrgGoalFeedbackService service)
        {
            _service = service;
        }

        [HttpPost("create")]
        public async Task<ApiResponseDto<OrgGoalFeedbackResponseDto>> CreateOrgGoalFeedback(CreateOrgGoalFeedbackRequestDto dto)
        {
            try
            {
                var result = await _service.CreateOrgGoalFeedbackAsync(dto);
                return ApiResponseDto<OrgGoalFeedbackResponseDto>.SuccessResponse(result, "Organization goal feedback created");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<OrgGoalFeedbackResponseDto>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpGet("{feedbackId}")]
        public async Task<ApiResponseDto<OrgGoalFeedbackResponseDto>> GetOrgGoalFeedback(int feedbackId)
        {
            try
            {
                var result = await _service.GetOrgGoalFeedbackByIdAsync(feedbackId);
                return ApiResponseDto<OrgGoalFeedbackResponseDto>.SuccessResponse(result);
            }
            catch (Exception ex)
            {
                return ApiResponseDto<OrgGoalFeedbackResponseDto>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpGet("goal/{organizationObjectiveId}")]
        public async Task<ApiResponseDto<List<OrgGoalFeedbackResponseDto>>> GetFeedbackByOrgGoal(int organizationObjectiveId)
        {
            try
            {
                var result = await _service.GetFeedbackByOrgGoalAsync(organizationObjectiveId);
                return ApiResponseDto<List<OrgGoalFeedbackResponseDto>>.SuccessResponse(result);
            }
            catch (Exception ex)
            {
                return ApiResponseDto<List<OrgGoalFeedbackResponseDto>>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpGet("all")]
        public async Task<ApiResponseDto<List<OrgGoalFeedbackResponseDto>>> GetAllOrgGoalFeedback([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var result = await _service.GetAllOrgGoalFeedbackAsync(pageNumber, pageSize);
                return ApiResponseDto<List<OrgGoalFeedbackResponseDto>>.SuccessResponse(result);
            }
            catch (Exception ex)
            {
                return ApiResponseDto<List<OrgGoalFeedbackResponseDto>>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpPut("{feedbackId}")]
        public async Task<ApiResponseDto<OrgGoalFeedbackResponseDto>> UpdateOrgGoalFeedback(int feedbackId, UpdateOrgGoalFeedbackRequestDto dto)
        {
            try
            {
                var result = await _service.UpdateOrgGoalFeedbackAsync(feedbackId, dto);
                return ApiResponseDto<OrgGoalFeedbackResponseDto>.SuccessResponse(result, "Organization goal feedback updated");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<OrgGoalFeedbackResponseDto>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        [HttpDelete("{feedbackId}")]
        public async Task<ApiResponseDto<bool>> DeleteOrgGoalFeedback(int feedbackId)
        {
            try
            {
                var result = await _service.DeleteOrgGoalFeedbackAsync(feedbackId);
                return ApiResponseDto<bool>.SuccessResponse(result, "Organization goal feedback deleted");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<bool>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }
    }
}
