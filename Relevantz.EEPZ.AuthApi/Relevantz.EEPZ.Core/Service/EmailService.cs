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

                _configuration["SmtpSettings:FromName"],

                _configuration["SmtpSettings:FromEmail"]));

            message.To.Add(new MailboxAddress("", toEmail));

            message.Subject = subject;
 
            var bodyBuilder = new BodyBuilder

            {

                HtmlBody = htmlBody

            };

            message.Body = bodyBuilder.ToMessageBody();
 
            using var client = new SmtpClient();

            await client.ConnectAsync(

                _configuration["SmtpSettings:Host"],

                _configuration.GetValue<int>("SmtpSettings:Port"),

                _configuration.GetValue<bool>("SmtpSettings:EnableSsl")

                    ? SecureSocketOptions.StartTls

                    : SecureSocketOptions.None);
 
            await client.AuthenticateAsync(

                _configuration["SmtpSettings:Username"],

                _configuration["SmtpSettings:Password"]);
 
            await client.SendAsync(message);

            await client.DisconnectAsync(true);
 
            EEPZServiceLog.Information($"Email sent successfully to {toEmail} - Subject: {subject}");

            return true;

        }
 
        public async Task<bool> SendWelcomeEmailAsync(string toEmail, string firstName, string temporaryPassword)

        {

            var subject = "Welcome to EEPZ System";

            var htmlBody = EmailTemplateHelper.GetWelcomeEmailTemplate(firstName, toEmail, temporaryPassword);

            return await SendEmailAsync(toEmail, subject, htmlBody);

        }
 
        public async Task<bool> SendOtpEmailAsync(string toEmail, string firstName, string otpCode, string otpType, int expirationMinutes)

        {

            var subject = "Your OTP Code - EEPZ System";

            var htmlBody = EmailTemplateHelper.GetOtpEmailTemplate(firstName, otpCode, otpType, expirationMinutes);

            return await SendEmailAsync(toEmail, subject, htmlBody);

        }
 
        public async Task<bool> SendPasswordResetConfirmationAsync(string toEmail, string firstName)

        {

            var subject = "Password Reset Successful - EEPZ System";

            var htmlBody = EmailTemplateHelper.GetPasswordResetConfirmationTemplate(firstName);

            return await SendEmailAsync(toEmail, subject, htmlBody);

        }
 
        public async Task<bool> SendChangeRequestNotificationAsync(string toEmail, string firstName, string changeType, string newValue)

        {

            var subject = "Change Request Submitted - EEPZ System";

            var htmlBody = EmailTemplateHelper.GetChangeRequestNotificationTemplate(firstName, changeType, newValue);

            return await SendEmailAsync(toEmail, subject, htmlBody);

        }

    }

}

 