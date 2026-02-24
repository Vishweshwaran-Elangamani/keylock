using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace eepzbackend.Controllers
{
    [ApiController]
    [Authorize]
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

        /// <summary>
        /// Retrieves all submitted forms assigned to a reviewer.
        /// Supports pagination via query parameters.
        /// </summary>
        [HttpGet("forms")]
        public async Task<IActionResult> GetSubmittedForms(
            int reviewerUserId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            var rows = await _service.GetSubmittedFormsAsync(reviewerUserId, page, pageSize);
            return Ok(rows);
        }

        /// <summary>
        /// Retrieves all ratings submitted by a reviewer.
        /// Supports pagination via query parameters.
        /// </summary>
        [HttpGet("submitted-ratings")]
        public async Task<IActionResult> GetReviewerSubmittedRatings(
            int reviewerUserId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            var rows = await _service.GetSubmittedRatingsAsync(reviewerUserId, page, pageSize);
            return Ok(rows);
        }

        /// <summary>
        /// Retrieves a specific assessment for a reviewer by assessment ID.
        /// Returns 404 if the assessment is not found.
        /// </summary>
        [HttpGet("assessment/{assessmentId:int}")]
        public async Task<IActionResult> GetAssessment(int reviewerUserId, int assessmentId)
        {
            var dto = await _service.GetAssessmentAsync(reviewerUserId, assessmentId);
            if (dto is null)
                return NotFound();
            return Ok(dto);
        }

        /// <summary>
        /// Retrieves all assessments with detailed information for a reviewer.
        /// Supports pagination via query parameters.
        /// </summary>
        [HttpGet("assessments")]
        public async Task<IActionResult> GetAllAssessmentsWithDetails(
            int reviewerUserId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            var list = await _service.GetAssessmentsWithDetailsAsync(
                reviewerUserId,
                page,
                pageSize
            );
            return Ok(list);
        }

        /// <summary>
        /// Submits reviews for a reviewer.
        /// Requires a valid request body with review items.
        /// Returns success message upon completion.
        /// </summary>
        [HttpPost("reviews")]
        public async Task<IActionResult> PostReviewerReviews(
            int reviewerUserId,
            [FromBody] SubmitReviewDto body
        )
        {
            if (body is null || body.Items is null || body.Items.Count == 0)
                return BadRequest(new { success = false, message = "No review items provided." });

            await _service.SaveReviewAsync(reviewerUserId, body);
            return Ok(new { success = true, message = "Reviews submitted successfully" });
        }

        /// <summary>
        /// Records a decision (approve/reject/etc.) for a reviewer on a given assessment.
        /// Accepts optional reviewer comments in the request body.
        /// Returns success message if decision is recorded.
        /// </summary>
        [HttpPost("decision")]
        public async Task<IActionResult> PostDecision(
            int reviewerUserId,
            [FromQuery] int assessmentId,
            [FromQuery] string decision,
            [FromBody] string? reviewerComment = null
        )
        {
            var ok = await _service.SetDecisionAsync(
                reviewerUserId,
                assessmentId,
                decision,
                reviewerComment
            );
            if (!ok)
                return Forbid();

            return Ok(
                new
                {
                    assessmentId,
                    decision = decision.Trim(),
                    message = "Decision recorded successfully.",
                }
            );
        }

        /// <summary>
        /// Retrieves all attachments associated with a given assessment.
        /// Returns a list of attachment metadata.
        /// </summary>
        [HttpGet("assessment/{assessmentId:int}/attachments")]
        public async Task<IActionResult> GetAssessmentAttachments(
            int approverUserId,
            int assessmentId
        )
        {
            var attachments = await _service.GetAssessmentAttachmentsAsync(assessmentId);
            return Ok(new { success = true, data = attachments });
        }

        /// <summary>
        /// Downloads a specific attachment from GridFS by attachment ID.
        /// Returns the file stream if found, otherwise returns appropriate error response.
        /// </summary>
        [HttpGet("attachments/{attachmentId:int}/download")]
        public async Task<IActionResult> DownloadAttachment(int approverUserId, int attachmentId)
        {
            var (success, fileBytes, contentType, fileName, errors) =
                await _service.DownloadAttachmentFromGridFSAsync(attachmentId);

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
    }
}
