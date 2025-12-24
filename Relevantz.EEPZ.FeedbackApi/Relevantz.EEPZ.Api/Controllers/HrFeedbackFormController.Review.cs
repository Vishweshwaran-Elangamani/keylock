using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.DTOs.Request;
using Microsoft.AspNetCore.Mvc;

namespace EepzBackend.Controllers
{

    public partial class HrFeedbackFormController
    {
        

        /// <summary>
        /// HR reviews a submitted form response
        /// </summary>
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

        /// <summary>
        /// Distribute form to selected employees
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

                return Ok(new 
                { 
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
