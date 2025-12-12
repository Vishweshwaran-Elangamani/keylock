using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.Services.Interface;

namespace Relevantz.EEPZ.Api.Controllers.LnD
{
    /// <summary>
    /// Approvals Management - Processing, History, and File Downloads
    /// </summary>
    [ApiController]
    [Route("api/lnd-approvals")]
    [Authorize]
    public class LnDApprovalsController : BaseLnDController
    {
        private readonly ILnDService _lndService;

        public LnDApprovalsController(ILnDService lndService)
        {
            _lndService = lndService;
        }

        [HttpGet("my-approvals")]

        public async Task<IActionResult> GetMyApprovals(
    [FromQuery] string? approvalType,
    [FromQuery] string? status,
    [FromQuery] string? sortField,
    [FromQuery] string? sortOrder,
    [FromQuery] int pageNumber = 1,
    [FromQuery] int pageSize = 10,
    [FromQuery] string? searchTerm = null
)
        {
            var employeeId = GetCurrentEmployeeId();
            var result = await _lndService.GetMyApprovals(
                employeeId,
                approvalType,
                status,
                sortField,
                sortOrder,
                pageNumber,
                pageSize,
                searchTerm
            );

            return result.Success ? Ok(result) : BadRequest(result);
        }


        [HttpPost("process")]
        public async Task<IActionResult> ProcessApproval([FromBody] ApprovalDecisionRequest request)
        {
            var approverId = GetCurrentEmployeeId();
            var result = await _lndService.ProcessApproval(approverId, request);

            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Get complete approval history for the logged-in user (as requester or approver)
        /// </summary>
        [HttpGet("history")]
        public async Task<IActionResult> GetApprovalHistory(
            [FromQuery] string? approvalType,
            [FromQuery] string? status,
            [FromQuery] string? role,
            [FromQuery] string? searchTerm,
            [FromQuery] string? sortField,
            [FromQuery] string? sortOrder,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10
        )
        {
            var employeeId = GetCurrentEmployeeId();
            var result = await _lndService.GetApprovalHistory(
                employeeId,
                approvalType,
                status,
                role,
                searchTerm,
                sortField,
                sortOrder,
                pageNumber,
                pageSize
            );

            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Get detailed approval information including all attachments
        /// </summary>
        [HttpGet("{approvalId}/details")]
        public async Task<IActionResult> GetApprovalDetails(int approvalId)
        {
            var employeeId = GetCurrentEmployeeId();
            var result = await _lndService.GetApprovalDetails(employeeId, approvalId);

            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Download attachment file from approval history
        /// </summary>
        [HttpGet("{approvalId}/download")]
        public async Task<IActionResult> DownloadApprovalAttachment(int approvalId)
        {
            var employeeId = GetCurrentEmployeeId();
            var result = await _lndService.GetApprovalAttachment(employeeId, approvalId);

            if (!result.Success)
                return BadRequest(result);

            var fileBytes = result.Data.FileBytes;
            var fileName = result.Data.FileName;
            var contentType = result.Data.ContentType;

            return File(fileBytes, contentType, fileName);
        }

        /// <summary>
        /// Download assignment completion proof
        /// </summary>
        [HttpGet("assignments/{assignmentId}/download-proof")]
        public async Task<IActionResult> DownloadAssignmentProof(int assignmentId)
        {
            var employeeId = GetCurrentEmployeeId();
            var result = await _lndService.GetAssignmentProof(employeeId, assignmentId);

            if (!result.Success)
                return BadRequest(result);

            var fileBytes = result.Data.FileBytes;
            var fileName = result.Data.FileName;
            var contentType = result.Data.ContentType;

            return File(fileBytes, contentType, fileName);
        }

        [HttpGet("{approvalId}/attachment/preview")]
        public async Task<IActionResult> PreviewApprovalAttachment(int approvalId)
        {
            var employeeId = GetCurrentEmployeeId();
            var result = await _lndService.PreviewApprovalAttachment(employeeId, approvalId);

            if (!result.Success)
                return BadRequest(result);

            return File(result.Data.FileBytes, result.Data.ContentType, result.Data.FileName, enableRangeProcessing: true);
        }

        [HttpGet("assignments/{assignmentId}/proof/preview")]
        public async Task<IActionResult> PreviewAssignmentProof(int assignmentId)
        {
            var employeeId = GetCurrentEmployeeId();
            var result = await _lndService.PreviewAssignmentProof(employeeId, assignmentId);

            if (!result.Success)
                return BadRequest(result);

            return File(result.Data.FileBytes, result.Data.ContentType, result.Data.FileName, enableRangeProcessing: true);
        }
    }
}
