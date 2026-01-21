using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Relevantz.EEPZ.Common.Constants;

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

        public UserController(IProfileService profileService, IUserManagementService userManagementService)
        {
            _profileService = profileService;
            _userManagementService = userManagementService;
        }
        /// <summary>
        /// Gets the current logged-in user's profile.
        /// </summary>
        /// <returns>200 OK with profile, 400/401/500 on error</returns>
        [HttpGet("profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { success = false, message = MessageConstants.InvalidUserToken });
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
                return StatusCode(500, new { success = false, message = MessageConstants.ErrorFetchingProfile, error = ex.Message });
            }
        }
        /// <summary>
        /// Gets profile for specific user by ID (Admin/HR only).
        /// </summary>
        /// <param name="Id">User identifier</param>
        /// <returns>200 OK with profile, 400/500 on error</returns>
        [HttpGet("profile/{Id}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> GetProfileById(int Id)
        {
            try
            {
                var result = await _profileService.GetProfileByUserIdAsync(Id);
                if (!result.Success)
                {
                    return BadRequest(result);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = MessageConstants.ErrorFetchingProfile, error = ex.Message });
            }
        }
        /// <summary>
        /// Updates current user's profile.
        /// </summary>
        /// <param name="request">Profile update data</param>
        /// <returns>200 OK on success, 400/401/500 on error</returns>
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileRequestDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = MessageConstants.InvalidRequestData, errors = ModelState });
                }
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { success = false, message = MessageConstants.InvalidUserToken });
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
                return StatusCode(500, new { success = false, message = MessageConstants.ErrorUpdatingProfile, error = ex.Message });
            }
        }
        /// <summary>
        /// Uploads/updates current user's profile photo (JPEG/PNG/GIF/WEBP, 5MB max).
        /// </summary>
        /// <param name="ProfilePhoto">Image file</param>
        /// <returns>200 OK on success, 400/401/500 on error</returns>
        [HttpPut("profile/upload-photo")]
        public async Task<IActionResult> UploadProfilePhoto([FromForm] IFormFile ProfilePhoto)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { success = false, message = MessageConstants.InvalidUserToken });
                }

                if (ProfilePhoto == null || ProfilePhoto.Length == 0)
                {
                    return BadRequest(new { success = false, message = MessageConstants.NoPhotoProvided });
                }

                var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp" };
                if (!allowedTypes.Contains(ProfilePhoto.ContentType.ToLower()))
                {
                    return BadRequest(new { success = false, message = MessageConstants.InvalidPhotoType });
                }

                const long maxFileSize = 5 * 1024 * 1024;
                if (ProfilePhoto.Length > maxFileSize)
                {
                    return BadRequest(new 
                    { 
                        success = false, 
                        message = $"{MessageConstants.PhotoTooLarge} Your file is {ProfilePhoto.Length / 1024 / 1024:F2}MB."
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
                return StatusCode(500, new { success = false, message = MessageConstants.ErrorUploadingPhoto, error = ex.Message });
            }
        }
        /// <summary>
        /// Creates new user (Admin operation).
        /// </summary>
        /// <param name="request">User creation data</param>
        /// <returns>200 OK on success, 400 on error</returns>
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
        /// Updates existing user (Admin operation).
        /// </summary>
        /// <param name="request">User update data</param>
        /// <returns>200 OK on success, 400 on error</returns>
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
        /// Gets user by identifier.
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <returns>200 OK with user, 404 if not found</returns>
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUserById(int userId)
        {
            var result = await _userManagementService.GetUserByIdAsync(userId);
            if (!result.Success)
                return NotFound(result);
            return Ok(result);
        }
        /// <summary>
        /// Gets all users.
        /// </summary>
        /// <returns>200 OK with users list</returns>
        [HttpGet("all")]
        public async Task<IActionResult> GetAllUsers()
        {
            var result = await _userManagementService.GetAllUsersAsync();
            return Ok(result);
        }
        /// <summary>
        /// Deactivates a user.
        /// </summary>
        /// <param name="userId">User ID to deactivate</param>
        /// <returns>200 OK on success, 400 on error</returns>
        [HttpPost("deactivate/{Id}")]
        public async Task<IActionResult> DeactivateUser(int Id)
        {
            var result = await _userManagementService.DeactivateUserAsync(Id);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        /// <summary>
        /// Activates a deactivated user.
        /// </summary>
        /// <param name="userId">User ID to activate</param>
        /// <returns>200 OK on success, 400 on error</returns>
        [HttpPost("activate/{Id}")]
        public async Task<IActionResult> ActivateUser(int Id)
        {
            var result = await _userManagementService.ActivateUserAsync(Id);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        /// <summary>
        /// Gets employees reporting to manager (Manager/HR/Admin only).
        /// </summary>
        /// <param name="managerId">Manager user ID</param>
        /// <returns>200 OK with employees, 403/404/500 on error</returns>
        [HttpGet("manager/{managerId}/employees")]
        public async Task<IActionResult> GetEmployeesByManager(int managerId)
        {
            try
            {
                var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                if (userRole != "HR" && userRole != "Admin" && currentUserId != managerId)
                {
                    return Forbid(MessageConstants.ManagerForbidden);
                }
                var result = await _userManagementService.GetEmployeesByManagerAsync(managerId);
                if (!result.Success)
                    return NotFound(result);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = MessageConstants.ErrorFetchingProfile });
            }
        }
        /// <summary>
        /// Assigns role and department to user.
        /// </summary>
        /// <param name="request">Assignment data</param>
        /// <returns>200 OK on success, 400 on error</returns>
        [HttpPost("assign-role-department")]
        public async Task<IActionResult> AssignRoleAndDepartment([FromBody] AssignRoleDepartmentRequestDto request)
        {
            var result = await _userManagementService.AssignRoleAndDepartmentAsync(request);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        /// <summary>
        /// Gets next available employee company ID (Admin/HR only).
        /// </summary>
        /// <returns>200 OK with next ID, 500 on error</returns>
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
                    message = MessageConstants.NextEmpIdSuccess
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = MessageConstants.NextEmpIdError,
                    error = ex.Message
                });
            }
        }
    }
}
