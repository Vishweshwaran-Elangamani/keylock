using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Common.Constants;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace Relevantz.EEPZ.Core.Service
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        private async Task<bool> SendEmailAsync(string toEmail, string toName, string subject, string htmlBody)
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(
                _configuration[EmailConstants.ConfigKeys.FromName],
                _configuration[EmailConstants.ConfigKeys.FromEmail]));
            message.To.Add(new MailboxAddress(toName, toEmail));
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

            _logger.LogInformation($"Goal reminder email sent successfully to {toEmail} - Subject: {subject}");
            return true;
        }

        public async Task<bool> SendGoalReminderEmailAsync(string toEmail, string userName, List<string> goalSuggestions)
        {
            var subject = EmailConstants.Subjects.GoalReminder;
            var htmlBody = EmailTemplateHelper.GetGoalReminderEmailTemplate(userName, goalSuggestions);
            return await SendEmailAsync(toEmail, userName, subject, htmlBody);
        }

        public async Task<bool> SendBulkGoalRemindersAsync(List<(string email, string name)> recipients)
        {
            var successCount = 0;
            foreach (var (email, name) in recipients)
            {
                try
                {
                    var result = await SendGoalReminderEmailAsync(email, name, new List<string>());
                    if (result) successCount++;

                    await Task.Delay(100);
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Failed to send bulk email to {email}: {ex.Message}");
                }
            }

            _logger.LogInformation($"Bulk reminders sent: {successCount}/{recipients.Count} successful");
            return successCount == recipients.Count;
        }
    }
}
