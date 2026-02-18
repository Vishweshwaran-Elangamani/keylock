using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.DTOs.Request;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace EepzBackend.Controllers
{
    public partial class HrFeedbackFormController
    {
        [Authorize(Roles = "HR")]
        [HttpPost("responses/{responseId:int}/hr-review")]
        public async Task<IActionResult> SetHRReview(
            int responseId,
            [FromQuery] string hrComments,
            [FromQuery] int reviewedByHRId,
            CancellationToken ct)
        {
           
            var hrIdFromToken = int.Parse(User.FindFirst("EmployeeId")!.Value);

            if (reviewedByHRId != hrIdFromToken)
                return Forbid();

            var result = await _service.SetHRReviewAsync(responseId, hrComments, hrIdFromToken, ct);

            return Ok(ApiResponseDto<bool>.SuccessResponse(result, "HR review set"));
        }

        [Authorize(Roles = "HR")]
        [HttpPost("forms/{formId:int}/distribute")]
        public async Task<IActionResult> DistributeForm(
            int formId,
            [FromBody] DistributeFormRequest request,
            CancellationToken ct)
        {
           

            if (request?.EmployeeIds == null || !request.EmployeeIds.Any())
                return BadRequest("EmployeeIds cannot be empty.");

            var response = await _service.DistributeFormAsync(formId, request.EmployeeIds, ct);

            return Ok(ApiResponseDto<DistributeFormResponse>
                .SuccessResponse(response, response.Message));
        }
    }
}
