using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Data.DBContexts;

namespace eepzbackend.Controllers
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
            ILogger<RecognitionRewardController> logger
        )
        {
            _service = service;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetRecognitionRewards()
        {
            try
            {
                var result = await _service.GetRecognitionRewardsAsync();
                return Ok(result);
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Error fetching recognition and rewards");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
