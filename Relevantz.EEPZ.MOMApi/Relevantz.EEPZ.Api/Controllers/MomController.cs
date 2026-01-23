using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.Services.Interfaces;
using System.Security.Claims;

namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/moms")]
    [Authorize]
    [Produces("application/json")]
    public partial class MomController : ControllerBase
    {
        private readonly IMomService _momService;
        private readonly ILogger<MomController> _logger;

        public MomController(IMomService momService, ILogger<MomController> logger)
        {
            _momService = momService ?? throw new ArgumentNullException(nameof(momService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Create a new MOM
        /// </summary>
        /// <param name="createMomDto">MOM creation data</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Created MOM details with Location header</returns>
        /// <response code="201">MOM created successfully</response>
        /// <response code="400">Invalid request data</response>
        /// <response code="401">Unauthorized - valid JWT token required</response>
        /// <response code="500">Internal server error</response>
        [HttpPost]
        [ResponseCache(CacheProfileName = "NoCache")]
        [ProducesResponseType(typeof(ApiResponse<MomResponseDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ApiResponse<MomResponseDto>>> CreateMom(
            [FromBody] CreateMomDto createMomDto,
            CancellationToken cancellationToken)
        {
            var correlationId = HttpContext.TraceIdentifier;

            try
            {
                ValidateModelState(correlationId);
                ValidateDto(createMomDto, nameof(createMomDto), correlationId);

                var employeeId = GetEmployeeIdFromClaims();
                var role = GetRoleFromClaims();

                _logger.LogInformation("Creating MOM for employee ID: {EmployeeId}, Role: {Role}, CorrelationId: {CorrelationId}", 
                    employeeId, role, correlationId);

                var result = await _momService.CreateMomAsync(createMomDto, employeeId, role, cancellationToken);

                _logger.LogInformation("Successfully created MOM ID: {MomId}, CorrelationId: {CorrelationId}", 
                    result.MomId, correlationId);

                Response.Headers.Append("X-Correlation-Id", correlationId);

                return CreatedAtAction(
                    nameof(GetMomById),
                    new { momId = result.MomId },
                    ApiResponse<MomResponseDto>.SuccessResponse(
                        result,
                        AppConstants.ResponseMessages.MomCreatedSuccessfully,
                        correlationId));
            }
            catch (Exception ex)
            {
                return HandleException<MomResponseDto>(ex, correlationId, nameof(CreateMom));
            }
        }

        /// <summary>
        /// Update an existing MOM
        /// </summary>
        /// <param name="momId">The MOM ID to update</param>
        /// <param name="updateMomDto">MOM update data</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Updated MOM details</returns>
        /// <response code="200">MOM updated successfully</response>
        /// <response code="400">Invalid request data</response>
        /// <response code="401">Unauthorized - valid JWT token required</response>
        /// <response code="403">Forbidden - insufficient permissions</response>
        /// <response code="404">MOM not found</response>
        /// <response code="500">Internal server error</response>
        [HttpPut("{momId:int}")]
        [ResponseCache(CacheProfileName = "NoCache")]
        [ProducesResponseType(typeof(ApiResponse<MomResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ApiResponse<MomResponseDto>>> UpdateMom(
            int momId, 
            [FromBody] UpdateMomDto updateMomDto,
            CancellationToken cancellationToken)
        {
            var correlationId = HttpContext.TraceIdentifier;

            try
            {
                ValidateModelState(correlationId);
                ValidateDto(updateMomDto, nameof(updateMomDto), correlationId);
                ValidatePositiveId(momId, nameof(momId), correlationId);

                if (updateMomDto.MomId != momId)
                {
                    _logger.LogWarning("MOM ID mismatch - Route: {RouteId}, Body: {BodyId}, CorrelationId: {CorrelationId}", 
                        momId, updateMomDto.MomId, correlationId);
                    throw new ArgumentException("MOM ID in route must match MOM ID in request body");
                }

                var employeeId = GetEmployeeIdFromClaims();
                var role = GetRoleFromClaims();

                _logger.LogInformation("Updating MOM ID: {MomId} by employee ID: {EmployeeId}, Role: {Role}, CorrelationId: {CorrelationId}", 
                    momId, employeeId, role, correlationId);

                var result = await _momService.UpdateMomAsync(updateMomDto, employeeId, role, cancellationToken);

                _logger.LogInformation("Successfully updated MOM ID: {MomId}, CorrelationId: {CorrelationId}", 
                    momId, correlationId);

                Response.Headers.Append("X-Correlation-Id", correlationId);

                return Ok(ApiResponse<MomResponseDto>.SuccessResponse(
                    result,
                    AppConstants.ResponseMessages.MomUpdatedSuccessfully,
                    correlationId));
            }
            catch (Exception ex)
            {
                return HandleException<MomResponseDto>(ex, correlationId, nameof(UpdateMom));
            }
        }

        /// <summary>
        /// Get MOMs submitted by the current user
        /// </summary>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>List of MOMs submitted by the user</returns>
        /// <response code="200">MOMs retrieved successfully</response>
        /// <response code="401">Unauthorized - valid JWT token required</response>
        /// <response code="500">Internal server error</response>
        [HttpGet("my")]
        [ResponseCache(CacheProfileName = "NoCache")]
        [Authorize(Roles = AppConstants.Roles.Manager + "," + AppConstants.Roles.Employee)]
        [ProducesResponseType(typeof(ApiResponse<List<MomResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ApiResponse<List<MomResponseDto>>>> GetMyMoms(CancellationToken cancellationToken)
        {
            var correlationId = HttpContext.TraceIdentifier;

            try
            {
                var employeeId = GetEmployeeIdFromClaims();

                _logger.LogDebug("Retrieving MOMs submitted by employee ID: {EmployeeId}, CorrelationId: {CorrelationId}", 
                    employeeId, correlationId);

                var result = await _momService.GetMomsSubmittedByEmployeeAsync(employeeId, cancellationToken);

                _logger.LogInformation("Retrieved {Count} MOMs for employee ID: {EmployeeId}, CorrelationId: {CorrelationId}", 
                    result.Count, employeeId, correlationId);

                Response.Headers.Append("X-Correlation-Id", correlationId);

                return Ok(ApiResponse<List<MomResponseDto>>.SuccessResponse(
                    result,
                    AppConstants.ResponseMessages.MomsRetrievedSuccessfully,
                    correlationId));
            }
            catch (Exception ex)
            {
                return HandleException<List<MomResponseDto>>(ex, correlationId, nameof(GetMyMoms));
            }
        }

        /// <summary>
        /// Get a specific MOM by ID
        /// </summary>
        /// <param name="momId">The MOM ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>MOM details</returns>
        /// <response code="200">MOM retrieved successfully</response>
        /// <response code="400">Invalid MOM ID</response>
        /// <response code="401">Unauthorized - valid JWT token required</response>
        /// <response code="403">Forbidden - insufficient permissions to access this MOM</response>
        /// <response code="404">MOM not found</response>
        /// <response code="500">Internal server error</response>
        [HttpGet("{momId:int}")]
        [ResponseCache(Duration = 60, VaryByHeader = "Authorization", Location = ResponseCacheLocation.Any)]
        [ProducesResponseType(typeof(ApiResponse<MomResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ApiResponse<MomResponseDto>>> GetMomById(
            int momId,
            CancellationToken cancellationToken)
        {
            var correlationId = HttpContext.TraceIdentifier;

            try
            {
                ValidatePositiveId(momId, nameof(momId), correlationId);

                var employeeId = GetEmployeeIdFromClaims();
                var role = GetRoleFromClaims();

                _logger.LogDebug("Retrieving MOM by ID: {MomId} for employee ID: {EmployeeId}, Role: {Role}, CorrelationId: {CorrelationId}", 
                    momId, employeeId, role, correlationId);

                var result = await _momService.GetMomByIdAsync(momId, cancellationToken);

                if (result == null)
                {
                    _logger.LogWarning("MOM with ID {MomId} not found, CorrelationId: {CorrelationId}", 
                        momId, correlationId);

                    Response.Headers.Append("X-Correlation-Id", correlationId);

                    return NotFound(CreateProblemDetails(
                        StatusCodes.Status404NotFound,
                        "Resource Not Found",
                        AppConstants.ExceptionMessages.MomNotFound,
                        correlationId,
                        HttpContext.Request.Path));
                }

                if (!CanAccessMom(result, employeeId, role))
                {
                    _logger.LogWarning(
                        "Access denied: Employee ID {EmployeeId} with role {Role} attempted to access MOM ID {MomId} owned by {OwnerId}, CorrelationId: {CorrelationId}",
                        employeeId, role, momId, result.SubmittedByEmployeeId, correlationId);

                    Response.Headers.Append("X-Correlation-Id", correlationId);

                    return StatusCode(StatusCodes.Status403Forbidden,
                        CreateProblemDetails(
                            StatusCodes.Status403Forbidden,
                            "Forbidden",
                            "You do not have permission to access this MOM",
                            correlationId,
                            HttpContext.Request.Path));
                }

                _logger.LogInformation("Successfully retrieved MOM ID: {MomId} by employee ID: {EmployeeId}, CorrelationId: {CorrelationId}", 
                    momId, employeeId, correlationId);

                Response.Headers.Append("X-Correlation-Id", correlationId);
                
                var etag = $"\"{result.MomId}-{result.UpdatedAt?.Ticks ?? result.CreatedAt.Ticks}\"";
                Response.Headers.Append("ETag", etag);

                return Ok(ApiResponse<MomResponseDto>.SuccessResponse(
                    result,
                    AppConstants.ResponseMessages.MomRetrievedSuccessfully,
                    correlationId));
            }
            catch (Exception ex)
            {
                return HandleException<MomResponseDto>(ex, correlationId, nameof(GetMomById));
            }
        }

        /// <summary>
        /// Delete a MOM
        /// </summary>
        /// <param name="momId">The MOM ID to delete</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>No content on success</returns>
        /// <response code="204">MOM deleted successfully</response>
        /// <response code="400">Invalid MOM ID</response>
        /// <response code="401">Unauthorized - valid JWT token required</response>
        /// <response code="403">Forbidden - insufficient permissions</response>
        /// <response code="404">MOM not found</response>
        /// <response code="500">Internal server error</response>
        [HttpDelete("{momId:int}")]
        [ResponseCache(CacheProfileName = "NoCache")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DeleteMom(
            int momId,
            CancellationToken cancellationToken)
        {
            var correlationId = HttpContext.TraceIdentifier;

            try
            {
                ValidatePositiveId(momId, nameof(momId), correlationId);

                var employeeId = GetEmployeeIdFromClaims();
                var role = GetRoleFromClaims();

                _logger.LogInformation("Deleting MOM ID: {MomId} by employee ID: {EmployeeId}, Role: {Role}, CorrelationId: {CorrelationId}", 
                    momId, employeeId, role, correlationId);

                var result = await _momService.DeleteMomAsync(momId, employeeId, role, cancellationToken);

                if (!result)
                {
                    _logger.LogWarning("MOM with ID {MomId} not found for deletion, CorrelationId: {CorrelationId}", 
                        momId, correlationId);

                    Response.Headers.Append("X-Correlation-Id", correlationId);

                    return NotFound(CreateProblemDetails(
                        StatusCodes.Status404NotFound,
                        "Resource Not Found",
                        AppConstants.ExceptionMessages.MomNotFound,
                        correlationId,
                        HttpContext.Request.Path));
                }

                _logger.LogInformation("Successfully deleted MOM ID: {MomId}, CorrelationId: {CorrelationId}", 
                    momId, correlationId);

                Response.Headers.Append("X-Correlation-Id", correlationId);

                return NoContent();
            }
            catch (Exception ex)
            {
                return HandleExceptionForDelete(ex, correlationId, nameof(DeleteMom));
            }
        }

        #region Private Helper Methods

        private int GetEmployeeIdFromClaims()
        {
            var employeeIdClaim = User.FindFirst(AppConstants.ClaimTypes.EmployeeId);

            if (employeeIdClaim != null && int.TryParse(employeeIdClaim.Value, out int employeeId))
            {
                _logger.LogDebug("Retrieved employee ID {EmployeeId} from EmployeeId claim", employeeId);
                return employeeId;
            }

            var subClaim = User.FindFirst(AppConstants.ClaimTypes.Sub) ??
                           User.FindFirst(ClaimTypes.NameIdentifier);

            if (subClaim != null && int.TryParse(subClaim.Value, out int subId))
            {
                _logger.LogDebug("Retrieved employee ID {EmployeeId} from Sub/NameIdentifier claim", subId);
                return subId;
            }

            _logger.LogError("Employee ID not found in JWT token claims");
            throw new UnauthorizedAccessException(AppConstants.ExceptionMessages.UserIdNotFoundInToken);
        }

        private string GetRoleFromClaims()
        {
            var roleClaim =
                User.FindFirst(AppConstants.ClaimTypes.MsRoleSchema) ??
                User.FindFirst(ClaimTypes.Role) ??
                User.FindFirst(AppConstants.ClaimTypes.Role);

            var role = roleClaim?.Value ?? AppConstants.Roles.Employee;
            _logger.LogDebug("Retrieved role '{Role}' from JWT claims", role);
            return role;
        }

        private bool CanAccessMom(MomResponseDto mom, int employeeId, string role)
        {
            

            // Managers can access all MOMs
            if (role == AppConstants.Roles.Manager)
            {
                _logger.LogDebug("Access granted: Manager role");
                return true;
            }

            // Owners can access their own MOMs
            if (mom.SubmittedByEmployeeId == employeeId)
            {
                _logger.LogDebug("Access granted: Resource owner (Employee ID: {EmployeeId})", employeeId);
                return true;
            }

            _logger.LogDebug("Access denied: No matching authorization rule for Employee ID: {EmployeeId}", employeeId);
            return false;
        }

        private void ValidateModelState(string correlationId)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                var errorMessage = string.Join("; ", errors);
                _logger.LogWarning("Model validation failed: {Errors}, CorrelationId: {CorrelationId}", 
                    errorMessage, correlationId);

                throw new ArgumentException($"Model validation failed: {errorMessage}");
            }
        }

        private void ValidateDto(object dto, string parameterName, string correlationId)
        {
            if (dto == null)
            {
                _logger.LogWarning("DTO validation failed - {ParameterName} is null, CorrelationId: {CorrelationId}", 
                    parameterName, correlationId);
                throw new ArgumentNullException(parameterName, $"{parameterName} cannot be null");
            }
        }

        private void ValidatePositiveId(int id, string parameterName, string correlationId)
        {
            if (id <= 0)
            {
                _logger.LogWarning("ID validation failed - {ParameterName} with value {Id} must be positive, CorrelationId: {CorrelationId}", 
                    parameterName, id, correlationId);
                throw new ArgumentException($"{parameterName} must be greater than 0", parameterName);
            }
        }

        private ProblemDetails CreateProblemDetails(int statusCode, string title, string detail, string correlationId, string instance)
        {
            return new ProblemDetails
            {
                Status = statusCode,
                Title = title,
                Detail = detail,
                Instance = instance,
                Extensions =
                {
                    ["traceId"] = correlationId,
                    ["timestamp"] = DateTime.UtcNow
                }
            };
        }

        private ActionResult<ApiResponse<T>> HandleException<T>(Exception exception, string correlationId, string methodName)
        {
            Response.Headers.Append("X-Correlation-Id", correlationId);

            return exception switch
            {
                ArgumentNullException argNullEx => HandleArgumentNullException<T>(argNullEx, correlationId, methodName),
                ArgumentException argEx => HandleArgumentException<T>(argEx, correlationId, methodName),
                UnauthorizedAccessException unauthEx => HandleUnauthorizedAccessException<T>(unauthEx, correlationId, methodName),
                KeyNotFoundException keyNotFoundEx => HandleKeyNotFoundException<T>(keyNotFoundEx, correlationId, methodName),
                InvalidOperationException invalidOpEx => HandleInvalidOperationException<T>(invalidOpEx, correlationId, methodName),
                _ => HandleUnhandledException<T>(exception, correlationId, methodName)
            };
        }

        private IActionResult HandleExceptionForDelete(Exception exception, string correlationId, string methodName)
        {
            Response.Headers.Append("X-Correlation-Id", correlationId);

            return exception switch
            {
                ArgumentNullException argNullEx => BadRequest(CreateProblemDetailsFromException(argNullEx, StatusCodes.Status400BadRequest, correlationId, methodName)),
                ArgumentException argEx => BadRequest(CreateProblemDetailsFromException(argEx, StatusCodes.Status400BadRequest, correlationId, methodName)),
                UnauthorizedAccessException unauthEx => StatusCode(StatusCodes.Status403Forbidden, CreateProblemDetailsFromException(unauthEx, StatusCodes.Status403Forbidden, correlationId, methodName)),
                KeyNotFoundException keyNotFoundEx => NotFound(CreateProblemDetailsFromException(keyNotFoundEx, StatusCodes.Status404NotFound, correlationId, methodName)),
                InvalidOperationException invalidOpEx => BadRequest(CreateProblemDetailsFromException(invalidOpEx, StatusCodes.Status400BadRequest, correlationId, methodName)),
                _ => StatusCode(StatusCodes.Status500InternalServerError, CreateProblemDetailsFromException(exception, StatusCodes.Status500InternalServerError, correlationId, methodName))
            };
        }

        private ProblemDetails CreateProblemDetailsFromException(Exception exception, int statusCode, string correlationId, string methodName)
        {
            _logger.LogError(exception, "Exception in {MethodName}: {Message}, CorrelationId: {CorrelationId}", 
                methodName, exception.Message, correlationId);

            var title = statusCode switch
            {
                400 => "Bad Request",
                403 => "Forbidden",
                404 => "Not Found",
                500 => "Internal Server Error",
                _ => "Error"
            };

            return CreateProblemDetails(statusCode, title, exception.Message, correlationId, HttpContext.Request.Path);
        }

        private ActionResult<ApiResponse<T>> HandleArgumentNullException<T>(ArgumentNullException exception, string correlationId, string methodName)
        {
            _logger.LogWarning(exception, "Argument null exception in {MethodName}: {Message}, CorrelationId: {CorrelationId}",
                methodName, exception.Message, correlationId);

            return BadRequest(CreateProblemDetails(StatusCodes.Status400BadRequest, "Bad Request", exception.Message, correlationId, HttpContext.Request.Path));
        }

        private ActionResult<ApiResponse<T>> HandleArgumentException<T>(ArgumentException exception, string correlationId, string methodName)
        {
            _logger.LogWarning(exception, "Argument exception in {MethodName}: {Message}, CorrelationId: {CorrelationId}",
                methodName, exception.Message, correlationId);

            return BadRequest(CreateProblemDetails(StatusCodes.Status400BadRequest, "Bad Request", exception.Message, correlationId, HttpContext.Request.Path));
        }

        private ActionResult<ApiResponse<T>> HandleUnauthorizedAccessException<T>(UnauthorizedAccessException exception, string correlationId, string methodName)
        {
            _logger.LogWarning(exception, "Unauthorized access in {MethodName}: {Message}, CorrelationId: {CorrelationId}",
                methodName, exception.Message, correlationId);

            return StatusCode(StatusCodes.Status403Forbidden, CreateProblemDetails(StatusCodes.Status403Forbidden, "Forbidden", exception.Message, correlationId, HttpContext.Request.Path));
        }

        private ActionResult<ApiResponse<T>> HandleKeyNotFoundException<T>(KeyNotFoundException exception, string correlationId, string methodName)
        {
            _logger.LogWarning(exception, "Resource not found in {MethodName}: {Message}, CorrelationId: {CorrelationId}",
                methodName, exception.Message, correlationId);

            return NotFound(CreateProblemDetails(StatusCodes.Status404NotFound, "Resource Not Found", exception.Message, correlationId, HttpContext.Request.Path));
        }

        private ActionResult<ApiResponse<T>> HandleInvalidOperationException<T>(InvalidOperationException exception, string correlationId, string methodName)
        {
            _logger.LogWarning(exception, "Invalid operation in {MethodName}: {Message}, CorrelationId: {CorrelationId}",
                methodName, exception.Message, correlationId);

            return BadRequest(CreateProblemDetails(StatusCodes.Status400BadRequest, "Bad Request", exception.Message, correlationId, HttpContext.Request.Path));
        }

        private ActionResult<ApiResponse<T>> HandleUnhandledException<T>(Exception exception, string correlationId, string methodName)
        {
            _logger.LogError(exception, "Unhandled exception in {MethodName}: {Message}, CorrelationId: {CorrelationId}",
                methodName, exception.Message, correlationId);

            return StatusCode(StatusCodes.Status500InternalServerError,
                CreateProblemDetails(StatusCodes.Status500InternalServerError, "Internal Server Error",
                    AppConstants.ExceptionMessages.InternalServerError ?? "An unexpected error occurred",
                    correlationId, HttpContext.Request.Path));
        }

        #endregion
    }
}
