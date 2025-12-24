using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.Services.Interface;
using ILogger = Microsoft.Extensions.Logging.ILogger;
using Relevantz.EEPZ.Core.IService;
namespace Relevantz.EEPZ.Api.Controllers.Goals
{
    [Route("api/goal-attachments")]  
    public class GoalAttachmentsController : BaseGoalController
    {
        protected readonly IGoalAttachmentService _service;
        protected readonly IBaseGoalService _baseService;

        public GoalAttachmentsController(
            IGoalAttachmentService service,
            IBaseGoalService baseService,
            ILogger<GoalAttachmentsController> logger
        )
            : base(baseService, logger)
        {
            _service = service;
            _baseService = baseService;
        }

        /// <summary>
        /// Upload a file attachment to a goal
        /// </summary>
        [HttpPost("{goalId:int}/upload")]
        public async Task<IActionResult> UploadFile(
            int goalId,
            IFormFile file,
            [FromForm] string title
        )
        {
            var userId = 0;
            try
            {
                userId = GetEmpMasterId();

                _logger.LogInformation(
                    "User {UserId} uploading file to goal {GoalId}: {FileName} ({FileSize} bytes)",
                    userId,
                    goalId,
                    file.FileName,
                    file.Length
                );

                var result = await _service.UploadFileAsync(goalId, file, title, userId);

                _logger.LogInformation(
                    "File uploaded successfully to goal {GoalId}. AttachmentId: {AttachmentId}",
                    goalId,
                    result.AttachmentId
                );

                var response = ApiResponseDto<FileUploadResponseDto>.SuccessResponse(
                    ResponseMessages.Codes.FILE_UPLOADED_SUCCESS,
                    result,
                    new { GoalId = goalId, UploadedBy = userId }
                );

                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                _logger.LogWarning("Goal {GoalId} not found during file upload", goalId);
                var response = ApiResponseDto<FileUploadResponseDto>.ErrorResponse(
                    ResponseMessages.Codes.GOAL_NOT_FOUND
                );
                return NotFound(response);
            }
            catch (UnauthorizedAccessException)
            {
                var response = ApiResponseDto<FileUploadResponseDto>.ErrorResponse(
                    ResponseMessages.Codes.FILE_ACCESS_DENIED
                );
                return Forbid(response.Message);
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("size"))
            {
                var response = ApiResponseDto<FileUploadResponseDto>.ErrorResponse(
                    ResponseMessages.Codes.FILE_SIZE_EXCEEDED,
                    ex.Message
                );
                return BadRequest(response);
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("type"))
            {
                var response = ApiResponseDto<FileUploadResponseDto>.ErrorResponse(
                    ResponseMessages.Codes.FILE_TYPE_INVALID,
                    ex.Message
                );
                return BadRequest(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error uploading file to goal {GoalId} by User {UserId}",
                    goalId,
                    userId
                );
                var response = ApiResponseDto<FileUploadResponseDto>.ErrorResponse(
                    ResponseMessages.Codes.FILE_UPLOAD_FAILED
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// List all attachments for a goal
        /// </summary>
        [HttpGet("{goalId:int}")]  
        public async Task<IActionResult> ListAttachments(int goalId)
        {
            try
            {
                var items = await _service.ListAttachmentsAsync(goalId);

                var response = ApiResponseDto<List<GoalAttachment>>.SuccessResponse(
                    ResponseMessages.Codes.FILE_DOWNLOADED_SUCCESS,
                    items,
                    new { GoalId = goalId, AttachmentCount = items.Count }
                );

                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                var response = ApiResponseDto<List<GoalAttachment>>.ErrorResponse(
                    ResponseMessages.Codes.GOAL_NOT_FOUND
                );
                return NotFound(response);
            }
            catch (Exception ex)
            {
                var response = ApiResponseDto<List<GoalAttachment>>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Download an attachment by ID (enhanced with security)
        /// </summary>
        [HttpGet("{attachmentId:int}/download")]
        public async Task<IActionResult> DownloadAttachment(int attachmentId)
        {
            try
            {
                var userId = GetEmpMasterId();

                var (fileBytes, contentType, fileName) = await _service.DownloadFileAsync(
                    attachmentId,
                    userId
                );

                // Set Content-Disposition header with proper filename
                Response.Headers.Add("Content-Disposition", $"attachment; filename=\"{fileName}\"");

                // Also set Access-Control-Expose-Headers to allow frontend to read Content-Disposition
                Response.Headers.Add("Access-Control-Expose-Headers", "Content-Disposition");

                return File(fileBytes, contentType, fileName);
            }
            catch (KeyNotFoundException)
            {
                var response = ApiResponseDto.ErrorResponse(ResponseMessages.Codes.FILE_NOT_FOUND);
                return NotFound(response);
            }
            catch (UnauthorizedAccessException)
            {
                var response = ApiResponseDto.ErrorResponse(
                    ResponseMessages.Codes.FILE_ACCESS_DENIED
                );
                return Forbid(response.Message);
            }
            catch (FileNotFoundException)
            {
                var response = ApiResponseDto.ErrorResponse(ResponseMessages.Codes.FILE_NOT_FOUND);
                return NotFound(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading attachment {AttachmentId}", attachmentId);
                var response = ApiResponseDto.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Preview attachment without downloading (inline display)
        /// </summary>
        [HttpGet("{attachmentId:int}/preview")]
        public async Task<IActionResult> PreviewAttachment(int attachmentId)
        {
            try
            {
                var userId = GetEmpMasterId();
                var result = await _service.PreviewFileAsync(attachmentId, userId);

                if (result == null)
                {
                    var response = ApiResponseDto<object>.ErrorResponse(
                        ResponseMessages.Codes.FILE_NOT_FOUND,
                        "Attachment not found or access denied"
                    );
                    return NotFound(response);
                }

                byte[] fileBytes = result.Value.fileBytes;
                string contentType = result.Value.contentType;
                string fileName = result.Value.fileName;

                // Set proper headers for inline preview
                Response.Headers["Content-Disposition"] = $"inline; filename=\"{fileName}\"";
                Response.Headers["Cache-Control"] = "public, max-age=3600";
                Response.Headers["Content-Length"] = fileBytes.Length.ToString();
                Response.Headers["Accept-Ranges"] = "bytes";

                return File(fileBytes, contentType, enableRangeProcessing: true);
            }
            catch (UnauthorizedAccessException)
            {
                var response = ApiResponseDto<object>.ErrorResponse(
                    ResponseMessages.Codes.FILE_ACCESS_DENIED
                );
                return Forbid(response.Message);
            }
            catch (FileNotFoundException)
            {
                var response = ApiResponseDto<object>.ErrorResponse(
                    ResponseMessages.Codes.FILE_NOT_FOUND
                );
                return NotFound(response);
            }
            catch (Exception)
            {
                var response = ApiResponseDto<object>.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }

        /// <summary>
        /// Delete an attachment
        /// </summary>
        [HttpDelete("{attachmentId:int}")]
        public async Task<IActionResult> DeleteAttachment(int attachmentId)
        {
            try
            {
                var userId = GetEmpMasterId();

                var success = await _service.DeleteAttachmentAsync(attachmentId, userId);

                if (success)
                {
                    var response = ApiResponseDto.SuccessResponse(
                        ResponseMessages.Codes.FILE_DELETED_SUCCESS,
                        new { AttachmentId = attachmentId, DeletedBy = userId }
                    );
                    return Ok(response);
                }
                else
                {
                    var response = ApiResponseDto.ErrorResponse(
                        ResponseMessages.Codes.FILE_UPLOAD_FAILED
                    );
                    return BadRequest(response);
                }
            }
            catch (KeyNotFoundException)
            {
                var response = ApiResponseDto.ErrorResponse(ResponseMessages.Codes.FILE_NOT_FOUND);
                return NotFound(response);
            }
            catch (UnauthorizedAccessException)
            {
                var response = ApiResponseDto.ErrorResponse(
                    ResponseMessages.Codes.FILE_ACCESS_DENIED
                );
                return Forbid(response.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting attachment {AttachmentId}", attachmentId);
                var response = ApiResponseDto.ErrorResponse(
                    ResponseMessages.Codes.INTERNAL_SERVER_ERROR
                );
                return StatusCode(500, response);
            }
        }
    }
}
