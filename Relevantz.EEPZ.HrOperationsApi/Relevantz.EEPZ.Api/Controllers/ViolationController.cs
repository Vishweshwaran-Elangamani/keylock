// using System.IdentityModel.Tokens.Jwt;
// using System.Security.Claims;
// using System.Threading.Tasks;
// using Microsoft.AspNetCore.Authorization;
// using Microsoft.AspNetCore.Mvc;
// using Relevantz.EEPZ.Common.DTOs.Request;
// using Relevantz.EEPZ.Core.IService;

// namespace Relevantz.EEPZ.Api.Controllers
// {
//    [ApiController]
//     [Route("api/[controller]")]
//     [Authorize] //  JWT authentication enabled for all endpoints
//     public class ViolationController : ControllerBase
//     {
//         private readonly IViolationService _violationService;
//         private readonly ILogger<ViolationController> _logger;
 
//         public ViolationController(IViolationService violationService, ILogger<ViolationController> logger)
//         {
//             _violationService = violationService;
//             _logger = logger;
//         }
 
//         /// <summary>
//         /// Get all violations - HR ONLY
//         /// </summary>
//         [HttpGet("list")]
//         [Authorize(Roles = "Admin,HR")] //  Role-based authorization
//         public async Task<IActionResult> GetAllViolations()
//         {
//             try
//             {
//                 var result = await _violationService.GetAllViolationsAsync();
//                 return Ok(result);
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError($" Error fetching all violations: {ex.Message}");
//                 return StatusCode(500, new { success = false, message = "An error occurred" });
//             }
//         }
 
//         /// <summary>
//         /// Get violation by ID - HR and Manager
//         /// </summary>
//         [HttpGet("{id}")]
//         [Authorize(Roles = "Admin,HR,Manager")] //  Role-based authorization
//         public async Task<IActionResult> GetViolationById(int id)
//         {
//             try
//             {
//                 var result = await _violationService.GetViolationByIdAsync(id);
 
//                 if (!result.Success)
//                     return NotFound(result);
 
//                 return Ok(result);
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError($" Error fetching violation {id}: {ex.Message}");
//                 return StatusCode(500, new { success = false, message = "An error occurred" });
//             }
//         }
 
//         /// <summary>
//         /// Get violations by employee
//         /// Role-based access: HR sees all, Employee sees own only
//         /// </summary>
//         [HttpGet("employee/{EmployeeUserId}")]
//         public async Task<IActionResult> GetViolationsByEmployee(int EmployeeUserId)
//         {
//             try
//             {
//                 //  Get current user ID from JWT
//                 var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
//                     ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
 
//                 if (string.IsNullOrEmpty(currentUserIdClaim) || !int.TryParse(currentUserIdClaim, out int currentUserId))
//                 {
//                     return Unauthorized(new { success = false, message = "Invalid user authentication" });
//                 }
 
//                 //  Check if user has HR role
//                 var isHR = User.IsInRole("Admin") || User.IsInRole("HR");
 
//                 //  If not HR, only allow viewing own violations
//                 if (!isHR && currentUserId != EmployeeUserId)
//                 {
//                     _logger.LogWarning($" User {currentUserId} attempted to access violations of user {EmployeeUserId}");
//                     return Forbid("You can only view your own violations");
//                 }
 
//                 var result = await _violationService.GetViolationsByEmployeeAsync(EmployeeUserId);
//                 return Ok(result);
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError($" Error fetching violations for employee {EmployeeUserId}: {ex.Message}");
//                 return StatusCode(500, new { success = false, message = "An error occurred" });
//             }
//         }
 
//         /// <summary>
//         /// Get violations by policy - HR ONLY
//         /// </summary>
//         [HttpGet("policy/{policyId}")]
//         [Authorize(Roles = "Admin,HR")] //  Role-based authorization
//         public async Task<IActionResult> GetViolationsByPolicy(int policyId)
//         {
//             try
//             {
//                 var result = await _violationService.GetViolationsByPolicyAsync(policyId);
//                 return Ok(result);
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError($" Error fetching violations for policy {policyId}: {ex.Message}");
//                 return StatusCode(500, new { success = false, message = "An error occurred" });
//             }
//         }
 
//         /// <summary>
//         /// Report violation - HR and Manager
//         /// </summary>
//         [HttpPost("report")]
//         [Authorize(Roles = "Admin,HR,Manager")] //  Role-based authorization
//         public async Task<IActionResult> ReportViolation([FromBody] ReportViolationRequestDto request)
//         {
//             try
//             {
//                 //  Get user ID from JWT token
//                 var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
//                     ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
 
//                 if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int reportedByUserId))
//                 {
//                     _logger.LogWarning(" Unable to extract user ID from JWT token for reporting violation");
//                     return Unauthorized(new { success = false, message = "Invalid user authentication" });
//                 }
 
