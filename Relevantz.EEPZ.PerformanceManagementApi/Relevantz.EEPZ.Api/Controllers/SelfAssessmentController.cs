using Microsoft.AspNetCore.Mvc;

using Microsoft.EntityFrameworkCore;


using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
 
namespace PerformanceManagement.Controllers

{

    [ApiController]

    [Route("api/[controller]")]

    public class SelfAssessmentController : ControllerBase

    {

        private readonly ISelfAssessmentService _assessmentService;

        private readonly EEPZDbContext _context;
 
        public SelfAssessmentController(ISelfAssessmentService assessmentService, EEPZDbContext context)

        {

            _assessmentService = assessmentService;

            _context = context;

        }
 
        /// <summary>

        /// US0029: Employee submits self-assessment to manager

        /// </summary>

        [HttpPost("submit")]

        public async Task<IActionResult> SubmitSelfAssessment([FromBody] SubmitSelfAssessmentRequestDto request)

        {

            if (!ModelState.IsValid)

                return BadRequest(new { success = false, message = "Invalid data provided." });
 
            var result = await _assessmentService.SubmitSelfAssessmentAsync(request);
 
            if (result.Success)

                return Ok(new { success = true, data = result.Data, message = "Assessment submitted successfully." });
 
            return BadRequest(new { success = false, message = string.Join(", ", result.Errors) });

        }
 
        /// <summary>

        /// Get submitted assessment details for viewing (read-only)

        /// </summary>

        [HttpGet("view/{formId}/user/{userId}")]

        public async Task<IActionResult> GetSubmittedAssessment(int formId, int userId)

        {

            try

            {

                var assessment = await _context.Selfassessments

                    .Include(sa => sa.Form)

                    .Include(sa => sa.Assessmentdetails)

                        .ThenInclude(ad => ad.Competency)

                    .FirstOrDefaultAsync(sa =>

                        sa.FormId == formId &&

                        sa.EmployeeId == userId &&

                        sa.Status == "Submitted");
 
                if (assessment == null)

                    return NotFound(new { success = false, message = "No submitted assessment found." });
 
                var result = new

                {

                    assessmentId = assessment.AssessmentId,

                    formName = assessment.Form.Name,

                    status = assessment.Status,

                    submittedAt = assessment.SubmittedAt,

                    details = assessment.Assessmentdetails.Select(ad => new

                    {

                        competencyId = ad.CompetencyId,

                        competencyName = ad.Competency.Name,

                        competencyDescription = ad.Competency.Description,

                        rating = ad.EmployeeRating,

                        comments = ad.EmployeeComments

                    }).ToList()

                };
 
                return Ok(new { success = true, data = result });

            }

            catch (Exception ex)

            {

                return StatusCode(500, new

                {

                    success = false,

                    message = $"Error retrieving assessment: {ex.Message}"

                });

            }

        }
 
        /// <summary>

        /// Get self-assessment by ID

        /// </summary>

        [HttpGet("{assessmentId}")]

        public async Task<IActionResult> GetSelfAssessment(int assessmentId)

        {

            var result = await _assessmentService.GetSelfAssessmentAsync(assessmentId);
 
            if (result.Success)

                return Ok(new { success = true, data = result.Data });
 
            return NotFound(new { success = false, message = string.Join(", ", result.Errors) });

        }
 
        /// <summary>

        /// Get self-assessment by form and user

        /// </summary>

        [HttpGet("form/{formId}/user/{userId}")]

        public async Task<IActionResult> GetSelfAssessmentByFormAndUser(int formId, int userId)

        {

            var result = await _assessmentService.GetSelfAssessmentByFormAndUserAsync(formId, userId);
 
            if (result.Success)

                return Ok(new { success = true, data = result.Data });
 
            return NotFound(new { success = false, message = string.Join(", ", result.Errors) });

        }
 
        /// <summary>

        /// US2: HR views forms submitted by employees

        /// </summary>

        [HttpGet("submitted")]

        public async Task<IActionResult> GetAllSubmittedForms([FromQuery] string? status = null)

        {

            var result = await _assessmentService.GetAllSubmittedFormsAsync(status);
 
            if (result.Success)

                return Ok(new { success = true, data = result.Data });
 
            return BadRequest(new { success = false, message = string.Join(", ", result.Errors) });

        }
 
        /// <summary>

        /// Get all assessments assigned to a specific user

        /// </summary>

        [HttpGet("user/{userId}/assignments")]

        public async Task<IActionResult> GetAssessmentsByUser(int userId)

        {

            var result = await _assessmentService.GetAssessmentsByUserAsync(userId);
 
            if (result.Success)

                return Ok(new { success = true, data = result.Data });
 
            return NotFound(new { success = false, message = string.Join(", ", result.Errors) });

        }
 
        /// <summary>

        /// Update assessment status

        /// </summary>

        [HttpPatch("{assessmentId}/status")]

        public async Task<IActionResult> UpdateAssessmentStatus(int assessmentId, [FromBody] UpdateStatusDto statusDto)

        {

            if (string.IsNullOrEmpty(statusDto?.Status))

                return BadRequest(new { success = false, message = "Status is required." });
 
            var result = await _assessmentService.UpdateAssessmentStatusAsync(assessmentId, statusDto.Status);
 
            if (result.Success)

                return Ok(new { success = true, data = result.Data, message = "Status updated successfully." });
 
            return BadRequest(new { success = false, message = string.Join(", ", result.Errors) });

        }

    }
 
    // Helper DTO for PATCH endpoint

    public class UpdateStatusDto

    {

        public string Status { get; set; }

    }

}

 