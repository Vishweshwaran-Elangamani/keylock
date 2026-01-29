using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace eepzbackend.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class UserProfilesController : ControllerBase
    {
        private readonly IUserProfilesService _userProfilesService;
        private readonly ILogger<UserProfilesController> _logger;

        public UserProfilesController(
            IUserProfilesService userProfilesService,
            ILogger<UserProfilesController> logger
        )
        {
            _userProfilesService = userProfilesService;
            _logger = logger;
        }

        // RESTful route: GET api/userprofiles
        [HttpGet]
        public async Task<IActionResult> GetAllUserProfiles()
        {
            var result = await _userProfilesService.GetAllUserProfilesAsync();

            if (result.Success)
            {
                return Ok(new { success = true, data = result.Data });
            }

            return StatusCode(
                500,
                new { success = false, message = string.Join(", ", result.Errors) }
            );
        }
    }
}
