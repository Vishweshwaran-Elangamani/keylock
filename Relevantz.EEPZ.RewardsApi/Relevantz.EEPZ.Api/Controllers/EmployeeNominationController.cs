 
using System;
using System.Net.Mime;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Core.Services.Interfaces;
 
namespace Relevantz.EEPZ.API.Controllers
{
    [ApiController]
    [Authorize] 
    [Route("api/[controller]")]
    [Produces(MediaTypeNames.Application.Json)]
    public class EmployeeNominationController : ControllerBase
    {
        private readonly IEmployeeNominationService _service;
        private readonly ILogger<EmployeeNominationController> _logger;
 
        public EmployeeNominationController(
            IEmployeeNominationService service,
            ILogger<EmployeeNominationController> logger
        )
        {
            _service = service ?? throw new ArgumentNullException(nameof(service));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }
 
        /// <summary>
        /// Searches nomination notifications for the given employee.
        /// </summary>
        /// <param name="employeeId">Employee identifier (must be a positive integer).</param>
        [HttpGet("search")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> SearchEmployeeNotifications([FromQuery] int employeeId)
        {
            
            if (employeeId <= 0)
            {
                _logger.LogWarning("Validation failed: employeeId must be positive. Provided: {EmployeeId}", employeeId);
                return BadRequest(BuildProblem(
                    status: StatusCodes.Status400BadRequest,
                    title: "Invalid employee id",
                    detail: "Employee id must be a positive integer."));
            }
            var result = await _service.SearchEmployeeNotificationsAsync(employeeId);
            return MapServiceResult(result);
        }
 
        /// <summary>
        /// Centralizes success/error mapping to HTTP responses for this controller.
        /// </summary>
        private IActionResult MapServiceResult(dynamic result)
        {
            // Known validation failure → 400 (ProblemDetails)
            if (!result.Success &&
                string.Equals(result.Message, "Please enter a valid employee ID", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(BuildProblem(
                    status: StatusCodes.Status400BadRequest,
                    title: "Invalid employee id",
                    detail: result.Message ?? "Please enter a valid employee ID."));
            }
 
            if (!result.Success)
            {
                throw new InvalidOperationException(result.Message ?? "Search failed.");
            }
 
            return Ok(new
            {
                success = true,
                data = result.Data,
                count = result.Count,
                message = result.Message
            });
        }
 
        /// <summary>
        /// Builds a ProblemDetails instance consistently for 4xx from this controller.
        /// (Global middleware also returns ProblemDetails for 5xx/499.)
        /// </summary>
        private ProblemDetails BuildProblem(int status, string title, string detail) =>
            new ProblemDetails
            {
                Type = $"https://httpstatuses.com/{status}",
                Title = title,
                Status = status,
                Detail = detail,
                Instance = HttpContext?.Request?.Path.Value
            };
    }
}
