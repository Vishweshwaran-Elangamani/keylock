using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Core.IService;
using System.Security.Claims;

namespace Relevantz.EEPZ.Api.Controllers
{
   [Authorize] 
    [ApiController]
    [Route("api/employee/[controller]")]
    public class EmployeePolicyController : ControllerBase
    {
        private readonly IPolicyService _policyService;
        private readonly ILogger<EmployeePolicyController> _logger;
 
        public EmployeePolicyController(IPolicyService policyService, ILogger<EmployeePolicyController> logger)
        {
            _policyService = policyService;
            _logger = logger;
        }
 
        //  Get all PUBLISHED policies (ALL authenticated users can view)
        // Accessible by: Employee, Manager, Department Head, Leadership (NOT HR - they use their own endpoints)
        [HttpGet("published")]
        public async Task<IActionResult> GetPublishedPolicies()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "Unknown";
               
                _logger.LogInformation($" User {userId} (Role: {userRole}) fetching published policies");
 
                var response = await _policyService.GetPublishedPoliciesAsync();
               
                _logger.LogInformation($" Returned {response.Data?.Count ?? 0} published policies to user {userId}");
               
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error fetching published policies: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Failed to fetch policies" });
            }
        }
 
        //  Get single policy details (ALL authenticated users can view if published)
        // Accessible by: Employee, Manager, Department Head, Leadership
        [HttpGet("{policyId}")]
        public async Task<IActionResult> GetPolicyById(int policyId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "Unknown";
               
                _logger.LogInformation($" User {userId} (Role: {userRole}) requesting policy {policyId}");
               
                var response = await _policyService.GetPolicyByIdAsync(policyId);
 
                if (!response.Success)
                {
                    _logger.LogWarning($" Policy {policyId} not found for user {userId}");
                    return NotFound(response);
                }
 
                //  IMPORTANT: Only return if published
                if (!response.Data.IsPublished)
                {
                    _logger.LogWarning($" Policy {policyId} is not published. Access denied for user {userId}");
                    return NotFound(new { success = false, message = "Policy not found or not published" });
                }
 
                _logger.LogInformation($" User {userId} viewed policy {policyId}: {response.Data.PolicyName}");
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error fetching policy {policyId}: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Failed to fetch policy" });
            }
        }
    }
 
 
}
