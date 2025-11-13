namespace Relevantz.EEPZ.Core.IService
{
    public interface IEmailService
    {
        Task<bool> SendWelcomeEmailAsync(string toEmail, string firstName, string temporaryPassword);
        Task<bool> SendOtpEmailAsync(string toEmail, string firstName, string otpCode, string otpType, int expirationMinutes);
        Task<bool> SendPasswordResetConfirmationAsync(string toEmail, string firstName);
        Task<bool> SendChangeRequestNotificationAsync(string toEmail, string firstName, string changeType, string newValue);
    }
}
