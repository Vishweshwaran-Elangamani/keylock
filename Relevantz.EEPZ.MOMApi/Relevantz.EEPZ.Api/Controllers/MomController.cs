using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Core.Services.Interfaces;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Text.RegularExpressions;

namespace eepzbackend.Controllers
{
    /// <summary>
    /// Controller for managing Minutes of Meeting (MOM) operations
    /// SECURED: Rate limiting via middleware, input sanitization, validation, caching, and audit logging
    /// RESTful: Uses noun-based routes with proper HTTP methods
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public partial class MomController : ControllerBase
    {
        private readonly IMomService _momService;
        private readonly ILogger<MomController> _logger;
        private readonly IMemoryCache _cache;

        // Cache configuration
        private const int CacheExpirationMinutes = 5;
        private const string CacheKeyPrefix = "MOM_";

        public MomController(
            IMomService momService,
            ILogger<MomController> logger,
            IMemoryCache cache)
        {
            _momService = momService;
            _logger = logger;
            _cache = cache;
        }

        /// <summary>
        /// Create a new MOM
        /// SECURED: Rate limiting via middleware, date validation, input sanitization, audit logging
        /// RESTful: POST /api/mom (noun-based route, HTTP method indicates action)
        /// </summary>
        /// <remarks>
        /// Rate Limited: 100 requests per minute per client (global middleware)
        /// Meeting date must be within past 7 days or future 30 days
        /// </remarks>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<MomResponseDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status429TooManyRequests)]
        public async Task<ActionResult<ApiResponse<MomResponseDto>>> CreateMom(
            [FromBody] CreateMomDto createMomDto)
        {
            var correlationId = HttpContext.TraceIdentifier;
            var employeeId = GetEmployeeIdFromClaims();
            var role = GetRoleFromClaims();

            // VALIDATION 1: Null check
            if (createMomDto == null)
            {
                _logger.LogWarning("CreateMom called with null payload by employee {EmployeeId}", employeeId);
                return BadRequest(ApiResponse<object>.ErrorResponse(
                    "Request body cannot be null",
                    correlationId));
            }

            // VALIDATION 2: Date validation - past 7 days to future 30 days
            var minDate = DateTime.Now.AddDays(-7);
            var maxDate = DateTime.Now.AddDays(30);

            if (createMomDto.MeetingDate < minDate || createMomDto.MeetingDate > maxDate)
            {
                _logger.LogWarning(
                    "Invalid meeting date {MeetingDate} by employee {EmployeeId}. Must be between {MinDate} and {MaxDate}",
                    createMomDto.MeetingDate, employeeId, minDate, maxDate);

                return BadRequest(ApiResponse<object>.ErrorResponse(
                    $"Meeting date must be between {minDate:yyyy-MM-dd} and {maxDate:yyyy-MM-dd}",
                    correlationId));
            }

            // VALIDATION 3: Input sanitization
            createMomDto = SanitizeCreateMomDto(createMomDto);

            // VALIDATION 4: Business rule validation
            var validationErrors = ValidateCreateMomDto(createMomDto);
            if (validationErrors.Any())
            {
                _logger.LogWarning(
                    "CreateMom validation failed for employee {EmployeeId}: {Errors}",
                    employeeId, string.Join(", ", validationErrors));

                return BadRequest(ApiResponse<object>.ErrorResponse(
                    string.Join("; ", validationErrors),
                    correlationId));
            }

            // Create MOM
            var result = await _momService.CreateMomAsync(createMomDto, employeeId, role);

            // AUDIT LOGGING
            _logger.LogInformation(
                "MOM {MomId} '{MeetingTitle}' created by employee {EmployeeId} ({Role}) at {Timestamp}. " +
                "DiscussionPoints: {DiscussionPointCount}, ActionItems: {ActionItemCount}",
                result.MomId, result.MeetingTitle, employeeId, role, DateTime.UtcNow,
                result.DiscussionPoints?.Count ?? 0, result.ActionItems?.Count ?? 0);

            Response.Headers.Append("X-Correlation-Id", correlationId);
            Response.Headers.Append("X-Resource-Id", result.MomId.ToString());

            // Return 201 Created
            return CreatedAtAction(
                nameof(GetMomById),
                new { momId = result.MomId },
                ApiResponse<MomResponseDto>.SuccessResponse(
                    result,
                    AppConstants.ResponseMessages.MomCreatedSuccessfully,
                    correlationId));
        }

        /// <summary>
        /// Update an existing MOM
        /// SECURED: Null/empty validation, field-level validation, version control, audit logging
        /// RESTful: PUT /api/mom/{momId} (noun-based route, HTTP method indicates action)
        /// </summary>
        /// <remarks>
        /// Only managers can update MOMs. Empty update payloads are rejected.
        /// All changes are logged for audit purposes.
        /// PUT is idempotent - multiple identical requests have the same effect as a single request.
        /// </remarks>
        [HttpPut("{int}")] // CHANGED: Removed "/update", added momId to route
        [ProducesResponseType(typeof(ApiResponse<MomResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<MomResponseDto>>> UpdateMom(
            int Id, 
            [FromBody] UpdateMomDto updateMomDto)
        {
            var correlationId = HttpContext.TraceIdentifier;
            var employeeId = GetEmployeeIdFromClaims();
            var role = GetRoleFromClaims();

            // VALIDATION 1: Null check
            if (updateMomDto == null)
            {
                _logger.LogWarning("UpdateMom called with null payload by employee {EmployeeId}", employeeId);
                return BadRequest(ApiResponse<object>.ErrorResponse(
                    "Request body cannot be null",
                    correlationId));
            }

            // CHANGED: Validate momId from route matches body (if provided)
            if (momId <= 0)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(
                    "Invalid MOM ID in route",
                    correlationId));
            }

            // Set momId from route if not in body
            if (updateMomDto.MomId == 0)
            {
                updateMomDto.MomId = momId;
            }
            else if (updateMomDto.MomId != momId)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(
                    "MOM ID in route does not match MOM ID in body",
                    correlationId));
            }

            // VALIDATION 2: Reject empty update payloads
            if (IsEmptyUpdatePayload(updateMomDto))
            {
                _logger.LogWarning(
                    "UpdateMom called with empty payload for MOM {MomId} by employee {EmployeeId}",
                    updateMomDto.MomId, employeeId);

                return BadRequest(ApiResponse<object>.ErrorResponse(
                    "Update payload cannot be empty. At least one field must be provided.",
                    correlationId));
            }

            // VALIDATION 3: Date validation if provided
            if (updateMomDto.MeetingDate.HasValue)
            {
                var minDate = DateTime.Now.AddDays(-7);
                var maxDate = DateTime.Now.AddDays(30);

                if (updateMomDto.MeetingDate.Value < minDate ||
                    updateMomDto.MeetingDate.Value > maxDate)
                {
                    return BadRequest(ApiResponse<object>.ErrorResponse(
                        $"Meeting date must be between {minDate:yyyy-MM-dd} and {maxDate:yyyy-MM-dd}",
                        correlationId));
                }
            }

            // VALIDATION 4: Input sanitization
            updateMomDto = SanitizeUpdateMomDto(updateMomDto);

            // VALIDATION 5: Field-level validation
            var validationErrors = ValidateUpdateMomDto(updateMomDto);
            if (validationErrors.Any())
            {
                _logger.LogWarning(
                    "UpdateMom validation failed for MOM {MomId} by employee {EmployeeId}: {Errors}",
                    updateMomDto.MomId, employeeId, string.Join(", ", validationErrors));

                return BadRequest(ApiResponse<object>.ErrorResponse(
                    string.Join("; ", validationErrors),
                    correlationId));
            }

            // Get original MOM for audit comparison
            var originalMom = await _momService.GetMomByIdAsync(updateMomDto.MomId);
            if (originalMom == null)
            {
                return NotFound(ApiResponse<object>.ErrorResponse(
                    AppConstants.ExceptionMessages.MomNotFound,
                    correlationId));
            }

            // Update MOM
            var result = await _momService.UpdateMomAsync(updateMomDto, employeeId, role);

            // AUDIT LOGGING - Log what changed
            LogMomChanges(originalMom, result, employeeId, role);

            // Invalidate cache
            _cache.Remove($"{CacheKeyPrefix}{updateMomDto.MomId}");
            _cache.Remove($"{CacheKeyPrefix}MyMoms_{employeeId}");

            Response.Headers.Append("X-Correlation-Id", correlationId);
            Response.Headers.Append("X-Resource-Version", DateTime.UtcNow.Ticks.ToString());

            return Ok(ApiResponse<MomResponseDto>.SuccessResponse(
                result,
                AppConstants.ResponseMessages.MomUpdatedSuccessfully,
                correlationId));
        }

