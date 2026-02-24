using FluentValidation;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Common.Constants;

namespace Relevantz.EEPZ.Common.Constants
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class DeptHeadApprovalsController : ControllerBase
    {
        private readonly IDeptHeadApprovalsService _deptHeadService;
        private readonly ILogger<DeptHeadApprovalsController> _logger;

        public DeptHeadApprovalsController(
            IDeptHeadApprovalsService deptHeadService,
            ILogger<DeptHeadApprovalsController> logger
        )
        {
            _deptHeadService = deptHeadService;
            _logger = logger;
        }

        /// <summary>
        /// Approve an employee rating by department head.
        /// Method renamed as per review suggestion. Route preserved for backward compatibility.
        /// </summary>
        [HttpPost("approve-employee")]
        public async Task<IActionResult> ApproveEmployeeByDepartmentHead([FromBody] ApprovalRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, message = ApiMessages.InvalidData });

            var deptHeadUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(deptHeadUserIdClaim) || !int.TryParse(deptHeadUserIdClaim, out int deptHeadUserId))
            {
                return Unauthorized(new { success = false, message = ApiMessages.InvalidToken });
            }

            var result = await _deptHeadService.ApproveDeptHeadEmployeeAsync(request, deptHeadUserId);

            if (result.Success)
            {
                return Ok(new
                {
                    success = true,
                    message = ApiMessages.EmployeeApprovedSuccess,
                    approvalId = result.Data
                });
            }

            return BadRequest(new
            {
                success = false,
                message = ApiMessages.OperationFailed,
                errors = result.Errors
            });
        }

        /// <summary>
        /// Get submitted ratings for Department Head (self or specific departmentHeadId).
        /// </summary>
        [HttpGet("submitted-ratings")]
        public async Task<IActionResult> GetDeptHeadSubmittedRatings([FromQuery] int? departmentHeadId)
        {
            int? deptHeadEmployeeId = departmentHeadId;

            if (!deptHeadEmployeeId.HasValue)
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int userId))
                {
                    deptHeadEmployeeId = await _deptHeadService.GetEmployeeIdFromUserIdAsync(userId);
                }
            }

            var result = await _deptHeadService.GetDeptHeadSubmittedRatingsAsync(deptHeadEmployeeId);

            if (result.Success)
                return Ok(new { success = true, data = result.Data });

            return StatusCode(500, new
            {
                success = false,
                message = ApiMessages.FailedToFetchSubmittedRatings,
                errors = result.Errors
            });
        }

        /// <summary>
        /// Get manager approved employees (paged).
        /// </summary>
        [HttpGet("approved-employees")]
        public async Task<IActionResult> GetManagerApprovedEmployees(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 5,
            [FromQuery] int? departmentHeadId = null)
        {
            int? deptHeadEmployeeId = departmentHeadId;

            if (!deptHeadEmployeeId.HasValue)
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int userId))
                {
                    deptHeadEmployeeId = await _deptHeadService.GetEmployeeIdFromUserIdAsync(userId);
                }
            }

            var (success, data, totalRecords, totalPages, errors) =
                await _deptHeadService.GetManagerApprovedEmployeesAsync(page, pageSize, deptHeadEmployeeId);

            if (success)
            {
                return Ok(new
                {
                    success = true,
                    data,
                    totalRecords,
                    currentPage = page,
                    totalPages
                });
            }

            return StatusCode(500, new
            {
                success = false,
                message = ApiMessages.GenericError,
                errors
            });
        }

        /// <summary>
        /// Get pending acknowledgments for the current employee.
        /// </summary>
        [HttpGet("employee/pending-acknowledgments")]
        public async Task<IActionResult> GetPendingAcknowledgments()
        {
            var employeeId = GetEmployeeIdFromClaims();
            var userId = GetUserIdFromClaims();

            if (employeeId == 0 && userId == 0)
            {
                return Unauthorized(new { success = false, message = ApiMessages.CouldNotIdentifyEmployee });
            }

            var result = await _deptHeadService.GetPendingAcknowledgmentsAsync(employeeId, userId);

            if (result.Success)
                return Ok(new { success = true, data = result.Data });

            return StatusCode(500, new
            {
                success = false,
                message = ApiMessages.GenericError,
                errors = result.Errors
            });
        }

        /// <summary>
        /// Acknowledge rating by employee.
        /// </summary>
        [HttpPost("employee/acknowledge")]
        public async Task<IActionResult> AcknowledgeRating([FromBody] AcknowledgeRequestDto request)
        {
            var employeeId = GetEmployeeIdFromClaims();
            var userId = GetUserIdFromClaims();

            var result = await _deptHeadService.AcknowledgeRatingAsync(request, employeeId, userId);

            if (result.Success)
            {
                return Ok(new
                {
                    success = true,
                    message = ApiMessages.RatingAcknowledgedSuccess,
                    acknowledgedAt = result.Data
                });
            }

            if (result.Errors?.Contains("NOT_FOUND") == true)
            {
                return NotFound(new
                {
                    success = false,
                    message = ApiMessages.NotFound,
                    errors = result.Errors
                });
            }

            return BadRequest(new
            {
                success = false,
                message = ApiMessages.OperationFailed,
                errors = result.Errors
            });
        }

        /// <summary>
        /// For manager: Get list of employee comments after acknowledgment.
        /// </summary>
        [HttpGet("manager/employee-acknowledged-comments")]
        public async Task<IActionResult> GetEmployeeAcknowledgedComments()
        {
            int managerId = 0;

            if (Request.Query.ContainsKey("managerId"))
            {
                int.TryParse(Request.Query["managerId"], out managerId);
            }

            if (managerId == 0)
            {
                var managerIdClaim =
                    User.FindFirst("empMasterId")?.Value
                    ?? User.FindFirst("EmployeeId")?.Value
                    ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                int.TryParse(managerIdClaim, out managerId);
            }

            var result = await _deptHeadService.GetEmployeeAcknowledgedCommentsAsync(managerId);

            if (result.Success)
                return Ok(new { success = true, data = result.Data });

            return StatusCode(500, new
            {
                success = false,
                message = ApiMessages.GenericError,
                errors = result.Errors
            });
        }

