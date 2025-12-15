using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using System;
using System.IO;
using System.Threading.Tasks;

namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/reviewer/{reviewerUserId:int}")]
    public class ReviewerController : ControllerBase
    {
        private readonly IManagerReviewRepository _repo;
        private readonly EEPZDbContext _context;
        private readonly IConfiguration _configuration;

        public ReviewerController(
            IManagerReviewRepository repo, 
            EEPZDbContext context,
            IConfiguration configuration)
        {
            _repo = repo;
            _context = context;
            _configuration = configuration;
        }

        [HttpGet("submitted-forms")]
        public async Task<IActionResult> GetSubmittedForms(
            int reviewerUserId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25)
        {
            var rows = await _repo.GetReviewerSubmittedFormsAsync(reviewerUserId, page, pageSize);
            return Ok(rows);
        }

          [HttpGet("submitted-ratings")]
public async Task<IActionResult> GetReviewerSubmittedRatings(
    int reviewerUserId,
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 25)
{
    var rows = await _repo.GetReviewerSubmittedRatingsAsync(
        reviewerUserId, page, pageSize);
 
    return Ok(rows);
}

        [HttpGet("assessment/{assessmentId:int}")]
        public async Task<IActionResult> GetAssessment(int reviewerUserId, int assessmentId)
        {
            var dto = await _repo.GetAssessmentForReviewerAsync(reviewerUserId, assessmentId);
            if (dto is null)
                return NotFound();

            return Ok(dto);
        }

        [HttpPost("reviews")]
        public async Task<IActionResult> PostReviewerReviews(
            int reviewerUserId,
            [FromBody] SubmitReviewDto body)
        {
            if (body is null || body.Items is null || body.Items.Count == 0)
                return BadRequest(new { success = false, message = "No review items provided." });

            await _repo.SubmitReviewerReviewsAsync(reviewerUserId, body.AssessmentId, body.Items);

            return Ok(new { success = true, message = "Reviews submitted successfully" });
        }

        [HttpPost("decision")]
        public async Task<IActionResult> PostDecision(
            int reviewerUserId,
            [FromQuery] int assessmentId,
            [FromQuery] string decision,
            [FromBody] string? reviewerComment = null)
        {
            var ok = await _repo.SetReviewerDecisionAsync(
                reviewerUserId, assessmentId, decision, reviewerComment);

            if (!ok)
                return Forbid();

            return Ok(new
            {
                assessmentId,
                decision = decision.Trim(),
                message = "Decision recorded successfully."
            });
        }

        [HttpGet("assessments/full")]
        public async Task<IActionResult> GetAllAssessmentsWithDetails(
            int reviewerUserId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25)
        {
            var list = await _repo.GetReviewerAssessmentsWithDetailsAsync(reviewerUserId, page, pageSize);
            return Ok(list);
        }

        [HttpGet("assessment/{assessmentId:int}/decision")]
        public async Task<IActionResult> GetL2Decision(int reviewerUserId, int assessmentId)
        {
            var dto = await _repo.GetLatestReviewerDecisionAsync(assessmentId);
            return Ok(dto);
        }

        [HttpGet("assessment/{assessmentId:int}/attachments")]
        public async Task<IActionResult> GetAssessmentAttachments(int reviewerUserId, int assessmentId)
        {
            try
            {
                var attachments = await _repo.GetAssessmentAttachmentsAsync(assessmentId);
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
        public async Task<IActionResult> DownloadAttachment(int reviewerUserId, int attachmentId)
        {
            try
            {
                var attachment = await _context.Selfassessmentattachments
                    .FirstOrDefaultAsync(a => a.AttachmentId == attachmentId);

                if (attachment == null)
                    return NotFound(new { success = false, message = "Attachment not found." });

                if (string.IsNullOrWhiteSpace(attachment.FilePath))
                    return NotFound(new { success = false, message = "File path missing." });

                // Get base path from configuration
                var basePath = _configuration["FileStorage:BasePath"] ?? "D:\\Capstone\\Backend\\eepz\\SharedUploads";
                
                // Remove "uploads\" prefix if it exists in the database path
                var cleanPath = attachment.FilePath
                    .Replace("uploads\\", "", StringComparison.OrdinalIgnoreCase)
                    .Replace("uploads/", "", StringComparison.OrdinalIgnoreCase)
                    .TrimStart('\\', '/');
                
                var filePath = Path.Combine(basePath, cleanPath);

                Console.WriteLine($"=== REVIEWER DEBUG INFO ===");
                Console.WriteLine($"Base Path: {basePath}");
                Console.WriteLine($"Database Path: {attachment.FilePath}");
                Console.WriteLine($"Cleaned Path: {cleanPath}");
                Console.WriteLine($"Full Path: {filePath}");
                Console.WriteLine($"File Exists: {System.IO.File.Exists(filePath)}");

                if (!System.IO.File.Exists(filePath))
                    return NotFound(new { 
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
