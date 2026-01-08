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
    public class PolicyController : ControllerBase
    {
        private readonly IPolicyService _policyService;
        private readonly IMongoDbService _mongoDbService;  
        private readonly ILogger<PolicyController> _logger;
        //CONSTRUCTOR
        public PolicyController(
            IPolicyService policyService, 
            IMongoDbService mongoDbService,  
            ILogger<PolicyController> logger)
        {
            _policyService = policyService;
            _mongoDbService = mongoDbService;  
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
        /// Upload document - Stores in MongoDB instead of local filesystem
        /// </summary>
        [HttpPost("upload-document")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> UploadDocument(
            [FromForm] IFormFile? file, 
            [FromForm] string? documentUrl, 
            [FromForm] string? documentName, 
            [FromForm] string? documentType)
        {
            try
            {
                // Validate inputs
                if (string.IsNullOrEmpty(documentType) || (documentType != "link" && documentType != "upload"))
                    return BadRequest(new { success = false, message = "Document type must be 'link' or 'upload'" });
                // Get user ID for audit trail
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
                if (!int.TryParse(userIdClaim, out int userId))
                    return Unauthorized(new { success = false, message = "Invalid user authentication" });
                //  Handle File Upload - MONGODB STORAGE
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
                    //  Read file into byte array
                    byte[] fileData;
                    using (var memoryStream = new MemoryStream())
                    {
                        await file.CopyToAsync(memoryStream);
                        fileData = memoryStream.ToArray();
                    }
                    // Determine content type
                    var contentType = extension switch
                    {
                        ".pdf" => "application/pdf",
                        ".doc" => "application/msword",
                        ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        _ => "application/octet-stream"
                    };
                    //  Upload to MongoDB and get the ObjectId
                    var fileId = await _mongoDbService.UploadFileAsync(
                        fileData, 
                        file.FileName, 
                        contentType, 
                        file.Length, 
                        userId
                    );
                    _logger.LogInformation($" Document uploaded to MongoDB: {file.FileName} (ID: {fileId}, Size: {file.Length} bytes)");
                    //  Return MongoDB ObjectId as documentUrl
                    return Ok(new
                    {
                        success = true,
                        message = "File uploaded successfully to MongoDB",
                        data = new
                        {
                            documentUrl = fileId,  // MongoDB ObjectId
                            documentName = file.FileName,
                            documentSize = file.Length,
                            documentSizeFormatted = FormatFileSize(file.Length),
                            documentType = "upload"
                        }
                    });
                }
                else if (documentType == "link")
                {
                    if (string.IsNullOrEmpty(documentUrl))
                        return BadRequest(new { success = false, message = "Document URL is required for links" });
                    if (string.IsNullOrEmpty(documentName))
                        return BadRequest(new { success = false, message = "Document name is required" });
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
                _logger.LogError($"Error uploading document: {ex.Message}");
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
        /// Unpublish policy - HR ONLY
        /// </summary>
        [HttpPost("unpublish/{policyId}")]
        [Authorize(Roles = "Admin,HR")]
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
        /// <summary>
        /// Serve/Download document from MongoDB - All authenticated users
        /// </summary>
        [HttpGet("document/{fileId}")]
        public async Task<IActionResult> GetPolicyDocument(string fileId)
        {
            try
            {
                // Validate fileId to prevent injection attacks
                if (string.IsNullOrEmpty(fileId) || fileId.Contains("..") || fileId.Length != 24)
                {
                    _logger.LogWarning($" Invalid file ID attempt: {fileId}");
                    return BadRequest(new { success = false, message = "Invalid file ID" });
                }
                //  Retrieve document from MongoDB
                var document = await _mongoDbService.GetFileAsync(fileId);
                if (document == null)
                {
                    _logger.LogWarning($"Document not found in MongoDB: {fileId}");
                    return NotFound(new { success = false, message = "Document not found" });
                }
                _logger.LogInformation($"Serving document from MongoDB: {document.OriginalFileName} (ID: {fileId})");
                // Return file for download/inline viewing
                return File(
                    document.FileData, 
                    document.ContentType, 
                    document.OriginalFileName, 
                    enableRangeProcessing: true
                );
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error serving document {fileId}: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Error retrieving document" });
            }
        }
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
    }
}
