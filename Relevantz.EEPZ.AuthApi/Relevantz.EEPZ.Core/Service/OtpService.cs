using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using Microsoft.Extensions.Configuration;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Core.Service
{
    public class OtpService : IOtpService
    {
        private readonly IOtpRepository _otpRepository;
        private readonly IEmailService _emailService;
        private readonly IUserAuthenticationRepository _userAuthRepository;
        private readonly IConfiguration _configuration;

        public OtpService(
            IOtpRepository otpRepository,
            IEmailService emailService,
            IUserAuthenticationRepository userAuthRepository,
            IConfiguration configuration)
        {
            _otpRepository = otpRepository;
            _emailService = emailService;
            _userAuthRepository = userAuthRepository;
            _configuration = configuration;
        }

        public async Task<Otp> GenerateOtpAsync(string email, string otpType)
        {
            try
            {
                var otpLength = _configuration.GetValue<int>("OtpSettings:Length", 6);
                var expirationMinutes = _configuration.GetValue<int>("OtpSettings:ExpirationMinutes", 10);

                var otpCode = OtpHelper.GenerateOtp(otpLength);
                var istZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
                var istNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, istZone);
                var expiresAt = istNow.AddMinutes(expirationMinutes);

                var otp = new Otp
                {
                    Email = email,
                    OtpCode = otpCode,
                    OtpType = otpType,
                    ExpiresAt = expiresAt,
                    IsUsed = false,
                    CreatedAt = istNow
                };

                await _otpRepository.CreateAsync(otp);

                // Get user's first name for email
                var user = await _userAuthRepository.GetByEmailAsync(email);
                var firstName = user?.Employee?.Userprofile?.FirstName ?? "User";

                // Send OTP email
                await _emailService.SendOtpEmailAsync(email, firstName, otpCode, otpType, expirationMinutes);

                EEPZBusinessLog.Information($"OTP generated for {email} - Type: {otpType}");
                return otp;
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error generating OTP for {email}", ex);
                throw;
            }
        }

        public async Task<bool> VerifyOtpAsync(string email, string otpCode, string otpType)
        {
            try
            {
                var otp = await _otpRepository.GetValidOtpAsync(email, otpCode, otpType);

                if (otp == null)
                {
                    EEPZBusinessLog.Warning($"Invalid OTP attempt for {email}");
                    return false;
                }

                if (OtpHelper.IsExpired(otp.ExpiresAt))
                {
                    EEPZBusinessLog.Warning($"Expired OTP attempt for {email}");
                    return false;
                }

                await _otpRepository.MarkAsUsedAsync(otp.OtpId);
                EEPZBusinessLog.Information($"OTP verified successfully for {email}");
                return true;
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error verifying OTP for {email}", ex);
                return false;
            }
        }

        public async Task<bool> ResendOtpAsync(string email, string otpType)
        {
            try
            {
                var maxAttempts = _configuration.GetValue<int>("OtpSettings:MaxAttempts", 3);
                var istZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
                var istTimeMinus30 = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow.AddMinutes(-30), istZone);

                var recentOtpCount = await _otpRepository.GetUnusedOtpCountAsync(
                    email,
                    otpType,
                    istTimeMinus30);

                if (recentOtpCount >= maxAttempts)
                {
                    EEPZBusinessLog.Warning($"OTP resend limit exceeded for {email}");
                    return false;
                }

                await GenerateOtpAsync(email, otpType);
                return true;
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error resending OTP for {email}", ex);
                return false;
            }
        }

        public async Task CleanupExpiredOtpsAsync()
        {
            try
            {
                await _otpRepository.DeleteExpiredOtpsAsync();
                EEPZServiceLog.Information("Expired OTPs cleaned up successfully");
            }
            catch (Exception ex)
            {
                EEPZServiceLog.Error("Error cleaning up expired OTPs", ex);
            }
        }
    }
}
