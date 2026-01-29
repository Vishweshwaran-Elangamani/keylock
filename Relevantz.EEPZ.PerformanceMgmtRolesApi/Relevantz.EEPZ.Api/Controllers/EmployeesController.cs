using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Common.Constants;

namespace PerformanceManagement.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class EmployeesController : ControllerBase
    {
        private readonly IEmployeesService _employeesService;
        private readonly ILogger<EmployeesController> _logger;

        public EmployeesController(
            IEmployeesService employeesService,
            ILogger<EmployeesController> logger
        )
        {
            _employeesService = employeesService;
            _logger = logger;
        }

        [HttpGet("all-managers")]
        public async Task<IActionResult> GetAllManagers()
        {
            var result = await _employeesService.GetAllManagersAsync();

            if (result.Success)
            {
                return Ok(new { success = true, data = result.Data });
            }

            return StatusCode(
                500,
                new { success = false, message = string.Join(", ", result.Errors) }
            );
        }

        [HttpGet("user/{userId}/role")]
        public async Task<IActionResult> GetUserRole(int userId)
        {
            var result = await _employeesService.GetUserRoleAsync(userId);

            if (result.Success)
            {
                return Ok(new { success = true, data = result.Data });
            }

            if (result.Errors.Contains(ErrorMessages.UserNotFound))
            {
                return NotFound(new { success = false, message = string.Join(", ", result.Errors) });
            }

            return StatusCode(
                500,
                new { success = false, message = string.Join(", ", result.Errors) }
            );
        }
    }
}
