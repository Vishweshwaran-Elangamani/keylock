// using Microsoft.AspNetCore.Mvc;
// using Microsoft.EntityFrameworkCore;
// using Relevantz.EEPZ.Data.DBContexts;
// using Relevantz.EEPZ.Common.Entities;
// using Relevantz.EEPZ.Common.DTOs.Request;
// using Relevantz.EEPZ.Common.DTOs.Response;
// using Relevantz.EEPZ.Core.Services.Interfaces;
// using Microsoft.AspNetCore.Authorization;

// namespace PerformanceManagement.Controllers

// {

//     [ApiController]
//     [Authorize]
//     [Route("api/[controller]")]

//     public class FormManagementController : ControllerBase

//     {

//         private readonly IFormManagementService _formService;
 
//         public FormManagementController(IFormManagementService formService)

//         {

//             _formService = formService;

//         }
 
//         /// <summary>

//         /// US1: HR creates a self-assessment form (Delivery/Enablement)

//         /// </summary>

//         [HttpPost("create")]

//         public async Task<IActionResult> CreateForm([FromBody] CreateFormRequestDto request)

//         {

//             var result = await _formService.CreateFormAsync(request);

//             if (result.Success)

//                 return Ok(result);

//             return BadRequest(result);

//         }
 
//         /// <summary>

//         /// Get form by ID

//         /// </summary>

//         [HttpGet("{formId}")]

//         public async Task<IActionResult> GetFormById(int formId)

//         {

//             var result = await _formService.GetFormByIdAsync(formId);

//             if (result.Success)

//                 return Ok(result);

//             return NotFound(result);

//         }

//         /// <summary>

//         /// Get all forms

//         /// </summary>

//         [HttpGet("all")]

//         public async Task<IActionResult> GetAllForms()

//         {

//             var result = await _formService.GetAllFormsAsync();

//             if (result.Success)

//                 return Ok(result);

//             return BadRequest(result);

//         }
        
//         /// <summary>
// /// Update an existing form by ID
// /// </summary>
// [HttpPut("{formId}")]
// public async Task<IActionResult> UpdateForm(int formId, [FromBody] CreateFormRequestDto request)
// {
//     var result = await _formService.UpdateFormAsync(formId, request);

//     if (result.Success)
//         return Ok(result);

//     return BadRequest(result);
// }


//         /// <summary>

//         /// Delete form by ID

//         /// </summary>

//         [HttpDelete("{formId}")]

//         public async Task<IActionResult> DeleteForm(int formId)

//         {

//             var result = await _formService.DeleteFormAsync(formId);

//             if (result.Success)

//                 return Ok(result);

//             return BadRequest(result);

//         }
        
//         [HttpDelete("draft/{assignmentId}")]
// public async Task<IActionResult> DeleteDraft(int assignmentId)
// {
//     var result = await _formService.DeleteDraftAsync(assignmentId);

//     if (result.Success)
//         return Ok(result);

//     return BadRequest(result);
// }


//     }

