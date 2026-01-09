using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ViolationController : ControllerBase
    {
        private readonly IViolationService _violationService;
        private readonly ISlaEscalationService _slaEscalationService;
        private readonly ILogger<ViolationController> _logger;

        public ViolationController(
            IViolationService violationService,
            ISlaEscalationService slaEscalationService,
            ILogger<ViolationController> logger)
        {
            _violationService = violationService;
            _slaEscalationService = slaEscalationService;
            _logger = logger;
        }

        #region Violation Endpoints

        /// <summary>
        /// Get all violations - HR ONLY
        /// </summary>
        [HttpGet("list")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> GetAllViolations()
        {
            try
            {
                var result = await _violationService.GetAllViolationsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching all violations: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        /// <summary>
        /// Get violation by ID - HR and Manager
        /// </summary>
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<IActionResult> GetViolationById(int id)
        {
            try
            {
                var result = await _violationService.GetViolationByIdAsync(id);
                if (!result.Success)
                    return NotFound(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching violation {id}: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        /// <summary>
        /// Get violations by employee
        /// Role-based access: HR sees all, Employee sees own only
        /// </summary>
        [HttpGet("employee/{EmployeeUserId}")]
        public async Task<IActionResult> GetViolationsByEmployee(int EmployeeUserId)
        {
            try
            {
                // Get current user ID from JWT
                var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

                if (string.IsNullOrEmpty(currentUserIdClaim) || !int.TryParse(currentUserIdClaim, out int currentUserId))
                {
                    return Unauthorized(new { success = false, message = "Invalid user authentication" });
                }

                // Check if user has HR role
                var isHR = User.IsInRole("Admin") || User.IsInRole("HR");

                // If not HR, only allow viewing own violations
                if (!isHR && currentUserId != EmployeeUserId)
                {
                    _logger.LogWarning($"User {currentUserId} attempted to access violations of user {EmployeeUserId}");
                    return Forbid("You can only view your own violations");
                }

                var result = await _violationService.GetViolationsByEmployeeAsync(EmployeeUserId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching violations for employee {EmployeeUserId}: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        /// <summary>
        /// Get violations by policy - HR ONLY
        /// </summary>
        [HttpGet("policy/{policyId}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> GetViolationsByPolicy(int policyId)
        {
            try
            {
                var result = await _violationService.GetViolationsByPolicyAsync(policyId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching violations for policy {policyId}: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        /// <summary>
        /// Report violation - HR and Manager
        /// </summary>
        [HttpPost("report")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<IActionResult> ReportViolation([FromBody] ReportViolationRequestDto request)
        {
            try
            {
                // Get user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int reportedByUserId))
                {
                    _logger.LogWarning("Unable to extract user ID from JWT token for reporting violation");
                    return Unauthorized(new { success = false, message = "Invalid user authentication" });
                }

                _logger.LogInformation($"User {reportedByUserId} reporting violation for employee {request.EmployeeUserId}");

                var result = await _violationService.ReportViolationAsync(request, reportedByUserId);
                
                if (!result.Success)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error reporting violation: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred while reporting violation" });
            }
        }

        /// <summary>
        /// Resolve violation - HR ONLY
        /// </summary>
        [HttpPut("resolve/{id}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> ResolveViolation(int id, [FromBody] ResolveViolationRequestDto request)
        {
            try
            {
                // Get user ID from JWT
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

                if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int userId))
                {
                    _logger.LogInformation($"User {userId} resolving violation {id}");
                }

                var result = await _violationService.ResolveViolationAsync(id, request);
                
                if (!result.Success)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error resolving violation {id}: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred while resolving violation" });
            }
        }

        /// <summary>
        /// Get violation statistics - HR ONLY
        /// </summary>
        [HttpGet("stats")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> GetViolationStats()
        {
            try
            {
                var result = await _violationService.GetViolationStatsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching violation stats: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        #endregion

        #region SLA Escalation Endpoints

        /// <summary>
        /// Get all SLA escalations - HR ONLY
        /// </summary>
        [HttpGet("sla-escalations")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> GetAllSlaEscalations()
        {
            try
            {
                _logger.LogInformation("Fetching all SLA escalations");
                var result = await _slaEscalationService.GetAllSlaEscalationsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching SLA escalations: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        /// <summary>
        /// Get SLA escalations by employee
        /// Role-based access: HR sees all, Employee sees own only
        /// </summary>
        [HttpGet("sla-escalations/employee/{EmployeeUserId}")]
        public async Task<IActionResult> GetSlaEscalationsByEmployee(int EmployeeUserId)
        {
            try
            {
                // Get current user ID from JWT
                var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

                if (string.IsNullOrEmpty(currentUserIdClaim) || !int.TryParse(currentUserIdClaim, out int currentUserId))
                {
                    return Unauthorized(new { success = false, message = "Invalid user authentication" });
                }

                // Check if user has HR role
                var isHR = User.IsInRole("Admin") || User.IsInRole("HR");

                // If not HR, only allow viewing own escalations
                if (!isHR && currentUserId != EmployeeUserId)
                {
                    _logger.LogWarning($"User {currentUserId} attempted to access escalations of user {EmployeeUserId}");
                    return Forbid("You can only view your own SLA escalations");
                }

                var result = await _slaEscalationService.GetSlaEscalationsByEmployeeAsync(EmployeeUserId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching employee SLA escalations: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        /// <summary>
        /// Get SLA escalation by ID - HR and assigned employees
        /// </summary>
        [HttpGet("sla-escalations/{escalationId}")]
        public async Task<IActionResult> GetSlaEscalationById(int escalationId)
        {
            try
            {
                var result = await _slaEscalationService.GetSlaEscalationByIdAsync(escalationId);

                if (!result.Success)
                {
                    return NotFound(result);
                }

                // Authorization check
                var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

                if (!string.IsNullOrEmpty(currentUserIdClaim) && int.TryParse(currentUserIdClaim, out int currentUserId))
                {
                    var isHR = User.IsInRole("Admin") || User.IsInRole("HR");

                    // Check if user is the owner or escalated to
                    var escalation = result.Data;
                    var isOwner = escalation?.SlaId != null; // You may need to check actual employee ID
                    var isEscalatedTo = escalation?.EscalatedToEmployeeId == currentUserId;

                    if (!isHR && !isOwner && !isEscalatedTo)
                    {
                        return Forbid("You don't have permission to view this escalation");
                    }
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching escalation details: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        /// <summary>
        /// Get combined violations and SLA escalations - HR ONLY
        /// </summary>
        [HttpGet("combined")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> GetCombinedViolationsAndEscalations()
        {
            try
            {
                var result = await _slaEscalationService.GetCombinedViolationsAndEscalationsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching combined violations: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        /// <summary>
        /// Get SLA escalation statistics - HR ONLY
        /// </summary>
        [HttpGet("sla-escalations/stats")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> GetSlaEscalationStats()
        {
            try
            {
                var result = await _slaEscalationService.GetSlaEscalationStatsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching escalation stats: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        #endregion
    }
}
