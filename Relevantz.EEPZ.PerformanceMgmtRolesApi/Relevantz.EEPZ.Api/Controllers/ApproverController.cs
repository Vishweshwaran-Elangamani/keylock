using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Microsoft.Extensions.Configuration;


namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/approver/{approverUserId:int}")]
    public class ApproverController : ControllerBase
    {
        private readonly IApproverService _service;
        private readonly IConfiguration _configuration;

        public ApproverController(IApproverService service, IConfiguration configuration)
        {
            _service = service;
            _configuration = configuration;
        }

        [HttpGet("submitted-forms")]
        public async Task<IActionResult> GetSubmittedForms(
            int approverUserId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25)
        {
            try
            {
                var forms = await _service.GetSubmittedFormsAsync(approverUserId, page, pageSize);
                return Ok(new { success = true, data = forms });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("submitted-l1-ratings")]
        public async Task<IActionResult> GetSubmittedL1Ratings(int approverUserId, [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
        {
            var rows = await _service.GetSubmittedL1RatingsAsync(approverUserId, page, pageSize);
            return Ok(rows);
        }

        [HttpGet("rework-forms")]
        public async Task<IActionResult> GetReworkForms(int approverUserId, [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
        {
            var rows = await _service.GetReworkFormsAsync(approverUserId, page, pageSize);
            return Ok(rows);
        }

        [HttpGet("assessment/{assessmentId:int}")]
        public async Task<IActionResult> GetAssessmentForApprove(int approverUserId, int assessmentId)
        {
            var dto = await _service.GetAssessmentAsync(approverUserId, assessmentId);
            if (dto is null)
                return NotFound();
            return Ok(dto);
        }

        [HttpGet("assessments")]
        public async Task<IActionResult> GetApproverAssessmentsWithDetails(int approverUserId, [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
        {
            var list = await _service.GetAssessmentsWithDetailsAsync(approverUserId, page, pageSize);
            return Ok(list);
        }

        [HttpGet("assessment/{assessmentId:int}/decision")]
        public async Task<IActionResult> GetLatestReviewerDecision(int approverUserId, int assessmentId)
        {
            var decision = await _service.GetLatestReviewerDecisionAsync(assessmentId);
            if (decision == null)
                return NotFound();

            return Ok(new
            {
                decision = decision.Decision,
                note = decision.Note

            });
        }




        [HttpPost("reviews")]
        public async Task<IActionResult> PostApproverReviews(int approverUserId, [FromBody] SubmitReviewDto body)
        {
            if (body is null || body.Items is null || body.Items.Count == 0)
                return BadRequest("No review items provided.");

            var saved = await _service.SaveReviewAsync(approverUserId, body);
            if (saved == 0)
                return Forbid();

            return Created(string.Empty, new { saved });
        }

        [HttpPost("decision")]
        public async Task<IActionResult> PostDecision(int approverUserId, [FromQuery] int assessmentId, [FromQuery] string decision, [FromBody] string? approverComment = null)
        {
            var ok = await _service.SetDecisionAsync(approverUserId, assessmentId, decision, approverComment);
            if (!ok)
                return Forbid();

            return Ok(new { assessmentId, decision = decision.Trim(), message = "Decision recorded successfully." });
        }
        [HttpGet("assessment/{assessmentId:int}/attachments")]
        public async Task<IActionResult> GetAssessmentAttachments(int approverUserId, int assessmentId)
        {
            try
            {
                var attachments = await _service.GetAssessmentAttachmentsAsync(assessmentId);
                return Ok(new { success = true, data = attachments });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = $"Error retrieving attachments: {ex.Message}"
                });
            }
        }

        [HttpGet("attachments/{attachmentId:int}/download")]
        public async Task<IActionResult> DownloadAttachment(int approverUserId, int attachmentId)
        {
            try
            {
                var attachment = await _service.GetAttachmentByIdAsync(attachmentId);

                if (attachment == null)
                    return NotFound(new { success = false, message = "Attachment not found." });

                if (string.IsNullOrWhiteSpace(attachment.FilePath))
                    return NotFound(new { success = false, message = "File path missing." });

                var basePath = _configuration["FileStorage:BasePath"] ?? "D:\\Capstone\\Backend\\eepz\\SharedUploads";

                var cleanPath = attachment.FilePath
                    .Replace("uploads\\", "", StringComparison.OrdinalIgnoreCase)
                    .Replace("uploads/", "", StringComparison.OrdinalIgnoreCase)
                    .TrimStart('\\', '/');

                var filePath = Path.Combine(basePath, cleanPath);

                Console.WriteLine($"=== DEBUG INFO ===");
                Console.WriteLine($"Base Path: {basePath}");
                Console.WriteLine($"Database Path: {attachment.FilePath}");
                Console.WriteLine($"Cleaned Path: {cleanPath}");
                Console.WriteLine($"Full Path: {filePath}");
                Console.WriteLine($"File Exists: {System.IO.File.Exists(filePath)}");

                if (!System.IO.File.Exists(filePath))
                    return NotFound(new
                    {
                        success = false,
                        message = "File not found on server.",
                        attemptedPath = filePath,
                        databasePath = attachment.FilePath
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
}
