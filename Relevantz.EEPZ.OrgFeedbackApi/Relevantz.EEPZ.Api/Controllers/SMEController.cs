using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Models;
namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SmeController : ControllerBase
    {
        private readonly ISmeService _service;
        private readonly ILogger<SmeController> _logger;

        public SmeController(ISmeService service, ILogger<SmeController> logger)
        {
            _service = service;
            _logger = logger;
        }

        /// <summary>
        /// Get all active SMEs with Employee and Skill details
        /// </summary>
        [HttpGet("active")]
        [ProducesResponseType(typeof(ApiResponse<List<SmeDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetActiveSmes()
        {
            _logger.LogInformation("Retrieving active SMEs");
            var response = await _service.GetActiveSmesAsync();
            return Ok(response);
        }
    }
}
