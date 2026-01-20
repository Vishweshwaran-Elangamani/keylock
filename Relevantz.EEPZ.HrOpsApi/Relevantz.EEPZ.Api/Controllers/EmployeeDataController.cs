
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.IService;

namespace Relevantz.EEPZ.Api.Controllers
{
    /// <summary>
    /// Provides endpoints for retrieving employee-related insights such as goal tracking data,
    /// compliance metrics, department details, and policy access based on user permissions.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeeDataController : ControllerBase
    {
        private readonly IEmployeeDataService _employeeDataService;
        private readonly ILogger<EmployeeDataController> _logger;

        /// <summary>
        /// Initializes a new instance of <see cref="EmployeeDataController"/>.
        /// </summary>
        /// <param name="employeeDataService">Service for retrieving employee analytics and related data.</param>
        /// <param name="logger">Logger instance for audit and error tracking.</param>
        public EmployeeDataController(
            IEmployeeDataService employeeDataService,
            ILogger<EmployeeDataController> logger)
        {
            _employeeDataService = employeeDataService;
            _logger = logger;
        }

        /// <summary>
        /// Retrieves a high-level compliance overview for goals across the organization.
        /// </summary>
        /// <returns>200 OK with compliance overview statistics.</returns>
        [HttpGet("goal-tracking/overview")]
        public async Task<IActionResult> GetComplianceOverview()
        {
            var result = await _employeeDataService.GetComplianceOverviewAsync();
            return Ok(result);
        }

        /// <summary>
        /// Retrieves employees who have not submitted or set their goals.
        /// </summary>
        /// <returns>
        /// 200 OK with employee list and metadata,  
        /// 500 Internal Server Error if processing fails.
        /// </returns>
        [HttpGet("goal-tracking/employees-without-goals")]
        public async Task<IActionResult> GetEmployeesWithoutGoals()
        {
            try
            {
                var userIdClaim =
                    User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                    User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ??
                    User.FindFirst("sub")?.Value;

                int? currentUserId = null;

                if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int parsedUserId))
                {
                    currentUserId = parsedUserId;
                    _logger.LogInformation("Current logged-in user ID: {UserId}", currentUserId);
                }
                else
                {
                    _logger.LogWarning("Unable to extract user ID from JWT token");
                }

                var (employees, message) = await _employeeDataService.GetEmployeesWithoutGoalsAsync(currentUserId);

                return Ok(new
                {
                    success = true,
                    message,
                    data = new
                    {
                        totalEmployeesWithoutGoals = employees.Count,
                        employees
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError("Error getting employees without goals: {Message}", ex.Message);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Suggests a set of recommended goals for a specific user.
        /// </summary>
        /// <param name="userId">The user ID to generate suggestions for.</param>
        /// <returns>
        /// 200 OK with suggested goals,  
        /// 404 Not Found if the user or context is invalid,  
        /// 500 Internal Server Error if generation fails.
        /// </returns>
        [HttpGet("goal-tracking/suggest-goals/{userId}")]
        public async Task<IActionResult> SuggestGoals(int userId)
        {
            try
            {
                var result = await _employeeDataService.SuggestGoalsAsync(userId);

                return Ok(new
                {
                    success = true,
                    message = "Goal suggestions generated",
                    data = result
                });
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError("Error suggesting goals for user {UserId}: {Message}", userId, ex.Message);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Sends goal reminders to employees who have pending or incomplete goals.
        /// </summary>
        /// <param name="request">Request containing reminder configuration.</param>
        /// <returns>
        /// 200 OK with reminder summary,  
        /// 404 Not Found if criteria are invalid,  
        /// 500 Internal Server Error on unexpected errors.
        /// </returns>
        [HttpPost("goal-tracking/send-goal-reminders")]
        public async Task<IActionResult> SendGoalReminders([FromBody] SendGoalReminderRequestDto request)
        {
            try
            {
                var result = await _employeeDataService.SendGoalRemindersAsync(request);

                return Ok(new
                {
                    success = true,
                    message = result.Message,
                    data = new
                    {
                        totalSent = result.TotalSent,
                        successful = result.Successful,
                        failed = result.Failed,
                        sentTo = result.SentTo,
                        failedSends = result.FailedSends
                    }
                });
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError("Error sending goal reminders: {Message}", ex.Message);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Retrieves the organization's goal adoption rate.
        /// </summary>
        /// <returns>
        /// 200 OK with adoption statistics,  
        /// 500 Internal Server Error on failure.
        /// </returns>
        [HttpGet("goal-tracking/goal-adoption-rate")]
        public async Task<IActionResult> GetGoalAdoptionRate()
        {
            try
            {
                var result = await _employeeDataService.GetGoalAdoptionRateAsync();
                return Ok(new { success = true, message = "Success", data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError("Error getting goal adoption rate: {Message}", ex.Message);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Retrieves detailed statistics related to employee goal activity.
        /// </summary>
        /// <returns>
        /// 200 OK with goal statistics data,  
        /// 500 Internal Server Error if retrieval fails.
        /// </returns>
        [HttpGet("goal-tracking/goal-statistics")]
        public async Task<IActionResult> GetGoalStatistics()
        {
            try
            {
                var result = await _employeeDataService.GetGoalStatisticsAsync();
                return Ok(new { success = true, message = "Success", data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError("Error getting goal statistics: {Message}", ex.Message);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Retrieves all departments available in the system.
        /// </summary>
        /// <returns>
        /// 200 OK with department data,  
        /// 400 Bad Request if service call fails.
        /// </returns>
        [HttpGet("department/all")]
        public async Task<IActionResult> GetAllDepartments()
        {
            try
            {
                var (departments, message) = await _employeeDataService.GetAllDepartmentsAsync();

                return Ok(new
                {
                    success = true,
                    message,
                    data = departments
                });
            }
            catch (Exception ex)
            {
                _logger.LogError("Backend Error: {Message}", ex.Message);
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        /// <summary>
        /// Retrieves a specific department by its identifier.
        /// </summary>
        /// <param name="id">The department identifier.</param>
        /// <returns>
        /// 200 OK when found,  
        /// 404 Not Found if the department does not exist,  
        /// 400 Bad Request on failure.
        /// </returns>
        [HttpGet("department/{id}")]
        public async Task<IActionResult> GetDepartmentById(int id)
        {
            try
            {
                var department = await _employeeDataService.GetDepartmentByIdAsync(id);

                if (department == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Department not found"
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = department
                });
            }
            catch (Exception ex)
            {
                _logger.LogError("Error getting department {Id}: {Message}", id, ex.Message);
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        /// <summary>
        /// Retrieves all published policies accessible to the logged-in user.
        /// </summary>
        /// <returns>
        /// 200 OK with a list of policies,  
        /// 500 Internal Server Error if retrieval fails.
        /// </returns>
        [HttpGet("policy/published")]
        [Authorize]
        public async Task<IActionResult> GetPublishedPolicies()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "Unknown";

                var policies = await _employeeDataService.GetPublishedPoliciesAsync(userId, userRole);

                return Ok(new { success = true, data = policies });
            }
            catch (Exception ex)
            {
                _logger.LogError("Error fetching published policies: {Message}", ex.Message);
                return StatusCode(500, new { success = false, message = "Failed to fetch policies" });
            }
        }

        /// <summary>
        /// Retrieves a specific policy by ID for the logged-in user.
        /// </summary>
        /// <param name="policyId">The policy identifier.</param>
        /// <returns>
        /// 200 OK with policy details,  
        /// 404 Not Found if access or policy is invalid,  
        /// 500 Internal Server Error on unexpected errors.
        /// </returns>
        [HttpGet("policy/{policyId}")]
        [Authorize]
        public async Task<IActionResult> GetPolicyById(int policyId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "Unknown";

                var policy = await _employeeDataService.GetPolicyByIdAsync(policyId, userId, userRole);

                return Ok(new { success = true, data = policy });
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError("Error fetching policy {PolicyId}: {Message}", policyId, ex.Message);
                return StatusCode(500, new { success = false, message = "Failed to fetch policy" });
            }
        }
    }
}
