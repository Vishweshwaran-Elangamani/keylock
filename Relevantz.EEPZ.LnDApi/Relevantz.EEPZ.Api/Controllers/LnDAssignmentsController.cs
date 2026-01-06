using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.Services.Interface;
using Serilog;

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
        #region Dependencies

        private readonly ILnDAssignmentService _assignmentService;

        public LnDAssignmentsController(ILnDAssignmentService assignmentService)
        {
            _assignmentService = assignmentService;
        }

        #endregion

        #region Assignment Operations

        /// <summary>Checks and marks overdue assignments (scheduled job endpoint for HR only).</summary>
        [HttpPost("check-overdue")]
        [Authorize(Roles = LnDConstants.USER_ROLES.HR)]
        public async Task<IActionResult> CheckOverdueAssignments()
        {
            Log.Information("CheckOverdueAssignments API called");

            var result = await _assignmentService.CheckAndMarkOverdueAssignments();

            if (!result.Success)                             
            {
                Log.Warning("CheckOverdueAssignments API failed. Message={Message}", result.Message);
                return BadRequest(result);
            }

            Log.Information("CheckOverdueAssignments API succeeded. OverdueCount={Count}", result.Data);
            return Ok(result);
        }

        /// <summary>Requests SME assignment for a team member (manager initiates request).</summary>
        [HttpPost("request-sme")]
        public async Task<IActionResult> RequestSmeAssignment([FromBody] SmeRequestDto request)
        {
            var managerId = GetCurrentEmployeeId();

            Log.Information(
                "RequestSmeAssignment API called. ManagerId={ManagerId}, MenteeId={MenteeId}, SkillId={SkillId}",
                managerId, request.MenteeEmployeeId, request.SkillId
            );

            var result = await _assignmentService.RequestSmeAssignment(managerId, request);

            if (result.Success)
            {
                Log.Information(
                    "RequestSmeAssignment API succeeded. ManagerId={ManagerId}, MenteeId={MenteeId}",
                    managerId, request.MenteeEmployeeId
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "RequestSmeAssignment API failed. ManagerId={ManagerId}, Message={Message}",
                    managerId, result.Message
                );
                return BadRequest(result);
            }
        }

        /// <summary>Uploads completion proof document for an assignment (mentee uploads proof).</summary>
        [HttpPost("upload-proof")]
        public async Task<IActionResult> UploadCompletionProof(
            [FromForm] UploadCompletionProofRequest request
        )
        {
            var employeeId = GetCurrentEmployeeId();

            Log.Information(
                "UploadCompletionProof API called. EmployeeId={EmployeeId}, AssignmentId={AssignmentId}",
                employeeId, request.AssignmentId
            );

            var result = await _assignmentService.UploadCompletionProof(employeeId, request);

            if (result.Success)
            {
                Log.Information(
                    "UploadCompletionProof API succeeded. EmployeeId={EmployeeId}, AssignmentId={AssignmentId}",
                    employeeId, request.AssignmentId
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "UploadCompletionProof API failed. EmployeeId={EmployeeId}, Message={Message}",
                    employeeId, result.Message
                );
                return BadRequest(result);
            }
        }

        /// <summary>Completes an assignment with rating and acknowledgment (manager approves completion).</summary>
        [HttpPost("complete")]
        public async Task<IActionResult> CompleteAssignment(
            [FromBody] CompleteAssignmentRequest request
        )
        {
            var managerId = GetCurrentEmployeeId();

            Log.Information(
                "CompleteAssignment API called. ManagerId={ManagerId}",
                managerId
            );

            var result = await _assignmentService.CompleteAssignment(managerId, request);

            if (result.Success)
            {
                Log.Information(
                    "CompleteAssignment API succeeded. ManagerId={ManagerId}, AssignmentId={AssignmentId}",
                    managerId, request.AssignmentId
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "CompleteAssignment API failed. ManagerId={ManagerId}, Message={Message}",
                    managerId, result.Message
                );
                return BadRequest(result);
            }
        }

        #endregion

        #region Assignment Retrieval

        /// <summary>Gets assignments for the logged-in employee as mentee with filtering and pagination.</summary>
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

            Log.Information(
                "GetMyAssignments API called. EmployeeId={EmployeeId}, StatusFilter={StatusFilter}, Page={PageNumber}",
                employeeId, statusFilter ?? "all", pageNumber
            );

            var result = await _assignmentService.GetMyAssignments(
                employeeId,
                statusFilter,
                searchTerm,
                sortField,
                sortOrder,
                pageNumber,
                pageSize
            );

            if (result.Success)
            {
                Log.Information(
                    "GetMyAssignments API succeeded. EmployeeId={EmployeeId}, TotalCount={TotalCount}",
                    employeeId, result.Data?.TotalCount ?? 0
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "GetMyAssignments API failed. EmployeeId={EmployeeId}, Message={Message}",
                    employeeId, result.Message
                );
                return BadRequest(result);
            }
        }

        /// <summary>Gets assignments for the manager's team members with filtering and pagination.</summary>
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

            Log.Information(
                "GetTeamAssignments API called. ManagerId={ManagerId}, StatusFilter={StatusFilter}, Page={PageNumber}",
                managerId, statusFilter ?? "all", pageNumber
            );

            var result = await _assignmentService.GetTeamAssignments(
                managerId,
                statusFilter,
                searchTerm,
                sortField,
                sortOrder,
                pageNumber,
                pageSize
            );

            if (result.Success)
            {
                Log.Information(
                    "GetTeamAssignments API succeeded. ManagerId={ManagerId}, TotalCount={TotalCount}",
                    managerId, result.Data?.TotalCount ?? 0
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "GetTeamAssignments API failed. ManagerId={ManagerId}, Message={Message}",
                    managerId, result.Message
                );
                return BadRequest(result);
            }
        }

        /// <summary>Gets assignments where the logged-in employee is the assigned SME with filtering and pagination.</summary>
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

            Log.Information(
                "GetSmeAssignments API called. SmeEmployeeId={SmeEmployeeId}, StatusFilter={StatusFilter}, Page={PageNumber}",
                smeEmployeeId, statusFilter ?? "all", pageNumber
            );

            var result = await _assignmentService.GetSmeAssignments(
                smeEmployeeId,
                statusFilter,
                searchTerm,
                sortField,
                sortOrder,
                pageNumber,
                pageSize
            );

            if (result.Success)
            {
                Log.Information(
                    "GetSmeAssignments API succeeded. SmeEmployeeId={SmeEmployeeId}, TotalCount={TotalCount}",
                    smeEmployeeId, result.Data?.TotalCount ?? 0
                );
                return Ok(result);
            }
            else
            {
                Log.Warning(
                    "GetSmeAssignments API failed. SmeEmployeeId={SmeEmployeeId}, Message={Message}",
                    smeEmployeeId, result.Message
                );
                return BadRequest(result);
            }
        }

        #endregion

        #region Export

        /// <summary>Exports team assignments to Excel file (manager only).</summary>
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

            Log.Information(
                "ExportTeamAssignments API called. ManagerId={ManagerId}, StatusFilter={StatusFilter}",
                managerId, statusFilter ?? "all"
            );

            var result = await _assignmentService.ExportTeamAssignmentsToExcel(
                managerId,
                statusFilter,
                searchTerm,
                sortField,
                sortOrder
            );

            if (!result.Success)
            {
                Log.Warning(
                    "ExportTeamAssignments API failed. ManagerId={ManagerId}, Message={Message}",
                    managerId, result.Message
                );
                return BadRequest(result);
            }

            var fileName = $"TeamAssignments_{DateTime.Now:yyyyMMddHHmmss}.xlsx";

            Log.Information(
                "ExportTeamAssignments API succeeded. ManagerId={ManagerId}, FileName={FileName}, FileSize={FileSize} bytes",
                managerId, fileName, result.Data.Length
            );

            return File(
                result.Data,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName
            );
        }

        #endregion
    }
}
