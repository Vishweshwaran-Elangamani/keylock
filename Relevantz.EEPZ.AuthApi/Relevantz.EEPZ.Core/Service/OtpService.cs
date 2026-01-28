using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using Microsoft.Extensions.Configuration;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Constants;
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
            var otpLength = _configuration.GetValue<int>(
                ConfigurationKeys.OtpSettings.Length, 
                OtpSettingsConstants.DefaultOtpLength);
            var expirationMinutes = _configuration.GetValue<int>(
                ConfigurationKeys.OtpSettings.ExpirationMinutes, 
                OtpSettingsConstants.DefaultExpirationMinutes);
            var otpCode = OtpHelper.GenerateOtp(otpLength);
            // Get current IST time (Asia/Kolkata = UTC +5:30)
            var istNow = TimeZoneHelper.GetIstNow();
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
            var firstName = user?.Employee?.Userprofile?.FirstName ?? OtpMessages.DefaultUserName;
            // Send OTP email
            await _emailService.SendOtpEmailAsync(email, firstName, otpCode, otpType, expirationMinutes);
            EEPZBusinessLog.Information(string.Format(
                OtpMessages.OtpGenerated, 
                email, 
                otpType, 
                TimeZoneHelper.FormatIstTime(expiresAt)));
            return otp;
        }
        public async Task<bool> VerifyOtpAsync(string email, string otpCode, string otpType)
        {
            var otp = await _otpRepository.GetValidOtpAsync(email, otpCode, otpType);
            if (otp == null)
            {
                EEPZBusinessLog.Warning(string.Format(OtpMessages.InvalidOtpAttempt, email));
                return false;
            }
            // Check if OTP is expired using IST time
            var istNow = TimeZoneHelper.GetIstNow();
            if (otp.ExpiresAt < istNow)
            {
                EEPZBusinessLog.Warning(string.Format(
                    OtpMessages.ExpiredOtpAttempt, 
                    email, 
                    TimeZoneHelper.FormatIstTime(otp.ExpiresAt), 
                    TimeZoneHelper.FormatIstTime(istNow)));
                return false;
            }
            await _otpRepository.MarkAsUsedAsync(otp.OtpId);
            EEPZBusinessLog.Information(string.Format(OtpMessages.OtpVerifiedSuccessfully, email));
            return true;
        }
        public async Task<bool> ResendOtpAsync(string email, string otpType)
        {
            var maxAttempts = _configuration.GetValue<int>(
                ConfigurationKeys.OtpSettings.MaxAttempts, 
                OtpSettingsConstants.DefaultMaxAttempts);
            var resendCooldownMinutes = _configuration.GetValue<int>(
                ConfigurationKeys.OtpSettings.ResendCooldownMinutes, 
                OtpSettingsConstants.DefaultResendCooldownMinutes);
            // Get IST time minus cooldown period
            var istTimeMinus = TimeZoneHelper.GetIstNow().AddMinutes(-resendCooldownMinutes);
            var recentOtpCount = await _otpRepository.GetUnusedOtpCountAsync(
                email,
                otpType,
                istTimeMinus);
            if (recentOtpCount >= maxAttempts)
            {
                EEPZBusinessLog.Warning(string.Format(
                    OtpMessages.OtpResendLimitExceeded, 
                    email, 
                    recentOtpCount, 
                    resendCooldownMinutes));
                return false;
            }
            await GenerateOtpAsync(email, otpType);
            EEPZBusinessLog.Information(string.Format(
                OtpMessages.OtpResent, 
                email, 
                recentOtpCount + 1, 
                maxAttempts));
            return true;
        }
        public async Task CleanupExpiredOtpsAsync()
        {
            var istNow = TimeZoneHelper.GetIstNow();
            EEPZServiceLog.Information(string.Format(
                OtpMessages.StartingExpiredOtpCleanup, 
                TimeZoneHelper.FormatIstTime(istNow)));
            await _otpRepository.DeleteExpiredOtpsAsync();
            EEPZServiceLog.Information(OtpMessages.ExpiredOtpsCleaned);
        }
    }
}
