using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Constants;
using Microsoft.AspNetCore.Authorization;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/smes")]
    [Authorize]
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
        /// Retrieves all active SMEs.
        /// </summary>
        /// <returns>A list of active SME records.</returns>
        // 200 OK: Active SMEs retrieved successfully.
        // 500 InternalServerError: Unexpected server-side error.
        [HttpGet("active")]
        [ProducesResponseType(typeof(ApiResponseDto<List<SmeResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<List<SmeResponseDto>>), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetActiveSmes()
        {
            _logger.LogInformation("Retrieving active SMEs");

            try
            {

                var result = await _service.GetActiveSmesAsync();

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while retrieving active SMEs");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    ApiResponseDto<List<SmeResponseDto>>.ErrorResponse(
                        MessageConstants.InternalServerError));
            }
        }
    }
}
