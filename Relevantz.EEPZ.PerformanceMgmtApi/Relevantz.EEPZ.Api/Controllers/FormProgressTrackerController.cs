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

        // [HttpGet("{id}")]
        // public async Task<IActionResult> GetById(int id)
        // {
        //     var result = await _service.GetByIdAsync(id);
        //     if (!((dynamic)result).success)
        //         return NotFound(result);
        //     return Ok(result);
        // }

        // [HttpGet("ByAssignment/{assignmentId}")]
        // public async Task<IActionResult> GetByAssignment(int assignmentId)
        // {
        //     var result = await _service.GetByAssignmentAsync(assignmentId);
        //     if (!((dynamic)result).success)
        //         return NotFound(result);
        //     return Ok(result);
        // }

        // [HttpPost]
        // public async Task<IActionResult> Upsert([FromBody] FormProgressTrackerUpdateDto dto)
        // {
        //     if (!ModelState.IsValid)
        //         return BadRequest(
        //             new
        //             {
        //                 success = false,
        //                 message = "Invalid data.",
        //                 errors = ModelState,
        //             }
        //         );

        //     var result = await _service.UpsertAsync(dto);
        //     return Ok(result);
        // }
    }
}
