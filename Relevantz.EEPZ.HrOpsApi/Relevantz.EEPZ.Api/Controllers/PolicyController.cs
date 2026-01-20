
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.IService;

namespace Relevantz.EEPZ.Api.Controllers
{
    /// <summary>
    /// Provides endpoints for creating, managing, publishing, and retrieving company policies,
    /// including document upload, MongoDB storage, and policy visibility management.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class PolicyController : ControllerBase
    {
        private readonly IPolicyService _policyService;
        private readonly IMongoDbService _mongoDbService;
        private readonly ILogger<PolicyController> _logger;

        /// <summary>
        /// Initializes a new instance of <see cref="PolicyController"/>.
        /// </summary>
        /// <param name="policyService">Service responsible for policy operations.</param>
        /// <param name="mongoDbService">Service for file/document storage in MongoDB.</param>
        /// <param name="logger">Logger instance for operational and error tracking.</param>
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
        /// Creates a new policy.  
        /// Restricted to Admin and HR roles.
        /// </summary>
        /// <param name="request">Payload containing policy information.</param>
        /// <returns>Appropriate HTTP response based on success or failure.</returns>
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
                    _logger.LogWarning("Unable to extract user ID from JWT token for policy creation");
                    return Unauthorized(new { success = false, message = "Invalid user authentication" });
                }

                _logger.LogInformation($"User {createdByUserId} creating new policy");

