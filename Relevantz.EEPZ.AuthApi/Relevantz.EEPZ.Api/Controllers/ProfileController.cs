using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
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
    }
}
