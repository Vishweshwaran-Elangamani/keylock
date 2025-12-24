using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.Services.Interfaces;
namespace PerformanceManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeesController : ControllerBase
    {
        private readonly IEmployeesService _employeesService;
        private readonly ILogger<EmployeesController> _logger;
 
        public EmployeesController(IEmployeesService employeesService, ILogger<EmployeesController> logger)
        {
            _employeesService = employeesService;
            _logger = logger;
        }
 
        [HttpGet("all-managers")]
        public async Task<IActionResult> GetAllManagers()
        {
            try
            {
                var result = await _employeesService.GetAllManagersAsync();
                if (result.Success)
                    return Ok(new { success = true, data = result.Data });
                return StatusCode(500, new { success = false, message = string.Join(", ", result.Errors) });
            }
            catch (System.Exception ex)
            {
                _logger.LogError($"Error in GetAllManagers: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
 
        [HttpGet("user/{userId}/role")]
        public async Task<IActionResult> GetUserRole(int userId)
        {
            try
            {
                var result = await _employeesService.GetUserRoleAsync(userId);
                if (result.Success)
                    return Ok(new { success = true, data = result.Data });
                if (result.Errors.Contains("User not found"))
                    return NotFound(new { success = false, message = string.Join(", ", result.Errors) });
                return StatusCode(500, new { success = false, message = string.Join(", ", result.Errors) });
            }
            catch (System.Exception ex)
            {
                _logger.LogError($"Error in GetUserRole: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
 
 