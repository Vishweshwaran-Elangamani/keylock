using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common;

namespace eepzbackend.Controllers
{
    public partial class SlaController
    {
        /// <summary>
        /// Retrieves SLA compliance metrics.
        /// If departmentId is provided → department compliance.
        /// If omitted → compliance for all departments.
        /// </summary>
        /// <param name="departmentId">Optional department identifier</param>
        /// <param name="period">Compliance period filter</param>
        /// <param name="level">Compliance level (dept/all)</param>
        /// <returns>Compliance metrics data</returns>
        [HttpGet("compliance")]
        public async Task<IActionResult> GetDepartmentCompliance(
            [FromQuery] int? departmentId,
            [FromQuery] string? period,
            [FromQuery] string level = "dept")
        {
            _logger.LogInformation(
                "START GetDepartmentCompliance. UserId: {UserId}, DeptId: {DeptId}, Level: {Level}, Period: {Period}, CorrelationId: {CorrelationId}",
                UserId, departmentId, level, period, CorrelationId);

            object data = level.ToLower() == "dept" && departmentId.HasValue
                ? await _slaService.GetDepartmentCompliance(departmentId.Value, period)
                : await _slaService.GetAllDepartmentCompliance(period);

            _logger.LogInformation("SUCCESS GetDepartmentCompliance. CorrelationId: {CorrelationId}", CorrelationId);
            _logger.LogInformation("END GetDepartmentCompliance. CorrelationId: {CorrelationId}", CorrelationId);

            return Ok(new ApiResponse<object>
            {
                StatusCode = StatusCodes.Status200OK,
                Success = true,
                Message = ApiMessages.Success,
                Data = data,
                CorrelationId = CorrelationId
            });
        }

        /// <summary>
        /// Calculates compliance metrics for a department.
        /// </summary>
        /// <param name="request">Compliance calculation request</param>
        /// <returns>Calculated compliance result</returns>
        [HttpPost("compliance")]
        public async Task<IActionResult> CalculateCompliance([FromBody] CalculateComplianceRequest request)
        {
            _logger.LogInformation(
                "START CalculateCompliance. UserId: {UserId}, DeptId: {DeptId}, Period: {Period}, CorrelationId: {CorrelationId}",
                UserId, request.DepartmentId, request.Period, CorrelationId);

            var data = await _slaService.CalculateCompliance(request);

            _logger.LogInformation("SUCCESS CalculateCompliance. CorrelationId: {CorrelationId}", CorrelationId);
            _logger.LogInformation("END CalculateCompliance. CorrelationId: {CorrelationId}", CorrelationId);

            return Ok(new ApiResponse<DepartmentComplianceResponse>
            {
                StatusCode = StatusCodes.Status200OK,
                Success = true,
                Message = ApiMessages.ComplianceCalculated,
                Data = data,
                CorrelationId = CorrelationId
            });
        }
    }
}
