using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using System;
using System.Threading.Tasks;

namespace PerformanceManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SelfAssessmentController : ControllerBase
    {
        private readonly ISelfAssessmentService _assessmentService;
        private readonly EEPZDbContext _context;

        public SelfAssessmentController(ISelfAssessmentService assessmentService, EEPZDbContext context)
        {
            _assessmentService = assessmentService;
            _context = context;
        }

        /// <summary>
        /// Submit self-assessment with attachments (converts EmployeeId to UserId)
        /// </summary>
        [HttpPost("submit")]
        public async Task<IActionResult> SubmitSelfAssessment([FromBody] SubmitSelfAssessmentRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, message = "Invalid data provided." });

            try
            {
                // ✅ Frontend sends EmployeeId in the UserId field
                var employeeId = request.UserId;

                // Convert EmployeeId to actual UserId
                var userAuth = await _context.Userauthentications
                    .FirstOrDefaultAsync(ua => ua.EmployeeId == employeeId);

                if (userAuth == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = $"No user found for employee ID {employeeId}"
                    });
                }

                var actualUserId = userAuth.UserId;

                // ✅ Create new request with actual UserId for database
                var convertedRequest = new SubmitSelfAssessmentRequestDto
                {
                    FormId = request.FormId,
                    UserId = actualUserId,
                    Status = request.Status,
                    AssessmentDetails = request.AssessmentDetails,
                    Attachments = request.Attachments // ✅ Pass through attachments
                };

                // Call service with converted request
                var result = await _assessmentService.SubmitSelfAssessmentAsync(convertedRequest);

                if (result.Success)
                {
                    return Ok(new
                    {
                        success = true,
                        data = result.Data,
                        message = "Assessment submitted successfully."
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = string.Join(", ", result.Errors)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = $"Error: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// ✅ Get submitted assessment details with attachments (converts EmployeeId to UserId)
        /// </summary>
        [HttpGet("view/{formId}/user/{employeeId}")]
        public async Task<IActionResult> GetSubmittedAssessment(int formId, int employeeId)
        {
            try
            {
                // ✅ Convert EmployeeId to UserId
                var userAuth = await _context.Userauthentications
                    .FirstOrDefaultAsync(ua => ua.EmployeeId == employeeId);

                if (userAuth == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = $"No user found for employee ID {employeeId}"
                    });
                }

                var userId = userAuth.UserId;

                // ✅ Now query using UserId
                var assessment = await _context.Selfassessments
                    .Include(sa => sa.Form)
                    .Include(sa => sa.Assessmentdetails)
                        .ThenInclude(ad => ad.Competency)
                    .Include(sa => sa.Selfassessmentattachments) // ✅ Include attachments
                    .FirstOrDefaultAsync(sa =>
                        sa.FormId == formId &&
                        sa.EmployeeId == userId &&
                        sa.Status == "Submitted");

                if (assessment == null)
                    return NotFound(new { success = false, message = "No submitted assessment found." });

                var result = new
                {
                    assessmentId = assessment.AssessmentId,
                    formName = assessment.Form.Name,
                    status = assessment.Status,
                    submittedAt = assessment.SubmittedAt,
                    details = assessment.Assessmentdetails.Select(ad => new
                    {
                        competencyId = ad.CompetencyId,
                        competencyName = ad.Competency.Name,
                        competencyDescription = ad.Competency.Description,
                        rating = ad.EmployeeRating,
                        comments = ad.EmployeeComments
                    }).ToList(),
                    // ✅ Include attachments in response
                    attachments = assessment.Selfassessmentattachments
                        .OrderBy(a => a.DisplayOrder)
                        .Select(a => new
                        {
                            attachmentId = a.AttachmentId,
                            fileName = a.FileName,
                            filePath = a.FilePath,
                            fileType = a.FileType,
                            fileSize = a.FileSize,
                            note = a.AttachmentNote,
                            uploadedAt = a.UploadedAt
                        }).ToList()
                };

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = $"Error retrieving assessment: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Get self-assessment by ID
        /// </summary>
        [HttpGet("{assessmentId}")]
        public async Task<IActionResult> GetSelfAssessment(int assessmentId)
        {
            var result = await _assessmentService.GetSelfAssessmentAsync(assessmentId);

            if (result.Success)
                return Ok(new { success = true, data = result.Data });

            return NotFound(new { success = false, message = string.Join(", ", result.Errors) });
        }

        /// <summary>
        /// ✅ Get self-assessment by form and user (converts EmployeeId to UserId)
        /// </summary>
        [HttpGet("form/{formId}/user/{employeeId}")]
        public async Task<IActionResult> GetSelfAssessmentByFormAndUser(int formId, int employeeId)
        {
            try
            {
                // ✅ Convert EmployeeId to UserId
                var userAuth = await _context.Userauthentications
                    .FirstOrDefaultAsync(ua => ua.EmployeeId == employeeId);

                if (userAuth == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = $"No user found for employee ID {employeeId}"
                    });
                }

                var userId = userAuth.UserId;

                // ✅ Call service with UserId
                var result = await _assessmentService.GetSelfAssessmentByFormAndUserAsync(formId, userId);

                if (result.Success)
                    return Ok(new { success = true, data = result.Data });

                return NotFound(new { success = false, message = string.Join(", ", result.Errors) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = $"Error: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// HR views forms submitted by employees
        /// </summary>
        [HttpGet("submitted")]
        public async Task<IActionResult> GetAllSubmittedForms([FromQuery] string? status = null)
        {
            var result = await _assessmentService.GetAllSubmittedFormsAsync(status);

            if (result.Success)
                return Ok(new { success = true, data = result.Data });

            return BadRequest(new { success = false, message = string.Join(", ", result.Errors) });
        }

        /// <summary>
        /// ✅ Get all assessments assigned to a specific user (converts EmployeeId to UserId)
        /// </summary>
        [HttpGet("user/{employeeId}/assignments")]
        public async Task<IActionResult> GetAssessmentsByUser(int employeeId)
        {
            try
            {
                // ✅ Convert EmployeeId to UserId
                var userAuth = await _context.Userauthentications
                    .FirstOrDefaultAsync(ua => ua.EmployeeId == employeeId);

                if (userAuth == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = $"No user found for employee ID {employeeId}"
                    });
                }

                var userId = userAuth.UserId;

                // ✅ Call service with UserId
                var result = await _assessmentService.GetAssessmentsByUserAsync(userId);

                if (result.Success)
                    return Ok(new { success = true, data = result.Data });

                return NotFound(new { success = false, message = string.Join(", ", result.Errors) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = $"Error: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Update assessment status
        /// </summary>
        [HttpPatch("{assessmentId}/status")]
        public async Task<IActionResult> UpdateAssessmentStatus(int assessmentId, [FromBody] UpdateStatusDto statusDto)
        {
            if (string.IsNullOrEmpty(statusDto?.Status))
                return BadRequest(new { success = false, message = "Status is required." });

            var result = await _assessmentService.UpdateAssessmentStatusAsync(assessmentId, statusDto.Status);

            if (result.Success)
                return Ok(new { success = true, data = result.Data, message = "Status updated successfully." });

            return BadRequest(new { success = false, message = string.Join(", ", result.Errors) });
        }

        // ✅ NEW: Get attachments for an assessment
        [HttpGet("{assessmentId}/attachments")]
        public async Task<IActionResult> GetAssessmentAttachments(int assessmentId)
        {
            try
            {
                var result = await _assessmentService.GetAssessmentAttachmentsAsync(assessmentId);

                if (result.Success)
                    return Ok(new { success = true, data = result.Data });

                return NotFound(new { success = false, message = string.Join(", ", result.Errors) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = $"Error: {ex.Message}"
                });
            }
        }

        // ✅ NEW: Delete specific attachment
        [HttpDelete("attachments/{attachmentId}")]
        public async Task<IActionResult> DeleteAttachment(int attachmentId)
        {
            try
            {
                var result = await _assessmentService.DeleteAttachmentAsync(attachmentId);

                if (result.Success)
                    return Ok(new { success = true, message = "Attachment deleted successfully." });

                return NotFound(new { success = false, message = string.Join(", ", result.Errors) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = $"Error: {ex.Message}"
                });
            }
        }

        // ✅ NEW: Download attachment file
        [HttpGet("attachments/{attachmentId}/download")]
        public async Task<IActionResult> DownloadAttachment(int attachmentId)
        {
            try
            {
                var attachment = await _context.Selfassessmentattachments
                    .FirstOrDefaultAsync(a => a.AttachmentId == attachmentId);

                if (attachment == null)
                    return NotFound(new { success = false, message = "Attachment not found." });

                var filePath = System.IO.Path.Combine(
                    System.IO.Directory.GetCurrentDirectory(), 
                    attachment.FilePath
                );

                if (!System.IO.File.Exists(filePath))
                    return NotFound(new { success = false, message = "File not found on server." });

                var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
                var contentType = attachment.FileType ?? "application/octet-stream";

                return File(fileBytes, contentType, attachment.FileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = $"Error downloading file: {ex.Message}"
                });
            }
        }
    }

    /// <summary>
    /// Helper DTO for PATCH endpoint
    /// </summary>
    public class UpdateStatusDto
    {
        public string Status { get; set; }
    }
}
