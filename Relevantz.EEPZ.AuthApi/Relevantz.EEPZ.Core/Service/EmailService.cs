using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;
using Relevantz.EEPZ.Common.Constants;
namespace Relevantz.EEPZ.Core.Service
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }
        private async Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody)
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(
                _configuration[EmailConstants.ConfigKeys.FromName],
                _configuration[EmailConstants.ConfigKeys.FromEmail]));
            message.To.Add(new MailboxAddress(EmailConstants.Defaults.EmptyRecipientName, toEmail));
            message.Subject = subject;
            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = htmlBody
            };
            message.Body = bodyBuilder.ToMessageBody();
            using var client = new SmtpClient();
            await client.ConnectAsync(
                _configuration[EmailConstants.ConfigKeys.Host],
                _configuration.GetValue<int>(EmailConstants.ConfigKeys.Port),
                _configuration.GetValue<bool>(EmailConstants.ConfigKeys.EnableSsl)
                    ? SecureSocketOptions.StartTls
                    : SecureSocketOptions.None);
            await client.AuthenticateAsync(
                _configuration[EmailConstants.ConfigKeys.Username],
                _configuration[EmailConstants.ConfigKeys.Password]);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
            EEPZServiceLog.Information($"Email sent successfully to {toEmail} - Subject: {subject}");
            return true;
        }
        public async Task<bool> SendWelcomeEmailAsync(string toEmail, string firstName, string temporaryPassword)
        {
            var subject = EmailConstants.Subjects.Welcome;
            var htmlBody = EmailTemplateHelper.GetWelcomeEmailTemplate(firstName, toEmail, temporaryPassword);
            return await SendEmailAsync(toEmail, subject, htmlBody);
        }
        public async Task<bool> SendOtpEmailAsync(string toEmail, string firstName, string otpCode, string otpType, int expirationMinutes)
        {
            var subject = EmailConstants.Subjects.Otp;
            var htmlBody = EmailTemplateHelper.GetOtpEmailTemplate(firstName, otpCode, otpType, expirationMinutes);
            return await SendEmailAsync(toEmail, subject, htmlBody);
        }
        public async Task<bool> SendPasswordResetConfirmationAsync(string toEmail, string firstName)
        {
            var subject = EmailConstants.Subjects.PasswordResetConfirmation;
            var htmlBody = EmailTemplateHelper.GetPasswordResetConfirmationTemplate(firstName);
            return await SendEmailAsync(toEmail, subject, htmlBody);
        }
        public async Task<bool> SendChangeRequestNotificationAsync(string toEmail, string firstName, string changeType, string newValue)
        {
            var subject = EmailConstants.Subjects.ChangeRequestNotification;
            var htmlBody = EmailTemplateHelper.GetChangeRequestNotificationTemplate(firstName, changeType, newValue);
            return await SendEmailAsync(toEmail, subject, htmlBody);
        }
    }
}