/// <summary>
/// Get attachments for a Dept Head assessment.
/// </summary>
[HttpGet("{deptHeadEmployeeId}/assessment/{assessmentId}/attachments")]
public async Task<IActionResult> GetDeptHeadAssessmentAttachments(int deptHeadEmployeeId, int assessmentId)
{
    
    var result = await _deptHeadService.GetDeptHeadAssessmentAttachmentsAsync(assessmentId);

    if (result.Success)
        return Ok(new { success = true, data = result.Data });

    return StatusCode(500, new
    {
        success = false,
        message = ApiMessages.AttachmentsFetchFailed,
        errors = result.Errors
    });
}


        /// <summary>
        /// Download specific attachment for Dept Head.
        /// </summary>
        [HttpGet("{deptHeadEmployeeId}/attachments/{attachmentId}/download")]
        public async Task<IActionResult> DownloadDeptHeadAttachment(int deptHeadEmployeeId, int attachmentId)
        {
            var (success, fileBytes, contentType, fileName, errors) =
                await _deptHeadService.DownloadDeptHeadAttachmentAsync(attachmentId);

            if (!success)
            {
                if (errors?.Contains("ATTACHMENT_NOT_FOUND") == true || errors?.Contains("FILE_NOT_FOUND") == true)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = ApiMessages.NotFound,
                        errors
                    });
                }

                return StatusCode(500, new
                {
                    success = false,
                    message = ApiMessages.GenericError,
                    errors
                });
            }

            return File(fileBytes, contentType, fileName);
        }

/// <summary>
/// Get details of an approved employee entry.
/// </summary>
[HttpGet("approved-employees/{approvalId}/details")]
public async Task<IActionResult> GetApprovedEmployeeDetails(int approvalId)
{
    // approvalId uniquely identifies the approval record and implicitly links to employee, project, and assessment.
    // Hence, no additional IDs are required here to fetch the complete details.
    var result = await _deptHeadService.GetApprovedEmployeeDetailsAsync(approvalId);

    if (result.Success)
        return Ok(new { success = true, data = result.Data });

    return NotFound(new
    {
        success = false,
        message = ApiMessages.NotFound,
        errors = result.Errors
    });
}

        #region Helpers

        private int GetUserIdFromClaims()
        {
            var userIdClaim =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("userId")?.Value
                ?? User.FindFirst("sub")?.Value;

            int.TryParse(userIdClaim, out int userId);
            return userId;
        }

        private int GetEmployeeIdFromClaims()
        {
            var employeeIdClaim =
                User.FindFirst("empMasterId")?.Value
                ?? User.FindFirst("EmployeeId")?.Value
                ?? User.FindFirst("employeeId")?.Value;

            int.TryParse(employeeIdClaim, out int employeeId);
            return employeeId;
        }

        #endregion
    }
}