        /// <summary>
        /// Get MOMs submitted by the current user
        /// SECURED: Pagination, caching, claim validation
        /// RESTful: GET /api/mom/my-moms (collection endpoint with filter)
        /// </summary>
        /// <remarks>
        /// Results are cached for 5 minutes to improve performance.
        /// Supports pagination to handle large datasets efficiently.
        /// GET is safe and idempotent.
        /// </remarks>
        [HttpGet("my-moms")]
        [Authorize(Roles = AppConstants.Roles.Manager + "," + AppConstants.Roles.Employee)]
        [ProducesResponseType(typeof(ApiResponse<PaginatedResponse<MomResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<PaginatedResponse<MomResponseDto>>>> GetMyMoms(
            [FromQuery, Range(1, int.MaxValue)] int pageNumber = 1,
            [FromQuery, Range(1, 100)] int pageSize = 20,
            [FromQuery] string? searchTerm = null,
            [FromQuery] string? meetingType = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            var correlationId = HttpContext.TraceIdentifier;
            var employeeId = GetEmployeeIdFromClaims();

            // VALIDATION: Validate employeeId from claims
            if (employeeId <= 0)
            {
                _logger.LogWarning("Invalid employeeId {EmployeeId} extracted from claims", employeeId);
                return Unauthorized(ApiResponse<object>.ErrorResponse(
                    "Invalid user credentials",
                    correlationId));
            }

            // VALIDATION: Sanitize search term
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                searchTerm = SanitizeInput(searchTerm);
            }

            // CACHING: Check cache first
            var cacheKey = $"{CacheKeyPrefix}MyMoms_{employeeId}_{pageNumber}_{pageSize}_{searchTerm}_{meetingType}_{startDate}_{endDate}";

            if (_cache.TryGetValue(cacheKey, out PaginatedResponse<MomResponseDto>? cachedResult) &&
                cachedResult != null)
            {
                _logger.LogDebug("Cache hit for GetMyMoms, employee {EmployeeId}", employeeId);
                Response.Headers.Append("X-Cache", "HIT");
                Response.Headers.Append("X-Correlation-Id", correlationId);

                return Ok(ApiResponse<PaginatedResponse<MomResponseDto>>.SuccessResponse(
                    cachedResult,
                    AppConstants.ResponseMessages.MomsRetrievedSuccessfully,
                    correlationId));
            }

            // Fetch from database
            var allMoms = await _momService.GetMomsSubmittedByEmployeeAsync(employeeId);

            // Apply filtering
            var filteredMoms = allMoms.AsQueryable();

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                filteredMoms = filteredMoms.Where(m =>
                    m.MeetingTitle.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ||
                    (m.Attendees != null && m.Attendees.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)));
            }

            if (!string.IsNullOrWhiteSpace(meetingType))
            {
                filteredMoms = filteredMoms.Where(m => m.MeetingType == meetingType);
            }

            if (startDate.HasValue)
            {
                filteredMoms = filteredMoms.Where(m => m.MeetingDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                filteredMoms = filteredMoms.Where(m => m.MeetingDate <= endDate.Value);
            }

            // Apply pagination
            var totalCount = filteredMoms.Count();
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            var paginatedData = filteredMoms
                .OrderByDescending(m => m.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var result = new PaginatedResponse<MomResponseDto>
            {
                Data = paginatedData,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalPages = totalPages,
                HasPreviousPage = pageNumber > 1,
                HasNextPage = pageNumber < totalPages
            };

            // Cache the result
            var cacheOptions = new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromMinutes(CacheExpirationMinutes))
                .SetSlidingExpiration(TimeSpan.FromMinutes(2))
                .SetSize(1);

            _cache.Set(cacheKey, result, cacheOptions);

            _logger.LogInformation(
                "Retrieved {Count} MOMs for employee {EmployeeId} (Page {PageNumber}/{TotalPages})",
                paginatedData.Count, employeeId, pageNumber, totalPages);

            Response.Headers.Append("X-Cache", "MISS");
            Response.Headers.Append("X-Correlation-Id", correlationId);
            Response.Headers.Append("X-Total-Count", totalCount.ToString());
            Response.Headers.Append("X-Page-Number", pageNumber.ToString());
            Response.Headers.Append("X-Total-Pages", totalPages.ToString());

            return Ok(ApiResponse<PaginatedResponse<MomResponseDto>>.SuccessResponse(
                result,
                AppConstants.ResponseMessages.MomsRetrievedSuccessfully,
                correlationId));
        }

        /// <summary>
        /// Get a specific MOM by ID
        /// SECURED: Caching, validation
        /// RESTful: GET /api/mom/{momId} (singular resource endpoint)
        /// </summary>
        [HttpGet("{int}")]
        [ProducesResponseType(typeof(ApiResponse<MomResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<MomResponseDto>>> GetMomById(int momId)
        {
            var correlationId = HttpContext.TraceIdentifier;

            if (momId <= 0)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(
                    AppConstants.ExceptionMessages.InvalidArgument,
                    correlationId));
            }

            // Check cache
            var cacheKey = $"{CacheKeyPrefix}{momId}";
            if (_cache.TryGetValue(cacheKey, out MomResponseDto? cachedMom) && cachedMom != null)
            {
                Response.Headers.Append("X-Cache", "HIT");
                Response.Headers.Append("X-Correlation-Id", correlationId);

                return Ok(ApiResponse<MomResponseDto>.SuccessResponse(
                    cachedMom,
                    AppConstants.ResponseMessages.MomRetrievedSuccessfully,
                    correlationId));
            }

            var result = await _momService.GetMomByIdAsync(momId);
            if (result == null)
            {
                _logger.LogWarning("MOM {MomId} not found", momId);
                return NotFound(ApiResponse<object>.ErrorResponse(
                    AppConstants.ExceptionMessages.MomNotFound,
                    correlationId));
            }

            // Cache the result
            var cacheOptions = new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromMinutes(CacheExpirationMinutes))
                .SetSize(1);
            _cache.Set(cacheKey, result, cacheOptions);

            Response.Headers.Append("X-Cache", "MISS");
            Response.Headers.Append("X-Correlation-Id", correlationId);

            return Ok(ApiResponse<MomResponseDto>.SuccessResponse(
                result,
                AppConstants.ResponseMessages.MomRetrievedSuccessfully,
                correlationId));
        }

        /// <summary>
        /// Delete a MOM (Soft Delete)
        /// SECURED: Confirmation token, soft delete, audit logging
        /// RESTful: DELETE /api/mom/{momId} (HTTP method indicates action)
        /// </summary>
        /// <remarks>
        /// Implements soft delete pattern. MOM is marked as deleted but retained in database.
        /// Requires confirmation token to prevent accidental deletions.
        /// All deletions are logged for audit and compliance purposes.
        /// DELETE is idempotent - multiple identical requests have the same effect.
        /// </remarks>
        [HttpDelete("{int}")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<object>>> DeleteMom(
            int momId,
            [FromQuery, Required] string confirmationToken)
        {
            var correlationId = HttpContext.TraceIdentifier;
            var employeeId = GetEmployeeIdFromClaims();
            var role = GetRoleFromClaims();

            // VALIDATION 1: MomId validation
            if (momId <= 0)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse(
                    AppConstants.ExceptionMessages.InvalidArgument,
                    correlationId));
            }

            // VALIDATION 2: Confirmation token validation
            if (string.IsNullOrWhiteSpace(confirmationToken))
            {
                _logger.LogWarning(
                    "DeleteMom attempt without confirmation token for MOM {MomId} by employee {EmployeeId}",
                    momId, employeeId);

                return BadRequest(ApiResponse<object>.ErrorResponse(
                    "Confirmation token is required. Please confirm the deletion operation.",
                    correlationId));
            }

            // Validate confirmation token format (should be "DELETE_" + momId)
            var expectedToken = $"DELETE_{momId}";
            if (confirmationToken != expectedToken)
            {
                _logger.LogWarning(
                    "Invalid confirmation token for MOM {MomId} deletion by employee {EmployeeId}",
                    momId, employeeId);

                return BadRequest(ApiResponse<object>.ErrorResponse(
                    $"Invalid confirmation token. Expected: {expectedToken}",
                    correlationId));
            }

            // Get MOM details for audit logging before deletion
            var momToDelete = await _momService.GetMomByIdAsync(momId);
            if (momToDelete == null)
            {
                return NotFound(ApiResponse<object>.ErrorResponse(
                    AppConstants.ExceptionMessages.MomNotFound,
                    correlationId));
            }

            // SOFT DELETE: Call service to mark as deleted
            var result = await _momService.DeleteMomAsync(momId, employeeId, role);

            if (!result)
            {
                return NotFound(ApiResponse<object>.ErrorResponse(
                    AppConstants.ExceptionMessages.MomNotFound,
                    correlationId));
            }

            // AUDIT LOGGING - Comprehensive deletion log
            _logger.LogWarning(
                "MOM {MomId} '{MeetingTitle}' DELETED by employee {EmployeeId} ({Role}) at {Timestamp}. " +
                "Original meeting date: {MeetingDate}, Created at: {CreatedAt}, " +
                "DiscussionPoints: {DiscussionPointCount}, ActionItems: {ActionItemCount}, " +
                "Confirmation token: {ConfirmationToken}",
                momId, momToDelete.MeetingTitle, employeeId, role, DateTime.UtcNow,
                momToDelete.MeetingDate, momToDelete.CreatedAt,
                momToDelete.DiscussionPoints?.Count ?? 0,
                momToDelete.ActionItems?.Count ?? 0,
                confirmationToken);

            // Invalidate cache
            _cache.Remove($"{CacheKeyPrefix}{momId}");
            _cache.Remove($"{CacheKeyPrefix}MyMoms_{employeeId}");

            Response.Headers.Append("X-Correlation-Id", correlationId);
            Response.Headers.Append("X-Deleted-At", DateTime.UtcNow.ToString("O"));

            return Ok(ApiResponse<object>.SuccessResponse(
                new
                {
                    MomId = momId,
                    DeletedAt = DateTime.UtcNow,
                    DeletedBy = employeeId,
                    MeetingTitle = momToDelete.MeetingTitle
                },
                AppConstants.ResponseMessages.MomDeletedSuccessfully,
                correlationId));
        }

