using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.IService;

namespace Relevantz.EEPZ.Api.Controllers
{
   [ApiController]
    [Route("api/[controller]")]
    //[Authorize] //  JWT authentication enabled for all endpoints
    public class PolicyController : ControllerBase
    {
        private readonly IPolicyService _policyService;
        private readonly ILogger<PolicyController> _logger;
 
        public PolicyController(IPolicyService policyService, ILogger<PolicyController> logger)
        {
            _policyService = policyService;
            _logger = logger;
        }
 
        /// <summary>
        /// Create new policy - HR ONLY
        /// </summary>
        [HttpPost("create")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> CreatePolicy([FromBody] CreatePolicyRequestDto request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
 
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int createdByUserId))
                {
                    _logger.LogWarning(" Unable to extract user ID from JWT token for policy creation");
                    return Unauthorized(new { success = false, message = "Invalid user authentication" });
                }
 
                _logger.LogInformation($" User {createdByUserId} creating new policy");
 
                var result = await _policyService.CreatePolicyAsync(request, createdByUserId);
 
                if (!result.Success)
                    return BadRequest(result);
 
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error creating policy: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred while creating policy" });
            }
        }
 
        /// <summary>
        /// Get all policies - All authenticated users
        /// </summary>
        [HttpGet("list")]
        public async Task<IActionResult> GetAllPolicies()
        {
            try
            {
                var result = await _policyService.GetAllPoliciesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error fetching all policies: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }
 
        /// <summary>
        /// Get published policies only - All authenticated users
        /// </summary>
        [HttpGet("published")]
        public async Task<IActionResult> GetPublishedPolicies()
        {
            try
            {
                var result = await _policyService.GetPublishedPoliciesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error fetching published policies: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }
 
        /// <summary>
        /// Get draft policies - HR ONLY
        /// </summary>
        [HttpGet("drafts")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> GetDraftPolicies()
        {
            try
            {
                var result = await _policyService.GetDraftPoliciesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error fetching draft policies: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }
 
        /// <summary>
        /// Get active policies only
        /// </summary>
        [HttpGet("active")]
        public async Task<IActionResult> GetActivePolicies()
        {
            try
            {
                var result = await _policyService.GetActivePoliciesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error fetching active policies: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }
 
        /// <summary>
        /// Get inactive policies
        /// </summary>
        [HttpGet("inactive")]
        public async Task<IActionResult> GetInactivePolicies()
        {
            try
            {
                var result = await _policyService.GetInactivePoliciesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error fetching inactive policies: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }
 
        /// <summary>
        /// Get policy by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPolicyById(int id)
        {
            try
            {
                var result = await _policyService.GetPolicyByIdAsync(id);
 
                if (!result.Success)
                    return NotFound(result);
 
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error fetching policy {id}: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }
 
        /// <summary>
        /// Update policy - HR ONLY
        /// </summary>
        [HttpPut("update/{id}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> UpdatePolicy(int id, [FromBody] UpdatePolicyRequestDto request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
 
                if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int userId))
                {
                    _logger.LogInformation($" User {userId} updating policy {id}");
                }
 
                var result = await _policyService.UpdatePolicyAsync(id, request);
 
                if (!result.Success)
                    return BadRequest(result);
 
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error updating policy {id}: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred while updating policy" });
            }
        }
 
        /// <summary>
        /// Upload policy document (file or link) - HR ONLY
        /// </summary>
        [HttpPost("upload-document")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> UploadDocument([FromForm] IFormFile? file, [FromForm] string? documentUrl, [FromForm] string? documentName, [FromForm] string? documentType)
        {
            try
            {
                // Validate inputs
                if (string.IsNullOrEmpty(documentType) || (documentType != "link" && documentType != "upload"))
                    return BadRequest(new { success = false, message = "Document type must be 'link' or 'upload'" });
 
                //  Handle File Upload
                if (documentType == "upload")
                {
                    if (file == null || file.Length == 0)
                        return BadRequest(new { success = false, message = "No file uploaded" });
 
                    // Validate file type
                    var allowedExtensions = new[] { ".pdf", ".doc", ".docx" };
                    var extension = Path.GetExtension(file.FileName).ToLower();
                    if (!allowedExtensions.Contains(extension))
                        return BadRequest(new { success = false, message = "Only PDF, DOC, DOCX files allowed" });
 
                    // Validate file size (5MB max)
                    const long maxFileSize = 5 * 1024 * 1024;
                    if (file.Length > maxFileSize)
                        return BadRequest(new { success = false, message = "File size must be less than 5MB" });
 
                    // Create uploads directory
                    var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "policies");
                    Directory.CreateDirectory(uploadsPath);
 
                    // Generate unique filename
                    var uniqueFileName = $"{Guid.NewGuid()}{extension}";
                    var filePath = Path.Combine(uploadsPath, uniqueFileName);
 
                    // Save file
                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }
 
                    //  FIX: Return FULL URL (not relative path)
                    var baseUrl = $"{Request.Scheme}://{Request.Host}";
                    var fileUrl = $"{baseUrl}/uploads/policies/{uniqueFileName}";
                    var fileName = file.FileName;
 
                    _logger.LogInformation($" Document uploaded: {fileUrl} (Size: {file.Length} bytes)");
 
                    return Ok(new
                    {
                        success = true,
                        message = "File uploaded successfully",
                        data = new
                        {
                            documentUrl = fileUrl, //  FULL URL
                            documentName = fileName,
                            documentSize = file.Length,
                            documentSizeFormatted = FormatFileSize(file.Length),
                            documentType = "upload"
                        }
                    });
                }
 
                //  Handle External Link
                else if (documentType == "link")
                {
                    if (string.IsNullOrEmpty(documentUrl))
                        return BadRequest(new { success = false, message = "Document URL is required for links" });
 
                    if (string.IsNullOrEmpty(documentName))
                        return BadRequest(new { success = false, message = "Document name is required" });
 
                    // Validate URL format
                    if (!Uri.TryCreate(documentUrl, UriKind.Absolute, out _))
                        return BadRequest(new { success = false, message = "Invalid URL format" });
 
                    _logger.LogInformation($" Document link added: {documentUrl}");
 
                    return Ok(new
                    {
                        success = true,
                        message = "Document link added successfully",
                        data = new
                        {
                            documentUrl = documentUrl,
                            documentName = documentName,
                            documentSize = (long?)null,
                            documentType = "link"
                        }
                    });
                }
 
                return BadRequest(new { success = false, message = "Invalid request" });
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error uploading document: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Document upload failed" });
            }
        }
 
 
        /// <summary>
        /// Publish policy (make visible to all employees) - HR ONLY
        /// </summary>
        [HttpPost("publish/{id}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> PublishPolicy(int id)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
 
                if (!int.TryParse(userIdClaim, out int publishedBy))
                    return Unauthorized(new { success = false, message = "Invalid user" });
 
                var result = await _policyService.PublishPolicyAsync(id, publishedBy);
 
                if (!result.Success)
                    return BadRequest(result);
 
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error publishing policy: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Failed to publish policy" });
            }
        }
 
        /// <summary>
        /// Soft delete policy (mark inactive) - HR ONLY
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> DeletePolicy(int id)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
 
                if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int userId))
                {
                    _logger.LogInformation($" User {userId} deleting policy {id}");
                }
 
                var result = await _policyService.DeletePolicyAsync(id);
 
                if (!result.Success)
                    return NotFound(result);
 
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error deleting policy {id}: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred while deleting policy" });
            }
        }
 
        // Helper method
        private string FormatFileSize(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB" };
            double len = bytes;
            int order = 0;
            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len = len / 1024;
            }
            return $"{len:0.##} {sizes[order]}";
        }
        [HttpPost("unpublish/{policyId}")]
        public async Task<IActionResult> UnpublishPolicy(int policyId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var response = await _policyService.UnpublishPolicyAsync(policyId, userId);
 
                _logger.LogInformation($" Policy {policyId} unpublished by user {userId}");
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($" Error unpublishing policy: {ex.Message}");
                return BadRequest(new { message = "Failed to unpublish policy" });
            }
        }
 
       
 
    }
 
 
}
