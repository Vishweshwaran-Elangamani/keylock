using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Constants;


namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/smes")]
    public class SmeController : ControllerBase
    {
        private readonly ISmeService _service;
        private readonly ILogger<SmeController> _logger;

        public SmeController(ISmeService service, ILogger<SmeController> logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpGet("active")]
        [ProducesResponseType(typeof(ApiResponseDto<List<SmeResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<List<SmeResponseDto>>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetActiveSmes()
        {
            _logger.LogInformation("Retrieving active SMEs");

            var response = await _service.GetActiveSmesAsync();

            return Ok(response);
        }


    }
}