                var result = await _policyService.CreatePolicyAsync(request, createdByUserId);
                if (!result.Success)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating policy: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred while creating policy" });
            }
        }

        /// <summary>
        /// Retrieves all policies. 
        /// Available to all authenticated users.
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
                _logger.LogError($"Error fetching all policies: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        /// <summary>
        /// Retrieves only published policies.
        /// Available to all authenticated users.
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
                _logger.LogError($"Error fetching published policies: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        /// <summary>
        /// Retrieves draft policies.  
        /// Restricted to Admin and HR roles.
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
                _logger.LogError($"Error fetching draft policies: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        /// <summary>
        /// Retrieves all active (published + effective) policies.
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
                _logger.LogError($"Error fetching active policies: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        /// <summary>
        /// Retrieves all inactive policies.
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
                _logger.LogError($"Error fetching inactive policies: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        /// <summary>
        /// Retrieves a specific policy by its ID.
        /// </summary>
        /// <param name="id">Policy ID.</param>
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
                _logger.LogError($"Error fetching policy {id}: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        /// <summary>
        /// Updates a policy.  
        /// Restricted to Admin and HR roles.
        /// </summary>
        /// <param name="id">Policy ID.</param>
        /// <param name="request">Updated policy data.</param>
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
                    _logger.LogInformation($"User {userId} updating policy {id}");
                }

                var result = await _policyService.UpdatePolicyAsync(id, request);
                if (!result.Success)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating policy {id}: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred while updating policy" });
            }
        }

        /// <summary>
        /// Uploads and stores a document in MongoDB OR stores an external link.
        /// Restricted to Admin and HR roles.
        /// </summary>
        /// <param name="file">Optional file upload (PDF/DOC/DOCX).</param>
        /// <param name="documentUrl">Optional document URL.</param>
        /// <param name="documentName">Human-readable document name.</param>
        /// <param name="documentType">"upload" or "link".</param>
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
                // Validate document type
                if (string.IsNullOrEmpty(documentType) || (documentType != "link" && documentType != "upload"))
                    return BadRequest(new { success = false, message = "Document type must be 'link' or 'upload'" });

                // Get user ID
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

                if (!int.TryParse(userIdClaim, out int userId))
                    return Unauthorized(new { success = false, message = "Invalid user authentication" });

                // Handle file upload to MongoDB
                if (documentType == "upload")
                {
                    if (file == null || file.Length == 0)
                        return BadRequest(new { success = false, message = "No file uploaded" });

                    var allowedExtensions = new[] { ".pdf", ".doc", ".docx" };
                    var extension = Path.GetExtension(file.FileName).ToLower();

                    if (!allowedExtensions.Contains(extension))
                        return BadRequest(new { success = false, message = "Only PDF, DOC, DOCX files allowed" });

                    const long maxFileSize = 5 * 1024 * 1024;
                    if (file.Length > maxFileSize)
                        return BadRequest(new { success = false, message = "File size must be less than 5MB" });

                    byte[] fileData;
                    using (var memoryStream = new MemoryStream())
                    {
                        await file.CopyToAsync(memoryStream);
                        fileData = memoryStream.ToArray();
                    }

                    var contentType = extension switch
                    {
                        ".pdf" => "application/pdf",
                        ".doc" => "application/msword",
                        ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        _ => "application/octet-stream"
                    };

                    // Upload to MongoDB
                    var fileId = await _mongoDbService.UploadFileAsync(
                        fileData,
                        file.FileName,
                        contentType,
                        file.Length,
                        userId
                    );

                    _logger.LogInformation($"Document uploaded to MongoDB: {file.FileName} (ID: {fileId})");

                    return Ok(new
                    {
                        success = true,
                        message = "File uploaded successfully to MongoDB",
                        data = new
                        {
                            documentUrl = fileId,
                            documentName = file.FileName,
                            documentSize = file.Length,
                            documentSizeFormatted = FormatFileSize(file.Length),
                            documentType = "upload"
                        }
                    });
                }

                // Handle document link
                if (documentType == "link")
                {
                    if (string.IsNullOrEmpty(documentUrl))
                        return BadRequest(new { success = false, message = "Document URL is required" });

                    if (string.IsNullOrEmpty(documentName))
                        return BadRequest(new { success = false, message = "Document name is required" });

                    if (!Uri.TryCreate(documentUrl, UriKind.Absolute, out _))
                        return BadRequest(new { success = false, message = "Invalid URL format" });

                    _logger.LogInformation($"Document link stored: {documentUrl}");

                    return Ok(new
                    {
                        success = true,
                        message = "Document link added successfully",
                        data = new
                        {
                            documentUrl,
                            documentName,
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
        /// Publishes a policy and makes it visible to all employees.  
        /// Restricted to Admin and HR roles.
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
                _logger.LogError($"Error publishing policy: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Failed to publish policy" });
            }
        }

        /// <summary>
        /// Unpublishes a policy.  
        /// Restricted to Admin and HR roles.
        /// </summary>
        [HttpPost("unpublish/{policyId}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> UnpublishPolicy(int policyId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                var response = await _policyService.UnpublishPolicyAsync(policyId, userId);

                _logger.LogInformation($"Policy {policyId} unpublished by user {userId}");

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error unpublishing policy: {ex.Message}");
                return BadRequest(new { message = "Failed to unpublish policy" });
            }
        }

        /// <summary>
        /// Soft deletes (marks inactive) a policy.  
        /// Restricted to Admin and HR roles.
        /// </summary>
        /// <param name="id">Policy ID.</param>
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
                    _logger.LogInformation($"User {userId} deleting policy {id}");
                }

                var result = await _policyService.DeletePolicyAsync(id);

                if (!result.Success)
                    return NotFound(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting policy {id}: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred while deleting policy" });
            }
        }

        /// <summary>
        /// Retrieves a stored document by its MongoDB ObjectId.
        /// </summary>
        /// <param name="fileId">MongoDB file identifier (24-character ObjectId).</param>
        /// <returns>
        /// 200 OK with file stream,  
        /// 400 Bad Request if ID is invalid,  
        /// 404 Not Found if file doesn't exist,  
        /// 500 Internal Server Error on retrieval failure.
        /// </returns>
        [HttpGet("document/{fileId}")]
        public async Task<IActionResult> GetPolicyDocument(string fileId)
        {
            try
            {
                if (string.IsNullOrEmpty(fileId) || fileId.Contains("..") || fileId.Length != 24)
                {
                    _logger.LogWarning($"Invalid file ID attempt: {fileId}");
                    return BadRequest(new { success = false, message = "Invalid file ID" });
                }

                var document = await _mongoDbService.GetFileAsync(fileId);

                if (document == null)
                {
                    _logger.LogWarning($"Document not found in MongoDB: {fileId}");
                    return NotFound(new { success = false, message = "Document not found" });
                }

                _logger.LogInformation($"Serving document from MongoDB: {document.OriginalFileName}");

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

        /// <summary>
        /// Helper method to convert byte sizes into human-readable formats.
        /// </summary>
        private string FormatFileSize(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB" };
            double len = bytes;
            int order = 0;

            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len /= 1024;
            }

            return $"{len:0.##} {sizes[order]}";
        }
    }
}
