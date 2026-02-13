using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.Utils;
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
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                              ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;


            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int createdByUserId))
            {
                EEPZBusinessLog.LogBusinessWarning("Unable to extract user ID from JWT token for policy creation");
                return Unauthorized(new { success = false, message = "Invalid user authentication" });
            }


            // DTO uses PolicyName, not Title
            EEPZBusinessLog.LogBusinessInformation("User {UserId} creating new policy: {PolicyTitle}",
                createdByUserId, request.PolicyName);


            var result = await _policyService.CreatePolicyAsync(request, createdByUserId);


            if (!result.Success)
            {
                EEPZBusinessLog.LogBusinessWarning("Policy creation failed for user {UserId}: {Message}",
                    createdByUserId, result.Message);
                return BadRequest(result);
            }


            // DTO uses PolicyName, not Title
            EEPZBusinessLog.LogBusinessInformation("Policy '{PolicyTitle}' created successfully by user {UserId}",
                request.PolicyName, createdByUserId);


            return Ok(result);
        }


        /// <summary>
        /// Retrieves all policies.
        /// Available to all authenticated users.
        /// </summary>
        [HttpGet("list")]
        public async Task<IActionResult> GetAllPolicies()
        {
            EEPZBusinessLog.LogBusinessInformation("Retrieving all policies");


            var result = await _policyService.GetAllPoliciesAsync();


            EEPZBusinessLog.LogBusinessInformation("Retrieved {Count} policies", result.Data?.Count ?? 0);
            return Ok(result);
        }


        /// <summary>
        /// Retrieves only published policies.
        /// Available to all authenticated users.
        /// </summary>
        [HttpGet("published")]
        public async Task<IActionResult> GetPublishedPolicies()
        {
            EEPZBusinessLog.LogBusinessInformation("Retrieving published policies");


            var result = await _policyService.GetPublishedPoliciesAsync();


            EEPZBusinessLog.LogBusinessInformation("Retrieved {Count} published policies", result.Data?.Count ?? 0);
            return Ok(result);
        }


        /// <summary>
        /// Retrieves draft policies.
        /// Restricted to Admin and HR roles.
        /// </summary>
        [HttpGet("drafts")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> GetDraftPolicies()
        {
            EEPZBusinessLog.LogBusinessInformation("Retrieving draft policies");


            var result = await _policyService.GetDraftPoliciesAsync();


            EEPZBusinessLog.LogBusinessInformation("Retrieved {Count} draft policies", result.Data?.Count ?? 0);
            return Ok(result);
        }


        /// <summary>
        /// Retrieves all active (published + effective) policies.
        /// </summary>
        [HttpGet("active")]
        public async Task<IActionResult> GetActivePolicies()
        {
            EEPZBusinessLog.LogBusinessInformation("Retrieving active policies");


            var result = await _policyService.GetActivePoliciesAsync();


            EEPZBusinessLog.LogBusinessInformation("Retrieved {Count} active policies", result.Data?.Count ?? 0);
            return Ok(result);
        }


        /// <summary>
        /// Retrieves all inactive policies.
        /// </summary>
        [HttpGet("inactive")]
        public async Task<IActionResult> GetInactivePolicies()
        {
            EEPZBusinessLog.LogBusinessInformation("Retrieving inactive policies");


            var result = await _policyService.GetInactivePoliciesAsync();


            EEPZBusinessLog.LogBusinessInformation("Retrieved {Count} inactive policies", result.Data?.Count ?? 0);
            return Ok(result);
        }


        /// <summary>
        /// Retrieves a specific policy by its ID.
        /// </summary>
        /// <param name="id">Policy ID.</param>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPolicyById(int id)
        {
            EEPZBusinessLog.LogBusinessInformation("Retrieving policy {PolicyId}", id);


            var result = await _policyService.GetPolicyByIdAsync(id);


            if (!result.Success)
            {
                EEPZBusinessLog.LogBusinessWarning("Policy {PolicyId} not found", id);
                return NotFound(result);
            }


            EEPZBusinessLog.LogBusinessInformation("Policy {PolicyId} retrieved successfully", id);
            return Ok(result);
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
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;


            if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int userId))
            {
                EEPZBusinessLog.LogBusinessInformation("User {UserId} updating policy {PolicyId}", userId, id);
            }


            var result = await _policyService.UpdatePolicyAsync(id, request);


            if (!result.Success)
            {
                EEPZBusinessLog.LogBusinessWarning("Policy {PolicyId} update failed: {Message}", id, result.Message);
                return BadRequest(result);
            }


            EEPZBusinessLog.LogBusinessInformation("Policy {PolicyId} updated successfully", id);
            return Ok(result);
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
            if (string.IsNullOrEmpty(documentType) || (documentType != "link" && documentType != "upload"))
            {
                EEPZBusinessLog.LogBusinessWarning("Invalid document type provided: {DocumentType}", documentType);
                return BadRequest(new { success = false, message = "Document type must be 'link' or 'upload'" });
            }


            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;


            if (!int.TryParse(userIdClaim, out int userId))
            {
                EEPZBusinessLog.LogBusinessWarning("Invalid user authentication for document upload");
                return Unauthorized(new { success = false, message = "Invalid user authentication" });
            }


            if (documentType == "upload")
            {
                if (file == null || file.Length == 0)
                {
                    EEPZBusinessLog.LogBusinessWarning("Document upload attempted with no file by user {UserId}", userId);
                    return BadRequest(new { success = false, message = "No file uploaded" });
                }


                var allowedExtensions = new[] { ".pdf", ".doc", ".docx" };
                var extension = Path.GetExtension(file.FileName).ToLower();


                if (!allowedExtensions.Contains(extension))
                {
                    EEPZBusinessLog.LogBusinessWarning("Invalid file extension {Extension} uploaded by user {UserId}", extension, userId);
                    return BadRequest(new { success = false, message = "Only PDF, DOC, DOCX files allowed" });
                }


                const long maxFileSize = 5 * 1024 * 1024;
                if (file.Length > maxFileSize)
                {
                    EEPZBusinessLog.LogBusinessWarning("File size {FileSize} exceeds limit for user {UserId}", file.Length, userId);
                    return BadRequest(new { success = false, message = "File size must be less than 5MB" });
                }


                EEPZBusinessLog.LogBusinessInformation("User {UserId} uploading document: {FileName}, size: {FileSize}",
                    userId, file.FileName, file.Length);


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


                var fileId = await _mongoDbService.UploadFileAsync(
                    fileData,
                    file.FileName,
                    contentType,
                    file.Length,
                    userId
                );


                EEPZBusinessLog.LogBusinessInformation("Document uploaded successfully by user {UserId}, fileId: {FileId}",
                    userId, fileId);


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


            if (documentType == "link")
            {
                if (string.IsNullOrEmpty(documentUrl))
                {
                    EEPZBusinessLog.LogBusinessWarning("Document link creation attempted without URL by user {UserId}", userId);
                    return BadRequest(new { success = false, message = "Document URL is required" });
                }


                if (string.IsNullOrEmpty(documentName))
                {
                    EEPZBusinessLog.LogBusinessWarning("Document link creation attempted without name by user {UserId}", userId);
                    return BadRequest(new { success = false, message = "Document name is required" });
                }


                if (!Uri.TryCreate(documentUrl, UriKind.Absolute, out _))
                {
                    EEPZBusinessLog.LogBusinessWarning("Invalid URL format provided by user {UserId}: {DocumentUrl}", userId, documentUrl);
                    return BadRequest(new { success = false, message = "Invalid URL format" });
                }


                EEPZBusinessLog.LogBusinessInformation("User {UserId} added document link: {DocumentName}",
                    userId, documentName);


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


        /// <summary>
        /// Publishes a policy and makes it visible to all employees.
        /// Restricted to Admin and HR roles.
        /// </summary>
        [HttpPost("publish/{id}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> PublishPolicy(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;


            if (!int.TryParse(userIdClaim, out int publishedBy))
            {
                EEPZBusinessLog.LogBusinessWarning("Invalid user authentication for policy publish");
                return Unauthorized(new { success = false, message = "Invalid user" });
            }


            EEPZBusinessLog.LogBusinessInformation("User {UserId} publishing policy {PolicyId}", publishedBy, id);


            var result = await _policyService.PublishPolicyAsync(id, publishedBy);


            if (!result.Success)
            {
                EEPZBusinessLog.LogBusinessWarning("Policy {PolicyId} publish failed: {Message}", id, result.Message);
                return BadRequest(result);
            }


            EEPZBusinessLog.LogBusinessInformation("Policy {PolicyId} published successfully by user {UserId}", id, publishedBy);
            return Ok(result);
        }


        /// <summary>
        /// Unpublishes a policy.
        /// Restricted to Admin and HR roles.
        /// </summary>
        [HttpPost("unpublish/{policyId}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> UnpublishPolicy(int policyId)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");


            EEPZBusinessLog.LogBusinessInformation("User {UserId} unpublishing policy {PolicyId}", userId, policyId);


            var response = await _policyService.UnpublishPolicyAsync(policyId, userId);


            if (response.Success)
            {
                EEPZBusinessLog.LogBusinessInformation("Policy {PolicyId} unpublished successfully by user {UserId}", policyId, userId);
            }
            else
            {
                EEPZBusinessLog.LogBusinessWarning("Policy {PolicyId} unpublish failed: {Message}", policyId, response.Message);
            }


            return Ok(response);
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
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;


            if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int userId))
            {
                EEPZBusinessLog.LogBusinessInformation("User {UserId} deleting policy {PolicyId}", userId, id);
            }


            var result = await _policyService.DeletePolicyAsync(id);


            if (!result.Success)
            {
                EEPZBusinessLog.LogBusinessWarning("Policy {PolicyId} deletion failed: {Message}", id, result.Message);
                return NotFound(result);
            }


            EEPZBusinessLog.LogBusinessInformation("Policy {PolicyId} deleted successfully", id);
            return Ok(result);
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
            if (string.IsNullOrEmpty(fileId) || fileId.Contains("..") || fileId.Length != 24)
            {
                EEPZBusinessLog.LogBusinessWarning("Invalid file ID requested: {FileId}", fileId);
                return BadRequest(new { success = false, message = "Invalid file ID" });
            }


            EEPZBusinessLog.LogBusinessInformation("Retrieving policy document {FileId}", fileId);


            var document = await _mongoDbService.GetFileAsync(fileId);


            if (document == null)
            {
                EEPZBusinessLog.LogBusinessWarning("Policy document {FileId} not found", fileId);
                return NotFound(new { success = false, message = "Document not found" });
            }


            EEPZBusinessLog.LogBusinessInformation("Policy document {FileId} retrieved successfully", fileId);


            return File(
                document.FileData,
                document.ContentType,
                document.OriginalFileName,
                enableRangeProcessing: true
            );
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