//                 _logger.LogInformation($" User {reportedByUserId} reporting violation for employee {request.EmployeeUserId}");
 
//                 var result = await _violationService.ReportViolationAsync(request, reportedByUserId);
 
//                 if (!result.Success)
//                     return BadRequest(result);
 
//                 return Ok(result);
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError($" Error reporting violation: {ex.Message}");
//                 return StatusCode(500, new { success = false, message = "An error occurred while reporting violation" });
//             }
//         }
 
//         /// <summary>
//         /// Resolve violation - HR ONLY
//         /// </summary>
//         [HttpPut("resolve/{id}")]
//         [Authorize(Roles = "Admin,HR")] //  Role-based authorization
//         public async Task<IActionResult> ResolveViolation(int id, [FromBody] ResolveViolationRequestDto request)
//         {
//             try
//             {
//                 //  Get user ID from JWT (for audit trail)
//                 var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
//                     ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
 
//                 if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int userId))
//                 {
//                     _logger.LogInformation($" User {userId} resolving violation {id}");
//                 }
 
//                 var result = await _violationService.ResolveViolationAsync(id, request);
 
//                 if (!result.Success)
//                     return BadRequest(result);
 
//                 return Ok(result);
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError($" Error resolving violation {id}: {ex.Message}");
//                 return StatusCode(500, new { success = false, message = "An error occurred while resolving violation" });
//             }
//         }
 
//         /// <summary>
//         /// Get violation statistics - HR ONLY
//         /// </summary>
//         [HttpGet("stats")]
//         [Authorize(Roles = "Admin,HR")] //  Role-based authorization
//         public async Task<IActionResult> GetViolationStats()
//         {
//             try
//             {
//                 var result = await _violationService.GetViolationStatsAsync();
//                 return Ok(result);
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError($" Error fetching violation stats: {ex.Message}");
//                 return StatusCode(500, new { success = false, message = "An error occurred" });
//             }
//         }
//     }
 
