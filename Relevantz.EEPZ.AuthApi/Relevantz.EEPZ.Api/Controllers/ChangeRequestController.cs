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

        /// <summary>
        /// Employee submits email change request
        /// Uses: NewEmail, Reason from DTO
        /// </summary>
        [HttpPost("submit")]
        public async Task<IActionResult> SubmitChangeRequest([FromBody] ChangeRequestDto request)
        {
            // Validation for employee submission
            if (string.IsNullOrWhiteSpace(request.NewEmail))
            {
                return BadRequest(new { success = false, message = "Email is required" });
            }

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var result = await _changeRequestService.SubmitChangeRequestAsync(userId, request);
            
            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        /// <summary>
        /// Admin approves/rejects email change request
        /// Uses: RequestId, Status, AdminRemarks from DTO
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPost("process")]
        public async Task<IActionResult> ProcessChangeRequest([FromBody] ChangeRequestDto request)
        {
            // Validation for admin processing
            if (!request.RequestId.HasValue || request.RequestId <= 0)
            {
                return BadRequest(new { success = false, message = "Request ID is required" });
            }

            if (string.IsNullOrWhiteSpace(request.Status))
            {
                return BadRequest(new { success = false, message = "Status is required" });
            }

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
