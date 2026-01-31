using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Utils;
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
                EEPZBusinessLog.LogBusinessInformation("Retrieving all violations");

                var result = await _violationService.GetAllViolationsAsync();

                EEPZBusinessLog.LogBusinessInformation("Retrieved {Count} violations", result.Data?.Count ?? 0);
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Error retrieving all violations", ex);
                throw;
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
                EEPZBusinessLog.LogBusinessInformation("Retrieving violation {ViolationId}", id);

                var result = await _violationService.GetViolationByIdAsync(id);

                if (!result.Success)
                {
                    EEPZBusinessLog.LogBusinessWarning("Violation {ViolationId} not found", id);
                    return NotFound(result);
                }

                EEPZBusinessLog.LogBusinessInformation("Violation {ViolationId} retrieved successfully", id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Error retrieving violation {ViolationId}", ex, id);
                throw;
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
                {
                    EEPZBusinessLog.LogBusinessWarning("Invalid user authentication for violations retrieval");
                    return Unauthorized(new { success = false, message = "Invalid user authentication" });
                }

                var isHR = User.IsInRole("Admin") || User.IsInRole("HR");

                if (!isHR && currentUserId != EmployeeUserId)
                {
                    EEPZBusinessLog.LogBusinessWarning("User {CurrentUserId} attempted unauthorized access to violations of user {EmployeeUserId}",
                        currentUserId, EmployeeUserId);
                    return Forbid("You can only view your own violations");
                }

                EEPZBusinessLog.LogBusinessInformation("User {CurrentUserId} retrieving violations for employee {EmployeeUserId}",
                    currentUserId, EmployeeUserId);

                var result = await _violationService.GetViolationsByEmployeeAsync(EmployeeUserId);

                EEPZBusinessLog.LogBusinessInformation("Retrieved {Count} violations for employee {EmployeeUserId}",
                    result.Data?.Count ?? 0, EmployeeUserId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Error retrieving violations for employee {EmployeeUserId}", ex, EmployeeUserId);
                throw;
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
                EEPZBusinessLog.LogBusinessInformation("Retrieving violations for policy {PolicyId}", policyId);

                var result = await _violationService.GetViolationsByPolicyAsync(policyId);

                EEPZBusinessLog.LogBusinessInformation("Retrieved {Count} violations for policy {PolicyId}",
                    result.Data?.Count ?? 0, policyId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Error retrieving violations for policy {PolicyId}", ex, policyId);
                throw;
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
                    EEPZBusinessLog.LogBusinessWarning("Unable to extract user ID for reporting violation");
                    return Unauthorized(new { success = false, message = "Invalid user authentication" });
                }

                EEPZBusinessLog.LogBusinessInformation("User {ReportedByUserId} reporting violation for employee {EmployeeUserId}, policy {PolicyId}",
                    reportedByUserId, request.EmployeeUserId, request.PolicyId);

                var result = await _violationService.ReportViolationAsync(request, reportedByUserId);

                if (!result.Success)
                {
                    EEPZBusinessLog.LogBusinessWarning("Violation report failed for employee {EmployeeUserId}: {Message}",
                        request.EmployeeUserId, result.Message);
                    return BadRequest(result);
                }

                EEPZBusinessLog.LogBusinessInformation("Violation reported successfully for employee {EmployeeUserId} by user {ReportedByUserId}",
                    request.EmployeeUserId, reportedByUserId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Error reporting violation", ex);
                throw;
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
                {
                    EEPZBusinessLog.LogBusinessInformation("User {UserId} resolving violation {ViolationId}", userId, id);
                }

                var result = await _violationService.ResolveViolationAsync(id, request);

                if (!result.Success)
                {
                    EEPZBusinessLog.LogBusinessWarning("Violation {ViolationId} resolution failed: {Message}", id, result.Message);
                    return BadRequest(result);
                }

                EEPZBusinessLog.LogBusinessInformation("Violation {ViolationId} resolved successfully", id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Error resolving violation {ViolationId}", ex, id);
                throw;
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
                EEPZBusinessLog.LogBusinessInformation("Retrieving violation statistics");

                var result = await _violationService.GetViolationStatsAsync();

                EEPZBusinessLog.LogBusinessInformation("Violation statistics retrieved successfully");
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Error retrieving violation statistics", ex);
                throw;
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
                EEPZBusinessLog.LogBusinessInformation("Fetching all SLA escalations");

                var result = await _slaEscalationService.GetAllSlaEscalationsAsync();

                EEPZBusinessLog.LogBusinessInformation("Retrieved {Count} SLA escalations", result.Data?.Count ?? 0);
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Error retrieving all SLA escalations", ex);
                throw;
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
                {
                    EEPZBusinessLog.LogBusinessWarning("Invalid user authentication for SLA escalations retrieval");
                    return Unauthorized(new { success = false, message = "Invalid user authentication" });
                }

                var isHR = User.IsInRole("Admin") || User.IsInRole("HR");

                if (!isHR && currentUserId != EmployeeUserId)
                {
                    EEPZBusinessLog.LogBusinessWarning("Unauthorized SLA escalation access attempt by user {CurrentUserId} for employee {EmployeeUserId}",
                        currentUserId, EmployeeUserId);
                    return Forbid("You can only view your own SLA escalations");
                }

                EEPZBusinessLog.LogBusinessInformation("User {CurrentUserId} retrieving SLA escalations for employee {EmployeeUserId}",
                    currentUserId, EmployeeUserId);

                var result = await _slaEscalationService.GetSlaEscalationsByEmployeeAsync(EmployeeUserId);

                EEPZBusinessLog.LogBusinessInformation("Retrieved {Count} SLA escalations for employee {EmployeeUserId}",
                    result.Data?.Count ?? 0, EmployeeUserId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Error retrieving SLA escalations for employee {EmployeeUserId}", ex, EmployeeUserId);
                throw;
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
                EEPZBusinessLog.LogBusinessInformation("Retrieving SLA escalation {EscalationId}", escalationId);

                var result = await _slaEscalationService.GetSlaEscalationByIdAsync(escalationId);

                if (!result.Success)
                {
                    EEPZBusinessLog.LogBusinessWarning("SLA escalation {EscalationId} not found", escalationId);
                    return NotFound(result);
                }

                var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

                if (int.TryParse(currentUserIdClaim, out int currentUserId))
                {
                    var isHR = User.IsInRole("Admin") || User.IsInRole("HR");

                    var escalation = result.Data;
                    var isOwner = escalation?.SlaId != null;
                    var isAssigned = escalation?.EscalatedToEmployeeId == currentUserId;

                    if (!isHR && !isOwner && !isAssigned)
                    {
                        EEPZBusinessLog.LogBusinessWarning("User {UserId} denied access to SLA escalation {EscalationId}",
                            currentUserId, escalationId);
                        return Forbid("You don't have permission to view this escalation");
                    }
                }

                EEPZBusinessLog.LogBusinessInformation("SLA escalation {EscalationId} retrieved successfully", escalationId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Error retrieving SLA escalation {EscalationId}", ex, escalationId);
                throw;
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
                EEPZBusinessLog.LogBusinessInformation("Retrieving combined violations and escalations");

                var result = await _slaEscalationService.GetCombinedViolationsAndEscalationsAsync();

                EEPZBusinessLog.LogBusinessInformation("Combined violations and escalations retrieved successfully");
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Error retrieving combined violations and escalations", ex);
                throw;
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
                EEPZBusinessLog.LogBusinessInformation("Retrieving SLA escalation statistics");

                var result = await _slaEscalationService.GetSlaEscalationStatsAsync();

                EEPZBusinessLog.LogBusinessInformation("SLA escalation statistics retrieved successfully");
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Error retrieving SLA escalation statistics", ex);
                throw;
            }
        }

        #endregion
    }
}
