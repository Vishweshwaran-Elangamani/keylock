using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Core.Services.Interfaces;
using System.IO;

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
            ILogger<AssessmentDetailsController> logger)
        {
            _assessmentDetailsService = assessmentDetailsService;
            _fileStorage = fileStorage;
            _logger = logger;
        }


        private IActionResult ErrorResponse(string message, int statusCode = 400)
        {
            var response = new { success = false, message };
            return StatusCode(statusCode, response);
        }

        [HttpGet("all-details")]
        public async Task<IActionResult> GetAllDetails()
        {
            var result = await _assessmentDetailsService.GetAllDetailsAsync();
            return Ok(new { success = true, data = result });
        }

        [HttpGet("hrattachments/{attachmentId}/download")]
        public async Task<IActionResult> DownloadHrAttachment(int attachmentId)
        {
            if (attachmentId <= 0)
                return ErrorResponse("Invalid attachmentId", StatusCodes.Status400BadRequest);

            _logger.LogInformation("HR download request for attachment {AttachmentId}", attachmentId);

            var result = await _assessmentDetailsService.GetHrAttachmentAsync(attachmentId);

            if (!result.Success)
            {
                _logger.LogWarning("Failed to get HR attachment {AttachmentId}: {Error}",
                    attachmentId, result.ErrorMessage);

                return ErrorResponse(result.ErrorMessage ?? "Attachment not found", StatusCodes.Status404NotFound);
            }

            if (result.FileBytes == null || result.FileBytes.Length == 0)
            {
                _logger.LogWarning("HR attachment {AttachmentId} has no file data", attachmentId);
                return ErrorResponse("File data is empty", StatusCodes.Status404NotFound);
            }

            var contentType = result.ContentType ?? "application/octet-stream";
            var safeFileName = string.IsNullOrWhiteSpace(result.FileName)
                ? "download"
                : Path.GetFileName(result.FileName);

            _logger.LogInformation("Sending HR file: FileName={FileName}, ContentType={ContentType}, Size={Size} bytes",
                safeFileName, contentType, result.FileBytes.Length);


            return File(result.FileBytes, contentType, safeFileName);
        }

        [HttpGet("test-file/{fileId}")]
        public async Task<IActionResult> TestFileExists(string fileId)
        {
            if (string.IsNullOrWhiteSpace(fileId))
                return ErrorResponse("Invalid fileId", StatusCodes.Status400BadRequest);

            _logger.LogInformation("Testing file existence: {FileId}", fileId);

            var exists = await _fileStorage.FileExistsAsync(fileId);

            if (!exists)
            {
                return ErrorResponse("File not found in GridFS", StatusCodes.Status404NotFound);
            }

            var metadata = await _fileStorage.GetFileMetadataAsync(fileId);

            return Ok(new
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
                }
            });
        }

        [HttpGet("hrattachments/{attachmentId}/info")]
        public async Task<IActionResult> GetAttachmentInfo(int attachmentId)
        {
            if (attachmentId <= 0)
                return ErrorResponse("Invalid attachmentId", StatusCodes.Status400BadRequest);

            var result = await _assessmentDetailsService.GetHrAttachmentAsync(attachmentId);

            if (!result.Success)
            {
                return ErrorResponse(result.ErrorMessage ?? "Attachment not found", StatusCodes.Status404NotFound);
            }

            return Ok(new
            {
                success = true,
                attachmentId,
                fileName = result.FileName,
                contentType = result.ContentType,
                fileSize = result.FileBytes?.Length ?? 0
            });
        }
    }
}
