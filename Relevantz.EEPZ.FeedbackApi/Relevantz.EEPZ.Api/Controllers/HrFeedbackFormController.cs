using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EepzBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public partial class HrFeedbackFormController : ControllerBase
    {
        private readonly IHrFeedbackFormService _service;

        public HrFeedbackFormController(IHrFeedbackFormService service)
        {
            _service = service;
        }

        /// <summary>
        /// Create a new HR feedback form
        /// </summary>
        [HttpPost("forms/create")]
        public async Task<ApiResponseDto<HrFeedbackFormResponseDto>> CreateForm(CreateHRFeedbackFormRequestDto dto)
        {
            try
            {
                var result = await _service.CreateFormAsync(dto);
                return ApiResponseDto<HrFeedbackFormResponseDto>.SuccessResponse(result, "HR feedback form created");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<HrFeedbackFormResponseDto>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        /// <summary>
        /// Get a specific HR feedback form by ID
        /// </summary>
        [HttpGet("forms/{formId}")]
        public async Task<ApiResponseDto<HrFeedbackFormResponseDto>> GetForm(int formId)
        {
            try
            {
                var result = await _service.GetFormByIdAsync(formId);
                return ApiResponseDto<HrFeedbackFormResponseDto>.SuccessResponse(result);
            }
            catch (Exception ex)
            {
                return ApiResponseDto<HrFeedbackFormResponseDto>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        /// <summary>
        /// Get all HR feedback forms
        /// </summary>
        [HttpGet("forms")]
        public async Task<ApiResponseDto<List<HrFeedbackFormResponseDto>>> GetAllForms()
        {
            try
            {
                var result = await _service.GetAllFormsAsync();
                return ApiResponseDto<List<HrFeedbackFormResponseDto>>.SuccessResponse(result);
            }
            catch (Exception ex)
            {
                return ApiResponseDto<List<HrFeedbackFormResponseDto>>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        /// <summary>
        /// Get all active HR feedback forms
        /// </summary>
        [HttpGet("forms/active")]
        public async Task<ApiResponseDto<List<HrFeedbackFormResponseDto>>> GetActiveForms()
        {
            try
            {
                var result = await _service.GetActiveFormsAsync();
                return ApiResponseDto<List<HrFeedbackFormResponseDto>>.SuccessResponse(result);
            }
            catch (Exception ex)
            {
                return ApiResponseDto<List<HrFeedbackFormResponseDto>>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        /// <summary>
        /// Update an existing HR feedback form
        /// </summary>
        [HttpPut("forms/{formId}")]
        public async Task<ApiResponseDto<HrFeedbackFormResponseDto>> UpdateForm(int formId, UpdateHRFormRequestDto dto)
        {
            try
            {
                var result = await _service.UpdateFormAsync(formId, dto);
                return ApiResponseDto<HrFeedbackFormResponseDto>.SuccessResponse(result, "HR feedback form updated");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<HrFeedbackFormResponseDto>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        /// <summary>
        /// Delete an HR feedback form
        /// </summary>
        [HttpDelete("forms/{formId}")]
        public async Task<ApiResponseDto<bool>> DeleteForm(int formId)
        {
            try
            {
                var result = await _service.DeleteFormAsync(formId);
                return ApiResponseDto<bool>.SuccessResponse(result, "HR feedback form deleted");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<bool>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }
    }
}
