using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;



namespace EepzBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]


    public partial class HrFeedbackFormController : ControllerBase
    {
        private readonly IHrFeedbackFormService _service;

        public HrFeedbackFormController(IHrFeedbackFormService service)
        {
            _service = service;
        }

        [Authorize(Roles = "HR")]
        [HttpPost("forms")]
        public async Task<IActionResult> CreateForm([FromBody] CreateHRFeedbackFormRequestDto dto, CancellationToken ct)
        {
           

            var created = await _service.CreateFormAsync(dto, ct);
            return CreatedAtAction(nameof(GetForm), new { formId = created.FormId }, created);
        }

        [HttpGet("forms/{formId:int}")]
        public async Task<IActionResult> GetForm(int formId, CancellationToken ct)
        {
            var result = await _service.GetFormByIdAsync(formId, ct);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet("forms")]
        public async Task<IActionResult> GetAllForms([FromQuery] PaginationRequestDto pagination, CancellationToken ct)
        {
            

            var result = await _service.GetAllFormsAsync(pagination, ct);
            return Ok(result);
        }

        [HttpGet("forms/active")]
        public async Task<IActionResult> GetActiveForms([FromQuery] PaginationRequestDto pagination, CancellationToken ct)
        {
            

            var result = await _service.GetActiveFormsAsync(pagination, ct);
            return Ok(result);
        }

        [HttpPut("forms/{formId:int}")]
        public async Task<IActionResult> UpdateForm(int formId, [FromBody] UpdateHRFormRequestDto dto, CancellationToken ct)
        {
          
            var updated = await _service.UpdateFormAsync(formId, dto, ct);
            if (updated == null) return NotFound();
            return Ok(updated);
        }

        [Authorize(Roles = "HR")]
        [HttpDelete("forms/{formId:int}")]
        public async Task<IActionResult> DeleteForm(int formId, CancellationToken ct)
        {
            var deleted = await _service.DeleteFormAsync(formId, ct);
            if (!deleted) return NotFound();
            return NoContent();
        }
    }
}
