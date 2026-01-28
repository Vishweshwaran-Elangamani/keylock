namespace Relevantz.EEPZ.Common.Constants
{
    public static class OtpMessages
    {
        // Log Messages
        public const string OtpGenerated = "OTP generated for {0} - Type: {1}, Expires: {2} IST";
        public const string InvalidOtpAttempt = "Invalid OTP attempt for {0} - OTP not found or already used";
        public const string ExpiredOtpAttempt = "Expired OTP attempt for {0} - Expired at: {1} IST, Current: {2} IST";
        public const string OtpVerifiedSuccessfully = "OTP verified successfully for {0}";
        public const string OtpResendLimitExceeded = "OTP resend limit exceeded for {0} - {1} attempts in last {2} minutes";
        public const string OtpResent = "OTP resent for {0} - Attempt {1}/{2}";
        public const string StartingExpiredOtpCleanup = "Starting expired OTP cleanup at {0} IST";
        public const string ExpiredOtpsCleaned = "Expired OTPs cleaned up successfully";
        // Default User Name
        public const string DefaultUserName = "User";
    }
}
