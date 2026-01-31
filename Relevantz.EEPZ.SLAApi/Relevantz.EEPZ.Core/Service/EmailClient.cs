using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Polly;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class EmailClient : IEmailClient
    {
        private readonly IConfiguration _config;
        private readonly ILogger<EmailClient> _logger;
        private readonly AsyncPolicy _retryPolicy;

        public EmailClient(IConfiguration config, ILogger<EmailClient> logger)
        {
            _config = config;
            _logger = logger;

            var retryCount = int.TryParse(_config["SmtpSettings:RetryCount"], out var r) ? r : 3;
            var retryDelay = int.TryParse(_config["SmtpSettings:RetryDelaySeconds"], out var d) ? d : 2;

            _retryPolicy = Policy
                .Handle<Exception>()
                .WaitAndRetryAsync(retryCount,
                    _ => TimeSpan.FromSeconds(retryDelay),
                    (ex, ts, retry, ctx) =>
                        _logger.LogWarning(ex, "Retry {Retry} sending email", retry));
        }

        private SmtpClient CreateSmtpClient()
        {
            var host = _config["SmtpSettings:Host"];
            var port = int.Parse(_config["SmtpSettings:Port"]);
            var username = _config["SmtpSettings:Username"];
            var password = _config["SmtpSettings:Password"];
            var enableSsl = bool.Parse(_config["SmtpSettings:EnableSsl"]);
            var timeout = int.Parse(_config["SmtpSettings:TimeoutSeconds"]);

            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
                throw new InvalidOperationException("SMTP credentials missing.");

            return new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(username, password),
                EnableSsl = enableSsl,
                Timeout = timeout * 1000
            };
        }

        public async Task SendAsync(string toEmail, string subject, string body, bool isHtml = true)
        {
            await _retryPolicy.ExecuteAsync(async () =>
            {
                using var client = CreateSmtpClient();
                using var message = new MailMessage
                {
                    From = new MailAddress(_config["SmtpSettings:FromEmail"], _config["SmtpSettings:FromName"]),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = isHtml
                };
                message.To.Add(toEmail);

                await client.SendMailAsync(message);
            });

            _logger.LogInformation("Email sent to {Email}", toEmail);
        }
    }
}
