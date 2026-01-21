
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class RecognitionRewardController : ControllerBase
    {
        private readonly IRecognitionRewardService _service;
        private readonly ILogger<RecognitionRewardController> _logger;

        public RecognitionRewardController(
            IRecognitionRewardService service,
            ILogger<RecognitionRewardController> logger)
        {
            _service = service;
            _logger = logger;
        }

        /// <summary>
        /// Get all recognition & reward items.
        /// Unhandled exceptions are handled by global ExceptionHandlingMiddleware.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetRecognitionRewards()
        {
            _logger.LogInformation("[GET_RECOGNITION_REWARDS] Fetching recognition rewards");

            var result = await _service.GetRecognitionRewardsAsync();

            return Ok(new
            {
                success = true,
                data = result,
                message = "Recognition and rewards fetched successfully"
            });
        }
    }
}
