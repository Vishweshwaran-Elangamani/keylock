using System;
using System.Security.Claims;
using System.Threading.Tasks;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.Utils;
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
            try
            {
                EEPZBusinessLog.LogBusinessInformation("Retrieving goal tracking compliance overview");
                
                var result = await _employeeDataService.GetComplianceOverviewAsync();
                
                EEPZBusinessLog.LogBusinessInformation("Goal tracking compliance overview retrieved successfully");
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Failed to retrieve goal tracking compliance overview", ex);
                throw;
            }
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

                if (!string.IsNullOrEmpty(userIdClaim) &&
                    int.TryParse(userIdClaim, out int parsedUserId))
                {
                    currentUserId = parsedUserId;
                    EEPZBusinessLog.LogBusinessInformation("User {UserId} requesting employees without goals", currentUserId);
                }
                else
                {
                    EEPZBusinessLog.LogBusinessWarning("Unable to extract user ID from JWT token for employees without goals request");
                }

                var (employees, message) =
                    await _employeeDataService.GetEmployeesWithoutGoalsAsync(currentUserId);

                EEPZBusinessLog.LogBusinessInformation("Retrieved {Count} employees without goals", employees.Count);

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
                EEPZBusinessLog.LogBusinessError("Failed to retrieve employees without goals", ex);
                throw;
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
                EEPZBusinessLog.LogBusinessInformation("Generating goal suggestions for user {UserId}", userId);
                
                var result = await _employeeDataService.SuggestGoalsAsync(userId);

                EEPZBusinessLog.LogBusinessInformation("Goal suggestions generated successfully for user {UserId}", userId);

                return Ok(new
                {
                    success = true,
                    message = "Goal suggestions generated",
                    data = result
                });
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Failed to generate goal suggestions for user {UserId}", ex, userId);
                throw;
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
        public async Task<IActionResult> SendGoalReminders(
            [FromBody] SendGoalReminderRequestDto request)
        {
            try
            {
                EEPZBusinessLog.LogBusinessInformation("Sending goal reminders to employees");
                
                var result = await _employeeDataService.SendGoalRemindersAsync(request);

                EEPZBusinessLog.LogBusinessInformation("Goal reminders sent: {TotalSent} total, {Successful} successful, {Failed} failed", 
                    result.TotalSent, result.Successful, result.Failed);

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
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Failed to send goal reminders", ex);
                throw;
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
                EEPZBusinessLog.LogBusinessInformation("Retrieving goal adoption rate");
                
                var result = await _employeeDataService.GetGoalAdoptionRateAsync();
                
                EEPZBusinessLog.LogBusinessInformation("Goal adoption rate retrieved successfully");
                return Ok(new { success = true, message = "Success", data = result });
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Failed to retrieve goal adoption rate", ex);
                throw;
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
                EEPZBusinessLog.LogBusinessInformation("Retrieving goal statistics");
                
                var result = await _employeeDataService.GetGoalStatisticsAsync();
                
                EEPZBusinessLog.LogBusinessInformation("Goal statistics retrieved successfully");
                return Ok(new { success = true, message = "Success", data = result });
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Failed to retrieve goal statistics", ex);
                throw;
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
                EEPZBusinessLog.LogBusinessInformation("Retrieving all departments");
                
                var (departments, message) =
                    await _employeeDataService.GetAllDepartmentsAsync();

                EEPZBusinessLog.LogBusinessInformation("Retrieved {Count} departments", departments.Count);

                return Ok(new
                {
                    success = true,
                    message,
                    data = departments
                });
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Failed to retrieve all departments", ex);
                throw;
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
                EEPZBusinessLog.LogBusinessInformation("Retrieving department with ID {DepartmentId}", id);
                
                var department =
                    await _employeeDataService.GetDepartmentByIdAsync(id);

                if (department == null)
                {
                    EEPZBusinessLog.LogBusinessWarning("Department with ID {DepartmentId} not found", id);
                    return NotFound(new
                    {
                        success = false,
                        message = "Department not found"
                    });
                }

                EEPZBusinessLog.LogBusinessInformation("Department with ID {DepartmentId} retrieved successfully", id);

                return Ok(new
                {
                    success = true,
                    data = department
                });
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Failed to retrieve department with ID {DepartmentId}", ex, id);
                throw;
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
                var userId =
                    int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                var userRole =
                    User.FindFirst(ClaimTypes.Role)?.Value ?? "Unknown";

                EEPZBusinessLog.LogBusinessInformation("User {UserId} with role {UserRole} retrieving published policies", userId, userRole);

                var policies =
                    await _employeeDataService.GetPublishedPoliciesAsync(userId, userRole);

                EEPZBusinessLog.LogBusinessInformation("Retrieved {Count} published policies for user {UserId}", policies.Count, userId);

                return Ok(new { success = true, data = policies });
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Failed to retrieve published policies", ex);
                throw;
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
                var userId =
                    int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                var userRole =
                    User.FindFirst(ClaimTypes.Role)?.Value ?? "Unknown";

                EEPZBusinessLog.LogBusinessInformation("User {UserId} with role {UserRole} retrieving policy {PolicyId}", userId, userRole, policyId);

                var policy =
                    await _employeeDataService.GetPolicyByIdAsync(policyId, userId, userRole);

                EEPZBusinessLog.LogBusinessInformation("Policy {PolicyId} retrieved successfully for user {UserId}", policyId, userId);

                return Ok(new { success = true, data = policy });
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Failed to retrieve policy {PolicyId}", ex, policyId);
                throw;
            }
        }
    }
}
