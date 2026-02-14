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
        private readonly ISlaEscalationService _slaEscalationService;
        private readonly ILogger<ViolationController> _logger;


        /// <summary>
        /// Initializes a new instance of <see cref="ViolationController"/>.
        /// </summary>
        /// <param name="slaEscalationService">Service managing SLA escalation logic.</param>
        /// <param name="logger">Logger for operational and error tracking.</param>
        public ViolationController(
            ISlaEscalationService slaEscalationService,
            ILogger<ViolationController> logger)
        {
            _slaEscalationService = slaEscalationService;
            _logger = logger;
        }

        /// <summary>
        /// Retrieves all SLA escalations.  
        /// Restricted to Admin and HR.
        /// </summary>
        [HttpGet("sla-escalations")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> GetAllSlaEscalations()
        {
            EEPZBusinessLog.LogBusinessInformation("Fetching all SLA escalations");


            var result = await _slaEscalationService.GetAllSlaEscalationsAsync();


            EEPZBusinessLog.LogBusinessInformation("Retrieved {Count} SLA escalations", result.Data?.Count ?? 0);
            return Ok(result);
        }


        /// <summary>
        /// Retrieves SLA escalations for a specific employee.  
        /// HR/Admin can view all employees; Employees can only view their own.
        /// </summary>
        /// <param name="EmployeeUserId">Employee ID.</param>
        [HttpGet("sla-escalations/employee/{EmployeeUserId}")]
        public async Task<IActionResult> GetSlaEscalationsByEmployee(int EmployeeUserId)
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


        /// <summary>
        /// Retrieves details for a specific SLA escalation.
        /// HR/Admin can view all; employees can only view if assigned.
        /// </summary>
        /// <param name="escalationId">SLA escalation ID.</param>
        [HttpGet("sla-escalations/{escalationId}")]
        public async Task<IActionResult> GetSlaEscalationById(int escalationId)
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


        /// <summary>
        /// Retrieves SLA escalation statistics.
        /// Restricted to Admin and HR.
        /// </summary>
        [HttpGet("sla-escalations/stats")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> GetSlaEscalationStats()
        {
            EEPZBusinessLog.LogBusinessInformation("Retrieving SLA escalation statistics");


            var result = await _slaEscalationService.GetSlaEscalationStatsAsync();


            EEPZBusinessLog.LogBusinessInformation("SLA escalation statistics retrieved successfully");
            return Ok(result);
        }
    }
}
