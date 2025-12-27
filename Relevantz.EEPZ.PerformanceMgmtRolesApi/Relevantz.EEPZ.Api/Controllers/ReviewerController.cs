using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
 
namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/reviewer/{reviewerUserId:int}")]
    public class ReviewerController : ControllerBase
    {
          private readonly IReviewerService _service;
private readonly IConfiguration _configuration;
 
public ReviewerController(IReviewerService service, IConfiguration configuration)
{
    _service = service;
    _configuration = configuration;
}
 
        [HttpGet("submitted-forms")]
        public async Task<IActionResult> GetSubmittedForms(int reviewerUserId, [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
        {
            var rows = await _service.GetSubmittedFormsAsync(reviewerUserId, page, pageSize);
            return Ok(rows);
        }
 
        [HttpGet("submitted-ratings")]
        public async Task<IActionResult> GetReviewerSubmittedRatings(int reviewerUserId, [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
        {
            var rows = await _service.GetSubmittedRatingsAsync(reviewerUserId, page, pageSize);
            return Ok(rows);
        }
 
        [HttpGet("assessment/{assessmentId:int}")]
        public async Task<IActionResult> GetAssessment(int reviewerUserId, int assessmentId)
        {
            var dto = await _service.GetAssessmentAsync(reviewerUserId, assessmentId);
            if (dto is null)
                return NotFound();
            return Ok(dto);
        }
 
        [HttpGet("assessments")]
        public async Task<IActionResult> GetAllAssessmentsWithDetails(int reviewerUserId, [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
        {
            var list = await _service.GetAssessmentsWithDetailsAsync(reviewerUserId, page, pageSize);
            return Ok(list);
        }
 
        [HttpPost("reviews")]
        public async Task<IActionResult> PostReviewerReviews(int reviewerUserId, [FromBody] SubmitReviewDto body)
        {
            if (body is null || body.Items is null || body.Items.Count == 0)
                return BadRequest(new { success = false, message = "No review items provided." });
 
            await _service.SaveReviewAsync(reviewerUserId, body);
            return Ok(new { success = true, message = "Reviews submitted successfully" });
        }
 
        [HttpPost("decision")]
        public async Task<IActionResult> PostDecision(int reviewerUserId, [FromQuery] int assessmentId, [FromQuery] string decision, [FromBody] string? reviewerComment = null)
        {
            var ok = await _service.SetDecisionAsync(reviewerUserId, assessmentId, decision, reviewerComment);
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
        var (success, fileBytes, contentType, fileName, errors) = await _service.DownloadAttachmentFromGridFSAsync(attachmentId);

        if (!success)
        {
            if (errors.Contains("ATTACHMENT_NOT_FOUND") || errors.Contains("FILE_NOT_FOUND"))
            {
                return NotFound(new { success = false, message = string.Join(", ", errors) });
            }
            return StatusCode(500, new { success = false, message = string.Join(", ", errors) });
        }

        return File(fileBytes, contentType, fileName);
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
 