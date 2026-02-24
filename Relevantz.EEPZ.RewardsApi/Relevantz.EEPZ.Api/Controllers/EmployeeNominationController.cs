using System;
using System.ComponentModel.DataAnnotations;
using System.Net.Mime;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace Relevantz.EEPZ.API.Controllers
{
    [ApiController]
    [ApiVersion("1.0")]
    [Authorize]
    [Route("api/[controller]")]
    [Route("api/v{version:apiVersion}/[controller]")]
    [Produces(MediaTypeNames.Application.Json)]
    public class EmployeeNominationController : ControllerBase
    {
        private readonly IEmployeeNominationService _service;
        private readonly ILogger<EmployeeNominationController> _logger;

        public EmployeeNominationController(
            IEmployeeNominationService service,
            ILogger<EmployeeNominationController> logger)
        {
            _service = service ?? throw new ArgumentNullException(nameof(service));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
    /// fetch the reward recognized for the particular employee .
        /// </summary>
        /// <param name="query">Query parameters.</param>
        /// <param name="cancellationToken">Cancellation token for the request.</param>
        /// <returns>Notification search result.</returns>
        [Authorize(Roles = "Manager,HR,Department Head,Employee")]
        [HttpGet("search")]
        [ProducesResponseType(typeof(EmployeeNotificationSearchResultDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<EmployeeNotificationSearchResultDto>> SearchEmployeeNotifications(
            [FromQuery] EmployeeNotificationSearchQuery query,
            CancellationToken cancellationToken)
        {
            // ApiController automatically validates ModelState, but returning ValidationProblem keeps response consistent.
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Validation failed for SearchEmployeeNotifications. ModelState={ModelState}", ModelState);
                return ValidationProblem(ModelState);
            }

            _logger.LogInformation("Employee notification search requested. EmployeeId={EmployeeId}", query.EmployeeId);

            try
            {
                // Combine request cancellation + explicit cancellation.
                using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
                    cancellationToken,
                    HttpContext.RequestAborted);

                var result = await _service.SearchEmployeeNotificationsAsync(query.EmployeeId, linkedCts.Token);

                if (!result.Success)
                {
                    // Validation failures should return 400.
                    // Use message check only if service sets a known validation message.
                    if (string.Equals(result.Message, "Please enter a valid employee ID", StringComparison.OrdinalIgnoreCase))
                    {
                        return BadRequest(BuildProblem(
                            status: StatusCodes.Status400BadRequest,
                            title: "Invalid employee id",
                            detail: result.Message));
                    }

                    // For other failures, return 500 with generic message (avoid leaking internals).
                    _logger.LogError("Employee notification search failed. EmployeeId={EmployeeId}", query.EmployeeId);

                    return StatusCode(
                        StatusCodes.Status500InternalServerError,
                        BuildProblem(
                            status: StatusCodes.Status500InternalServerError,
                            title: "Search failed",
                            detail: "An unexpected error occurred while processing the request."));
                }

                return Ok(result);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Employee notification search cancelled. EmployeeId={EmployeeId}", query.EmployeeId);

                return BadRequest(BuildProblem(
                    status: StatusCodes.Status400BadRequest,
                    title: "Request cancelled",
                    detail: "The request was cancelled."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception in SearchEmployeeNotifications. EmployeeId={EmployeeId}", query.EmployeeId);

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    BuildProblem(
                        status: StatusCodes.Status500InternalServerError,
                        title: "Server error",
                        detail: "An unexpected error occurred."));
            }
        }

        /// <summary>
        /// Query model for validation at the API boundary.
        /// </summary>
        public sealed class EmployeeNotificationSearchQuery
        {
            [Required]
            [Range(1, int.MaxValue, ErrorMessage = "Employee id must be a positive integer.")]
            public int EmployeeId { get; init; }
        }

        /// <summary>
        /// Builds ProblemDetails consistently.
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
