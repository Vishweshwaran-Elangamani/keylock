using Microsoft.AspNetCore.Mvc;

using Microsoft.EntityFrameworkCore;


using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.Repository.Interfaces;

namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/reviewer/{reviewerUserId:int}")]
    public class ReviewerController : ControllerBase
    {
        private readonly IManagerReviewRepository _repo;
        public ReviewerController(IManagerReviewRepository repo) => _repo = repo;
 
        // GET /api/reviewer/3/submitted-forms
        [HttpGet("submitted-forms")]
        public async Task<IActionResult> GetSubmittedForms(
            int reviewerUserId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25)
        {
            var rows = await _repo.GetReviewerSubmittedFormsAsync(reviewerUserId, page, pageSize);
            return Ok(rows);
        }
 
        // GET /api/reviewer/3/assessment/1
        [HttpGet("assessment/{assessmentId:int}")]
        public async Task<IActionResult> GetAssessment(int reviewerUserId, int assessmentId)
        {
            var dto = await _repo.GetAssessmentForReviewerAsync(reviewerUserId, assessmentId);
            if (dto is null)
                return NotFound();
 
            return Ok(dto);
        }
 

       // POST /api/reviewer/3/reviews
[HttpPost("reviews")]
public async Task<IActionResult> PostReviewerReviews(
    int reviewerUserId,
    [FromBody] SubmitReviewDto body)
{
    if (body is null || body.Items is null || body.Items.Count == 0)
        return BadRequest(new { success = false, message = "No review items provided." });
 
    // ✅ FIXED: Call the correct method
    await _repo.SubmitReviewerReviewsAsync(reviewerUserId, body.AssessmentId, body.Items);
 
    return Ok(new { success = true, message = "Reviews submitted successfully" });
}
 
        // POST /api/reviewer/3/decision?assessmentId=1&decision=Approved
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
 
        // GET /api/reviewer/3/assessments/full?page=1&pageSize=25
        [HttpGet("assessments/full")]
        public async Task<IActionResult> GetAllAssessmentsWithDetails(
            int reviewerUserId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25)
        {
            var list = await _repo.GetReviewerAssessmentsWithDetailsAsync(reviewerUserId, page, pageSize);
            return Ok(list);
        }
 
        // GET /api/reviewer/3/assessment/3/decision
        [HttpGet("assessment/{assessmentId:int}/decision")]
        public async Task<IActionResult> GetL2Decision(int reviewerUserId, int assessmentId)
        {
            var dto = await _repo.GetLatestReviewerDecisionAsync(assessmentId);
            return Ok(dto);
        }
    }
}
 