        #region Private Helper Methods

        /// <summary>
        /// Extract employee ID from JWT claims with validation
        /// </summary>
        private int GetEmployeeIdFromClaims()
        {
            var employeeIdClaim = User.FindFirst(AppConstants.ClaimTypes.EmployeeId);

            if (employeeIdClaim != null && int.TryParse(employeeIdClaim.Value, out int employeeId) && employeeId > 0)
                return employeeId;

            var subClaim = User.FindFirst(AppConstants.ClaimTypes.Sub) ??
                           User.FindFirst(ClaimTypes.NameIdentifier);

            if (subClaim != null && int.TryParse(subClaim.Value, out int subId) && subId > 0)
                return subId;

            _logger.LogError("Failed to extract valid employeeId from claims");
            throw new UnauthorizedAccessException(AppConstants.ExceptionMessages.UserIdNotFoundInToken);
        }

        /// <summary>
        /// Extract role from JWT claims
        /// </summary>
        private string GetRoleFromClaims()
        {
            var roleClaim =
                User.FindFirst(AppConstants.ClaimTypes.MsRoleSchema) ??
                User.FindFirst(ClaimTypes.Role) ??
                User.FindFirst(AppConstants.ClaimTypes.Role);

            return roleClaim?.Value ?? AppConstants.Roles.Employee;
        }

