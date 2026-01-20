using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
namespace Relevantz.EEPZ.Api.Controllers
{
    /// <summary>
    /// Provides endpoints for user profile management and user administration,
    /// including profile retrieval/update, photo upload, user CRUD, activation,
    /// manager-employee queries, and role/department assignments.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IProfileService _profileService;
        private readonly IUserManagementService _userManagementService;
        /// <summary>
        /// Initializes a new instance of <see cref="UserController"/>.
        /// </summary>
        /// <param name="profileService">Service that handles user profile operations.</param>
        /// <param name="userManagementService">Service that handles administrative user management operations.</param>
        public UserController(IProfileService profileService, IUserManagementService userManagementService)
        {
            _profileService = profileService;
            _userManagementService = userManagementService;
        }
        /// <summary>
        /// Gets the current logged-in user's profile.
        /// </summary>
        /// <returns>
        /// 200 OK with the profile data,  
        /// 400 Bad Request if the lookup fails,  
        /// 401 Unauthorized if the token is invalid,  
        /// 500 Internal Server Error on unexpected errors.
        /// </returns>
        [HttpGet("profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { success = false, message = "Invalid user token" });
                }
                var result = await _profileService.GetProfileByUserIdAsync(userId);
                if (!result.Success)
                {
                    return BadRequest(result);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred while fetching profile", error = ex.Message });
            }
        }
        /// <summary>
        /// Gets the profile for a specific user by ID (Admin/HR only).
        /// </summary>
        /// <param name="userId">The user identifier to fetch profile for.</param>
        /// <returns>
        /// 200 OK with the profile data,  
        /// 400 Bad Request if lookup fails,  
        /// 500 Internal Server Error on unexpected errors.
        /// </returns>
        [HttpGet("profile/{userId}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> GetProfileById(int userId)
        {
            try
            {
                var result = await _profileService.GetProfileByUserIdAsync(userId);
                if (!result.Success)
                {
                    return BadRequest(result);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred while fetching profile", error = ex.Message });
            }
        }
        /// <summary>
        /// Updates the current user's profile.
        /// </summary>
        /// <param name="request">The profile update payload.</param>
        /// <returns>
        /// 200 OK on success,  
        /// 400 Bad Request if validation fails,  
        /// 401 Unauthorized if the token is invalid,  
        /// 500 Internal Server Error on unexpected errors.
        /// </returns>
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileRequestDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Invalid request data", errors = ModelState });
                }
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { success = false, message = "Invalid user token" });
                }
                var result = await _profileService.UpdateProfileAsync(userId, request);
                if (!result.Success)
                {
                    return BadRequest(result);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred while updating profile", error = ex.Message });
            }
        }
        /// <summary>
        /// Uploads or updates the current user's profile photo.
        /// </summary>
        /// <param name="ProfilePhoto">The image file (JPEG/PNG/GIF/WEBP) up to 5MB.</param>
        /// <returns>
        /// 200 OK on success,  
        /// 400 Bad Request if file validation fails,  
        /// 401 Unauthorized if the token is invalid,  
        /// 500 Internal Server Error on unexpected errors.
        /// </returns>
        [HttpPut("profile/upload-photo")]
        public async Task<IActionResult> UploadProfilePhoto([FromForm] IFormFile ProfilePhoto)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { success = false, message = "Invalid user token" });
                }
                // Validate file presence
                if (ProfilePhoto == null || ProfilePhoto.Length == 0)
                {
                    return BadRequest(new { success = false, message = "No photo file provided" });
                }
                // Validate file type
                var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp" };
                if (!allowedTypes.Contains(ProfilePhoto.ContentType.ToLower()))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed."
                    });
                }
                // Validate file size (5MB max)
                const long maxFileSize = 5 * 1024 * 1024;
                if (ProfilePhoto.Length > maxFileSize)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = $"File size exceeds maximum limit of 5MB. Your file is {ProfilePhoto.Length / 1024 / 1024:F2}MB."
                    });
                }
                Console.WriteLine($"Photo upload for UserId: {userId}");
                Console.WriteLine($"  File: {ProfilePhoto.FileName}");
                Console.WriteLine($"  Size: {ProfilePhoto.Length} bytes ({ProfilePhoto.Length / 1024.0:F2} KB)");
                Console.WriteLine($"  Type: {ProfilePhoto.ContentType}");
                var request = new UpdateProfileRequestDto
                {
                    ProfilePhoto = ProfilePhoto
                };
                var result = await _profileService.UpdateProfileAsync(userId, request);
                if (!result.Success)
                {
                    return BadRequest(result);
                }
                Console.WriteLine($"Photo uploaded successfully for UserId: {userId}");
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error uploading photo: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while uploading photo",
                    error = ex.Message
                });
            }
        }
        /// <summary>
        /// Creates a new user (administrative operation).
        /// </summary>
        /// <param name="request">The user creation payload.</param>
        /// <returns>
        /// 200 OK on success,  
        /// 400 Bad Request if creation fails.
        /// </returns>
        [HttpPost("create")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequestDto request)
        {
            var createdByUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var result = await _userManagementService.CreateUserAsync(request, createdByUserId);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        /// <summary>
        /// Updates an existing user (administrative operation).
        /// </summary>
        /// <param name="request">The user update payload.</param>
        /// <returns>
        /// 200 OK on success,  
        /// 400 Bad Request if update fails.
        /// </returns>
        [HttpPut("update")]
        public async Task<IActionResult> UpdateUser([FromBody] UpdateUserRequestDto request)
        {
            var updatedByUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var result = await _userManagementService.UpdateUserAsync(request, updatedByUserId);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        /// <summary>
        /// Retrieves a user by identifier.
        /// </summary>
        /// <param name="userId">The user identifier to query.</param>
        /// <returns>
        /// 200 OK with user data when found,  
        /// 404 Not Found if the user does not exist.
        /// </returns>
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUserById(int userId)
        {
            var result = await _userManagementService.GetUserByIdAsync(userId);
            if (!result.Success)
                return NotFound(result);
            return Ok(result);
        }
        /// <summary>
        /// Retrieves all users.
        /// </summary>
        /// <returns>
        /// 200 OK with the full list of users.
        /// </returns>
        [HttpGet("all")]
        public async Task<IActionResult> GetAllUsers()
        {
            var result = await _userManagementService.GetAllUsersAsync();
            return Ok(result);
        }
        /// <summary>
        /// Deactivates a user.
        /// </summary>
        /// <param name="userId">The identifier of the user to deactivate.</param>
        /// <returns>
        /// 200 OK on success,  
        /// 400 Bad Request if the operation fails.
        /// </returns>
        [HttpPost("deactivate/{userId}")]
        public async Task<IActionResult> DeactivateUser(int userId)
        {
            var result = await _userManagementService.DeactivateUserAsync(userId);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        /// <summary>
        /// Activates a previously deactivated user.
        /// </summary>
        /// <param name="userId">The identifier of the user to activate.</param>
        /// <returns>
        /// 200 OK on success,  
        /// 400 Bad Request if the operation fails.
        /// </returns>
        [HttpPost("activate/{userId}")]
        public async Task<IActionResult> ActivateUser(int userId)
        {
            var result = await _userManagementService.ActivateUserAsync(userId);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        /// <summary>
        /// Retrieves employees who report to the specified manager. 
        /// Access is limited to the manager themselves, HR, or Admin.
        /// </summary>
        /// <param name="managerId">The manager's user identifier.</param>
        /// <returns>
        /// 200 OK with the list of employees,  
        /// 403 Forbid if the caller is not allowed,  
        /// 404 Not Found if no records are found,  
        /// 500 Internal Server Error on unexpected errors.
        /// </returns>
        [HttpGet("manager/{managerId}/employees")]
        public async Task<IActionResult> GetEmployeesByManager(int managerId)
        {
            try
            {
                var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                if (userRole != "HR" && userRole != "Admin" && currentUserId != managerId)
                {
                    return Forbid("You can only view your own employees");
                }
                var result = await _userManagementService.GetEmployeesByManagerAsync(managerId);
                if (!result.Success)
                    return NotFound(result);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
        /// <summary>
        /// Assigns a role and department to a user.
        /// </summary>
        /// <param name="request">The assignment payload containing user, role, and department details.</param>
        /// <returns>
        /// 200 OK on success,  
        /// 400 Bad Request if the assignment fails.
        /// </returns>
        [HttpPost("assign-role-department")]
        public async Task<IActionResult> AssignRoleAndDepartment([FromBody] AssignRoleDepartmentRequestDto request)
        {
            var result = await _userManagementService.AssignRoleAndDepartmentAsync(request);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        /// <summary>
        /// Gets the next available employee company ID (Admin/HR only).
        /// </summary>
        /// <returns>
        /// 200 OK with the next ID in the response,  
        /// 500 Internal Server Error if generation fails.
        /// </returns>
        [HttpGet("next-employee-id")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> GetNextEmployeeCompanyId()
        {
            try
            {
                var nextId = await _userManagementService.GetNextEmployeeCompanyIdAsync();
                return Ok(new
                {
                    success = true,
                    data = nextId,
                    message = "Next Employee ID retrieved successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to generate Employee ID",
                    error = ex.Message
                });
            }
        }
    }
}
