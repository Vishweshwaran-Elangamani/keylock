using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // [Authorize]
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
        /// Get current logged-in user's profile
        /// </summary>
        [HttpGet("profile")]
        public async Task<IActionResult> GetMyProfile()
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

        /// <summary>
        /// Get profile by specific user ID (Admin/HR use)
        /// </summary>
        [HttpGet("profile/{userId}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> GetProfileById(int userId)
        {
            var result = await _profileService.GetProfileByUserIdAsync(userId);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Update current user's profile
        /// </summary>
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileRequestDto request)
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

        /// <summary>
        /// Upload/Update profile photo only
        /// </summary>
        [HttpPut("profile/upload-photo")]
        public async Task<IActionResult> UploadProfilePhoto([FromForm] IFormFile ProfilePhoto)
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

        [HttpPost("create")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequestDto request)
        {
            var createdByUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var result = await _userManagementService.CreateUserAsync(request, createdByUserId);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }

        [HttpPut("update")]
        public async Task<IActionResult> UpdateUser([FromBody] UpdateUserRequestDto request)
        {
            var updatedByUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var result = await _userManagementService.UpdateUserAsync(request, updatedByUserId);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUserById(int userId)
        {
            var result = await _userManagementService.GetUserByIdAsync(userId);
            if (!result.Success)
                return NotFound(result);
            return Ok(result);
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllUsers()
        {
            var result = await _userManagementService.GetAllUsersAsync();
            return Ok(result);
        }

        [HttpPost("deactivate/{userId}")]
        public async Task<IActionResult> DeactivateUser(int userId)
        {
            var result = await _userManagementService.DeactivateUserAsync(userId);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("activate/{userId}")]
        public async Task<IActionResult> ActivateUser(int userId)
        {
            var result = await _userManagementService.ActivateUserAsync(userId);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }

        [HttpGet("manager/{managerId}/employees")]
        public async Task<IActionResult> GetEmployeesByManager(int managerId)
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

        [HttpPost("assign-role-department")]
        public async Task<IActionResult> AssignRoleAndDepartment([FromBody] AssignRoleDepartmentRequestDto request)
        {
            var result = await _userManagementService.AssignRoleAndDepartmentAsync(request);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }

        [HttpGet("next-employee-id")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> GetNextEmployeeCompanyId()
        {
            var nextId = await _userManagementService.GetNextEmployeeCompanyIdAsync();
            return Ok(new
            {
                success = true,
                data = nextId,
                message = "Next Employee ID retrieved successfully"
            });
        }
        [HttpGet("throwexception")]
public IActionResult ThrowException()
{
    throw new Exception("Test exception for global exception handling");
}

    }
}
