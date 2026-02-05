using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.DTOs.Request;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace EepzBackend.Controllers
{
    public partial class HrFeedbackFormController
    {
        [HttpPost("responses/create")]
        public async Task<IActionResult> CreateFormResponse([FromBody] SubmitHRFormResponseRequestDto dto, CancellationToken ct)
        {
            var result = await _service.CreateFormResponseAsync(dto, ct);
            return Ok(ApiResponseDto<HrFeedbackFormResponseResponseDto>.SuccessResponse(result, "Form response created"));
        }

        [HttpGet("responses/{responseId}")]
        public async Task<IActionResult> GetFormResponse(int responseId, CancellationToken ct)
        {
            var result = await _service.GetFormResponseByIdAsync(responseId, ct);
            return Ok(ApiResponseDto<HrFeedbackFormResponseResponseDto>.SuccessResponse(result));
        }

        [HttpGet("responses/by-form/{formId}")]
        public async Task<IActionResult> GetResponsesByForm(int formId, CancellationToken ct)
        {
            var result = await _service.GetResponsesByFormAsync(formId, ct);
            return Ok(ApiResponseDto<List<HrFeedbackFormResponseResponseDto>>.SuccessResponse(result));
        }

        [HttpGet("responses/by-employee/{employeeId}")]
        public async Task<IActionResult> GetResponsesByEmployee(int employeeId, CancellationToken ct)
        {
            var result = await _service.GetResponsesBySubmitterAsync(employeeId, ct);
            return Ok(ApiResponseDto<List<HrFeedbackFormResponseResponseDto>>.SuccessResponse(
                result,
                $"Retrieved {result.Count} responses for employee {employeeId}"
            ));
        }

        [HttpGet("responses/pending-review")]
        public async Task<IActionResult> GetPendingReviewResponses(CancellationToken ct)
        {
            var result = await _service.GetPendingReviewResponsesAsync(ct);
            return Ok(ApiResponseDto<List<HrFeedbackFormResponseResponseDto>>.SuccessResponse(result));
        }

        [HttpPut("responses/{responseId}")]
        public async Task<IActionResult> UpdateFormResponse(int responseId, [FromBody] UpdateHRFormResponseRequestDto dto, CancellationToken ct)
        {
            var result = await _service.UpdateFormResponseAsync(responseId, dto, ct);
            return Ok(ApiResponseDto<HrFeedbackFormResponseResponseDto>.SuccessResponse(result, "Form response updated"));
        }

        [HttpPost("responses/{responseId}/submit")]
        public async Task<IActionResult> SubmitFormResponse(int responseId, CancellationToken ct)
        {
            var result = await _service.SubmitFormResponseAsync(responseId, ct);
            return Ok(ApiResponseDto<bool>.SuccessResponse(result, "Form response submitted"));
        }

        [HttpDelete("responses/{responseId}")]
        public async Task<IActionResult> DeleteFormResponse(int responseId, CancellationToken ct)
        {
            var result = await _service.DeleteFormResponseAsync(responseId, ct);
            return Ok(ApiResponseDto<bool>.SuccessResponse(result, "Form response deleted"));
        }
    }
}
