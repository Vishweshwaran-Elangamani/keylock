using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace PerformanceManagement.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class AssessmentDetailsController : ControllerBase
    {
        private readonly IAssessmentDetailsService _assessmentDetailsService;
        private readonly IFileStorageService _fileStorage;
        private readonly ILogger<AssessmentDetailsController> _logger;

        public AssessmentDetailsController(
            IAssessmentDetailsService assessmentDetailsService,
            IFileStorageService fileStorage,
            ILogger<AssessmentDetailsController> logger
        )
        {
            _assessmentDetailsService = assessmentDetailsService;
            _fileStorage = fileStorage;
            _logger = logger;
        }

        [HttpGet("all-details")]
        public async Task<IActionResult> GetAllDetails()
        {
            try
            {
                var result = await _assessmentDetailsService.GetAllDetailsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching all assessment details");
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("hrattachments/{attachmentId}/download")]
        public async Task<IActionResult> DownloadHrAttachment(int attachmentId)
        {
            try
            {
                _logger.LogInformation(
                    "HR download request for attachment {AttachmentId}",
                    attachmentId
                );

                var result = await _assessmentDetailsService.GetHrAttachmentAsync(attachmentId);

                if (!result.Success)
                {
                    _logger.LogWarning(
                        "Failed to get HR attachment {AttachmentId}: {Error}",
                        attachmentId,
                        result.ErrorMessage
                    );
                    return NotFound(
                        new
                        {
                            success = false,
                            message = result.ErrorMessage ?? "Attachment not found",
                        }
                    );
                }

                if (result.FileBytes == null || result.FileBytes.Length == 0)
                {
                    _logger.LogWarning(
                        "HR attachment {AttachmentId} has no file data",
                        attachmentId
                    );
                    return NotFound(new { success = false, message = "File data is empty" });
                }

                var contentType = result.ContentType ?? "application/octet-stream";
                var fileName = result.FileName ?? "download";

                _logger.LogInformation(
                    "Sending HR file: FileName={FileName}, ContentType={ContentType}, Size={Size} bytes",
                    fileName,
                    contentType,
                    result.FileBytes.Length
                );

                Response.Headers.Add("Content-Disposition", $"attachment; filename=\"{fileName}\"");
                Response.Headers.Add("X-Content-Type-Options", "nosniff");

                return File(result.FileBytes, contentType, fileName);
            }
            catch (FileNotFoundException ex)
            {
                _logger.LogError(
                    ex,
                    "File not found for HR attachment {AttachmentId}",
                    attachmentId
                );
                return NotFound(new { success = false, message = "File not found in storage" });
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error downloading HR attachment {AttachmentId}",
                    attachmentId
                );
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("test-file/{fileId}")]
        public async Task<IActionResult> TestFileExists(string fileId)
        {
            try
            {
                _logger.LogInformation("Testing file existence: {FileId}", fileId);

                var exists = await _fileStorage.FileExistsAsync(fileId);

                if (!exists)
                {
                    return NotFound(
                        new
                        {
                            success = false,
                            message = "File not found in GridFS",
                            fileId = fileId,
                        }
                    );
                }

                var metadata = await _fileStorage.GetFileMetadataAsync(fileId);

                return Ok(
                    new
                    {
                        success = true,
                        fileExists = true,
                        metadata = new
                        {
                            fileId = metadata?.FileId,
                            fileName = metadata?.FileName,
                            fileSize = metadata?.FileSize,
                            contentType = metadata?.ContentType,
                            uploadDate = metadata?.UploadDate,
                            subFolder = metadata?.SubFolder,
                        },
                    }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing file {FileId}", fileId);
                return StatusCode(
                    500,
                    new
                    {
                        success = false,
                        message = ex.Message,
                        fileId = fileId,
                    }
                );
            }
        }

        [HttpGet("hrattachments/{attachmentId}/info")]
        public async Task<IActionResult> GetAttachmentInfo(int attachmentId)
        {
            try
            {
                var result = await _assessmentDetailsService.GetHrAttachmentAsync(attachmentId);

                if (!result.Success)
                {
                    return NotFound(new { success = false, message = result.ErrorMessage });
                }

                return Ok(
                    new
                    {
                        success = true,
                        attachmentId = attachmentId,
                        fileName = result.FileName,
                        contentType = result.ContentType,
                        fileSize = result.FileBytes?.Length ?? 0,
                    }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting attachment info {AttachmentId}", attachmentId);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
