using System;
using System.Threading.Tasks;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Constants;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;

namespace Relevantz.EEPZ.Core.Service
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody)
        {
            try
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

                Console.WriteLine($"[EmailService] Email sent successfully to {toEmail} - Subject: {subject}");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] Error sending email to {toEmail}: {ex.Message}");
                return false;
            }
        }
    }
}
