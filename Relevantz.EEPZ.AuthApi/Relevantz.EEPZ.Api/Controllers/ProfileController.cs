using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Relevantz.EEPZ.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProfileController : ControllerBase
    {
        private readonly IProfileService _profileService;

        public ProfileController(IProfileService profileService)
        {
            _profileService = profileService;
        }

        /// <summary>
        /// Get current logged-in user's profile
        /// GET: api/Profile
        /// </summary>
        [HttpGet]
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
        /// Get profile by specific user ID (Admin/HR use)
        /// GET: api/Profile/{userId}
        /// </summary>
        [HttpGet("{userId}")]
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
        /// Update current user's profile
        /// PUT: api/Profile
        /// </summary>
        [HttpPut]
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
        /// Upload/Update profile photo only
        /// PUT: api/Profile/upload-photo
        /// </summary>
        [HttpPut("upload-photo")]
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
                    return BadRequest(new { 
                        success = false, 
                        message = "Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed." 
                    });
                }

                // Validate file size (5MB max)
                const long maxFileSize = 5 * 1024 * 1024; // 5MB
                if (ProfilePhoto.Length > maxFileSize)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = $"File size exceeds maximum limit of 5MB. Your file is {ProfilePhoto.Length / 1024 / 1024:F2}MB." 
                    });
                }

                // Log upload attempt
                Console.WriteLine($"Photo upload for UserId: {userId}");
                Console.WriteLine($"  File: {ProfilePhoto.FileName}");
                Console.WriteLine($"  Size: {ProfilePhoto.Length} bytes ({ProfilePhoto.Length / 1024.0:F2} KB)");
                Console.WriteLine($"  Type: {ProfilePhoto.ContentType}");

                // Create request DTO with only photo
                var request = new UpdateProfileRequestDto
                {
                    ProfilePhoto = ProfilePhoto
                };

                // Call service to update
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
                return StatusCode(500, new { 
                    success = false, 
                    message = "An error occurred while uploading photo", 
                    error = ex.Message 
                });
            }
        }
    }
}
