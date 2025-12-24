using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;


namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChangeRequestController : ControllerBase
    {
        private readonly IChangeRequestService _changeRequestService;


        public ChangeRequestController(IChangeRequestService changeRequestService)
        {
            _changeRequestService = changeRequestService;
        }


        [HttpPost("submit")]
        public async Task<IActionResult> SubmitChangeRequest([FromBody] ChangeRequestDto request)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var result = await _changeRequestService.SubmitChangeRequestAsync(userId, request);

            if (!result.Success)
                return BadRequest(result);


            return Ok(result);
        }


        [Authorize(Roles = "Admin")]
        [HttpPost("process")]
        public async Task<IActionResult> ProcessChangeRequest([FromBody] ProcessChangeRequestDto request)
        {
            var adminUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var result = await _changeRequestService.ProcessChangeRequestAsync(request, adminUserId);

            if (!result.Success)
                return BadRequest(result);


            return Ok(result);
        }


        [Authorize(Roles = "Admin")]
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingRequests()
        {
            var result = await _changeRequestService.GetPendingRequestsAsync();
            return Ok(result);
        }


        [HttpGet("my-requests")]
        public async Task<IActionResult> GetMyChangeRequests()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var result = await _changeRequestService.GetUserChangeRequestsAsync(userId);
            return Ok(result);
        }


        [Authorize(Roles = "Admin")]
        [HttpGet("all")]
        public async Task<IActionResult> GetAllChangeRequests()
        {
            var result = await _changeRequestService.GetAllChangeRequestsAsync();
            return Ok(result);
        }


        [HttpDelete("cancel/{requestId}")]
        public async Task<IActionResult> CancelChangeRequest(int requestId)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var result = await _changeRequestService.CancelChangeRequestAsync(userId, requestId);

            if (!result.Success)
                return BadRequest(result);


            return Ok(result);
        }


        [HttpGet("has-pending")]
        public async Task<IActionResult> HasPendingRequest()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var result = await _changeRequestService.HasPendingRequestAsync(userId);
            return Ok(result);
        }
    }
}