        /// <summary>
        /// Sanitize CreateMomDto inputs to prevent XSS and injection attacks
        /// </summary>
        private CreateMomDto SanitizeCreateMomDto(CreateMomDto dto)
        {
            dto.MeetingTitle = SanitizeInput(dto.MeetingTitle);
            dto.MeetingType = SanitizeInput(dto.MeetingType);
            dto.MeetingLink = SanitizeUrl(dto.MeetingLink);
            dto.Attendees = SanitizeInput(dto.Attendees);
            dto.CommentsObservations = SanitizeInput(dto.CommentsObservations);

            if (dto.DiscussionPoints != null)
            {
                foreach (var point in dto.DiscussionPoints)
                {
                    point.PointText = SanitizeInput(point.PointText);
                }
            }

            if (dto.ActionItems != null)
            {
                foreach (var item in dto.ActionItems)
                {
                    item.TaskDescription = SanitizeInput(item.TaskDescription);
                }
            }

            return dto;
        }

        /// <summary>
        /// Sanitize UpdateMomDto inputs
        /// </summary>
        private UpdateMomDto SanitizeUpdateMomDto(UpdateMomDto dto)
        {
            if (!string.IsNullOrWhiteSpace(dto.MeetingTitle))
                dto.MeetingTitle = SanitizeInput(dto.MeetingTitle);

            if (!string.IsNullOrWhiteSpace(dto.MeetingType))
                dto.MeetingType = SanitizeInput(dto.MeetingType);

            if (!string.IsNullOrWhiteSpace(dto.MeetingLink))
                dto.MeetingLink = SanitizeUrl(dto.MeetingLink);

            if (!string.IsNullOrWhiteSpace(dto.Attendees))
                dto.Attendees = SanitizeInput(dto.Attendees);

            if (!string.IsNullOrWhiteSpace(dto.CommentsObservations))
                dto.CommentsObservations = SanitizeInput(dto.CommentsObservations);

            if (dto.DiscussionPoints != null)
            {
                foreach (var point in dto.DiscussionPoints)
                {
                    point.PointText = SanitizeInput(point.PointText);
                }
            }

            if (dto.ActionItems != null)
            {
                foreach (var item in dto.ActionItems)
                {
                    item.TaskDescription = SanitizeInput(item.TaskDescription);
                }
            }

            return dto;
        }

