using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using System.Security.Claims;

namespace Relevantz.EEPZ.Api.Controllers
{

    [ApiController]
    [Authorize] 
    [Route("api/[controller]")]
    public class FormManagementController : ControllerBase
    {
        private readonly IFormManagementService _formService;
        private readonly ILogger<FormManagementController> _logger;

        public FormManagementController(
            IFormManagementService formService,
            ILogger<FormManagementController> logger)
        {
            _formService = formService;
            _logger = logger;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) 
                ?? User.FindFirst("sub");

            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            {
                return userId;
            }

            throw new UnauthorizedAccessException("User ID not found in JWT token");
        }

        private string GetCurrentUserRole()
        {
            var roleClaim = User.FindFirst(ClaimTypes.Role);
            return roleClaim?.Value ?? "Employee";
        }

        [HttpPost("create")]
        [Authorize(Roles = "HR,Admin")] 
        public async Task<IActionResult> CreateForm([FromBody] CreateFormRequestDto request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var userRole = GetCurrentUserRole();

                _logger.LogInformation(
                    "Create Form Request | UserId: {UserId} | Role: {Role}",
                    userId, userRole
                );

                if (!ModelState.IsValid)
                {
                    _logger.LogWarning(" Invalid form data provided");
                    return BadRequest(new { success = false, message = "Invalid form data", errors = ModelState });
                }

                var result = await _formService.CreateFormAsync(request);

                if (result.Success)
                {
                    _logger.LogInformation(" Form created successfully | FormId: {FormId}", result.Data?.FormId);
                    return Ok(result);
                }

                _logger.LogWarning(" Form creation failed: {Message}", result.Message);
                return BadRequest(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError(" Unauthorized access: {Message}", ex.Message);
                return Unauthorized(new { success = false, message = "Unauthorized access" });
            }
            catch (Exception ex)
            {
                _logger.LogError(" Error creating form: {Exception}", ex);
                return StatusCode(500, new 
                { 
                    success = false, 
                    message = "Internal server error",
                    details = ex.Message 
                });
            }
        }

        [HttpGet("{formId}")]
        public async Task<IActionResult> GetFormById(int formId)
        {
            try
            {
                var userId = GetCurrentUserId();

                _logger.LogInformation(
                    "Get Form By Id Request | UserId: {UserId} | FormId: {FormId}",
                    userId, formId
                );

                if (formId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid form ID" });
                }

                var result = await _formService.GetFormByIdAsync(formId);

                if (result.Success)
                {
                    _logger.LogInformation(" Form retrieved successfully | FormId: {FormId}", formId);
                    return Ok(result);
                }

                _logger.LogWarning(" Form not found | FormId: {FormId}", formId);
                return NotFound(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(" Error retrieving form: {Exception}", ex);
                return StatusCode(500, new 
                { 
                    success = false, 
                    message = "Internal server error",
                    details = ex.Message 
                });
            }
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllForms()
        {
            try
            {
                var userId = GetCurrentUserId();
                var userRole = GetCurrentUserRole();

                _logger.LogInformation(
                    "Get All Forms Request | UserId: {UserId} | Role: {Role}",
                    userId, userRole
                );

                var result = await _formService.GetAllFormsAsync();

                if (result.Success)
                {
                    _logger.LogInformation(" All forms retrieved successfully | Count: {Count}", 
                        result.Data?.Count ?? 0);
                    return Ok(result);
                }

                _logger.LogWarning(" Failed to retrieve forms: {Message}", result.Message);
                return BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(" Error retrieving all forms: {Exception}", ex);
                return StatusCode(500, new 
                { 
                    success = false, 
                    message = "Internal server error",
                    details = ex.Message 
                });
            }
        }

        [HttpPut("{formId}")]
        [Authorize(Roles = "HR,Admin")] 
        public async Task<IActionResult> UpdateForm(int formId, [FromBody] CreateFormRequestDto request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var userRole = GetCurrentUserRole();

                _logger.LogInformation(
                    "Update Form Request | UserId: {UserId} | Role: {Role} | FormId: {FormId}",
                    userId, userRole, formId
                );

                if (formId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid form ID" });
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Invalid form data", errors = ModelState });
                }

                var result = await _formService.UpdateFormAsync(formId, request);

                if (result.Success)
                {
                    _logger.LogInformation(" Form updated successfully | FormId: {FormId}", formId);
                    return Ok(result);
                }

                _logger.LogWarning(" Form update failed: {Message}", result.Message);
                return BadRequest(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError(" Unauthorized access: {Message}", ex.Message);
                return Unauthorized(new { success = false, message = "Unauthorized access" });
            }
            catch (Exception ex)
            {
                _logger.LogError(" Error updating form: {Exception}", ex);
                return StatusCode(500, new 
                { 
                    success = false, 
                    message = "Internal server error",
                    details = ex.Message 
                });
            }
        }

        [HttpDelete("{formId}")]
        [Authorize(Roles = "HR,Admin")] 
        public async Task<IActionResult> DeleteForm(int formId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var userRole = GetCurrentUserRole();

                _logger.LogInformation(
                    " Delete Form Request | UserId: {UserId} | Role: {Role} | FormId: {FormId}",
                    userId, userRole, formId
                );

                if (formId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid form ID" });
                }

                var result = await _formService.DeleteFormAsync(formId);

                if (result.Success)
                {
                    _logger.LogInformation(" Form deleted successfully | FormId: {FormId}", formId);
                    return Ok(result);
                }

                _logger.LogWarning(" Form deletion failed: {Message}", result.Message);
                return BadRequest(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError(" Unauthorized access: {Message}", ex.Message);
                return Unauthorized(new { success = false, message = "Unauthorized access" });
            }
            catch (Exception ex)
            {
                _logger.LogError(" Error deleting form: {Exception}", ex);
                return StatusCode(500, new 
                { 
                    success = false, 
                    message = "Internal server error",
                    details = ex.Message 
                });
            }
        }

        [HttpDelete("draft/{assignmentId}")]
        [Authorize(Roles = "HR,Admin")] 
        public async Task<IActionResult> DeleteDraft(int assignmentId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var userRole = GetCurrentUserRole();

                _logger.LogInformation(
                    "Delete Draft Request | UserId: {UserId} | Role: {Role} | AssignmentId: {AssignmentId}",
                    userId, userRole, assignmentId
                );

                if (assignmentId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid assignment ID" });
                }

                var result = await _formService.DeleteDraftAsync(assignmentId);

                if (result.Success)
                {
                    _logger.LogInformation(" Draft deleted successfully | AssignmentId: {AssignmentId}", assignmentId);
                    return Ok(result);
                }

                _logger.LogWarning(" Draft deletion failed: {Message}", result.Message);
                return BadRequest(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError(" Unauthorized access: {Message}", ex.Message);
                return Unauthorized(new { success = false, message = "Unauthorized access" });
            }
            catch (Exception ex)
            {
                _logger.LogError(" Error deleting draft: {Exception}", ex);
                return StatusCode(500, new 
                { 
                    success = false, 
                    message = "Internal server error",
                    details = ex.Message 
                });
            }
        }
    }
}
