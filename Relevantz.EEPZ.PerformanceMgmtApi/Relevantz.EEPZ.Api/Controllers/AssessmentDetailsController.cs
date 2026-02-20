using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Core.Services.Interfaces;
using System.IO;

namespace PerformanceManagement.Controllers
{
    /// <summary>
    /// Exposes endpoints to retrieve assessment details and to download/inspect HR attachments.
    /// Also includes a diagnostic endpoint to test storage metadata.
    /// </summary>
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

        /// <summary>
        /// Returns a consistent error envelope for this controller.
        /// </summary>
        private IActionResult ErrorResponse(string message, int statusCode = 400)
        {
            var response = new { success = false, message };
            return StatusCode(statusCode, response);
        }

        /// <summary>
        /// Gets all assessment details aggregated from the service layer.
        /// Always returns an envelope: <c>{ success: true, data: ... }</c>.
        /// </summary>
        /// <remarks>
        /// <b>200 OK</b>: Always, with an envelope (data may be empty).
        /// </remarks>
        [HttpGet("all-details")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllDetails()
        {
            // Keep controller thin: delegate to the service layer.
            var result = await _assessmentDetailsService.GetAllDetailsAsync();
            return Ok(new { success = true, data = result });
        }

        /// <summary>
        /// Downloads an HR attachment by its identifier.
        /// Validates the input, retrieves file bytes and metadata from the service,
        /// and returns a file response with a safe filename.
        /// </summary>
        /// <param name="attachmentId">Attachment primary key.</param>
        /// <remarks>
        /// <b>200 OK</b>: Returns the file with content type and filename.<br/>
        /// <b>400 Bad Request</b>: <paramref name="attachmentId"/> ≤ 0.<br/>
        /// <b>404 Not Found</b>: Attachment not found or file data is empty.
        /// </remarks>
        [HttpGet("hrattachments/{attachmentId}/download")]
        [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DownloadHrAttachment([FromRoute] int attachmentId)
        {
            if (attachmentId <= 0)
            {
                // Reject invalid IDs early to avoid unnecessary work in the service layer.
                return ErrorResponse("Invalid attachmentId", StatusCodes.Status400BadRequest);
            }

            _logger.LogInformation("HR download request for attachment {AttachmentId}", attachmentId);

            var result = await _assessmentDetailsService.GetHrAttachmentAsync(attachmentId);

            if (!result.Success)
            {
                _logger.LogWarning("Failed to get HR attachment {AttachmentId}: {Error}",
                    attachmentId, result.ErrorMessage);

                // Map service failure to 404; avoid leaking internal storage details.
                return ErrorResponse(result.ErrorMessage ?? "Attachment not found", StatusCodes.Status404NotFound);
            }

            if (result.FileBytes == null || result.FileBytes.Length == 0)
            {
                _logger.LogWarning("HR attachment {AttachmentId} has no file data", attachmentId);
                return ErrorResponse("File data is empty", StatusCodes.Status404NotFound);
            }

            // Fallback to a generic content type if unavailable.
            var contentType = result.ContentType ?? "application/octet-stream";

            // Ensure a safe filename (strip paths if any).
            var safeFileName = string.IsNullOrWhiteSpace(result.FileName)
                ? "download"
                : Path.GetFileName(result.FileName);

            _logger.LogInformation(
                "Sending HR file: FileName={FileName}, ContentType={ContentType}, Size={Size} bytes",
                safeFileName, contentType, result.FileBytes.Length);

            return File(result.FileBytes, contentType, safeFileName);
        }

        /// <summary>
        /// Checks whether a file exists in storage and returns basic metadata for diagnostics.
        /// </summary>
        /// <param name="fileId">The storage identifier (e.g., GridFS ObjectId).</param>
        /// <remarks>
        /// <b>200 OK</b>: File exists; returns metadata.<br/>
        /// <b>400 Bad Request</b>: <paramref name="fileId"/> is null/empty/whitespace.<br/>
        /// <b>404 Not Found</b>: File does not exist.
        /// </remarks>
        [HttpGet("test-file/{fileId}")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> TestFileExists(string fileId)
        {
            if (string.IsNullOrWhiteSpace(fileId))
            {
                return ErrorResponse("Invalid fileId", StatusCodes.Status400BadRequest);
            }

            _logger.LogInformation("Testing file existence: {FileId}", fileId);

            var exists = await _fileStorage.FileExistsAsync(fileId);
            if (!exists)
            {
                return ErrorResponse("File not found in storage", StatusCodes.Status404NotFound);
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

        /// <summary>
        /// Retrieves metadata for an HR attachment (name, content type, size) without file content.
        /// </summary>
        /// <param name="attachmentId">Attachment primary key.</param>
        /// <remarks>
        /// <b>200 OK</b>: Metadata returned.<br/>
        /// <b>400 Bad Request</b>: <paramref name="attachmentId"/> ≤ 0.<br/>
        /// <b>404 Not Found</b>: Attachment cannot be retrieved.
        /// </remarks>
        [HttpGet("hrattachments/{attachmentId}/info")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(object), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetAttachmentInfo([FromRoute] int attachmentId)
        {
            if (attachmentId <= 0)
            {
                return ErrorResponse("Invalid attachmentId", StatusCodes.Status400BadRequest);
            }

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