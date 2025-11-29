using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.Services.Interface;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LnDController : ControllerBase
    {
        private readonly ILnDService _lndService;

        public LnDController(ILnDService lndService)
        {
            _lndService = lndService;
        }

        private int GetCurrentEmployeeId()
        {
            // Check which claim name your JWT uses for employee ID
            var employeeIdClaim = User.FindFirst(LnDConstants.CLAIM_TYPES.EMPLOYEE_ID)?.Value;

            if (string.IsNullOrEmpty(employeeIdClaim))
            {
                throw new UnauthorizedAccessException("Employee ID not found in token");
            }

            return int.Parse(employeeIdClaim);
        }

        #region Employee Skills Management

        /// <summary>
        /// Get list of subordinate employees with pagination and search
        /// </summary>
        [HttpGet("employees/subordinates")]
        public async Task<IActionResult> GetSubordinateEmployees(
            [FromQuery] string? searchTerm,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 12
        )
        {
            var managerId = GetCurrentEmployeeId();
            var result = await _lndService.GetSubordinateEmployees(
                managerId,
                searchTerm,
                pageNumber,
                pageSize
            );

            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Get all available skills for dropdown
        /// </summary>
        [HttpGet("skills/all")]
        public async Task<IActionResult> GetAllSkills()
        {
            var result = await _lndService.GetAllSkills();

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("skills/subordinates")]
        public async Task<IActionResult> GetSubordinateSkills(
            [FromQuery] int? employeeId,
            [FromQuery] string? searchTerm,
            [FromQuery] string? sortBy = LnDConstants.DEFAULTS.SORT_BY_EMPLOYEE_NAME,
            [FromQuery] int pageNumber = 1
        )
        {
            var managerId = GetCurrentEmployeeId();
            var result = await _lndService.GetSubordinateSkills(
                managerId,
                employeeId,
                searchTerm,
                sortBy,
                pageNumber,
                1_000_000
            );

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("skills/record")]
        public async Task<IActionResult> RecordEmployeeSkill([FromBody] RecordSkillRequest request)
        {
            var managerId = GetCurrentEmployeeId();
            var result = await _lndService.RecordEmployeeSkill(managerId, request);

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("skills/record-bulk")]
        public async Task<IActionResult> BulkRecordEmployeeSkills(
            [FromBody] BulkRecordSkillRequest request
        )
        {
            var managerId = GetCurrentEmployeeId();
            var result = await _lndService.BulkRecordEmployeeSkills(managerId, request);

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut("skills/update-rating")]
        public async Task<IActionResult> UpdateEmployeeSkillRating(
            [FromBody] UpdateSkillRatingRequest request
        )
        {
            var managerId = GetCurrentEmployeeId();
            var result = await _lndService.UpdateEmployeeSkillRating(managerId, request);

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("skills/{mapperId}")]
        public async Task<IActionResult> DeleteEmployeeSkill(int mapperId)
        {
            var managerId = GetCurrentEmployeeId();
            var result = await _lndService.DeleteEmployeeSkill(managerId, mapperId);

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("skills/my-skills")]
        public async Task<IActionResult> GetMySkills(
            [FromQuery] string? searchTerm,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10
        )
        {
            var employeeId = GetCurrentEmployeeId();
            var result = await _lndService.GetMySkills(
                employeeId,
                searchTerm,
                pageNumber,
                pageSize
            );

            return result.Success ? Ok(result) : BadRequest(result);
        }

        #endregion

        #region SME Management

        [HttpGet("sme/check")]
        public async Task<IActionResult> CheckIfEmployeeIsSme()
        {
            var employeeId = GetCurrentEmployeeId();
            var result = await _lndService.CheckIfEmployeeIsSme(employeeId);

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("sme/apply")]
        public async Task<IActionResult> ApplyToBecomeSme([FromForm] BecomeSmeRequest request)
        {
            var employeeId = GetCurrentEmployeeId();
            var result = await _lndService.ApplyToBecomeSme(employeeId, request);

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("sme/available")]
        public async Task<IActionResult> GetAvailableSmes(
            [FromQuery] int skillId,
            [FromQuery] string? searchTerm,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10
        )
        {
            var result = await _lndService.GetAvailableSmes(
                skillId,
                searchTerm,
                pageNumber,
                pageSize
            );

            return result.Success ? Ok(result) : BadRequest(result);
        }

        #endregion

        #region HR Management

        [HttpGet("hr/assignments/organization/export")]
        [Authorize(Roles = LnDConstants.USER_ROLES.HR)]
        public async Task<IActionResult> ExportOrganizationAssignments(
            [FromQuery] string? statusFilter,
            [FromQuery] string? searchTerm,
            [FromQuery] string? sortField,
            [FromQuery] string? sortOrder
        )
        {
            var result = await _lndService.ExportOrganizationAssignmentsToExcel(
                statusFilter,
                searchTerm,
                sortField,
                sortOrder
            );

            if (!result.Success)
                return BadRequest(result);

            var fileName = $"OrganizationalAssignments_{DateTime.Now:yyyyMMddHHmmss}.xlsx";
            return File(result.Data,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName);
        }

        [HttpGet("hr/employees/organization")]
        [Authorize(Roles = LnDConstants.USER_ROLES.HR)]
        public async Task<IActionResult> GetAllOrganizationEmployees(
            [FromQuery] string? searchTerm,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 9
        )
        {
            var result = await _lndService.GetAllOrganizationEmployees(
                searchTerm,
                pageNumber,
                pageSize
            );

            return result.Success ? Ok(result) : BadRequest(result);
        }
        [HttpGet("hr/smes/export")]
        [Authorize(Roles = LnDConstants.USER_ROLES.HR)]
        public async Task<IActionResult> ExportAllActiveSmes(
    [FromQuery] string? searchTerm
)
        {
            var result = await _lndService.ExportAllActiveSmesToExcel(searchTerm);

            if (!result.Success)
                return BadRequest(result);

            var fileName = $"SMEDirectory_{DateTime.Now:yyyyMMddHHmmss}.xlsx";
            return File(result.Data,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName);
        }

        [HttpGet("hr/assignments/organization")]
        [Authorize(Roles = LnDConstants.USER_ROLES.HR)]
        public async Task<IActionResult> GetAllOrganizationAssignments(
            [FromQuery] string? statusFilter,
            [FromQuery] string? searchTerm,
            [FromQuery] string? sortField,
            [FromQuery] string? sortOrder,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10
        )
        {
            var result = await _lndService.GetAllOrganizationAssignments(
                statusFilter,
                searchTerm,
                sortField,
                sortOrder,
                pageNumber,
                pageSize
            );

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("hr/smes/all")]
        [Authorize(Roles = LnDConstants.USER_ROLES.HR)]
        public async Task<IActionResult> GetAllActiveSmes(
            [FromQuery] string? searchTerm,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10
        )
        {
            var result = await _lndService.GetAllActiveSmes(searchTerm, pageNumber, pageSize);

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("hr/skills/employee/{employeeId}")]
        [Authorize(Roles = LnDConstants.USER_ROLES.HR)]
        public async Task<IActionResult> GetEmployeeSkillsById(
            int employeeId,
            [FromQuery] int pageNumber = 1,
            [FromQuery] string? searchTerm = "",
            [FromQuery] string? sortBy = LnDConstants.DEFAULTS.SORT_BY_SKILL_NAME
        )
        {
            var result = await _lndService.GetEmployeeSkillsById(
                employeeId,
                pageNumber,
                searchTerm,
                sortBy
            );

            return result.Success ? Ok(result) : BadRequest(result);
        }

        #endregion


        #region Assignment Management

        /// <summary>
        /// Check and mark overdue assignments (can be called by scheduled job)
        /// </summary>
        [HttpPost("assignments/check-overdue")]
        [Authorize(Roles = LnDConstants.USER_ROLES.HR)]
        public async Task<IActionResult> CheckOverdueAssignments()
        {
            var result = await _lndService.CheckAndMarkOverdueAssignments();

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }


        [HttpPost("assignments/request-sme")]
        public async Task<IActionResult> RequestSmeAssignment([FromBody] SmeRequestDto request)
        {
            var managerId = GetCurrentEmployeeId();
            var result = await _lndService.RequestSmeAssignment(managerId, request);

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("assignments/my-assignments")]
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
        [HttpGet("assignments/team/export")]
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



        [HttpGet("assignments/team")]

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

        [HttpGet("assignments/sme")]
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

        [HttpPost("assignments/upload-proof")]
        public async Task<IActionResult> UploadCompletionProof(
            [FromForm] UploadCompletionProofRequest request
        )
        {
            var employeeId = GetCurrentEmployeeId();
            var result = await _lndService.UploadCompletionProof(employeeId, request);

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("assignments/complete")]
        public async Task<IActionResult> CompleteAssignment(
            [FromBody] CompleteAssignmentRequest request
        )
        {
            var managerId = GetCurrentEmployeeId();
            var result = await _lndService.CompleteAssignment(managerId, request);

            return result.Success ? Ok(result) : BadRequest(result);
        }

        #endregion

        #region Approvals Management

        [HttpGet("approvals/my-approvals")]
        public async Task<IActionResult> GetMyApprovals(
            [FromQuery] string? approvalType,
            [FromQuery] string? status,
            [FromQuery] string? sortField,
            [FromQuery] string? sortOrder,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10
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
                pageSize
            );

            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("approvals/process")]
        public async Task<IActionResult> ProcessApproval([FromBody] ApprovalDecisionRequest request)
        {
            var approverId = GetCurrentEmployeeId();
            var result = await _lndService.ProcessApproval(approverId, request);

            return result.Success ? Ok(result) : BadRequest(result);
        }

        #endregion

        #region Approval History & File Downloads

        /// <summary>
        /// Get complete approval history for the logged-in user (as requester or approver)
        /// </summary>
        [HttpGet("approvals/history")]
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
                pageSize // Pass to service
            );

            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Get detailed approval information including all attachments
        /// </summary>
        [HttpGet("approvals/{approvalId}/details")]
        public async Task<IActionResult> GetApprovalDetails(int approvalId)
        {
            var employeeId = GetCurrentEmployeeId();
            var result = await _lndService.GetApprovalDetails(employeeId, approvalId);

            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Download attachment file from approval history
        /// </summary>
        [HttpGet("approvals/{approvalId}/download")]
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

        [HttpGet("approvals/{approvalId}/attachment/preview")]
        public async Task<IActionResult> PreviewApprovalAttachment(int approvalId)
        {
            var employeeId = int.Parse(User.FindFirst("empId")?.Value ?? "0");
            var result = await _lndService.PreviewApprovalAttachment(employeeId, approvalId);

            if (!result.Success)
                return BadRequest(result);


            return File(result.Data.FileBytes, result.Data.ContentType, result.Data.FileName, enableRangeProcessing: true);
        }

        [HttpGet("assignments/{assignmentId}/proof/preview")]
        public async Task<IActionResult> PreviewAssignmentProof(int assignmentId)
        {
            var employeeId = int.Parse(User.FindFirst("empId")?.Value ?? "0");
            var result = await _lndService.PreviewAssignmentProof(employeeId, assignmentId);

            if (!result.Success)
                return BadRequest(result);


            return File(result.Data.FileBytes, result.Data.ContentType, result.Data.FileName, enableRangeProcessing: true);
        }

        #endregion
    }
}



