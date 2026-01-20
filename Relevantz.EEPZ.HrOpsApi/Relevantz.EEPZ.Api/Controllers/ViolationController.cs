
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
    /// <summary>
    /// Provides endpoints for managing policy violations and SLA escalations,
    /// including reporting, resolving, viewing, and retrieving analytics.
    /// Includes strict role-based access for HR, Admin, Managers, and Employees.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ViolationController : ControllerBase
    {
        private readonly IViolationService _violationService;
        private readonly ISlaEscalationService _slaEscalationService;
        private readonly ILogger<ViolationController> _logger;

        /// <summary>
        /// Initializes a new instance of <see cref="ViolationController"/>.
        /// </summary>
        /// <param name="violationService">Service handling violation operations.</param>
        /// <param name="slaEscalationService">Service managing SLA escalation logic.</param>
        /// <param name="logger">Logger for operational and error tracking.</param>
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
        /// Retrieves all violations in the system.  
        /// Restricted to Admin and HR roles.
        /// </summary>
        /// <returns>List of violations or error response.</returns>
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
        /// Retrieves a specific violation by its ID.  
        /// Accessible by Admin, HR, and Managers.
        /// </summary>
        /// <param name="id">Violation ID.</param>
        /// <returns>The violation details if found.</returns>
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
        /// Retrieves violations for a specific employee.  
        /// HR/Admin can view all; Employees can only view their own.
        /// </summary>
        /// <param name="EmployeeUserId">Employee user ID.</param>
        [HttpGet("employee/{EmployeeUserId}")]
        public async Task<IActionResult> GetViolationsByEmployee(int EmployeeUserId)
        {
            try
            {
                var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

                if (!int.TryParse(currentUserIdClaim, out int currentUserId))
                    return Unauthorized(new { success = false, message = "Invalid user authentication" });

                var isHR = User.IsInRole("Admin") || User.IsInRole("HR");

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
        /// Retrieves violations linked to a specific policy.  
        /// Restricted to Admin and HR.
        /// </summary>
        /// <param name="policyId">Policy ID.</param>
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
        /// Reports a new policy violation.  
        /// Allowed for Admin, HR, and Managers.
        /// </summary>
        /// <param name="request">Violation report details.</param>
        [HttpPost("report")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<IActionResult> ReportViolation([FromBody] ReportViolationRequestDto request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

                if (!int.TryParse(userIdClaim, out int reportedByUserId))
                {
                    _logger.LogWarning("Unable to extract user ID for reporting violation");
                    return Unauthorized(new { success = false, message = "Invalid user authentication" });
                }

                _logger.LogInformation($"User {reportedByUserId} reporting violation for {request.EmployeeUserId}");

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
        /// Resolves an existing violation.  
        /// Restricted to Admin and HR roles.
        /// </summary>
        /// <param name="id">Violation ID.</param>
        /// <param name="request">Resolution details.</param>
        [HttpPut("resolve/{id}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> ResolveViolation(int id, [FromBody] ResolveViolationRequestDto request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

                if (int.TryParse(userIdClaim, out int userId))
                    _logger.LogInformation($"User {userId} resolving violation {id}");

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
        /// Retrieves aggregated violation statistics.  
        /// Restricted to Admin and HR.
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
        /// Retrieves all SLA escalations.  
        /// Restricted to Admin and HR.
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
        /// Retrieves SLA escalations for a specific employee.  
        /// HR/Admin can view all employees; Employees can only view their own.
        /// </summary>
        /// <param name="EmployeeUserId">Employee ID.</param>
        [HttpGet("sla-escalations/employee/{EmployeeUserId}")]
        public async Task<IActionResult> GetSlaEscalationsByEmployee(int EmployeeUserId)
        {
            try
            {
                var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

                if (!int.TryParse(currentUserIdClaim, out int currentUserId))
                    return Unauthorized(new { success = false, message = "Invalid user authentication" });

                var isHR = User.IsInRole("Admin") || User.IsInRole("HR");

                if (!isHR && currentUserId != EmployeeUserId)
                {
                    _logger.LogWarning($"Unauthorized SLA escalation access attempt by user {currentUserId}");
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
        /// Retrieves details for a specific SLA escalation.
        /// HR/Admin can view all; employees can only view if assigned.
        /// </summary>
        /// <param name="escalationId">SLA escalation ID.</param>
        [HttpGet("sla-escalations/{escalationId}")]
        public async Task<IActionResult> GetSlaEscalationById(int escalationId)
        {
            try
            {
                var result = await _slaEscalationService.GetSlaEscalationByIdAsync(escalationId);

                if (!result.Success)
                    return NotFound(result);

                var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

                if (int.TryParse(currentUserIdClaim, out int currentUserId))
                {
                    var isHR = User.IsInRole("Admin") || User.IsInRole("HR");

                    var escalation = result.Data;
                    var isOwner = escalation?.SlaId != null;
                    var isAssigned = escalation?.EscalatedToEmployeeId == currentUserId;

                    if (!isHR && !isOwner && !isAssigned)
                        return Forbid("You don't have permission to view this escalation");
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
        /// Retrieves combined violation and SLA escalation records.
        /// Restricted to HR and Admin.
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
        /// Retrieves SLA escalation statistics.
        /// Restricted to Admin and HR.
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
