using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.DTOs.Request;
using Microsoft.AspNetCore.Mvc;

namespace EepzBackend.Controllers
{
    public partial class HrFeedbackFormController
    {
        [HttpPost("responses/{responseId}/hr-review")]
        public async Task<IActionResult> SetHRReview(
            int responseId,
            [FromQuery] string hrComments,
            [FromQuery] int reviewedByHRId,
            CancellationToken ct)
        {
            var result = await _service.SetHRReviewAsync(responseId, hrComments, reviewedByHRId, ct);
            return Ok(ApiResponseDto<bool>.SuccessResponse(result, "HR review set"));
        }

        [HttpPost("forms/{formId}/distribute")]
        public async Task<IActionResult> DistributeForm(
            int formId,
            [FromBody] DistributeFormRequest request,
            CancellationToken ct)
        {
            var response = await _service.DistributeFormAsync(formId, request.EmployeeIds, ct);
            return Ok(ApiResponseDto<DistributeFormResponse>.SuccessResponse(response, response.Message));
        }
    }
}
