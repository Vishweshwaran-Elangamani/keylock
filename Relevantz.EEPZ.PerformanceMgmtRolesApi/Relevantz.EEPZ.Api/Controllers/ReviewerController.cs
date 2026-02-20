using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace Relevantz.EEPZ.Api.Controllers
{
    /// <summary>
    /// Reviewer endpoints: submitted ratings/forms, assessments, attachments, and download.
    /// </summary>
    [ApiController]
    [Authorize]
    [Route("api/reviewer")]
    public class ReviewerController : ControllerBase
    {
        private readonly IReviewerService _service;
        private readonly ILogger<ReviewerController> _logger;

        public ReviewerController(IReviewerService service, ILogger<ReviewerController> logger)
        {
            _service = service;
            _logger = logger;
        }

        /// <summary>
        /// Returns paginated submitted ratings for a reviewer.
        /// </summary>
        /// <remarks>Uses simple pagination defaults; keeps controller thin.</remarks>
        [HttpGet("{reviewerUserId:int}/submitted-ratings")]
        public async Task<IActionResult> GetSubmittedRatings(
            [FromRoute] int reviewerUserId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            if (reviewerUserId <= 0)
                return BadRequest(new { message = "Invalid reviewerUserId" });

            var result = await _service.GetSubmittedRatingsAsync(reviewerUserId, page, pageSize);
            return Ok(result);
        }

        /// <summary>
        /// Returns paginated submitted forms for a reviewer.
        /// </summary>
        [HttpGet("{reviewerUserId:int}/submitted-forms")]
        public async Task<IActionResult> GetSubmittedForms(
            [FromRoute] int reviewerUserId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            if (reviewerUserId <= 0)
                return BadRequest(new { message = "Invalid reviewerUserId" });

            var result = await _service.GetSubmittedFormsAsync(reviewerUserId, page, pageSize);
            return Ok(result);
        }

        /// <summary>
        /// Returns paginated assessments (with details) visible to a reviewer.
        /// </summary>
        [HttpGet("{reviewerUserId:int}/assessments")]
        public async Task<IActionResult> GetReviewerAssessments(
            [FromRoute] int reviewerUserId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            if (reviewerUserId <= 0)
                return BadRequest(new { message = "Invalid reviewerUserId" });

            var data = await _service.GetAssessmentsWithDetailsAsync(reviewerUserId, page, pageSize);
            return Ok(data);
        }

        /// <summary>
        /// Returns a specific assessment visible to this reviewer.
        /// </summary>
        [HttpGet("{reviewerUserId:int}/assessment/{assessmentId:int}")]
        public async Task<IActionResult> GetAssessment([FromRoute] int reviewerUserId, [FromRoute] int assessmentId)
        {
            if (reviewerUserId <= 0 || assessmentId <= 0)
                return BadRequest(new { message = "Invalid IDs" });

            var dto = await _service.GetAssessmentAsync(reviewerUserId, assessmentId);
            if (dto == null)
                return NotFound();

            return Ok(dto);
        }

        /// <summary>
        /// Returns attachments metadata for a specific assessment.
        /// </summary>
        [HttpGet("{reviewerUserId:int}/assessment/{assessmentId:int}/attachments")]
        public async Task<IActionResult> GetAssessmentAttachments([FromRoute] int reviewerUserId, [FromRoute] int assessmentId)
        {
            if (reviewerUserId <= 0 || assessmentId <= 0)
                return BadRequest(new { message = "Invalid IDs" });

            var attachments = await _service.GetAssessmentAttachmentsAsync(assessmentId);
            return Ok(attachments);
        }

        /// <summary>
        /// Downloads a single assessment attachment (from GridFS).
        /// </summary>
        [HttpGet("attachment/{attachmentId:int}/download")]
        public async Task<IActionResult> DownloadAttachment([FromRoute] int attachmentId)
        {
            if (attachmentId <= 0)
                return BadRequest(new { message = "Invalid attachmentId" });

            var (success, fileBytes, contentType, fileName, errors) =
                await _service.DownloadAttachmentFromGridFSAsync(attachmentId);

            if (!success)
                return NotFound(new { message = errors?.FirstOrDefault() ?? "Attachment not found" });

            return File(fileBytes, contentType, fileName);
        }
    }
}