// }

 
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
    /// <summary>
    /// Form Management Controller
    /// Handles creation, retrieval, update, and deletion of performance management forms
    /// Requires JWT authentication for all endpoints
    /// </summary>
    [ApiController]
    [Authorize] // ✅ All endpoints require authentication
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

        /// <summary>
        /// Get current user's ID from JWT claims
        /// </summary>
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

        /// <summary>
        /// Get current user's role from JWT claims
        /// </summary>
        private string GetCurrentUserRole()
        {
            var roleClaim = User.FindFirst(ClaimTypes.Role);
            return roleClaim?.Value ?? "Employee";
        }

        /// <summary>
        /// US1: HR creates a new performance management form
        /// Only HR users can create forms
        /// </summary>
        /// <param name="request">Form creation request containing form structure and metadata</param>
        /// <returns>Created form with ID and metadata</returns>
        /// <response code="200">Form created successfully</response>
        /// <response code="400">Invalid form data provided</response>
        /// <response code="401">Unauthorized - User not authenticated</response>
        /// <response code="403">Forbidden - User does not have HR role</response>
        [HttpPost("create")]
        [Authorize(Roles = "HR,Admin")] // ✅ Only HR and Admin can create
        public async Task<IActionResult> CreateForm([FromBody] CreateFormRequestDto request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var userRole = GetCurrentUserRole();

                _logger.LogInformation(
                    "🟢 Create Form Request | UserId: {UserId} | Role: {Role}",
                    userId, userRole
                );

                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("❌ Invalid form data provided");
                    return BadRequest(new { success = false, message = "Invalid form data", errors = ModelState });
                }

                var result = await _formService.CreateFormAsync(request);

                if (result.Success)
                {
                    _logger.LogInformation("✅ Form created successfully | FormId: {FormId}", result.Data?.FormId);
                    return Ok(result);
                }

                _logger.LogWarning("❌ Form creation failed: {Message}", result.Message);
                return BadRequest(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError("❌ Unauthorized access: {Message}", ex.Message);
                return Unauthorized(new { success = false, message = "Unauthorized access" });
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ Error creating form: {Exception}", ex);
                return StatusCode(500, new 
                { 
                    success = false, 
                    message = "Internal server error",
                    details = ex.Message 
                });
            }
        }

        /// <summary>
        /// Retrieve a specific form by ID
        /// Authenticated users can view any form
        /// </summary>
        /// <param name="formId">The ID of the form to retrieve</param>
        /// <returns>Form details with sections and fields</returns>
        /// <response code="200">Form retrieved successfully</response>
        /// <response code="404">Form not found</response>
        /// <response code="401">Unauthorized - User not authenticated</response>
        [HttpGet("{formId}")]
        public async Task<IActionResult> GetFormById(int formId)
        {
            try
            {
                var userId = GetCurrentUserId();

                _logger.LogInformation(
                    "🔍 Get Form By Id Request | UserId: {UserId} | FormId: {FormId}",
                    userId, formId
                );

                if (formId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid form ID" });
                }

                var result = await _formService.GetFormByIdAsync(formId);

                if (result.Success)
                {
                    _logger.LogInformation("✅ Form retrieved successfully | FormId: {FormId}", formId);
                    return Ok(result);
                }

                _logger.LogWarning("❌ Form not found | FormId: {FormId}", formId);
                return NotFound(result);
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ Error retrieving form: {Exception}", ex);
                return StatusCode(500, new 
                { 
                    success = false, 
                    message = "Internal server error",
                    details = ex.Message 
                });
            }
        }

        /// <summary>
        /// Retrieve all available forms
        /// Authenticated users can view all forms
        /// </summary>
        /// <returns>List of all forms with metadata</returns>
        /// <response code="200">Forms retrieved successfully</response>
        /// <response code="401">Unauthorized - User not authenticated</response>
        [HttpGet("all")]
        public async Task<IActionResult> GetAllForms()
        {
            try
            {
                var userId = GetCurrentUserId();
                var userRole = GetCurrentUserRole();

                _logger.LogInformation(
                    "📋 Get All Forms Request | UserId: {UserId} | Role: {Role}",
                    userId, userRole
                );

                var result = await _formService.GetAllFormsAsync();

                if (result.Success)
                {
                    _logger.LogInformation("✅ All forms retrieved successfully | Count: {Count}", 
                        result.Data?.Count ?? 0);
                    return Ok(result);
                }

                _logger.LogWarning("❌ Failed to retrieve forms: {Message}", result.Message);
                return BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ Error retrieving all forms: {Exception}", ex);
                return StatusCode(500, new 
                { 
                    success = false, 
                    message = "Internal server error",
                    details = ex.Message 
                });
            }
        }

        /// <summary>
        /// Update an existing form
        /// Only HR users can update forms
        /// </summary>
        /// <param name="formId">The ID of the form to update</param>
        /// <param name="request">Updated form data</param>
        /// <returns>Updated form details</returns>
        /// <response code="200">Form updated successfully</response>
        /// <response code="400">Invalid form data provided</response>
        /// <response code="403">Forbidden - User does not have HR role</response>
        /// <response code="404">Form not found</response>
        /// <response code="401">Unauthorized - User not authenticated</response>
        [HttpPut("{formId}")]
        [Authorize(Roles = "HR,Admin")] // ✅ Only HR and Admin can update
        public async Task<IActionResult> UpdateForm(int formId, [FromBody] CreateFormRequestDto request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var userRole = GetCurrentUserRole();

                _logger.LogInformation(
                    "✏️ Update Form Request | UserId: {UserId} | Role: {Role} | FormId: {FormId}",
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
                    _logger.LogInformation("✅ Form updated successfully | FormId: {FormId}", formId);
                    return Ok(result);
                }

                _logger.LogWarning("❌ Form update failed: {Message}", result.Message);
                return BadRequest(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError("❌ Unauthorized access: {Message}", ex.Message);
                return Unauthorized(new { success = false, message = "Unauthorized access" });
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ Error updating form: {Exception}", ex);
                return StatusCode(500, new 
                { 
                    success = false, 
                    message = "Internal server error",
                    details = ex.Message 
                });
            }
        }

        /// <summary>
        /// Delete a form by ID
        /// Only HR users can delete forms
        /// </summary>
        /// <param name="formId">The ID of the form to delete</param>
        /// <returns>Deletion confirmation</returns>
        /// <response code="200">Form deleted successfully</response>
        /// <response code="403">Forbidden - User does not have HR role</response>
        /// <response code="404">Form not found</response>
        /// <response code="401">Unauthorized - User not authenticated</response>
        [HttpDelete("{formId}")]
        [Authorize(Roles = "HR,Admin")] // ✅ Only HR and Admin can delete
        public async Task<IActionResult> DeleteForm(int formId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var userRole = GetCurrentUserRole();

                _logger.LogInformation(
                    "❌ Delete Form Request | UserId: {UserId} | Role: {Role} | FormId: {FormId}",
                    userId, userRole, formId
                );

                if (formId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid form ID" });
                }

                var result = await _formService.DeleteFormAsync(formId);

                if (result.Success)
                {
                    _logger.LogInformation("✅ Form deleted successfully | FormId: {FormId}", formId);
                    return Ok(result);
                }

                _logger.LogWarning("❌ Form deletion failed: {Message}", result.Message);
                return BadRequest(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError("❌ Unauthorized access: {Message}", ex.Message);
                return Unauthorized(new { success = false, message = "Unauthorized access" });
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ Error deleting form: {Exception}", ex);
                return StatusCode(500, new 
                { 
                    success = false, 
                    message = "Internal server error",
                    details = ex.Message 
                });
            }
        }

        /// <summary>
        /// Delete a draft form by assignment ID
        /// Only HR users can delete drafts
        /// </summary>
        /// <param name="assignmentId">The assignment ID associated with the draft</param>
        /// <returns>Deletion confirmation</returns>
        /// <response code="200">Draft deleted successfully</response>
        /// <response code="403">Forbidden - User does not have HR role</response>
        /// <response code="404">Draft not found</response>
        /// <response code="401">Unauthorized - User not authenticated</response>
        [HttpDelete("draft/{assignmentId}")]
        [Authorize(Roles = "HR,Admin")] // ✅ Only HR and Admin can delete drafts
        public async Task<IActionResult> DeleteDraft(int assignmentId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var userRole = GetCurrentUserRole();

                _logger.LogInformation(
                    "🗑️ Delete Draft Request | UserId: {UserId} | Role: {Role} | AssignmentId: {AssignmentId}",
                    userId, userRole, assignmentId
                );

                if (assignmentId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid assignment ID" });
                }

                var result = await _formService.DeleteDraftAsync(assignmentId);

                if (result.Success)
                {
                    _logger.LogInformation("✅ Draft deleted successfully | AssignmentId: {AssignmentId}", assignmentId);
                    return Ok(result);
                }

                _logger.LogWarning("❌ Draft deletion failed: {Message}", result.Message);
                return BadRequest(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError("❌ Unauthorized access: {Message}", ex.Message);
                return Unauthorized(new { success = false, message = "Unauthorized access" });
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ Error deleting draft: {Exception}", ex);
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
