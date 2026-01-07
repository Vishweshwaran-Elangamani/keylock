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
        private readonly ILogger<AuthenticationController> _logger;
        public AuthenticationController(
            IAuthenticationService authenticationService,
            ILogger<AuthenticationController> logger)
        {
            _authenticationService = authenticationService;
            _logger = logger;
        }
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            var maskedEmail = MaskEmail(request.Email);
            _logger.LogInformation("Login attempt initiated for {MaskedEmail}", maskedEmail);
            try
            {
                request.IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
                request.UserAgent = HttpContext.Request.Headers["User-Agent"].ToString();
                var result = await _authenticationService.LoginAsync(request);
                if (!result.Success)
                {
                    _logger.LogWarning(
                        "Login failed for {MaskedEmail}. Reason: {Reason}",
                        maskedEmail,
                        result.Message);
                    return Unauthorized(result);
                }
                _logger.LogInformation(
                    "Login successful for {MaskedEmail}. OTP sent.",
                    maskedEmail);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Login exception occurred for {MaskedEmail}",
                    maskedEmail);
                return StatusCode(500, new { success = false, message = "An error occurred during login" });
            }
        }
        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequestDto request)
        {
            var maskedEmail = MaskEmail(request.Email);
            _logger.LogInformation("OTP verification attempt for {MaskedEmail}", maskedEmail);
            try
            {
                var result = await _authenticationService.VerifyOtpAndLoginAsync(request);
                if (!result.Success)
                {
                    _logger.LogWarning(
                        "OTP verification failed for {MaskedEmail}. Reason: {Reason}",
                        maskedEmail,
                        result.Message);
                    return BadRequest(result);
                }
                _logger.LogInformation(
                    "OTP verified successfully for {MaskedEmail}. User authenticated.",
                    maskedEmail);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "OTP verification exception for {MaskedEmail}",
                    maskedEmail);
                return StatusCode(500, new { success = false, message = "An error occurred during OTP verification" });
            }
        }
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto request)
        {
            var maskedEmail = MaskEmail(request.Email);
            _logger.LogInformation("Password reset requested for {MaskedEmail}", maskedEmail);
            try
            {
                var result = await _authenticationService.ForgotPasswordAsync(request);
                if (result.Success)
                {
                    _logger.LogInformation(
                        "Password reset OTP sent to {MaskedEmail}",
                        maskedEmail);
                }
                else
                {
                    _logger.LogWarning(
                        "Password reset request failed for {MaskedEmail}. Reason: {Reason}",
                        maskedEmail,
                        result.Message);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Password reset request exception for {MaskedEmail}",
                    maskedEmail);
                return StatusCode(500, new { success = false, message = "An error occurred during password reset" });
            }
        }
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request)
        {
            var maskedEmail = MaskEmail(request.Email);
            _logger.LogInformation("Password reset confirmation for {MaskedEmail}", maskedEmail);
            try
            {
                var result = await _authenticationService.ResetPasswordAsync(request);
                if (!result.Success)
                {
                    _logger.LogWarning(
                        "Password reset failed for {MaskedEmail}. Reason: {Reason}",
                        maskedEmail,
                        result.Message);
                    return BadRequest(result);
                }
                _logger.LogInformation(
                    "Password reset successful for {MaskedEmail}",
                    maskedEmail);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Password reset exception for {MaskedEmail}",
                    maskedEmail);
                return StatusCode(500, new { success = false, message = "An error occurred during password reset" });
            }
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
                    _logger.LogWarning("Change password attempted with invalid authentication token");
                    return Unauthorized(new { success = false, message = "Invalid user authentication" });
                }
                if (userId == 0)
                {
                    _logger.LogWarning("Change password attempted with userId = 0");
                    return Unauthorized(new { success = false, message = "User ID not found" });
                }
                _logger.LogInformation("Change password initiated for UserId: {UserId}", userId);
                var result = await _authenticationService.ChangePasswordAsync(userId, request);
                if (!result.Success)
                {
                    _logger.LogWarning(
                        "Change password failed for UserId: {UserId}. Reason: {Reason}",
                        userId,
                        result.Message);
                    return BadRequest(result);
                }
                _logger.LogInformation(
                    "Password changed successfully for UserId: {UserId}",
                    userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Change password exception occurred");
                return StatusCode(500, new { success = false, message = "An error occurred while changing password" });
            }
        }
        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                _logger.LogInformation("Logout initiated for UserId: {UserId}", userId);
                var result = await _authenticationService.LogoutAsync(userId);
                if (result.Success)
                {
                    _logger.LogInformation("Logout successful for UserId: {UserId}", userId);
                }
                else
                {
                    _logger.LogWarning(
                        "Logout failed for UserId: {UserId}. Reason: {Reason}",
                        userId,
                        result.Message);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Logout exception occurred");
                return StatusCode(500, new { success = false, message = "An error occurred during logout" });
            }
        }
        private static string MaskEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
                return "***@***.***";
            var parts = email.Split('@');
            var username = parts[0];
            var domain = parts[1];
            var maskedUsername = username.Length > 2
                ? username.Substring(0, 2) + new string('*', Math.Min(username.Length - 2, 5))
                : new string('*', username.Length);
            return $"{maskedUsername}@{domain}";
        }
    }
}
