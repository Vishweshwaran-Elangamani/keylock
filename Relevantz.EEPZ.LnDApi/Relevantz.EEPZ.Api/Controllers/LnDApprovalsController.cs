using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.Services.Interface;
using Serilog;

namespace Relevantz.EEPZ.Api.Controllers.LnD
{
    /// <summary>
    /// Approvals Management - Processing, History, and File Downloads
    /// </summary>
    [ApiController]
    [Authorize]
    public class LnDApprovalsController : BaseLnDController
    {
        #region Dependencies

        private readonly ILnDApprovalService _approvalService;

        public LnDApprovalsController(ILnDApprovalService approvalService)
        {
            _approvalService = approvalService;
        }

        #endregion

        #region Approval Retrieval and Processing

        /// <summary>
        /// Gets pending approvals assigned to the current user as approver.
        /// Supports filtering by type, status, search term, and pagination.
        /// </summary>
        [HttpGet("api/lnd-approvals/my-approvals")]
        public async Task<IActionResult> GetMyApprovals([FromQuery] MyApprovalsRequestModel request)
        {
            var employeeId = GetCurrentEmployeeId();

            Log.Information(
                "GetMyApprovals API called. EmployeeId={EmployeeId}, ApprovalType={ApprovalType}, Status={Status}, Page={PageNumber}, PageSize={PageSize}",
                employeeId, request.ApprovalType ?? "all", request.Status ?? "all", request.PageNumber, request.PageSize
            );

            var result = await _approvalService.GetMyApprovals(employeeId, request);

            if (result.Success)
            {
                Log.Information(
                    "GetMyApprovals API succeeded. EmployeeId={EmployeeId}, TotalCount={TotalCount}",
                    employeeId, result.Data?.TotalCount ?? 0
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "GetMyApprovals API failed. EmployeeId={EmployeeId}, Message={Message}",
                    employeeId, result.Message
                );
                return BadRequest(result);
            }
        }

        /// <summary>
        /// Processes an approval decision (approve or reject).
        /// Triggers business workflows for SME registration, assignments, and acknowledgements.  
        /// </summary>
        [HttpPost("api/lnd-approvals/process")] 
        public async Task<IActionResult> ProcessApproval([FromBody] ApprovalDecisionRequestModel request)
        {
            var approverId = GetCurrentEmployeeId();

            Log.Information(
                "ProcessApproval API called. ApproverId={ApproverId}, ApprovalId={ApprovalId}, IsApproved={IsApproved}",
                approverId, request.ApprovalId, request.IsApproved
            );

            var result = await _approvalService.ProcessApproval(approverId, request);

            if (result.Success)
            {
                Log.Information(
                    "ProcessApproval API succeeded. ApproverId={ApproverId}, ApprovalId={ApprovalId}, Decision={Decision}",
                    approverId, request.ApprovalId, request.IsApproved ? "APPROVED" : "REJECTED"
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "ProcessApproval API failed. ApproverId={ApproverId}, ApprovalId={ApprovalId}, Message={Message}",
                    approverId, request.ApprovalId, result.Message
                );
                return BadRequest(result);
            }
        }

        #endregion

        #region Approval History and Details

        /// <summary>
        /// Gets complete approval history for the logged-in user as requester or approver.
        /// Supports filtering by role, type, status, and search term with pagination.
        /// </summary>
        [HttpGet("api/lnd-approvals/history")]
        public async Task<IActionResult> GetApprovalHistory([FromQuery] ApprovalHistoryRequestModel request)
        {
            var employeeId = GetCurrentEmployeeId();

            Log.Information(
                "GetApprovalHistory API called. EmployeeId={EmployeeId}, Role={Role}, ApprovalType={ApprovalType}, Status={Status}",
                employeeId, request.Role ?? "all", request.ApprovalType ?? "all", request.Status ?? "all"
            );

            var result = await _approvalService.GetApprovalHistory(employeeId, request);

            if (result.Success)
            {
                Log.Information(
                    "GetApprovalHistory API succeeded. EmployeeId={EmployeeId}, TotalCount={TotalCount}",
                    employeeId, result.Data?.TotalCount ?? 0
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "GetApprovalHistory API failed. EmployeeId={EmployeeId}, Message={Message}",
                    employeeId, result.Message
                );
                return BadRequest(result);
            }
        }

        /// <summary>
        /// Gets detailed approval information including all attachments and assignment details.
        /// Enforces access control for requester and approver only.
        /// </summary>
        [HttpGet("api/approvals/{approvalId}/details")]
        public async Task<IActionResult> GetApprovalDetails(int approvalId)
        {
            var employeeId = GetCurrentEmployeeId();

            Log.Debug(
                "GetApprovalDetails API called. ApprovalId={ApprovalId}, EmployeeId={EmployeeId}",
                approvalId, employeeId
            );

            var result = await _approvalService.GetApprovalDetails(employeeId, approvalId);

            if (result.Success)
            {
                Log.Debug("GetApprovalDetails API succeeded. ApprovalId={ApprovalId}", approvalId);
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "GetApprovalDetails API failed. ApprovalId={ApprovalId}, Message={Message}",
                    approvalId, result.Message
                );
                return BadRequest(result);
            }
        }

