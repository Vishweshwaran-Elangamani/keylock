
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Microsoft.AspNetCore.Mvc;


using Microsoft.EntityFrameworkCore;


using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
 
namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/approver/{approverUserId:int}")]
    public class ApproverController : ControllerBase
    {
        private readonly IManagerReviewRepository _repo;
        public ApproverController(IManagerReviewRepository repo) => _repo = repo;
 
        // GET /api/approver/7/submitted-forms?page=1&pageSize=25
        [HttpGet("submitted-forms")]
        public async Task<IActionResult> GetSubmittedForms(
            int approverUserId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25)
        {
            var rows = await _repo.GetApproverSubmittedFormsAsync(approverUserId, page, pageSize);
            return Ok(rows);
        }
 
        // POST /api/approver/7/reviews
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
 
        // GET /api/approver/7/rework-forms
        [HttpGet("rework-forms")]
        public async Task<IActionResult> GetReworkForms(
            int approverUserId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25)
        {
            var rows = await _repo.GetApproverReworkFormsAsync(approverUserId, page, pageSize);
            return Ok(rows);
        }
 
        // GET /api/approver/2/assessment/1
        [HttpGet("assessment/{assessmentId:int}")]
        public async Task<IActionResult> GetAssessmentForApprover(int approverUserId, int assessmentId)
        {
            var dto = await _repo.GetAssessmentForApproverAsync(approverUserId, assessmentId);
            if (dto is null) return NotFound();
            return Ok(dto);
        }
 
        // GET /api/approver/2/assessments
        [HttpGet("assessments")]
        public async Task<IActionResult> GetApproverAssessmentsWithDetails(
            int approverUserId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25)
        {
            var list = await _repo.GetApproverAssessmentsWithDetailsAsync(approverUserId, page, pageSize);
            return Ok(list);
        }
 
        // GET /api/approver/2/assessment/3/decision
        [HttpGet("assessment/{assessmentId:int}/decision")]
        public async Task<IActionResult> GetL2DecisionForApprover(int approverUserId, int assessmentId)
        {
            var dto = await _repo.GetLatestReviewerDecisionAsync(assessmentId);
            return Ok(dto);
        }
    }
}
 