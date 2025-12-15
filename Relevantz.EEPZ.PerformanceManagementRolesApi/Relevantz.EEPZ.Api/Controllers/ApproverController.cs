using Relevantz.EEPZ.Data.Repository.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using System;
using System.IO;
using System.Threading.Tasks;

namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/approver/{approverUserId:int}")]
    public class ApproverController : ControllerBase
    {
        private readonly IManagerReviewRepository _repo;
        private readonly EEPZDbContext _context;
        private readonly IConfiguration _configuration;

        public ApproverController(
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
            int approverUserId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25)
        {
            var rows = await _repo.GetApproverSubmittedFormsAsync(approverUserId, page, pageSize);
            return Ok(rows);
        }

        [HttpGet("assessment/{assessmentId:int}/attachments")]
        public async Task<IActionResult> GetAssessmentAttachments(int approverUserId, int assessmentId)
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
public async Task<IActionResult> DownloadAttachment(int approverUserId, int attachmentId)
{
    try
    {
        var attachment = await _context.Selfassessmentattachments
            .FirstOrDefaultAsync(a => a.AttachmentId == attachmentId);

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


        [HttpPost("reviews")]
        public async Task<IActionResult> PostApproverReviews(
            int approverUserId,
            [FromBody] SubmitReviewDto body)
        {
            if (body is null || body.Items is null || body.Items.Count == 0)
                return BadRequest("No review items provided.");

            var saved = await _repo.SaveApproverReviewAsync(approverUserId, body);
            if (saved <= 0)
                return Forbid();

            return Created(string.Empty, new { saved });
        }

        [HttpGet("rework-forms")]
        public async Task<IActionResult> GetReworkForms(
            int approverUserId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25)
        {
            var rows = await _repo.GetApproverReworkFormsAsync(approverUserId, page, pageSize);
            return Ok(rows);
        }

        [HttpGet("assessment/{assessmentId:int}")]
        public async Task<IActionResult> GetAssessmentForApprover(int approverUserId, int assessmentId)
        {
            var dto = await _repo.GetAssessmentForApproverAsync(approverUserId, assessmentId);
            if (dto is null) return NotFound();
            return Ok(dto);
        }

        [HttpGet("assessments")]
        public async Task<IActionResult> GetApproverAssessmentsWithDetails(
            int approverUserId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25)
        {
            var list = await _repo.GetApproverAssessmentsWithDetailsAsync(approverUserId, page, pageSize);
            return Ok(list);
        }

        [HttpGet("assessment/{assessmentId:int}/decision")]
        public async Task<IActionResult> GetL2DecisionForApprover(int approverUserId, int assessmentId)
        {
            var dto = await _repo.GetLatestReviewerDecisionAsync(assessmentId);
            return Ok(dto);
        }
    }
}
