using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.DTOs.Request;
using Microsoft.AspNetCore.Mvc;

namespace EepzBackend.Controllers
{

    public partial class HrFeedbackFormController
    {

        /// <summary>
        /// Create a new form response (employee submits feedback)
        /// </summary>
        [HttpPost("responses/create")]
        public async Task<ApiResponseDto<HrFeedbackFormResponseResponseDto>> CreateFormResponse(SubmitHRFormResponseRequestDto dto)
        {
            try
            {
                var result = await _service.CreateFormResponseAsync(dto);
                return ApiResponseDto<HrFeedbackFormResponseResponseDto>.SuccessResponse(result, "Form response created");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<HrFeedbackFormResponseResponseDto>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        /// <summary>
        /// Get a specific form response by ID
        /// </summary>
        [HttpGet("responses/{responseId}")]
        public async Task<ApiResponseDto<HrFeedbackFormResponseResponseDto>> GetFormResponse(int responseId)
        {
            try
            {
                var result = await _service.GetFormResponseByIdAsync(responseId);
                return ApiResponseDto<HrFeedbackFormResponseResponseDto>.SuccessResponse(result);
            }
            catch (Exception ex)
            {
                return ApiResponseDto<HrFeedbackFormResponseResponseDto>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        /// <summary>
        /// Get all responses for a specific form
        /// </summary>
        [HttpGet("responses/by-form/{formId}")]
        public async Task<ApiResponseDto<List<HrFeedbackFormResponseResponseDto>>> GetResponsesByForm(int formId)
        {
            try
            {
                var result = await _service.GetResponsesByFormAsync(formId);
                return ApiResponseDto<List<HrFeedbackFormResponseResponseDto>>.SuccessResponse(result);
            }
            catch (Exception ex)
            {
                return ApiResponseDto<List<HrFeedbackFormResponseResponseDto>>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        /// <summary>
        /// Get all responses submitted by a specific employee
        /// </summary>
        [HttpGet("responses/by-employee/{employeeId}")]
        public async Task<ApiResponseDto<List<HrFeedbackFormResponseResponseDto>>> GetResponsesByEmployee(int employeeId)
        {
            try
            {
                var result = await _service.GetResponsesBySubmitterAsync(employeeId);
                return ApiResponseDto<List<HrFeedbackFormResponseResponseDto>>.SuccessResponse(
                    result,
                    $"Retrieved {result.Count} responses for employee {employeeId}"
                );
            }
            catch (Exception ex)
            {
                return ApiResponseDto<List<HrFeedbackFormResponseResponseDto>>.ErrorResponse(
                    $"Error: {ex.Message}",
                    new List<string> { ex.Message }
                );
            }
        }

        /// <summary>
        /// Get all responses pending HR review
        /// </summary>
        [HttpGet("responses/pending-review")]
        public async Task<ApiResponseDto<List<HrFeedbackFormResponseResponseDto>>> GetPendingReviewResponses()
        {
            try
            {
                var result = await _service.GetPendingReviewResponsesAsync();
                return ApiResponseDto<List<HrFeedbackFormResponseResponseDto>>.SuccessResponse(result);
            }
            catch (Exception ex)
            {
                return ApiResponseDto<List<HrFeedbackFormResponseResponseDto>>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        /// <summary>
        /// Update an existing form response (before submission)
        /// </summary>
        [HttpPut("responses/{responseId}")]
        public async Task<ApiResponseDto<HrFeedbackFormResponseResponseDto>> UpdateFormResponse(int responseId, UpdateHRFormResponseRequestDto dto)
        {
            try
            {
                var result = await _service.UpdateFormResponseAsync(responseId, dto);
                return ApiResponseDto<HrFeedbackFormResponseResponseDto>.SuccessResponse(result, "Form response updated");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<HrFeedbackFormResponseResponseDto>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        /// <summary>
        /// Submit a form response for review
        /// </summary>
        [HttpPost("responses/{responseId}/submit")]
        public async Task<ApiResponseDto<bool>> SubmitFormResponse(int responseId)
        {
            try
            {
                var result = await _service.SubmitFormResponseAsync(responseId);
                return ApiResponseDto<bool>.SuccessResponse(result, "Form response submitted");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<bool>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

        /// <summary>
        /// Delete a form response
        /// </summary>
        [HttpDelete("responses/{responseId}")]
        public async Task<ApiResponseDto<bool>> DeleteFormResponse(int responseId)
        {
            try
            {
                var result = await _service.DeleteFormResponseAsync(responseId);
                return ApiResponseDto<bool>.SuccessResponse(result, "Form response deleted");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<bool>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }
    }
}
