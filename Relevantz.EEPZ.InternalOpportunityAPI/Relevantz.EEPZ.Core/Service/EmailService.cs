using System;
using System.Threading.Tasks;
using Relevantz.EEPZ.Core.IService;
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
    int.Parse(_configuration["SmtpSettings:Port"] ?? "587"),
    _configuration["SmtpSettings:EnableSsl"] == "true" 
        ? SecureSocketOptions.StartTls 
        : SecureSocketOptions.None);


                await client.AuthenticateAsync(
                    _configuration["SmtpSettings:Username"],
                    _configuration["SmtpSettings:Password"]);

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
