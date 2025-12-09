using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.Services.Interface;

namespace Relevantz.EEPZ.Api.Controllers.LnD
{
    /// <summary>
    /// Assignment Management - Requests, Tracking, and Completion
    /// </summary>
    [ApiController]
    [Route("api/lnd-assignments")]
    [Authorize]
    public class LnDAssignmentsController : BaseLnDController
    {
        private readonly ILnDService _lndService;

        public LnDAssignmentsController(ILnDService lndService)
        {
            _lndService = lndService;
        }

        /// <summary>
        /// Check and mark overdue assignments (can be called by scheduled job)
        /// </summary>
        [HttpPost("check-overdue")]
        [Authorize(Roles = LnDConstants.USER_ROLES.HR)]
        public async Task<IActionResult> CheckOverdueAssignments()
        {
            var result = await _lndService.CheckAndMarkOverdueAssignments();

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpPost("request-sme")]
        public async Task<IActionResult> RequestSmeAssignment([FromBody] SmeRequestDto request)
        {
            var managerId = GetCurrentEmployeeId();
            var result = await _lndService.RequestSmeAssignment(managerId, request);

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("my-assignments")]
        public async Task<IActionResult> GetMyAssignments(
            [FromQuery] string? statusFilter,
            [FromQuery] string? searchTerm,
            [FromQuery] string? sortField,
            [FromQuery] string? sortOrder,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10
        )
        {
            var employeeId = GetCurrentEmployeeId();
            var result = await _lndService.GetMyAssignments(
                employeeId,
                statusFilter,
                searchTerm,
                sortField,
                sortOrder,
                pageNumber,
                pageSize
            );

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("team/export")]
        [Authorize(Roles = LnDConstants.USER_ROLES.MANAGER)]
        public async Task<IActionResult> ExportTeamAssignments(
            [FromQuery] string? statusFilter,
            [FromQuery] string? searchTerm,
            [FromQuery] string? sortField,
            [FromQuery] string? sortOrder
        )
        {
            var managerId = GetCurrentEmployeeId();
            var result = await _lndService.ExportTeamAssignmentsToExcel(
                managerId,
                statusFilter,
                searchTerm,
                sortField,
                sortOrder
            );

            if (!result.Success)
                return BadRequest(result);

            var fileName = $"TeamAssignments_{DateTime.Now:yyyyMMddHHmmss}.xlsx";
            return File(result.Data,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName);
        }

        [HttpGet("team")]
        public async Task<IActionResult> GetTeamAssignments(
            [FromQuery] string? statusFilter,
            [FromQuery] string? searchTerm,
            [FromQuery] string? sortField,
            [FromQuery] string? sortOrder,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10
        )
        {
            var managerId = GetCurrentEmployeeId();
            var result = await _lndService.GetTeamAssignments(
                managerId,
                statusFilter,
                searchTerm,
                sortField,
                sortOrder,
                pageNumber,
                pageSize
            );

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("sme")]
        public async Task<IActionResult> GetSmeAssignments(
            [FromQuery] string? statusFilter,
            [FromQuery] string? searchTerm,
            [FromQuery] string? sortField,
            [FromQuery] string? sortOrder,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10
        )
        {
            var smeEmployeeId = GetCurrentEmployeeId();
            var result = await _lndService.GetSmeAssignments(
                smeEmployeeId,
                statusFilter,
                searchTerm,
                sortField,
                sortOrder,
                pageNumber,
                pageSize
            );

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("upload-proof")]
        public async Task<IActionResult> UploadCompletionProof(
            [FromForm] UploadCompletionProofRequest request
        )
        {
            var employeeId = GetCurrentEmployeeId();
            var result = await _lndService.UploadCompletionProof(employeeId, request);

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("complete")]
        public async Task<IActionResult> CompleteAssignment(
            [FromBody] CompleteAssignmentRequest request
        )
        {
            var managerId = GetCurrentEmployeeId();
            var result = await _lndService.CompleteAssignment(managerId, request);

            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
