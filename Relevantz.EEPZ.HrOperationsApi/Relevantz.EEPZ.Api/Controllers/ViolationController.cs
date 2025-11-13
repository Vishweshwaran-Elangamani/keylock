using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.IService;

namespace Relevantz.EEPZ.Api.Controllers
{
   [ApiController]
    [Route("api/[controller]")]
    [Authorize] //  JWT authentication enabled for all endpoints
    public class ViolationController : ControllerBase
    {
        private readonly IViolationService _violationService;
        private readonly ILogger<ViolationController> _logger;
 
        public ViolationController(IViolationService violationService, ILogger<ViolationController> logger)
        {
            _violationService = violationService;
            _logger = logger;
        }
 
        /// <summary>
        /// Get all violations - HR ONLY
        /// </summary>
        [HttpGet("list")]
        [Authorize(Roles = "Admin,HR")] //  Role-based authorization
        public async Task<IActionResult> GetAllViolations()
        {
            try
            {
                var result = await _violationService.GetAllViolationsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error fetching all violations: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }
 
        /// <summary>
        /// Get violation by ID - HR and Manager
        /// </summary>
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,HR,Manager")] //  Role-based authorization
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
                _logger.LogError($" Error fetching violation {id}: {ex.Message}");
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
                //  Get current user ID from JWT
                var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
 
                if (string.IsNullOrEmpty(currentUserIdClaim) || !int.TryParse(currentUserIdClaim, out int currentUserId))
                {
                    return Unauthorized(new { success = false, message = "Invalid user authentication" });
                }
 
                //  Check if user has HR role
                var isHR = User.IsInRole("Admin") || User.IsInRole("HR");
 
                //  If not HR, only allow viewing own violations
                if (!isHR && currentUserId != EmployeeUserId)
                {
                    _logger.LogWarning($" User {currentUserId} attempted to access violations of user {EmployeeUserId}");
                    return Forbid("You can only view your own violations");
                }
 
                var result = await _violationService.GetViolationsByEmployeeAsync(EmployeeUserId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error fetching violations for employee {EmployeeUserId}: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }
 
        /// <summary>
        /// Get violations by policy - HR ONLY
        /// </summary>
        [HttpGet("policy/{policyId}")]
        [Authorize(Roles = "Admin,HR")] //  Role-based authorization
        public async Task<IActionResult> GetViolationsByPolicy(int policyId)
        {
            try
            {
                var result = await _violationService.GetViolationsByPolicyAsync(policyId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error fetching violations for policy {policyId}: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }
 
        /// <summary>
        /// Report violation - HR and Manager
        /// </summary>
        [HttpPost("report")]
        [Authorize(Roles = "Admin,HR,Manager")] //  Role-based authorization
        public async Task<IActionResult> ReportViolation([FromBody] ReportViolationRequestDto request)
        {
            try
            {
                //  Get user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
 
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int reportedByUserId))
                {
                    _logger.LogWarning(" Unable to extract user ID from JWT token for reporting violation");
                    return Unauthorized(new { success = false, message = "Invalid user authentication" });
                }
 
                _logger.LogInformation($" User {reportedByUserId} reporting violation for employee {request.EmployeeUserId}");
 
                var result = await _violationService.ReportViolationAsync(request, reportedByUserId);
 
                if (!result.Success)
                    return BadRequest(result);
 
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error reporting violation: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred while reporting violation" });
            }
        }
 
        /// <summary>
        /// Resolve violation - HR ONLY
        /// </summary>
        [HttpPut("resolve/{id}")]
        [Authorize(Roles = "Admin,HR")] //  Role-based authorization
        public async Task<IActionResult> ResolveViolation(int id, [FromBody] ResolveViolationRequestDto request)
        {
            try
            {
                //  Get user ID from JWT (for audit trail)
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
 
                if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int userId))
                {
                    _logger.LogInformation($" User {userId} resolving violation {id}");
                }
 
                var result = await _violationService.ResolveViolationAsync(id, request);
 
                if (!result.Success)
                    return BadRequest(result);
 
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error resolving violation {id}: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred while resolving violation" });
            }
        }
 
        /// <summary>
        /// Get violation statistics - HR ONLY
        /// </summary>
        [HttpGet("stats")]
        [Authorize(Roles = "Admin,HR")] //  Role-based authorization
        public async Task<IActionResult> GetViolationStats()
        {
            try
            {
                var result = await _violationService.GetViolationStatsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error fetching violation stats: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }
    }
 
}
