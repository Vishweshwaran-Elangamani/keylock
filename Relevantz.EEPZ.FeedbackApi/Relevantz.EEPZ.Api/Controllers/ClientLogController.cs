using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/log")]
    public class ClientLogController : ControllerBase
    {
        private readonly ILogger<ClientLogController> _logger;

        public ClientLogController(ILogger<ClientLogController> logger)
        {
            _logger = logger;
        }

        [HttpPost("client-error")]
        public IActionResult LogClientError([FromBody] ClientErrorDto dto)
        {
            _logger.LogWarning("Client error reported. Message: {Message}, Url: {Url}, UserAgent: {UserAgent}",
                dto.Message, dto.Url, dto.UserAgent);

            return Ok();
        }
    }

    public class ClientErrorDto
    {
        public string Message { get; set; }
        public string Url { get; set; }
        public string UserAgent { get; set; }
    }
}
