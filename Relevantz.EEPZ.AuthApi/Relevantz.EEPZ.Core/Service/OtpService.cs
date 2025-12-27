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

        /// <summary>
        /// Get IST timezone - works in both Windows and Linux/Docker
        /// </summary>
        private static TimeZoneInfo GetIstTimeZone()
        {
            try
            {
                // Try Linux/IANA timezone ID first (works in Docker)
                return TimeZoneInfo.FindSystemTimeZoneById("Asia/Kolkata");
            }
            catch (TimeZoneNotFoundException)
            {
                try
                {
                    // Fallback to Windows timezone ID
                    return TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
                }
                catch (TimeZoneNotFoundException)
                {
                    // Final fallback: Create custom IST timezone with +5:30 offset
                    return TimeZoneInfo.CreateCustomTimeZone(
                        "IST",
                        new TimeSpan(5, 30, 0), // UTC +5:30
                        "India Standard Time",
                        "IST");
                }
            }
        }

        /// <summary>
        /// Get current time in IST (Asia/Kolkata)
        /// </summary>
        private static DateTime GetIstNow()
        {
            var istZone = GetIstTimeZone();
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, istZone);
        }

        /// <summary>
        /// Convert UTC to IST
        /// </summary>
        private static DateTime ConvertToIst(DateTime utcTime)
        {
            var istZone = GetIstTimeZone();
            return TimeZoneInfo.ConvertTimeFromUtc(utcTime, istZone);
        }

        public async Task<Otp> GenerateOtpAsync(string email, string otpType)
        {
            try
            {
                var otpLength = _configuration.GetValue<int>("OtpSettings:Length", 6);
                var expirationMinutes = _configuration.GetValue<int>("OtpSettings:ExpirationMinutes", 10);
 
                var otpCode = OtpHelper.GenerateOtp(otpLength);
                
                // Get current IST time (Asia/Kolkata = UTC +5:30)
                var istNow = GetIstNow();
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

                EEPZBusinessLog.Information($"OTP generated for {email} - Type: {otpType}, Expires: {expiresAt:yyyy-MM-dd HH:mm:ss} IST");
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
                    EEPZBusinessLog.Warning($"Invalid OTP attempt for {email} - OTP not found or already used");
                    EEPZBusinessLog.Warning($"Invalid OTP attempt for {email} - OTP not found or already used");
                    return false;
                }

                // Check if OTP is expired using IST time
                var istNow = GetIstNow();
                if (otp.ExpiresAt < istNow)
                {
                    EEPZBusinessLog.Warning($"Expired OTP attempt for {email} - Expired at: {otp.ExpiresAt:yyyy-MM-dd HH:mm:ss} IST, Current: {istNow:yyyy-MM-dd HH:mm:ss} IST");
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
                
                // Get IST time 30 minutes ago (Asia/Kolkata = UTC +5:30)
                var istTimeMinus30 = GetIstNow().AddMinutes(-30);

                var recentOtpCount = await _otpRepository.GetUnusedOtpCountAsync(
                    email,
                    otpType,
                    istTimeMinus30);
 
                if (recentOtpCount >= maxAttempts)
                {
                    EEPZBusinessLog.Warning($"OTP resend limit exceeded for {email} - {recentOtpCount} attempts in last 30 minutes");
                    return false;
                }
 
                await GenerateOtpAsync(email, otpType);
                EEPZBusinessLog.Information($"OTP resent for {email} - Attempt {recentOtpCount + 1}/{maxAttempts}");
                EEPZBusinessLog.Information($"OTP resent for {email} - Attempt {recentOtpCount + 1}/{maxAttempts}");
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
                var istNow = GetIstNow();
                EEPZServiceLog.Information($"Starting expired OTP cleanup at {istNow:yyyy-MM-dd HH:mm:ss} IST");
                
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