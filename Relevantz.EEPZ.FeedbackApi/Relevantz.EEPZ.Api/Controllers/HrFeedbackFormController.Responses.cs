using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.DTOs.Request;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace EepzBackend.Controllers
{
    public partial class HrFeedbackFormController
    {
        [Authorize(Roles = "Employee,Manager")]
        [HttpPost("responses/create")]
        public async Task<IActionResult> CreateFormResponse(
            [FromBody] SubmitHRFormResponseRequestDto dto,
            CancellationToken ct)
        {
            var employeeId = GetLoggedInEmployeeId();

            var result = await _service.CreateFormResponseAsync(dto, employeeId, ct);

            return Ok(ApiResponseDto<HrFeedbackFormResponseResponseDto>
                .SuccessResponse(result, "Form response created"));
        }

        [Authorize(Roles = "Employee,Manager")]
        [HttpGet("responses/{responseId:int}")]
        public async Task<IActionResult> GetFormResponse(int responseId, CancellationToken ct)
        {
            var result = await _service.GetFormResponseByIdAsync(responseId, ct);

            return Ok(ApiResponseDto<HrFeedbackFormResponseResponseDto>
                .SuccessResponse(result));
        }

        [Authorize(Roles = "Employee,Manager")]
        [HttpGet("responses/by-form/{formId:int}")]
        public async Task<IActionResult> GetResponsesByForm(int formId, CancellationToken ct)
        {
            var result = await _service.GetResponsesByFormAsync(formId, ct);

            return Ok(ApiResponseDto<List<HrFeedbackFormResponseResponseDto>>
                .SuccessResponse(result));
        }

        [Authorize(Roles = "Employee,Manager")]
        [HttpGet("responses/by-employee/{employeeId:int}")]
        public async Task<IActionResult> GetResponsesByEmployee(int employeeId, CancellationToken ct)
        {
            var loggedInEmployeeId = GetLoggedInEmployeeId();

            if (employeeId != loggedInEmployeeId)
                return Forbid();

            var result = await _service.GetResponsesBySubmitterAsync(employeeId, ct);

            return Ok(ApiResponseDto<List<HrFeedbackFormResponseResponseDto>>
                .SuccessResponse(result, $"Retrieved {result.Count} responses for employee {employeeId}"));
        }

        [Authorize(Roles = "HR")]
        [HttpGet("responses/pending-review")]
        public async Task<IActionResult> GetPendingReviewResponses(CancellationToken ct)
        {
            var result = await _service.GetPendingReviewResponsesAsync(ct);

            return Ok(ApiResponseDto<List<HrFeedbackFormResponseResponseDto>>
                .SuccessResponse(result));
        }

        [Authorize(Roles = "Employee,Manager")]
        [HttpPut("responses/{responseId:int}")]
        public async Task<IActionResult> UpdateFormResponse(
            int responseId,
            [FromBody] UpdateHRFormResponseRequestDto dto,
            CancellationToken ct)
        {
            var employeeId = GetLoggedInEmployeeId();

            var result = await _service.UpdateFormResponseAsync(responseId, dto, employeeId, ct);

            return Ok(ApiResponseDto<HrFeedbackFormResponseResponseDto>
                .SuccessResponse(result, "Form response updated"));
        }

        [Authorize(Roles = "Employee,Manager")]
        [HttpPost("responses/{responseId:int}/submit")]
        public async Task<IActionResult> SubmitFormResponse(int responseId, CancellationToken ct)
        {
            var employeeId = GetLoggedInEmployeeId();

            var result = await _service.SubmitFormResponseAsync(responseId, employeeId, ct);

            return Ok(ApiResponseDto<bool>
                .SuccessResponse(result, "Form response submitted"));
        }

        [Authorize(Roles = "Employee")]
        [HttpDelete("responses/{responseId:int}")]
        public async Task<IActionResult> DeleteFormResponse(int responseId, CancellationToken ct)
        {
            var employeeId = GetLoggedInEmployeeId();

            var result = await _service.DeleteFormResponseAsync(responseId, employeeId, ct);

            return Ok(ApiResponseDto<bool>
                .SuccessResponse(result, "Form response deleted"));
        }

        private int GetLoggedInEmployeeId()
        {
            var claim =
                User.FindFirst("EmployeeId") ??
                User.FindFirst(ClaimTypes.NameIdentifier) ??
                User.FindFirst("sub");

            if (claim == null)
                throw new UnauthorizedAccessException("EmployeeId claim missing.");

            if (!int.TryParse(claim.Value, out var id))
                throw new UnauthorizedAccessException("Invalid EmployeeId claim.");

            return id;
        }
    }
}
