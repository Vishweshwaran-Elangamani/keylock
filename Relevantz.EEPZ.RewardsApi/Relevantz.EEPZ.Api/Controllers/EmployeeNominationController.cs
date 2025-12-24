using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace Relevantz.EEPZ.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeeNominationController : ControllerBase
    {
        private readonly IEmployeeNominationService _service;
        private readonly ILogger<EmployeeNominationController> _logger;

        public EmployeeNominationController(
            IEmployeeNominationService service,
            ILogger<EmployeeNominationController> logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchEmployeeNotifications([FromQuery] int employeeId)
        {
            try
            {
                var result = await _service.SearchEmployeeNotificationsAsync(employeeId);

                if (!result.Success && string.Equals(result.Message, "Please enter a valid employee ID", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = result.Message
                    });
                }

                if (!result.Success)
                {
                    return StatusCode(500, new { success = false, message = result.Message });
                }

                return Ok(new
                {
                    success = true,
                    data = result.Data,
                    count = result.Count,
                    message = result.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[SEARCH] Unhandled error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
