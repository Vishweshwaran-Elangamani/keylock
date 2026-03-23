using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Constants;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChangeRequestController : ControllerBase
    {
        private readonly IChangeRequestService _changeRequestService;
        private readonly ICurrentUserService _currentUser;

        public ChangeRequestController(
            IChangeRequestService changeRequestService,
            ICurrentUserService currentUser)
        {
            _changeRequestService = changeRequestService;
            _currentUser = currentUser;
        }

        [HttpPost("submit")]
        public async Task<IActionResult> SubmitChangeRequest([FromBody] ChangeRequestDto request)
        {
            var userId = await _currentUser.GetEmployeeIdAsync();
            if (userId == null)
                return Unauthorized(ApiResponseDto<string>.FailureResponse("User not found"));

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _changeRequestService.SubmitChangeRequestAsync(userId.Value, request);
            return Ok(ApiResponseDto<ChangeRequestResponseDto>.SuccessResponse(result, Constants.Messages.ChangeRequestSubmitted));
        }

        [Authorize]
        [HttpPost("process")]
        public async Task<IActionResult> ProcessChangeRequest([FromBody] ProcessChangeRequestDto request)
        {
            var adminUserId = await _currentUser.GetEmployeeIdAsync();
            if (adminUserId == null)
                return Unauthorized();

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _changeRequestService.ProcessChangeRequestAsync(request, adminUserId.Value);
            return Ok(ApiResponseDto<ChangeRequestResponseDto>.SuccessResponse(result, Constants.Messages.ChangeRequestProcessed));
        }

        [Authorize]
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingRequests()
        {
            var result = await _changeRequestService.GetPendingRequestsAsync();
            return Ok(ApiResponseDto<List<ChangeRequestResponseDto>>.SuccessResponse(result, "Pending requests retrieved successfully"));
        }

        [HttpGet("my-requests")]
        public async Task<IActionResult> GetMyChangeRequests()
        {
            var userId = await _currentUser.GetEmployeeIdAsync();
            if (userId == null)
                return Unauthorized();

            var result = await _changeRequestService.GetUserChangeRequestsAsync(userId.Value);
            return Ok(ApiResponseDto<List<ChangeRequestResponseDto>>.SuccessResponse(result, "User change requests retrieved successfully"));
        }

        [Authorize]
        [HttpGet("all")]
        public async Task<IActionResult> GetAllChangeRequests()
        {
            var result = await _changeRequestService.GetAllChangeRequestsAsync();
            return Ok(ApiResponseDto<List<ChangeRequestResponseDto>>.SuccessResponse(result, "All change requests retrieved successfully"));
        }

        [HttpDelete("cancel/{id}")]
        public async Task<IActionResult> CancelChangeRequest(int id)
        {
            var userId = await _currentUser.GetEmployeeIdAsync();
            if (userId == null)
                return Unauthorized();

            var result = await _changeRequestService.CancelChangeRequestAsync(userId.Value, id);
            return Ok(ApiResponseDto<bool>.SuccessResponse(result, "Change request cancelled successfully"));
        }

        [HttpGet("has-pending")]
        public async Task<IActionResult> HasPendingRequest()
        {
            var userId = await _currentUser.GetEmployeeIdAsync();
            if (userId == null)
                return Unauthorized();

            var result = await _changeRequestService.HasPendingRequestAsync(userId.Value);
            if (result != null)
                return Ok(ApiResponseDto<ChangeRequestResponseDto?>.SuccessResponse(result, "Pending request found"));

            return Ok(ApiResponseDto<ChangeRequestResponseDto?>.SuccessResponse(null, "No pending request found"));
        }
    }
}
