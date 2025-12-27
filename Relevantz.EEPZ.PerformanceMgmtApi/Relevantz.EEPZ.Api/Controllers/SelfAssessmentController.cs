using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Microsoft.Extensions.Logging;

namespace PerformanceManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SelfAssessmentController : ControllerBase
    {
        private readonly ISelfAssessmentService _assessmentService;
        private readonly ISelfAssessmentRepository _repository;
        private readonly IFileStorageService _fileStorage;
        private readonly ILogger<SelfAssessmentController> _logger;

        public SelfAssessmentController(
            ISelfAssessmentService assessmentService,
            ISelfAssessmentRepository repository,
            IFileStorageService fileStorage,
            ILogger<SelfAssessmentController> logger)
        {
            _assessmentService = assessmentService;
            _repository = repository;
            _fileStorage = fileStorage;
            _logger = logger;
        }

        [HttpPost("submit")]
        public async Task<IActionResult> SubmitSelfAssessment([FromBody] SubmitSelfAssessmentRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, message = "Invalid data provided." });

            try
            {
                var employeeId = request.UserId;
                var userAuth = await _repository.GetUserByEmployeeIdAsync(employeeId);

                if (userAuth == null)
                    return BadRequest(new { success = false, message = $"No user found for employee ID {employeeId}" });

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
                    return Ok(new { success = true, data = result.Data, message = "Assessment submitted successfully." });

                return BadRequest(new { success = false, message = string.Join(", ", result.Errors) });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting assessment");
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("view/{formId}/user/{employeeId}")]
        public async Task<IActionResult> GetSubmittedAssessment(int formId, int employeeId)
        {
            try
            {
                var userAuth = await _repository.GetUserByEmployeeIdAsync(employeeId);
                if (userAuth == null)
                    return NotFound(new { success = false, message = $"No user found for employee ID {employeeId}" });

                var userId = userAuth.UserId;
                var assessment = await _repository.GetSelfAssessmentByFormAndUserWithDetailsAsync(formId, userId);

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
                _logger.LogError(ex, "Error retrieving assessment");
                return StatusCode(500, new { success = false, message = $"Error retrieving assessment: {ex.Message}" });
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
                var userAuth = await _repository.GetUserByEmployeeIdAsync(employeeId);
                if (userAuth == null)
                    return NotFound(new { success = false, message = $"No user found for employee ID {employeeId}" });

                var userId = userAuth.UserId;
                var result = await _assessmentService.GetSelfAssessmentByFormAndUserAsync(formId, userId);

                if (result.Success)
                    return Ok(new { success = true, data = result.Data });

                return NotFound(new { success = false, message = string.Join(", ", result.Errors) });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting assessment");
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
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
                var userAuth = await _repository.GetUserByEmployeeIdAsync(employeeId);
                if (userAuth == null)
                    return NotFound(new { success = false, message = $"No user found for employee ID {employeeId}" });

                var userId = userAuth.UserId;
                var result = await _assessmentService.GetAssessmentsByUserAsync(userId);

                if (result.Success)
                    return Ok(new { success = true, data = result.Data });

                return NotFound(new { success = false, message = string.Join(", ", result.Errors) });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user assessments");
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
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
                _logger.LogError(ex, "Error getting attachments");
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
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
                _logger.LogError(ex, "Error deleting attachment");
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("attachments/{attachmentId}/download")]
public async Task<IActionResult> DownloadAttachment(int attachmentId)
{
    try
    {
        _logger.LogInformation("Download request for attachment {AttachmentId}", attachmentId);

        var attachment = await _repository.GetAttachmentByIdAsync(attachmentId);

        if (attachment == null)
        {
            _logger.LogWarning("Attachment {AttachmentId} not found in database", attachmentId);
            return NotFound(new { success = false, message = "Attachment not found." });
        }

        if (string.IsNullOrWhiteSpace(attachment.FilePath))
        {
            _logger.LogWarning("Attachment {AttachmentId} has no file path", attachmentId);
            return NotFound(new { success = false, message = "File path missing." });
        }

        _logger.LogInformation(
            "Fetching file from MongoDB: AttachmentId={AttachmentId}, FileId={FileId}, FileName={FileName}",
            attachmentId,
            attachment.FilePath,
            attachment.FileName);

        // Get file from MongoDB GridFS using stored ObjectId
        byte[] fileBytes;
        string contentType;
        string fileName;

        try
        {
            (fileBytes, contentType, fileName) = await _fileStorage.GetFileForPreviewAsync(attachment.FilePath);
        }
        catch (ArgumentException ex)
        {
            _logger.LogError(ex, "Invalid file ID format: {FileId}", attachment.FilePath);
            return BadRequest(new { success = false, message = "Invalid file ID format." });
        }
        catch (FileNotFoundException ex)
        {
            _logger.LogError(ex, "File not found in GridFS: {FileId}", attachment.FilePath);
            return NotFound(new { success = false, message = "File not found in storage." });
        }

        // Use original filename from database or from GridFS
        var downloadFileName = !string.IsNullOrEmpty(attachment.FileName)
            ? attachment.FileName
            : fileName;

        // Ensure content type is set correctly
        if (string.IsNullOrEmpty(contentType))
        {
            contentType = GetContentTypeFromFileName(downloadFileName);
        }

        _logger.LogInformation(
            "Sending file: FileName={FileName}, ContentType={ContentType}, Size={Size} bytes",
            downloadFileName,
            contentType,
            fileBytes.Length);

        // Return file with proper headers
        Response.Headers.Add("Content-Disposition", $"attachment; filename=\"{downloadFileName}\"");
        Response.Headers.Add("X-Content-Type-Options", "nosniff");
        
        return File(fileBytes, contentType, downloadFileName);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error downloading attachment {AttachmentId}", attachmentId);
        return StatusCode(500, new { success = false, message = $"Error downloading file: {ex.Message}" });
    }
}

// Helper method to determine content type from file extension
private string GetContentTypeFromFileName(string fileName)
{
    if (string.IsNullOrEmpty(fileName))
        return "application/octet-stream";

    var extension = System.IO.Path.GetExtension(fileName).ToLowerInvariant();

    return extension switch
    {
        ".pdf" => "application/pdf",
        ".csv" => "text/csv",
        ".txt" => "text/plain",
        ".doc" => "application/msword",
        ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".xls" => "application/vnd.ms-excel",
        ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".png" => "image/png",
        ".jpg" or ".jpeg" => "image/jpeg",
        ".gif" => "image/gif",
        _ => "application/octet-stream"
    };
}

    }

    public class UpdateStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }
}
