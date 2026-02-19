using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Relevantz.EEPZ.Common.Constants;
using FluentValidation;

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
        private readonly IValidator<LoginRequestDto> _loginValidator;
        private readonly IValidator<VerifyOtpRequestDto> _verifyOtpValidator;
        private readonly IValidator<ForgotPasswordRequestDto> _forgotPasswordValidator;
        private readonly IValidator<ResetPasswordRequestDto> _resetPasswordValidator;
        private readonly IValidator<ChangePasswordRequestDto> _changePasswordValidator;

        /// <summary>
        /// Initializes a new instance of <see cref="AuthenticationController"/>.
        /// </summary>
        public AuthenticationController(
            IAuthenticationService authenticationService,
            ILogger<AuthenticationController> logger,
            IValidator<LoginRequestDto> loginValidator,
            IValidator<VerifyOtpRequestDto> verifyOtpValidator,
            IValidator<ForgotPasswordRequestDto> forgotPasswordValidator,
            IValidator<ResetPasswordRequestDto> resetPasswordValidator,
            IValidator<ChangePasswordRequestDto> changePasswordValidator)
        {
            _authenticationService = authenticationService;
            _logger = logger;
            _loginValidator = loginValidator;
            _verifyOtpValidator = verifyOtpValidator;
            _forgotPasswordValidator = forgotPasswordValidator;
            _resetPasswordValidator = resetPasswordValidator;
            _changePasswordValidator = changePasswordValidator;
        }

        /// <summary>
        /// Initiates user login and triggers OTP delivery.
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            var validationResult = await _loginValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Validation failed",
                    errors = validationResult.Errors.Select(e => new
                    {
                        property = e.PropertyName,
                        error = e.ErrorMessage
                    })
                });
            }

            var maskedEmail = EmailMaskingUtil.MaskEmail(request.Email);
            _logger.LogInformation("Login attempt initiated for {MaskedEmail}", maskedEmail);

            request.IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            request.UserAgent = HttpContext.Request.Headers["User-Agent"].ToString();

            var result = await _authenticationService.LoginAsync(request);

            // Determine message based on response data
            string message;
            if (result.RequiresPasswordReset)
            {
                message = MessageConstants.FirstLoginMessage;
            }
            else if (result.RequiresTwoFactor)
            {
                message = MessageConstants.OtpSent;
            }
            else
            {
                message = MessageConstants.LoginSuccess;
            }

            _logger.LogInformation("Login successful for {MaskedEmail}", maskedEmail);

            return Ok(ApiResponseDto<LoginResponseDto>.SuccessResponse(result, message));
        }

        /// <summary>
        /// Verifies the OTP sent during login and completes authentication.
        /// </summary>
        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequestDto request)
        {
            var validationResult = await _verifyOtpValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Validation failed",
                    errors = validationResult.Errors.Select(e => new
                    {
                        property = e.PropertyName,
                        error = e.ErrorMessage
                    })
                });
            }

            var maskedEmail = EmailMaskingUtil.MaskEmail(request.Email);
            _logger.LogInformation("OTP verification attempt for {MaskedEmail}", maskedEmail);

            var result = await _authenticationService.VerifyOtpAndLoginAsync(request);

            _logger.LogInformation("OTP verified successfully for {MaskedEmail}. User authenticated.", maskedEmail);

            return Ok(ApiResponseDto<LoginResponseDto>.SuccessResponse(result, MessageConstants.LoginSuccess));
        }

        /// <summary>
        /// Initiates the forgot password flow and sends a password reset OTP.
        /// </summary>
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto request)
        {
            var validationResult = await _forgotPasswordValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Validation failed",
                    errors = validationResult.Errors.Select(e => new
                    {
                        property = e.PropertyName,
                        error = e.ErrorMessage
                    })
                });
            }

            var maskedEmail = EmailMaskingUtil.MaskEmail(request.Email);
            _logger.LogInformation("Password reset requested for {MaskedEmail}", maskedEmail);

            await _authenticationService.ForgotPasswordAsync(request);

            _logger.LogInformation("Password reset OTP sent to {MaskedEmail}", maskedEmail);

            return Ok(ApiResponseDto<object>.SuccessResponse(null, MessageConstants.OtpSent));
        }

        /// <summary>
        /// Confirms password reset using OTP and sets a new password.
        /// </summary>
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request)
        {
            var vr = await _resetPasswordValidator.ValidateAsync(request);
            if (!vr.IsValid)
                return BadRequest(new
                {
                    success = false,
                    message = "Validation failed",
                    errors = vr.Errors.Select(e => new { property = e.PropertyName, error = e.ErrorMessage })
                });

            var masked = EmailMaskingUtil.MaskEmail(request.Email);
            _logger.LogInformation("Password reset confirmation for {MaskedEmail}", masked);

            await _authenticationService.ResetPasswordAsync(request);

            _logger.LogInformation("Password reset successful for {MaskedEmail}", masked);

            return Ok(ApiResponseDto<object>.SuccessResponse(null, MessageConstants.PasswordResetComplete));
        }

        /// <summary>
        /// Changes the password for the authenticated user.
        /// </summary>
        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
        {
            var validationResult = await _changePasswordValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Validation failed",
                    errors = validationResult.Errors.Select(e => new
                    {
                        property = e.PropertyName,
                        error = e.ErrorMessage
                    })
                });
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                _logger.LogWarning("Change password attempted with invalid authentication token");
                return Unauthorized(ApiResponseDto<object>.FailureResponse("Invalid user authentication"));
            }

            _logger.LogInformation("Change password initiated for UserId: {UserId}", userId);

            await _authenticationService.ChangePasswordAsync(userId, request);

            _logger.LogInformation("Password changed successfully for UserId: {UserId}", userId);

            return Ok(ApiResponseDto<object>.SuccessResponse(null, MessageConstants.PasswordChangedComplete));
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

            await _authenticationService.LogoutAsync(userId);

            _logger.LogInformation("Logout successful for UserId: {UserId}", userId);

            return Ok(ApiResponseDto<object>.SuccessResponse(null, MessageConstants.LogoutSuccess));
        }
    }
}