using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common;

namespace eepzbackend.Controllers
{
    public partial class SlaController
    {
        [HttpGet("compliance")]
        public async Task<IActionResult> GetDepartmentCompliance(
            [FromQuery] int? departmentId,
            [FromQuery] string? period,
            [FromQuery] string level = "dept")
        {
            var correlationId = HttpContext.TraceIdentifier;
            var normalizedLevel = string.IsNullOrWhiteSpace(level)
                ? "dept"
                : level.Trim().ToLower();

            _logger.LogInformation(
                "START GetDepartmentCompliance | UserId: {UserId} | DeptId: {DeptId} | Level: {Level} | Period: {Period} | CorrelationId: {CorrelationId}",
                UserId, departmentId, normalizedLevel, period, correlationId);

            object data = normalizedLevel == "dept" && departmentId.HasValue
                ? await _slaService.GetDepartmentCompliance(departmentId.Value, period)
                : await _slaService.GetAllDepartmentCompliance(period);

            _logger.LogInformation(
                "END GetDepartmentCompliance | CorrelationId: {CorrelationId}",
                correlationId);

            return Ok(new ApiResponse<object>
            {
                StatusCode = StatusCodes.Status200OK,
                Success = true,
                Message = ApiMessages.Success,
                Data = data,
                CorrelationId = correlationId
            });
        }

        [HttpPost("compliance")]
        public async Task<IActionResult> CalculateCompliance([FromBody] CalculateComplianceRequest request)
        {
            var correlationId = HttpContext.TraceIdentifier;

            if (request == null)
            {
                return BadRequest(new ApiResponse<object>
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Success = false,
                    Message = ApiMessages.ValidationFailed,
                    CorrelationId = correlationId
                });
            }

            _logger.LogInformation(
                "START CalculateCompliance | UserId: {UserId} | DeptId: {DeptId} | Period: {Period} | CorrelationId: {CorrelationId}",
                UserId, request.DepartmentId, request.Period, correlationId);

            var data = await _slaService.CalculateCompliance(request);

            _logger.LogInformation(
                "END CalculateCompliance | CorrelationId: {CorrelationId}",
                correlationId);

            return Ok(new ApiResponse<DepartmentComplianceResponse>
            {
                StatusCode = StatusCodes.Status200OK,
                Success = true,
                Message = ApiMessages.ComplianceCalculated,
                Data = data,
                CorrelationId = correlationId
            });
        }
    }
}
