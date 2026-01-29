using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Common.Constants;


namespace eepzbackend.Controllers
{
    [ApiController]
    [Authorize]
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

        [HttpGet("submitted-appraisal-forms")]
        public async Task<IActionResult> GetSubmittedAppraisalForms(
            int approverUserId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            var forms = await _service.GetSubmittedFormsAsync(approverUserId, page, pageSize);
            return Ok(new { success = true, data = forms });
        }

        [HttpGet("submitted-l1-appraisal-ratings")]
        public async Task<IActionResult> GetSubmittedL1AppraisalRatings(
            int approverUserId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            var rows = await _service.GetSubmittedL1RatingsAsync(approverUserId, page, pageSize);
            return Ok(rows);
        }

        [HttpGet("pending-rework-forms")]
        public async Task<IActionResult> GetPendingReworkForms(
            int approverUserId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            var rows = await _service.GetReworkFormsAsync(approverUserId, page, pageSize);
            return Ok(rows);
        }

        [HttpGet("assessment/{assessmentId:int}")]
        public async Task<IActionResult> GetAssessmentForApprove(
            int approverUserId,
            int assessmentId
        )
        {
            var dto = await _service.GetAssessmentAsync(approverUserId, assessmentId);
            if (dto is null)
                return NotFound();
            return Ok(dto);
        }

        [HttpGet("assessments")]
        public async Task<IActionResult> GetApproverAssessmentsWithDetails(
            int approverUserId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            var list = await _service.GetAssessmentsWithDetailsAsync(
                approverUserId,
                page,
                pageSize
            );
            return Ok(list);
        }

        [HttpGet("assessment/{assessmentId:int}/decision")]
        public async Task<IActionResult> GetLatestReviewerDecision(int approverUserId, int assessmentId)
        {
            var decision = await _service.GetLatestReviewerDecisionAsync(assessmentId);


            return Ok(new
            {
                decision = decision?.Decision ?? "",
                note = decision?.Note ?? ""
            });
        }


        [HttpPost("approverReviews")]
        public async Task<IActionResult> PostApproverReviews(
            int approverUserId,
            [FromBody] SubmitReviewDto body
        )
        {
            if (body is null || body.Items is null || body.Items.Count == 0)
                return BadRequest("No review items provided.");

            var saved = await _service.SaveReviewAsync(approverUserId, body);
            if (saved == 0)
                return Forbid();

            return Created(string.Empty, new { saved });
        }

        [HttpPost("decision")]
        public async Task<IActionResult> PostDecision(
            int approverUserId,
            [FromQuery] int assessmentId,
            [FromQuery] string decision,
            [FromBody] string? approverComment = null
        )
        {
            var ok = await _service.SetDecisionAsync(
                approverUserId,
                assessmentId,
                decision,
                approverComment
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

        [HttpGet("assessment/{assessmentId:int}/attachments")]
        public async Task<IActionResult> GetAssessmentAttachments(
    int approverUserId,
    int assessmentId
)
        {
            var attachments = await _service.GetAssessmentAttachmentsAsync(assessmentId);
            return Ok(new { success = true, data = attachments });
        }


        [HttpGet("attachments/{attachmentId:int}/download")]
public async Task<IActionResult> DownloadAttachment(int approverUserId, int attachmentId)
{
    var (success, fileBytes, contentType, fileName, errors) =
        await _service.DownloadAttachmentFromGridFSAsync(attachmentId);

    if (!success)
    {
        if (errors.Contains(Relevantz.EEPZ.Common.Constants.AttachmentConstants.ATTACHMENT_NOT_FOUND) ||
            errors.Contains(Relevantz.EEPZ.Common.Constants.AttachmentConstants.FILE_NOT_FOUND))
        {
            return NotFound(new { success = false, message = string.Join(", ", errors) });
        }
       
        return StatusCode(500, new { success = false, message = string.Join(", ", errors) });
    }

   
    return File(fileBytes, contentType, fileName);
}

    }
}
