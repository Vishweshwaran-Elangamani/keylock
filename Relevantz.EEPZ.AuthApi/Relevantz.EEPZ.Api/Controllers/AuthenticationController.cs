using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Relevantz.EEPZ.Common.Constants;
namespace Relevantz.EEPZ.Api.Controllers
{
    /// <summary>
    /// Provides endpoints for authentication workflows such as login with OTP,
    /// OTP verification, password reset, password change, and logout.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AuthenticationController : ControllerBase
    {
        private readonly IAuthenticationService _authenticationService;
        private readonly ILogger<AuthenticationController> _logger;
        /// <summary>
        /// Initializes a new instance of <see cref="AuthenticationController"/>.
        /// </summary>
        public AuthenticationController(
            IAuthenticationService authenticationService,
            ILogger<AuthenticationController> logger)
        {
            _authenticationService = authenticationService;
            _logger = logger;
        }
        /// <summary>
        /// Initiates user login and triggers OTP delivery.
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            var maskedEmail = EmailMaskingUtil.MaskEmail(request.Email);
            _logger.LogInformation("Login attempt initiated for {MaskedEmail}", maskedEmail);
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
        /// <summary>
        /// Verifies the OTP sent during login and completes authentication.
        /// </summary>
        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequestDto request)
        {
            var maskedEmail = EmailMaskingUtil.MaskEmail(request.Email);
            _logger.LogInformation("OTP verification attempt for {MaskedEmail}", maskedEmail);
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
        /// <summary>
        /// Initiates the forgot password flow and sends a password reset OTP.
        /// </summary>
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto request)
        {
            var maskedEmail = EmailMaskingUtil.MaskEmail(request.Email);
            _logger.LogInformation("Password reset requested for {MaskedEmail}", maskedEmail);
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
        /// <summary>
        /// Confirms password reset using OTP and sets a new password.
        /// </summary>
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request)
        {
            var maskedEmail = EmailMaskingUtil.MaskEmail(request.Email);
            _logger.LogInformation("Password reset confirmation for {MaskedEmail}", maskedEmail);
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
        /// <summary>
        /// Changes the password for the authenticated user.
        /// </summary>
        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                _logger.LogWarning("Change password attempted with invalid authentication token");
                return Unauthorized(new { success = false, message = "Invalid user authentication" });
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
        /// <summary>
        /// Logs out the authenticated user.
        /// </summary>
        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
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
    }
}