        #endregion

        #region File Downloads

        /// <summary>
        /// Downloads attachment file from approval record.
        /// Returns file with appropriate MIME type and content disposition header.
        /// </summary>
        [HttpGet("api/lnd-approvals/{approvalId}/download")]
        public async Task<IActionResult> GetApprovalAttachmentDownload(int approvalId)
        {
            var employeeId = GetCurrentEmployeeId();

            Log.Information(
                "DownloadApprovalAttachment API called. ApprovalId={ApprovalId}, EmployeeId={EmployeeId}",
                approvalId, employeeId
            );

            var result = await _approvalService.GetApprovalAttachment(employeeId, approvalId);

            if (!result.Success)
            {
                Log.Warning(
                    "DownloadApprovalAttachment API failed. ApprovalId={ApprovalId}, Message={Message}",
                    approvalId, result.Message
                );
                return BadRequest(result);
            }

            var fileBytes = result.Data.FileBytes;
            var fileName = result.Data.FileName;
            var contentType = result.Data.ContentType;

            Log.Information(
                "DownloadApprovalAttachment API succeeded. ApprovalId={ApprovalId}, FileName={FileName}, FileSize={FileSize} bytes",
                approvalId, fileName, fileBytes.Length
            );

            return File(fileBytes, contentType, fileName);
        }                       

        /// <summary>
        /// Downloads assignment completion proof document.
        /// Validates access for mentee, SME, or reporting manager only.
        /// </summary>
        [HttpGet("api/lnd-approvals/assignments/{assignmentId}/download-proof")]
        public async Task<IActionResult> GetAssignmentProofDownload(int assignmentId)
        {
            var employeeId = GetCurrentEmployeeId();

            Log.Information(
                "DownloadAssignmentProof API called. AssignmentId={AssignmentId}, EmployeeId={EmployeeId}",
                assignmentId, employeeId
            );

            var result = await _approvalService.GetAssignmentProof(employeeId, assignmentId);

            if (!result.Success)
            {
                Log.Warning(
                    "DownloadAssignmentProof API failed. AssignmentId={AssignmentId}, Message={Message}",
                    assignmentId, result.Message
                );
                return BadRequest(result);
            }

            var fileBytes = result.Data.FileBytes;
            var fileName = result.Data.FileName;
            var contentType = result.Data.ContentType;

            Log.Information(
                "DownloadAssignmentProof API succeeded. AssignmentId={AssignmentId}, FileName={FileName}, FileSize={FileSize} bytes",
                assignmentId, fileName, fileBytes.Length
            );

            return File(fileBytes, contentType, fileName); 
        }

        #endregion

        #region File Previews

        /// <summary>
        /// Previews approval attachment in browser without download.
        /// Supports range processing for video and large file streaming.
        /// </summary>
        [HttpGet("api/approvals/{approvalId}/preview-attachment")]
        public async Task<IActionResult> GetApprovalAttachmentPreview(int approvalId)
        {
            var employeeId = GetCurrentEmployeeId();

            Log.Debug(
                "GetApprovalAttachmentPreview API called. ApprovalId={ApprovalId}, EmployeeId={EmployeeId}",
                approvalId, employeeId
            );

            var result = await _approvalService.GetApprovalAttachmentPreview(employeeId, approvalId);

            if (!result.Success)
            {
                Log.Warning(
                    "GetApprovalAttachmentPreview API failed. ApprovalId={ApprovalId}, Message={Message}",
                    approvalId, result.Message
                );
                return BadRequest(result);
            }

            Log.Debug(
                "GetApprovalAttachmentPreview API succeeded. ApprovalId={ApprovalId}, FileName={FileName}",
                approvalId, result.Data.FileName
            );

            return File(
                result.Data.FileBytes,
                result.Data.ContentType,
                result.Data.FileName,
                enableRangeProcessing: true
            );
        }

        /// <summary>
        /// Previews assignment proof document in browser without download.
        /// Supports range processing for video and large file streaming.
        /// </summary>
        [HttpGet("api/lnd-approvals/assignments/{assignmentId}/proof/preview")]
        public async Task<IActionResult> GetAssignmentProofPreview(int assignmentId)
        {
            var employeeId = GetCurrentEmployeeId();

            Log.Debug(
                "GetAssignmentProofPreview API called. AssignmentId={AssignmentId}, EmployeeId={EmployeeId}",
                assignmentId, employeeId
            );

            var result = await _approvalService.GetAssignmentProofPreview(employeeId, assignmentId);

            if (!result.Success)
            {
                Log.Warning(
                    "GetAssignmentProofPreview API failed. AssignmentId={AssignmentId}, Message={Message}",
                    assignmentId, result.Message
                );
                return BadRequest(result);
            }

            Log.Debug(
                "GetAssignmentProofPreview API succeeded. AssignmentId={AssignmentId}, FileName={FileName}",
                assignmentId, result.Data.FileName
            );

            return File(
                result.Data.FileBytes,
                result.Data.ContentType,
                result.Data.FileName,
                enableRangeProcessing: true
            );
        }

        #endregion
    }
}
