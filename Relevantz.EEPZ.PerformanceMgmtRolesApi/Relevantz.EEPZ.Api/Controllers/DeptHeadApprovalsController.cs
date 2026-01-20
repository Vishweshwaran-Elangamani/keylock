using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace PerformanceManagement.Controllers
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

        [HttpPost("approve-employee")]
        public async Task<IActionResult> ApproveDeptHeadEmployee(
            [FromBody] ApprovalRequestDto request
        )
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, message = "Invalid data provided." });

            try
            {
                var deptHeadUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (
                    string.IsNullOrEmpty(deptHeadUserIdClaim)
                    || !int.TryParse(deptHeadUserIdClaim, out int deptHeadUserId)
                )
                {
                    return Unauthorized(new { success = false, message = "Invalid token" });
                }

                var result = await _deptHeadService.ApproveDeptHeadEmployeeAsync(
                    request,
                    deptHeadUserId
                );

                if (result.Success)
                {
                    return Ok(
                        new
                        {
                            success = true,
                            message = "Employee approved successfully",
                            approvalId = result.Data,
                        }
                    );
                }

                return BadRequest(
                    new { success = false, message = string.Join(", ", result.Errors) }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in ApproveDeptHeadEmployee: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("submitted-ratings")]
        public async Task<IActionResult> GetDeptHeadSubmittedRatings(
            [FromQuery] int? departmentHeadId
        )
        {
            try
            {
                int? deptHeadEmployeeId = departmentHeadId;

                if (!deptHeadEmployeeId.HasValue)
                {
                    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    if (
                        !string.IsNullOrEmpty(userIdClaim)
                        && int.TryParse(userIdClaim, out int userId)
                    )
                    {
                        deptHeadEmployeeId = await _deptHeadService.GetEmployeeIdFromUserIdAsync(
                            userId
                        );
                    }
                }

                var result = await _deptHeadService.GetDeptHeadSubmittedRatingsAsync(
                    deptHeadEmployeeId
                );

                if (result.Success)
                    return Ok(new { success = true, data = result.Data });

                return StatusCode(
                    500,
                    new { success = false, message = string.Join(", ", result.Errors) }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in GetDeptHeadSubmittedRatings: {ex.Message}");
                return StatusCode(
                    500,
                    new
                    {
                        success = false,
                        message = "Failed to fetch submitted ratings",
                        error = ex.Message,
                    }
                );
            }
        }

        [HttpGet("approved-employees")]
        public async Task<IActionResult> GetManagerApprovedEmployees(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 5,
            [FromQuery] int? departmentHeadId = null
        )
        {
            try
            {
                int? deptHeadEmployeeId = departmentHeadId;

                if (!deptHeadEmployeeId.HasValue)
                {
                    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    if (
                        !string.IsNullOrEmpty(userIdClaim)
                        && int.TryParse(userIdClaim, out int userId)
                    )
                    {
                        deptHeadEmployeeId = await _deptHeadService.GetEmployeeIdFromUserIdAsync(
                            userId
                        );
                    }
                }

                var (success, data, totalRecords, totalPages, errors) =
                    await _deptHeadService.GetManagerApprovedEmployeesAsync(
                        page,
                        pageSize,
                        deptHeadEmployeeId
                    );

                if (success)
                {
                    return Ok(
                        new
                        {
                            success = true,
                            data = data,
                            totalRecords = totalRecords,
                            currentPage = page,
                            totalPages = totalPages,
                        }
                    );
                }

                return StatusCode(
                    500,
                    new { success = false, message = string.Join(", ", errors) }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError($"Fatal error in GetManagerApprovedEmployees: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("employee/pending-acknowledgments")]
        public async Task<IActionResult> GetPendingAcknowledgments()
        {
            try
            {
                var employeeIdClaim =
                    User.FindFirst("empMasterId")?.Value
                    ?? User.FindFirst("EmployeeId")?.Value
                    ?? User.FindFirst("employeeId")?.Value;

                var userIdClaim =
                    User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst("userId")?.Value
                    ?? User.FindFirst("sub")?.Value;

                int.TryParse(employeeIdClaim, out int employeeId);
                int.TryParse(userIdClaim, out int userId);

                if (employeeId == 0 && userId == 0)
                {
                    return Unauthorized(
                        new { success = false, message = "Could not identify employee in token" }
                    );
                }

                var result = await _deptHeadService.GetPendingAcknowledgmentsAsync(
                    employeeId,
                    userId
                );

                if (result.Success)
                    return Ok(new { success = true, data = result.Data });

                return StatusCode(
                    500,
                    new { success = false, message = string.Join(", ", result.Errors) }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in GetPendingAcknowledgments: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("employee/acknowledge")]
        public async Task<IActionResult> AcknowledgeRating([FromBody] AcknowledgeRequestDto request)
        {
            try
            {
                var employeeIdClaim =
                    User.FindFirst("empMasterId")?.Value
                    ?? User.FindFirst("EmployeeId")?.Value
                    ?? User.FindFirst("employeeId")?.Value;

                var userIdClaim =
                    User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst("userId")?.Value
                    ?? User.FindFirst("sub")?.Value;

                int.TryParse(employeeIdClaim, out int employeeId);
                int.TryParse(userIdClaim, out int userId);

                var result = await _deptHeadService.AcknowledgeRatingAsync(
                    request,
                    employeeId,
                    userId
                );

                if (result.Success)
                {
                    return Ok(
                        new
                        {
                            success = true,
                            message = "Rating acknowledged successfully",
                            acknowledgedAt = result.Data,
                        }
                    );
                }

                if (result.Errors.Contains("NOT_FOUND"))
                {
                    return NotFound(
                        new { success = false, message = string.Join(", ", result.Errors) }
                    );
                }

                return BadRequest(
                    new { success = false, message = string.Join(", ", result.Errors) }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in AcknowledgeRating: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("manager/employee-acknowledged-comments")]
        public async Task<IActionResult> GetEmployeeAcknowledgedComments()
        {
            try
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

                return StatusCode(
                    500,
                    new { success = false, message = string.Join(", ", result.Errors) }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in GetEmployeeAcknowledgedComments: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{deptHeadEmployeeId}/assessment/{assessmentId}/attachments")]
        public async Task<IActionResult> GetDeptHeadAssessmentAttachments(
            int deptHeadEmployeeId,
            int assessmentId
        )
        {
            try
            {
                var result = await _deptHeadService.GetDeptHeadAssessmentAttachmentsAsync(
                    assessmentId
                );

                if (result.Success)
                    return Ok(new { success = true, data = result.Data });

                return StatusCode(
                    500,
                    new { success = false, message = string.Join(", ", result.Errors) }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching attachments: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{deptHeadEmployeeId}/attachments/{attachmentId}/download")]
        public async Task<IActionResult> DownloadDeptHeadAttachment(
            int deptHeadEmployeeId,
            int attachmentId
        )
        {
            try
            {
                var (success, fileBytes, contentType, fileName, errors) =
                    await _deptHeadService.DownloadDeptHeadAttachmentAsync(attachmentId);

                if (!success)
                {
                    if (
                        errors.Contains("ATTACHMENT_NOT_FOUND") || errors.Contains("FILE_NOT_FOUND")
                    )
                    {
                        return NotFound(
                            new { success = false, message = string.Join(", ", errors) }
                        );
                    }
                    return StatusCode(
                        500,
                        new { success = false, message = string.Join(", ", errors) }
                    );
                }

                return File(fileBytes, contentType, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error downloading attachment: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("approved-employees/{approvalId}/details")]
        public async Task<IActionResult> GetApprovedEmployeeDetails(int approvalId)
        {
            try
            {
                var result = await _deptHeadService.GetApprovedEmployeeDetailsAsync(approvalId);

                if (result.Success)
                    return Ok(new { success = true, data = result.Data });

                return NotFound(
                    new { success = false, message = string.Join(", ", result.Errors) }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in GetApprovedEmployeeDetails: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
