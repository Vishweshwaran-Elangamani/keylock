using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace PerformanceManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AssignmentsController : ControllerBase
    {
        private readonly IAssignmentsService _assignmentsService;
        private readonly ILogger<AssignmentsController> _logger;

        public AssignmentsController(
            IAssignmentsService assignmentsService,
            ILogger<AssignmentsController> logger)
        {
            _assignmentsService = assignmentsService;
            _logger = logger;
        }

        private int GetUserIdFromToken()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim))
                {
                    userIdClaim = User.FindFirst("userId")?.Value
                               ?? User.FindFirst("sub")?.Value
                               ?? User.FindFirst("id")?.Value;
                }

                return int.TryParse(userIdClaim, out var userId) ? userId : 0;
            }
            catch
            {
                return 0;
            }
        }

        private int GetEmployeeIdFromToken()
        {
            try
            {
                var employeeIdClaim = User.FindFirst("employeeId")?.Value
                                   ?? User.FindFirst("empId")?.Value;

                return int.TryParse(employeeIdClaim, out var employeeId) ? employeeId : 0;
            }
            catch
            {
                return 0;
            }
        }

        [HttpPost("initiate")]
        public async Task<IActionResult> InitiateAppraisal([FromBody] InitiateAppraisalRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _assignmentsService.InitiateAppraisalAsync(request);
            return Ok(result);
        }

        [HttpGet("upcoming-eligible")]
        public async Task<IActionResult> GetUpcomingEligibleEmployees([FromQuery] int? formId = null)
        {
            var result = await _assignmentsService.GetUpcomingEligibleEmployeesAsync(formId);
            return Ok(result);
        }

        [HttpGet("available-for-form/{formId}")]
        public async Task<IActionResult> GetAvailableEmployeesForForm(int formId)
        {
            var result = await _assignmentsService.GetAvailableEmployeesForFormAsync(formId);
            return Ok(result);
        }

        [HttpGet("employee/{employeeId}")]
        public async Task<IActionResult> GetAssignmentsByEmployeeId(int employeeId)
        {
            var result = await _assignmentsService.GetAssignmentsByEmployeeIdAsync(employeeId);
            return Ok(result);
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllAssignments()
        {
            var result = await _assignmentsService.GetAllAssignmentsAsync();
            return Ok(result);
        }

        [HttpGet("drafts")]
        public async Task<IActionResult> GetDraftAssignments()
        {
            var result = await _assignmentsService.GetDraftAssignmentsAsync();
            return Ok(result);
        }

        [HttpPut("{assignmentId}")]
        public async Task<IActionResult> UpdateDraft(int assignmentId, [FromBody] UpdateDraftRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _assignmentsService.UpdateDraftAsync(assignmentId, request);
            return Ok(result);
        }

        [HttpGet("form/{formId}")]
        public async Task<IActionResult> GetAssignmentsByFormId(int formId)
        {
            var result = await _assignmentsService.GetAssignmentsByFormIdAsync(formId);
            return Ok(result);
        }

        [HttpDelete("{assignmentId}")]
        public async Task<IActionResult> DeleteAssignment(int assignmentId)
        {
            var result = await _assignmentsService.DeleteAssignmentAsync(assignmentId);
            return Ok(result);
        }

        [HttpGet("{assignmentId}")]
        public async Task<IActionResult> GetAssignmentDetails(int assignmentId)
        {
            var result = await _assignmentsService.GetAssignmentDetailsAsync(assignmentId);
            return Ok(result);
        }
    }
}
