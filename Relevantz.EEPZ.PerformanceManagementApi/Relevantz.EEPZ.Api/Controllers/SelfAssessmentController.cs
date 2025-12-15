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
        private readonly IConfiguration _configuration;

        public SelfAssessmentController(
            ISelfAssessmentService assessmentService, 
            EEPZDbContext context,
            IConfiguration configuration)
        {
            _assessmentService = assessmentService;
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("submit")]
        public async Task<IActionResult> SubmitSelfAssessment([FromBody] SubmitSelfAssessmentRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, message = "Invalid data provided." });

            try
            {
                var employeeId = request.UserId;

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

                var convertedRequest = new SubmitSelfAssessmentRequestDto
                {
                    FormId = request.FormId,
                    UserId = actualUserId,
                    Status = request.Status,
                    AssessmentDetails = request.AssessmentDetails,
                    Attachments = request.Attachments
                };

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

        [HttpGet("view/{formId}/user/{employeeId}")]
        public async Task<IActionResult> GetSubmittedAssessment(int formId, int employeeId)
        {
            try
            {
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

                var assessment = await _context.Selfassessments
                    .Include(sa => sa.Form)
                    .Include(sa => sa.Assessmentdetails)
                        .ThenInclude(ad => ad.Competency)
                    .Include(sa => sa.Selfassessmentattachments)
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

        [HttpGet("{assessmentId}")]
        public async Task<IActionResult> GetSelfAssessment(int assessmentId)
        {
            var result = await _assessmentService.GetSelfAssessmentAsync(assessmentId);

            if (result.Success)
                return Ok(new { success = true, data = result.Data });

            return NotFound(new { success = false, message = string.Join(", ", result.Errors) });
        }

        [HttpGet("form/{formId}/user/{employeeId}")]
        public async Task<IActionResult> GetSelfAssessmentByFormAndUser(int formId, int employeeId)
        {
            try
            {
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

        [HttpGet("submitted")]
        public async Task<IActionResult> GetAllSubmittedForms([FromQuery] string? status = null)
        {
            var result = await _assessmentService.GetAllSubmittedFormsAsync(status);

            if (result.Success)
                return Ok(new { success = true, data = result.Data });

            return BadRequest(new { success = false, message = string.Join(", ", result.Errors) });
        }

        [HttpGet("user/{employeeId}/assignments")]
        public async Task<IActionResult> GetAssessmentsByUser(int employeeId)
        {
            try
            {
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

        [HttpGet("attachments/{attachmentId}/download")]
        public async Task<IActionResult> DownloadAttachment(int attachmentId)
        {
            try
            {
                var attachment = await _context.Selfassessmentattachments
                    .FirstOrDefaultAsync(a => a.AttachmentId == attachmentId);

                if (attachment == null)
                    return NotFound(new { success = false, message = "Attachment not found." });

                if (string.IsNullOrWhiteSpace(attachment.FilePath))
                    return NotFound(new { success = false, message = "File path missing." });

                // Get base path from configuration
                var basePath = _configuration["FileStorage:BasePath"] ?? "D:\\Capstone\\Backend\\eepz\\SharedUploads";
                
                // Clean the file path from database
                var relativePath = attachment.FilePath
                    .Replace("uploads\\", "")
                    .Replace("uploads/", "")
                    .TrimStart('\\', '/');

                // Construct full path
                var filePath = Path.Combine(basePath, relativePath);

                Console.WriteLine($"Base Path: {basePath}");
                Console.WriteLine($"Database FilePath: {attachment.FilePath}");
                Console.WriteLine($"Cleaned Relative Path: {relativePath}");
                Console.WriteLine($"Full File Path: {filePath}");
                Console.WriteLine($"File Exists: {System.IO.File.Exists(filePath)}");

                if (!System.IO.File.Exists(filePath))
                    return NotFound(new { 
                        success = false, 
                        message = "File not found on server.",
                        attemptedPath = filePath
                    });

                var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
                var contentType = attachment.FileType ?? "application/octet-stream";

                return File(fileBytes, contentType, attachment.FileName);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Download Error: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = $"Error downloading file: {ex.Message}"
                });
            }
        }
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; }
    }
}
