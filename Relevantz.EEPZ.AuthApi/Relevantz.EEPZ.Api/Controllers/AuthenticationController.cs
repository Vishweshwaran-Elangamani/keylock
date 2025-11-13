using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthenticationController : ControllerBase
    {
        private readonly IAuthenticationService _authenticationService;

        public AuthenticationController(IAuthenticationService authenticationService)
        {
            _authenticationService = authenticationService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            request.IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            request.UserAgent = HttpContext.Request.Headers["User-Agent"].ToString();

            var result = await _authenticationService.LoginAsync(request);
            
            if (!result.Success)
                return Unauthorized(result);

            return Ok(result);
        }

        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequestDto request)
        {
            var result = await _authenticationService.VerifyOtpAndLoginAsync(request);
            
            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto request)
        {
            var result = await _authenticationService.ForgotPasswordAsync(request);
            return Ok(result);
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request)
        {
            var result = await _authenticationService.ResetPasswordAsync(request);
            
            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        [Authorize]
[HttpPost("change-password")]
public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
{
    try
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized(new { success = false, message = "Invalid user authentication" });
        }

        if (userId == 0)
        {
            return Unauthorized(new { success = false, message = "User ID not found" });
        }

        var result = await _authenticationService.ChangePasswordAsync(userId, request);
        
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }
    catch (Exception ex)
    {
        EEPZBusinessLog.Error($"Change password error for user", ex);
        return StatusCode(500, new { success = false, message = "An error occurred while changing password" });
    }
}


        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var result = await _authenticationService.LogoutAsync(userId);
            return Ok(result);
        }
    }
}
