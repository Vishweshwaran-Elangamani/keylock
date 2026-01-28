using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Core.Services.Interface;
using ILogger = Microsoft.Extensions.Logging.ILogger;

namespace Relevantz.EEPZ.Api.Controllers.Goals
{
    /// <summary>
    /// Controller for managing goal attachments, including upload, listing, download, preview, and deletion.
    /// </summary>
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
        /// Uploads a file attachment for a specific goal.
        /// </summary>
        [HttpPost("api/goal-attachments/{goalId}/upload")]
        public async Task<IActionResult> UploadFile(
            int goalId,
            IFormFile file,
            [FromForm] string title
        )
        {
            var userId = GetEmpMasterId();

            var result = await _service.UploadFileAsync(goalId, file, title, userId);

            var response = ApiResponseModel<FileUploadResponseModel>.SuccessResponse(
                ResponseMessages.Codes.FILE_UPLOADED_SUCCESS,
                result,
                new { GoalId = goalId, UploadedBy = userId }
            );

            return Ok(response);
        } 

        /// <summary>
        /// Retrieves a list of all attachments for a specific goal.
        /// </summary>
        [HttpGet("api/goal-attachments/{goalId}")]
        public async Task<IActionResult> ListAttachments(int goalId)
        {
            var items = await _service.ListAttachmentsAsync(goalId);

            var response = ApiResponseModel<List<GoalAttachment>>.SuccessResponse(
                ResponseMessages.Codes.FILE_DOWNLOADED_SUCCESS,
                items,
                new { GoalId = goalId, AttachmentCount = items.Count }
            );

            return Ok(response);
        }

        /// <summary>
        /// Downloads a specific attachment by its ID.
        /// </summary>
        [HttpGet("api/goal-attachments/{attachmentId}/download")]
        public async Task<IActionResult> GetAttachmentFile(int attachmentId)
        {
            var userId = GetEmpMasterId();

            var (fileBytes, contentType, fileName) = await _service.GetAttachmentFileAsync(
                attachmentId,
                userId
            );

            Response.Headers.Add("Content-Disposition", $"attachment; filename=\"{fileName}\"");
            Response.Headers.Add("Access-Control-Expose-Headers", "Content-Disposition");

            return File(fileBytes, contentType, fileName);
        }

        /// <summary>
        /// Previews a specific attachment inline by its ID.
        /// </summary>
        [HttpGet("api/goal-attachments/{attachmentId}/preview")]
        public async Task<IActionResult> GetAttachmentFilePreview(int attachmentId)
        {
            var userId = GetEmpMasterId();

            var result = await _service.GetAttachmentFilePreviewAsync(attachmentId, userId);

            return File(result.FileBytes, result.ContentType, result.FileName, enableRangeProcessing: true);
        }


        /// <summary>
        /// Deletes a specific attachment by its ID.
        /// </summary>
        [HttpDelete("api/goal-attachments/{attachmentId}")]
        public async Task<IActionResult> DeleteAttachment(int attachmentId)
        {
            var userId = GetEmpMasterId();

            await _service.DeleteAttachmentAsync(attachmentId, userId);

            var response = ApiResponseModel.SuccessResponse(
                ResponseMessages.Codes.FILE_DELETED_SUCCESS,
                new { AttachmentId = attachmentId, DeletedBy = userId }
            );

            return Ok(response);
        }
    }
}
