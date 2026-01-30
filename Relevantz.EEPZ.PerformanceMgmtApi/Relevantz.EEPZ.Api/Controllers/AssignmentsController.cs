using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace PerformanceManagement.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class AssignmentsController : ControllerBase
    {
        private readonly IAssignmentsService _assignmentsService;
        private readonly ILogger<AssignmentsController> _logger;

        public AssignmentsController(
            IAssignmentsService assignmentsService,
            ILogger<AssignmentsController> logger
        )
        {
            _assignmentsService = assignmentsService;
            _logger = logger;
        }

        private IActionResult UnauthorizedResponse(string message)
        {
            _logger.LogWarning("Unauthorized access: {Message}", message);
            return Unauthorized(new { success = false, message });
        }

        private int GetUserIdFromToken()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("userId")?.Value
                ?? User.FindFirst("sub")?.Value
                ?? User.FindFirst("id")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                throw new UnauthorizedAccessException("Invalid or missing userId claim.");

            return userId;
        }

        private int GetEmployeeIdFromToken()
        {
            var employeeIdClaim = User.FindFirst("employeeId")?.Value
                ?? User.FindFirst("empId")?.Value;

            if (string.IsNullOrEmpty(employeeIdClaim) || !int.TryParse(employeeIdClaim, out var employeeId))
                throw new UnauthorizedAccessException("Invalid or missing employeeId claim.");

            return employeeId;
        }

        /// <summary>
        /// Initiates an appraisal process.
        /// </summary>
        [HttpPost("initiate")]
        public async Task<IActionResult> InitiateAppraisal([FromBody] InitiateAppraisalRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid appraisal request.");
                return BadRequest(new { success = false, errors = ModelState });
            }

            var result = await _assignmentsService.InitiateAppraisalAsync(request);
            return Ok(result);
        }

        /// <summary>
        /// Retrieves upcoming eligible employees for appraisal.
        /// </summary>
        [HttpGet("upcoming-eligible")]
        public async Task<IActionResult> GetUpcomingEligibleEmployees([FromQuery] int? formId = null)
        {
            if (formId.HasValue && formId <= 0)
                return BadRequest(new { success = false, message = "Invalid formId." });

            var result = await _assignmentsService.GetUpcomingEligibleEmployeesAsync(formId);
            return Ok(result);
        }

        /// <summary>
        /// Retrieves available employees for a given form.
        /// </summary>
        [HttpGet("available-for-form/{formId}")]
        public async Task<IActionResult> GetAvailableEmployeesForForm(int formId)
        {
            if (formId <= 0)
                return BadRequest(new { success = false, message = "Invalid formId." });

            var result = await _assignmentsService.GetAvailableEmployeesForFormAsync(formId);
            return Ok(result);
        }

        /// <summary>
        /// Retrieves assignments by employee ID.
        /// </summary>
        [HttpGet("employee/{employeeId}")]
        public async Task<IActionResult> GetAssignmentsByEmployeeId(int employeeId)
        {
            if (employeeId <= 0)
                return BadRequest(new { success = false, message = "Invalid employeeId." });

            var result = await _assignmentsService.GetAssignmentsByEmployeeIdAsync(employeeId);
            return Ok(result);
        }

        /// <summary>
        /// Retrieves all assignments.
        /// </summary>
        [HttpGet("all")]
        public async Task<IActionResult> GetAllAssignments()
        {
            var result = await _assignmentsService.GetAllAssignmentsAsync();
            return Ok(result);
        }

        /// <summary>
        /// Retrieves draft assignments.
        /// </summary>
        [HttpGet("drafts")]
        public async Task<IActionResult> GetDraftAssignments()
        {
            var result = await _assignmentsService.GetDraftAssignmentsAsync();
            return Ok(result);
        }

        /// <summary>
        /// Updates a draft assignment.
        /// </summary>
        [HttpPut("{assignmentId}")]
        public async Task<IActionResult> UpdateDraft(int assignmentId, [FromBody] UpdateDraftRequestDto request)
        {
            if (assignmentId <= 0)
                return BadRequest(new { success = false, message = "Invalid assignmentId." });

            if (!ModelState.IsValid)
                return BadRequest(new { success = false, errors = ModelState });

            var result = await _assignmentsService.UpdateDraftAsync(assignmentId, request);
            return Ok(result);
        }

        /// <summary>
        /// Retrieves assignments by form ID.
        /// </summary>
        [HttpGet("form/{formId}")]
        public async Task<IActionResult> GetAssignmentsByFormId(int formId)
        {
            if (formId <= 0)
                return BadRequest(new { success = false, message = "Invalid formId." });

            var result = await _assignmentsService.GetAssignmentsByFormIdAsync(formId);
            return Ok(result);
        }

        /// <summary>
        /// Deletes an assignment by ID.
        /// </summary>
        [HttpDelete("{assignmentId}")]
        public async Task<IActionResult> DeleteAssignment(int assignmentId)
        {
            if (assignmentId <= 0)
                return BadRequest(new { success = false, message = "Invalid assignmentId." });

            var exists = await _assignmentsService.GetAssignmentDetailsAsync(assignmentId);
            if (exists == null)
                return NotFound(new { success = false, message = "Assignment not found." });

            await _assignmentsService.DeleteAssignmentAsync(assignmentId);
            _logger.LogInformation("Assignment {AssignmentId} deleted.", assignmentId);

            return Ok(new { success = true, message = "Assignment deleted successfully." });
        }

        /// <summary>
        /// Retrieves assignment details by ID.
        /// </summary>
        [HttpGet("{assignmentId}")]
        public async Task<IActionResult> GetAssignmentDetails(int assignmentId)
        {
            if (assignmentId <= 0)
                return BadRequest(new { success = false, message = "Invalid assignmentId." });

            var result = await _assignmentsService.GetAssignmentDetailsAsync(assignmentId);
            if (result == null)
                return NotFound(new { success = false, message = "Assignment not found." });

            return Ok(result);
        }
    }
}