// }

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.IRepository;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // JWT authentication enabled for all endpoints
    public class ViolationController : ControllerBase
    {
        private readonly IViolationService _violationService;
        private readonly ISlaEscalationRepository _slaEscalationRepository;
        private readonly ILogger<ViolationController> _logger;

        public ViolationController(
            IViolationService violationService,
            ISlaEscalationRepository slaEscalationRepository,
            ILogger<ViolationController> logger)
        {
            _violationService = violationService;
            _slaEscalationRepository = slaEscalationRepository;
            _logger = logger;
        }

        // ===================================================================
        // VIOLATION ENDPOINTS
        // ===================================================================

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
                // Get user ID from JWT (for audit trail)
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

        // ===================================================================
        // SLA ESCALATION ENDPOINTS
        // ===================================================================

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
                var escalations = await _slaEscalationRepository.GetAllAsync();

                var response = escalations.Select(MapToEscalationResponse).ToList();

                return Ok(new
                {
                    success = true,
                    message = $"Retrieved {response.Count} SLA escalations",
                    data = response
                });
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

                var escalations = await _slaEscalationRepository.GetByEmployeeUserIdAsync(EmployeeUserId);
                var response = escalations.Select(MapToEscalationResponse).ToList();

                return Ok(new
                {
                    success = true,
                    message = $"Retrieved {response.Count} escalations for employee",
                    data = response
                });
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
                var escalation = await _slaEscalationRepository.GetByIdAsync(escalationId);

                if (escalation == null)
                {
                    return NotFound(new { success = false, message = "Escalation not found" });
                }

                // Authorization check
                var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

                if (!string.IsNullOrEmpty(currentUserIdClaim) && int.TryParse(currentUserIdClaim, out int currentUserId))
                {
                    var isHR = User.IsInRole("Admin") || User.IsInRole("HR");
                    var isOwner = escalation.Sla?.EmployeeId == currentUserId;
                    var isEscalatedTo = escalation.EscalatedToEmployeeId == currentUserId;

                    if (!isHR && !isOwner && !isEscalatedTo)
                    {
                        return Forbid("You don't have permission to view this escalation");
                    }
                }

                var response = MapToEscalationResponse(escalation);

                return Ok(new
                {
                    success = true,
                    message = "Escalation details retrieved",
                    data = response
                });
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
                // Get regular violations
                var violationsResult = await _violationService.GetAllViolationsAsync();

                // Get SLA escalations
                var escalations = await _slaEscalationRepository.GetAllAsync();

                var escalationData = escalations.Select(e => new
                {
                    type = "SLA Escalation",
                    id = e.EscalationId,
                    employeeUserId = e.Sla?.EmployeeId,
                    employeeName = GetEmployeeName(e.Sla?.Employee?.Userprofile),
                    violation = e.Reason,
                    severity = GetSeverityLevel(CalculateDaysOverdue(e.Sla?.Deadline)),
                    status = e.EscalationStatus,
                    reportedDate = e.SubmittedAt,
                    details = new
                    {
                        slaType = e.Sla?.Slatype,
                        escalationLevel = e.EscalationLevel,
                        daysOverdue = CalculateDaysOverdue(e.Sla?.Deadline)
                    }
                }).ToList();

                return Ok(new
                {
                    success = true,
                    message = "Combined violations and escalations retrieved",
                    data = new
                    {
                        violations = violationsResult.Data,
                        slaEscalations = escalationData,
                        summary = new
                        {
                            totalViolations = violationsResult.Data?.Count() ?? 0,
                            totalEscalations = escalationData.Count,
                            totalCombined = (violationsResult.Data?.Count() ?? 0) + escalationData.Count
                        }
                    }
                });
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
                var escalations = await _slaEscalationRepository.GetAllAsync();

                var stats = new
                {
                    totalEscalations = escalations.Count,
                    openEscalations = escalations.Count(e => e.EscalationStatus == "Open" || e.EscalationStatus == "Pending"),
                    resolvedEscalations = escalations.Count(e => e.EscalationStatus == "Resolved"),
                    byLevel = escalations.GroupBy(e => e.EscalationLevel)
                        .Select(g => new { level = g.Key, count = g.Count() })
                        .ToList(),
                    bySeverity = escalations.GroupBy(e => GetSeverityLevel(CalculateDaysOverdue(e.Sla?.Deadline)))
                        .Select(g => new { severity = g.Key, count = g.Count() })
                        .ToList(),
                    recent = escalations
                        .OrderByDescending(e => e.SubmittedAt)
                        .Take(5)
                        .Select(e => new
                        {
                            escalationId = e.EscalationId,
                            employeeName = GetEmployeeName(e.Sla?.Employee?.Userprofile),
                            slaType = e.Sla?.Slatype,
                            escalationLevel = e.EscalationLevel,
                            submittedAt = e.SubmittedAt
                        })
                        .ToList()
                };

                return Ok(new
                {
                    success = true,
                    message = "Escalation statistics retrieved",
                    data = stats
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching escalation stats: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        // ===================================================================
        // HELPER METHODS
        // ===================================================================

        private SlaEscalationResponseDto MapToEscalationResponse(Common.Entities.Slaescalation escalation)
        {
            return new SlaEscalationResponseDto
            {
                EscalationId = escalation.EscalationId,
                SlaId = escalation.Slaid,
                SlaType = escalation.Sla?.Slatype,
                EmployeeUserId = escalation.Sla?.EmployeeId ?? 0,
                EmployeeName = GetEmployeeName(escalation.Sla?.Employee?.Userprofile),
                EmployeeEmail = escalation.Sla?.Employee?.Userprofile?.PersonalEmail,
                EscalatedToEmployeeId = escalation.EscalatedToEmployeeId,
                EscalatedToName = GetEmployeeName(escalation.EscalatedToEmployee?.Userprofile),
                EscalatedToEmail = escalation.EscalatedToEmployee?.Userprofile?.PersonalEmail,
                EscalationLevel = escalation.EscalationLevel,
                Reason = escalation.Reason,
                Description = escalation.Description,
                EscalationStatus = escalation.EscalationStatus,
                SubmittedByName = GetEmployeeName(escalation.SubmittedByEmployee?.Userprofile),
                SubmittedAt = escalation.SubmittedAt,
                EscalationDeadline = escalation.EscalationDeadline,
                ResolvedAt = escalation.ResolvedAt,
                ResolvedByName = GetEmployeeName(escalation.ResolvedByEmployee?.Userprofile),
                ResolutionComments = escalation.ResolutionComments,
                SlaDeadline = escalation.Sla?.Deadline,
                SlaStatus = escalation.Sla?.Status,
                DaysOverdue = CalculateDaysOverdue(escalation.Sla?.Deadline),
                Severity = GetSeverityLevel(CalculateDaysOverdue(escalation.Sla?.Deadline))
            };
        }

        private string GetEmployeeName(Common.Entities.Userprofile? userprofile)
        {
            if (userprofile == null)
                return "Unknown";
            return $"{userprofile.FirstName} {userprofile.LastName}";
        }

        private int CalculateDaysOverdue(DateTime? deadline)
        {
            if (!deadline.HasValue || deadline.Value >= DateTime.Now)
                return 0;
            return (int)(DateTime.Now - deadline.Value).TotalDays;
        }

        private string GetSeverityLevel(int daysOverdue)
        {
            if (daysOverdue >= 7)
                return "Critical";
            if (daysOverdue >= 3)
                return "High";
            if (daysOverdue >= 1)
                return "Medium";
            return "Low";
        }
    }
}
