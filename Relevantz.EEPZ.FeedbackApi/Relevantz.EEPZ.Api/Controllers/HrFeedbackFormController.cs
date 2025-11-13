using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.Entities;

namespace EepzBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HrFeedbackFormController : ControllerBase
    {
        private readonly IHrFeedbackFormService _service;

        public HrFeedbackFormController(IHrFeedbackFormService service)
        {
            _service = service;
        }

        // ============================================================================
        // FORM ENDPOINTS
        // ============================================================================

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

        // ============================================================================
        // FORM RESPONSE ENDPOINTS
        // ============================================================================

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

        [HttpPost("responses/{responseId}/hr-review")]
        public async Task<ApiResponseDto<bool>> SetHRReview(int responseId, [FromQuery] string hrComments, [FromQuery] int reviewedByHRId)
        {
            try
            {
                var result = await _service.SetHRReviewAsync(responseId, hrComments, reviewedByHRId);
                return ApiResponseDto<bool>.SuccessResponse(result, "HR review set");
            }
            catch (Exception ex)
            {
                return ApiResponseDto<bool>.ErrorResponse($"Error: {ex.Message}", new List<string> { ex.Message });
            }
        }

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

        /// <summary>
/// Distribute form to employees
/// POST /api/HrFeedbackForm/forms/{formId}/distribute
/// </summary>
[HttpPost("forms/{formId}/distribute")]
public async Task<IActionResult> DistributeForm(int formId, [FromBody] DistributeFormRequest request)
{
    try
    {
       
        if (request?.EmployeeIds == null || request.EmployeeIds.Count == 0)
            return BadRequest(new { success = false, message = "No employees selected" });

        var response = await _service.DistributeFormAsync(formId, request.EmployeeIds);

        return Ok(new { 
            success = response.Success,
            data = response,
            message = response.Message 
        });
    }
    catch (ArgumentException ex)
    {
        
        return BadRequest(new { success = false, message = ex.Message });
    }
    catch (KeyNotFoundException ex)
    {
        
        return NotFound(new { success = false, message = ex.Message });
    }
    catch (Exception ex)
    {
        
        return StatusCode(500, new { success = false, message = "Internal server error" });
    }
}


        

        

        
    }
}
