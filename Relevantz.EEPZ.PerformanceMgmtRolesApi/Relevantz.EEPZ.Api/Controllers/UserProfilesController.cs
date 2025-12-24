using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using System.Threading.Tasks;

namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserProfilesController : ControllerBase
    {
        private readonly IUserProfilesService _userProfilesService;
        private readonly ILogger<UserProfilesController> _logger;

        public UserProfilesController(
            IUserProfilesService userProfilesService,
            ILogger<UserProfilesController> logger)
        {
            _userProfilesService = userProfilesService;
            _logger = logger;
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllUserProfiles()
        {
            try
            {
                var result = await _userProfilesService.GetAllUserProfilesAsync();

                if (result.Success)
                {
                    return Ok(new
                    {
                        success = true,
                        data = result.Data
                    });
                }

                return StatusCode(500, new
                {
                    success = false,
                    message = string.Join(", ", result.Errors)
                });
            }
            catch (System.Exception ex)
            {
                _logger.LogError($"Error in GetAllUserProfiles: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }
    }
}
