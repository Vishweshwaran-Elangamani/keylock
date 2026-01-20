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
        /// <param name="authenticationService">Service that handles authentication operations.</param>
        /// <param name="logger">Logger instance for capturing authentication events.</param>
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
        /// <param name="request">Login request containing user email and related info.</param>
        /// <returns>
        /// 200 OK with login result on success (typically indicates OTP sent),
        /// 401 Unauthorized if credentials are invalid,
        /// 500 Internal Server Error for unexpected failures.
        /// </returns>
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

        /// <summary>
        /// Verifies the OTP sent during login and completes authentication.
        /// </summary>
        /// <param name="request">OTP verification request containing email and OTP code.</param>
        /// <returns>
        /// 200 OK with authentication result on success,
        /// 400 Bad Request if OTP is invalid/expired,
        /// 500 Internal Server Error for unexpected failures.
        /// </returns>
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

        /// <summary>
        /// Initiates the forgot password flow and sends a password reset OTP to the user's email.
        /// </summary>
        /// <param name="request">Forgot password request containing the user email.</param>
        /// <returns>
        /// 200 OK with operation result (success indicates reset OTP sent),
        /// 500 Internal Server Error for unexpected failures.
        /// </returns>
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

        /// <summary>
        /// Confirms password reset using OTP and sets a new password.
        /// </summary>
        /// <param name="request">Reset password request containing email, OTP, and new password.</param>
        /// <returns>
        /// 200 OK with operation result on success,
        /// 400 Bad Request if OTP or payload is invalid,
        /// 500 Internal Server Error for unexpected failures.
        /// </returns>
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

        /// <summary>
        /// Changes the password for the authenticated user.
        /// </summary>
        /// <param name="request">Change password request containing current and new password.</param>
        /// <returns>
        /// 200 OK with operation result on success,
        /// 400 Bad Request if validation fails,
        /// 401 Unauthorized if user context is invalid,
        /// 500 Internal Server Error for unexpected failures.
        /// </returns>
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

        /// <summary>
        /// Logs out the authenticated user and invalidates active tokens/sessions.
        /// </summary>
        /// <returns>
        /// 200 OK with operation result (success indicates logout completed),
        /// 500 Internal Server Error for unexpected failures.
        /// </returns>
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

        /// <summary>
        /// Masks the local-part of an email address for logging purposes.
        /// </summary>
        /// <param name="email">The email address to mask.</param>
        /// <returns>A masked email string preserving the domain.</returns>
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
