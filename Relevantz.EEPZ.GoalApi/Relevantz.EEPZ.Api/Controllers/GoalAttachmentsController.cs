using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Core.Services.Interface;
using ILogger = Microsoft.Extensions.Logging.ILogger;

namespace Relevantz.EEPZ.Api.Controllers.Goals
{
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

        [HttpPost("api/goal-attachments/{goalId:int}/upload")]
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

        [HttpGet("api/goal-attachments/{goalId:int}")]
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

        [HttpGet("api/goal-attachments/{attachmentId:int}/download")]
        public async Task<IActionResult> DownloadAttachment(int attachmentId)
        {
            var userId = GetEmpMasterId();

            var (fileBytes, contentType, fileName) = await _service.DownloadFileAsync(
                attachmentId,
                userId
            );

            Response.Headers.Add("Content-Disposition", $"attachment; filename=\"{fileName}\"");
            Response.Headers.Add("Access-Control-Expose-Headers", "Content-Disposition");

            return File(fileBytes, contentType, fileName);
        }

        [HttpGet("api/goal-attachments/{attachmentId:int}/preview")]
        public async Task<IActionResult> PreviewAttachment(int attachmentId)
        {
            var userId = GetEmpMasterId();

            var result = await _service.PreviewFileAsync(attachmentId, userId);

            byte[] fileBytes = result.Value.fileBytes;
            string contentType = result.Value.contentType;
            string fileName = result.Value.fileName;

            Response.Headers["Content-Disposition"] = $"inline; filename=\"{fileName}\"";
            Response.Headers["Cache-Control"] = "public, max-age=3600";
            Response.Headers["Content-Length"] = fileBytes.Length.ToString();
            Response.Headers["Accept-Ranges"] = "bytes";

            return File(fileBytes, contentType, enableRangeProcessing: true);
        }

        [HttpDelete("api/goal-attachments/{attachmentId:int}")]
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
