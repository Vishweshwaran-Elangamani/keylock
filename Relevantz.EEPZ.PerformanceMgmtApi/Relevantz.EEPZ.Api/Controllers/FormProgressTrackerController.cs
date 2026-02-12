using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace eepzbackend.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class FormProgressTrackerController : ControllerBase
    {
        private readonly IFormProgressTrackerService _service;

        public FormProgressTrackerController(IFormProgressTrackerService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        
        
    }
}