        /// <summary>
        /// Sanitize text input - remove dangerous characters and scripts
        /// </summary>
        private string SanitizeInput(string? input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return string.Empty;

            // Remove HTML tags
            input = Regex.Replace(input, "<[^>]*>", string.Empty);

            // Remove script tags and content
            input = Regex.Replace(input, "<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script>", string.Empty, RegexOptions.IgnoreCase);

            // Remove potentially dangerous characters
            input = Regex.Replace(input, "[<>\"']", string.Empty);

            // Trim and limit length
            input = input.Trim();
            if (input.Length > 5000)
                input = input.Substring(0, 5000);

            return input;
        }

        /// <summary>
        /// Sanitize and validate URL
        /// </summary>
        private string? SanitizeUrl(string? url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return null;

            url = url.Trim();

            // Validate URL format
            if (!Uri.TryCreate(url, UriKind.Absolute, out var uriResult))
                return null;

            // Allow only http, https, and common meeting platforms
            var allowedSchemes = new[] { "http", "https" };
            if (!allowedSchemes.Contains(uriResult.Scheme.ToLower()))
                return null;

            return url;
        }

        /// <summary>
        /// Validate CreateMomDto business rules
        /// </summary>
        private List<string> ValidateCreateMomDto(CreateMomDto dto)
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(dto.MeetingTitle) || dto.MeetingTitle.Length < 3)
                errors.Add("Meeting title must be at least 3 characters long");

            if (dto.MeetingTitle?.Length > 200)
                errors.Add("Meeting title cannot exceed 200 characters");

            if (string.IsNullOrWhiteSpace(dto.MeetingType))
                errors.Add("Meeting type is required");

            if (dto.DiscussionPoints != null && dto.DiscussionPoints.Count > 50)
                errors.Add("Maximum 50 discussion points allowed");

            if (dto.ActionItems != null && dto.ActionItems.Count > 100)
                errors.Add("Maximum 100 action items allowed");

            // Validate discussion points
            if (dto.DiscussionPoints != null)
            {
                foreach (var point in dto.DiscussionPoints)
                {
                    if (string.IsNullOrWhiteSpace(point.PointText))
                        errors.Add("Discussion point text cannot be empty");
                    if (point.PointText?.Length > 2000)
                        errors.Add("Discussion point text cannot exceed 2000 characters");
                }
            }

            // Validate action items
            if (dto.ActionItems != null)
            {
                foreach (var item in dto.ActionItems)
                {
                    if (string.IsNullOrWhiteSpace(item.TaskDescription))
                        errors.Add("Action item description cannot be empty");
                    if (item.TaskDescription?.Length > 1000)
                        errors.Add("Action item description cannot exceed 1000 characters");
                    if (item.DueDate < DateOnly.FromDateTime(DateTime.Now.AddDays(-1)))
                        errors.Add("Action item due date cannot be in the past");
                }
            }

            return errors;
        }

        /// <summary>
        /// Validate UpdateMomDto business rules
        /// </summary>
        private List<string> ValidateUpdateMomDto(UpdateMomDto dto)
        {
            var errors = new List<string>();

            if (!string.IsNullOrWhiteSpace(dto.MeetingTitle))
            {
                if (dto.MeetingTitle.Length < 3)
                    errors.Add("Meeting title must be at least 3 characters long");
                if (dto.MeetingTitle.Length > 200)
                    errors.Add("Meeting title cannot exceed 200 characters");
            }

            if (dto.DiscussionPoints != null && dto.DiscussionPoints.Count > 50)
                errors.Add("Maximum 50 discussion points allowed");

            if (dto.ActionItems != null && dto.ActionItems.Count > 100)
                errors.Add("Maximum 100 action items allowed");

            return errors;
        }

        /// <summary>
        /// Check if update payload is empty (no fields to update)
        /// </summary>
        private bool IsEmptyUpdatePayload(UpdateMomDto dto)
        {
            return string.IsNullOrWhiteSpace(dto.MeetingTitle) &&
                   string.IsNullOrWhiteSpace(dto.MeetingType) &&
                   !dto.MeetingDate.HasValue &&
                   string.IsNullOrWhiteSpace(dto.MeetingLink) &&
                   string.IsNullOrWhiteSpace(dto.Attendees) &&
                   string.IsNullOrWhiteSpace(dto.CommentsObservations) &&
                   (dto.DiscussionPoints == null || !dto.DiscussionPoints.Any()) &&
                   (dto.ActionItems == null || !dto.ActionItems.Any());
        }

        /// <summary>
        /// Log changes made to MOM for audit purposes
        /// </summary>
        private void LogMomChanges(MomResponseDto original, MomResponseDto updated, int employeeId, string role)
        {
            var changes = new List<string>();

            if (original.MeetingTitle != updated.MeetingTitle)
                changes.Add($"Title: '{original.MeetingTitle}' → '{updated.MeetingTitle}'");

            if (original.MeetingType != updated.MeetingType)
                changes.Add($"Type: '{original.MeetingType}' → '{updated.MeetingType}'");

            if (original.MeetingDate != updated.MeetingDate)
                changes.Add($"Date: {original.MeetingDate:yyyy-MM-dd} → {updated.MeetingDate:yyyy-MM-dd}");

            if (original.MeetingLink != updated.MeetingLink)
                changes.Add($"Link: '{original.MeetingLink}' → '{updated.MeetingLink}'");

            if (original.DiscussionPoints?.Count != updated.DiscussionPoints?.Count)
                changes.Add($"Discussion Points: {original.DiscussionPoints?.Count ?? 0} → {updated.DiscussionPoints?.Count ?? 0}");

            if (original.ActionItems?.Count != updated.ActionItems?.Count)
                changes.Add($"Action Items: {original.ActionItems?.Count ?? 0} → {updated.ActionItems?.Count ?? 0}");

            if (changes.Any())
            {
                _logger.LogInformation(
                    "MOM {MomId} updated by employee {EmployeeId} ({Role}) at {Timestamp}. Changes: {Changes}",
                    updated.MomId, employeeId, role, DateTime.UtcNow, string.Join("; ", changes));
            }
        }

        #endregion
    }
}
