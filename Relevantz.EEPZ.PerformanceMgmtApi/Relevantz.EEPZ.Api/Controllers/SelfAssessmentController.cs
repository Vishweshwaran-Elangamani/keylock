using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace PerformanceManagement.Controllers
{
    [ApiController]
    [Authorize]
    [Produces("application/json")]
    [Route("api/[controller]")]
    public class SelfAssessmentController : ControllerBase
    {
        private readonly ISelfAssessmentService _assessmentService;
        private readonly ISelfAssessmentRepository _repository;
        private readonly IFileStorageService _fileStorage;
        private readonly ILogger<SelfAssessmentController> _logger;
        private static readonly FileExtensionContentTypeProvider _contentTypes = new();

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

        // --------------------------------------------------------------------

        [HttpPost("submit")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> SubmitSelfAssessment([FromBody] SubmitSelfAssessmentRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, message = "Invalid data provided." });

            try
            {
                var userAuth = await _repository.GetUserByEmployeeIdAsync(request.UserId);
                if (userAuth == null)
                    return NotFound(new { success = false, message = $"No user found for ID {request.UserId}" });

                // Use actual platform user id
                request.UserId = userAuth.UserId;

                var result = await _assessmentService.SubmitSelfAssessmentAsync(request);

                if (!result.Success)
                    return BadRequest(new { success = false, message = string.Join(", ", result.Errors) });

                return CreatedAtAction(
                    nameof(GetSelfAssessment),
                    new { assessmentId = result.Data.AssessmentId },
                    new { success = true, data = result.Data, message = "Assessment submitted successfully." }
                );
            }
            catch (Exception ex)
            {
                var trace = HttpContext.TraceIdentifier;
                _logger.LogError(ex, "Error submitting assessment. Trace={Trace}", trace);

                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    message = "An unexpected error occurred.",
                    trace
                });
            }
        }

        // --------------------------------------------------------------------

        [HttpGet("{assessmentId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetSelfAssessment(int assessmentId)
        {
            var result = await _assessmentService.GetSelfAssessmentAsync(assessmentId);

            if (!result.Success)
                return NotFound(new { success = false, message = string.Join(", ", result.Errors) });

            return Ok(new { success = true, data = result.Data });
        }

        // --------------------------------------------------------------------

        [HttpGet("attachments/{attachmentId}/download")]
        [Produces("application/octet-stream")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(FileContentResult))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DownloadAttachment(int attachmentId)
        {
            try
            {
                var attachment = await _repository.GetAttachmentByIdAsync(attachmentId);
                if (attachment == null)
                    return NotFound(new { success = false, message = "Attachment not found." });

                if (string.IsNullOrWhiteSpace(attachment.FilePath))
                    return NotFound(new { success = false, message = "File path missing." });

                byte[] bytes;
                string storedContentType;
                string storedFileName;

                try
                {
                    (bytes, storedContentType, storedFileName) =
                        await _fileStorage.GetFileForPreviewAsync(attachment.FilePath);
                }
                catch (ArgumentException)
                {
                    return BadRequest(new { success = false, message = "Invalid file ID format." });
                }
                catch (FileNotFoundException)
                {
                    return NotFound(new { success = false, message = "File not found in storage." });
                }

                var downloadName = attachment.FileName ?? storedFileName ?? "download";
                downloadName = downloadName.Replace("\r", "").Replace("\n", "").Trim();

                var contentType =
                    !string.IsNullOrEmpty(storedContentType)
                        ? storedContentType
                        : (_contentTypes.TryGetContentType(downloadName, out var mapped)
                            ? mapped
                            : "application/octet-stream");

                // IMPORTANT: Append returns void; don't chain
                Response.Headers.Append("X-Content-Type-Options", "nosniff");

                return File(bytes, contentType, downloadName);
            }
            catch (Exception ex)
            {
                var trace = HttpContext.TraceIdentifier;
                _logger.LogError(ex, "Error downloading attachment {AttachmentId}. Trace={Trace}", attachmentId, trace);

                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    message = "Error downloading file.",
                    trace
                });
            }
        }

        // --------------------------------------------------------------------

        [HttpDelete("attachments/{attachmentId}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteAttachment(int attachmentId)
        {
            var result = await _assessmentService.DeleteAttachmentAsync(attachmentId);

            if (!result.Success)
                return NotFound(new { success = false, message = string.Join(", ", result.Errors) });

            return NoContent();
        }
    }
}