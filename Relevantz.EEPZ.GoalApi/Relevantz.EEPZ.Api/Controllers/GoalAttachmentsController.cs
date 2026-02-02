using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Core.Services.Interface;
using Serilog;
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

            Log.Debug("GoalAttachmentsController initialized.");
        }

        /// <summary>
        /// Uploads a file attachment for a specific goal.
        /// </summary>
        [HttpPost("api/goals/{goalId}/upload")]
        public async Task<IActionResult> UploadFile(
            int goalId,
            IFormFile file,
            [FromForm] string title
        )
        {
            var userId = GetEmpMasterId();

            Log.Information(
                "UploadFile START | GoalId={GoalId} | UserId={UserId} | FileName={FileName} | Title={Title}",
                goalId,
                userId,
                file?.FileName,
                title
            );

            var result = await _service.UploadFile(goalId, file, title, userId);

            Log.Information(
                "UploadFile END | GoalId={GoalId} | UserId={UserId} | Success={Success}",
                goalId,
                userId,
                result != null
            );

            var response = ApiResponseModel<FileUploadResponseModel>.SuccessResponse(
                ResponseMessages.Codes.FILE_UPLOADED_SUCCESS,
                result,
                new { GoalId = goalId, UploadedBy = userId }
            );

            return Ok(response);
        }

        /// <summary>
        /// Downloads a specific attachment by its ID.
        /// </summary>
        [HttpGet("api/goals/{attachmentId}/download")]
        public async Task<IActionResult> GetAttachmentFile(int attachmentId)
        {
            var userId = GetEmpMasterId();

            Log.Information(
                "GetAttachmentFile START | AttachmentId={AttachmentId} | UserId={UserId}",
                attachmentId,
                userId
            );

            var (fileBytes, contentType, fileName) = await _service.GetAttachmentFile(
                attachmentId,
                userId
            );

            Log.Information(
                "GetAttachmentFile END | AttachmentId={AttachmentId} | UserId={UserId} | FileName={FileName} | FileSize={FileSize}",
                attachmentId,
                userId,
                fileName,
                fileBytes?.Length
            );

            Response.Headers.Add("Content-Disposition", $"attachment; filename=\"{fileName}\"");
            Response.Headers.Add("Access-Control-Expose-Headers", "Content-Disposition");

            return File(fileBytes, contentType, fileName);
        }

        /// <summary>
        /// Previews a specific attachment inline by its ID.
        /// </summary>
        [HttpGet("api/goals/{attachmentId}/preview")]
        public async Task<IActionResult> GetAttachmentFilePreview(int attachmentId)
        {
            var userId = GetEmpMasterId();

            Log.Information(
                "GetAttachmentFilePreview START | AttachmentId={AttachmentId} | UserId={UserId}",
                attachmentId,
                userId
            );

            var result = await _service.GetAttachmentFilePreview(attachmentId, userId);

            Log.Information(
                "GetAttachmentFilePreview END | AttachmentId={AttachmentId} | UserId={UserId} | FileName={FileName}",
                attachmentId,
                userId,
                result.FileName
            );

            return File(
                result.FileBytes,
                result.ContentType,
                result.FileName,
                enableRangeProcessing: true
            );
        }

        /// <summary>
        /// Deletes a specific attachment by its ID.
        /// </summary>
        [HttpDelete("api/goals/{attachmentId}")]
        public async Task<IActionResult> DeleteAttachment(int attachmentId)
        {
            var userId = GetEmpMasterId();

            Log.Information(
                "DeleteAttachment START | AttachmentId={AttachmentId} | UserId={UserId}",
                attachmentId,
                userId
            );

            await _service.DeleteAttachment(attachmentId, userId);

            Log.Information(
                "DeleteAttachment END | AttachmentId={AttachmentId} | UserId={UserId} | Deleted=true",
                attachmentId,
                userId
            );

            var response = ApiResponseModel.SuccessResponse(
                ResponseMessages.Codes.FILE_DELETED_SUCCESS,
                new { AttachmentId = attachmentId, DeletedBy = userId }
            );

            return Ok(response);
        }
    }
}