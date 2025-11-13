using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Configuration;
using Relevantz.EEPZ.Core.IService;
using Microsoft.Extensions.Logging;
 
namespace Relevantz.EEPZ.Core.Service
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        private const string BaseStyle = @"
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                
                :root {
                    color-scheme: light dark;
                    supported-color-schemes: light dark;
                }
                
                * {
                    margin: 0;
                    padding: 0;
                }
                
                body {
                    margin: 0;
                    padding: 0;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    background-color: #FAFAFA;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                }
                
                @media (prefers-color-scheme: dark) {
                    body {
                        background-color: #0A0A0A;
                    }
                    
                    .email-container {
                        background-color: #1A1A1A;
                        border: 1px solid #2A2A2A;
                    }
                    
                    .brand-bar {
                        background-color: #2563EB;
                    }
                    
                    .header-section {
                        background-color: #1A1A1A;
                        border-bottom: 1px solid #2A2A2A;
                    }
                    
                    .brand-name {
                        color: #FFFFFF;
                    }
                    
                    .brand-subtitle {
                        color: #9CA3AF;
                    }
                    
                    .section-title {
                        background-color: #2A2A2A;
                        color: #E5E7EB;
                    }
                    
                    .content-area {
                        background-color: #1A1A1A;
                    }
                    
                    .text-primary {
                        color: #E5E7EB;
                    }
                    
                    .text-secondary {
                        color: #9CA3AF;
                    }
                    
                    .goal-table {
                        background-color: #111111;
                        border: 1px solid #2A2A2A;
                    }
                    
                    .goal-item {
                        background-color: #2A2A2A;
                        border: 1px solid #333333;
                    }
                    
                    .notice-bar {
                        background-color: #2A2A2A;
                        border-left: 3px solid #F59E0B;
                    }
                    
                    .notice-bar.success {
                        border-left-color: #10B981;
                    }
                    
                    .notice-bar.error {
                        border-left-color: #EF4444;
                    }
                    
                    .notice-bar.info {
                        border-left-color: #3B82F6;
                    }
                    
                    .notice-text {
                        color: #D1D5DB;
                    }
                    
                    .footer-section {
                        background-color: #111111;
                        border-top: 1px solid #2A2A2A;
                    }
                    
                    .footer-text {
                        color: #6B7280;
                    }
                    
                    .footer-link {
                        color: #60A5FA;
                    }
                    
                    .divider-line {
                        background-color: #2A2A2A;
                    }
                }
                
                table {
                    border-spacing: 0;
                    border-collapse: collapse;
                }
                
                td {
                    padding: 0;
                }
                
                .email-wrapper {
                    width: 100%;
                    background-color: #FAFAFA;
                    padding: 40px 0;
                }
                
                .email-container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #FFFFFF;
                    border: 1px solid #E5E7EB;
                    overflow: hidden;
                }
                
                .brand-bar {
                    width: 4px;
                    background-color: #2563EB;
                    height: 100%;
                }
                
                .header-section {
                    background-color: #FFFFFF;
                    padding: 40px 48px;
                    border-bottom: 1px solid #E5E7EB;
                }
                
                .brand-name {
                    font-size: 32px;
                    font-weight: 700;
                    color: #111827;
                    letter-spacing: 4px;
                    margin: 0 0 8px 0;
                }
                
                .brand-subtitle {
                    font-size: 12px;
                    font-weight: 500;
                    color: #6B7280;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    margin: 0;
                }
                
                .section-title {
                    background-color: #F9FAFB;
                    padding: 16px 48px;
                    font-size: 11px;
                    font-weight: 700;
                    color: #374151;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    border-top: 1px solid #E5E7EB;
                    border-bottom: 1px solid #E5E7EB;
                }
                
                .content-area {
                    padding: 40px 48px;
                    background-color: #FFFFFF;
                }
                
                .greeting-text {
                    font-size: 16px;
                    font-weight: 600;
                    color: #111827;
                    margin: 0 0 24px 0;
                    line-height: 1.5;
                }
                
                .text-primary {
                    font-size: 15px;
                    line-height: 1.7;
                    color: #374151;
                    margin: 0 0 16px 0;
                }
                
                .text-secondary {
                    font-size: 14px;
                    line-height: 1.6;
                    color: #6B7280;
                    margin: 0;
                }
                
                .goal-table {
                    width: 100%;
                    background-color: #F9FAFB;
                    border: 1px solid #E5E7EB;
                    margin: 32px 0;
                }
                
                .goal-item {
                    background-color: #FFFFFF;
                    border: 1px solid #E5E7EB;
                    padding: 20px 24px;
                    margin: 12px 0;
                }
                
                .goal-number {
                    font-size: 11px;
                    font-weight: 700;
                    color: #6B7280;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    margin: 0 0 8px 0;
                }
                
                .goal-text {
                    font-size: 14px;
                    font-weight: 500;
                    color: #111827;
                    line-height: 1.6;
                    margin: 0;
                }
                
                .notice-bar {
                    background-color: #F9FAFB;
                    border-left: 3px solid #F59E0B;
                    padding: 20px 24px;
                    margin: 28px 0;
                }
                
                .notice-bar.success {
                    border-left-color: #10B981;
                }
                
                .notice-bar.error {
                    border-left-color: #EF4444;
                }
                
                .notice-bar.info {
                    border-left-color: #3B82F6;
                }
                
                .notice-title {
                    font-size: 12px;
                    font-weight: 700;
                    color: #111827;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin: 0 0 8px 0;
                }
                
                .notice-text {
                    font-size: 14px;
                    color: #4B5563;
                    margin: 0;
                    line-height: 1.6;
                }
                
                .list-section {
                    margin: 28px 0;
                }
                
                .list-heading {
                    font-size: 13px;
                    font-weight: 700;
                    color: #111827;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin: 0 0 16px 0;
                }
                
                .list-item {
                    font-size: 14px;
                    color: #4B5563;
                    line-height: 1.7;
                    margin: 0 0 12px 0;
                    padding-left: 24px;
                    position: relative;
                }
                
                .list-item:before {
                    content: '•';
                    position: absolute;
                    left: 8px;
                    color: #3B82F6;
                    font-weight: bold;
                }
                
                .divider-line {
                    height: 1px;
                    background-color: #E5E7EB;
                    margin: 32px 0;
                }
                
                .button-container {
                    text-align: center;
                    margin: 32px 0;
                }
                
                .primary-button {
                    display: inline-block;
                    padding: 14px 32px;
                    background-color: #2563EB;
                    color: #FFFFFF;
                    text-decoration: none;
                    font-size: 14px;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    border-radius: 0;
                }
                
                .primary-button:hover {
                    background-color: #1D4ED8;
                }
                
                .footer-section {
                    background-color: #F9FAFB;
                    padding: 40px 48px;
                    border-top: 1px solid #E5E7EB;
                }
                
                .footer-brand {
                    text-align: center;
                    margin: 0 0 24px 0;
                }
                
                .footer-brand-name {
                    font-size: 18px;
                    font-weight: 700;
                    color: #111827;
                    letter-spacing: 3px;
                    margin: 0 0 4px 0;
                }
                
                .footer-brand-desc {
                    font-size: 11px;
                    color: #6B7280;
                    letter-spacing: 1px;
                    margin: 0;
                }
                
                .footer-text {
                    font-size: 13px;
                    color: #6B7280;
                    text-align: center;
                    line-height: 1.6;
                    margin: 12px 0;
                }
                
                .footer-link {
                    color: #2563EB;
                    text-decoration: none;
                    font-weight: 500;
                }
                
                .footer-link:hover {
                    color: #1D4ED8;
                }
                
                .footer-copyright {
                    font-size: 11px;
                    color: #9CA3AF;
                    text-align: center;
                    line-height: 1.7;
                    margin: 24px 0 0 0;
                }
                
                @media only screen and (max-width: 600px) {
                    .header-section,
                    .section-title,
                    .content-area,
                    .footer-section {
                        padding-left: 24px;
                        padding-right: 24px;
                    }
                    
                    .brand-name {
                        font-size: 26px;
                        letter-spacing: 3px;
                    }
                    
                    .goal-item {
                        padding: 16px 20px;
                    }
                }
            </style>
        ";
 
        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }
 
        public async Task<bool> SendGoalReminderEmailAsync(
            string toEmail,
            string userName,
            List<string> goalSuggestions)
        {
            try
            {
                var emailMessage = new MimeMessage();
                emailMessage.From.Add(new MailboxAddress(
                    _configuration["SmtpSettings:FromName"],
                    _configuration["SmtpSettings:FromEmail"]
                ));
                emailMessage.To.Add(new MailboxAddress(userName, toEmail));
                emailMessage.Subject = "Set Your Career Development Goals";
 
                // Build email body
                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = GenerateGoalReminderHtml(userName, goalSuggestions),
                    TextBody = GenerateGoalReminderText(userName, goalSuggestions)
                };
                emailMessage.Body = bodyBuilder.ToMessageBody();
 
                // Send email
                using var smtpClient = new SmtpClient();
                await smtpClient.ConnectAsync(
                    _configuration["SmtpSettings:Host"],
                    int.Parse(_configuration["SmtpSettings:Port"]),
                    SecureSocketOptions.StartTls
                );
 
                await smtpClient.AuthenticateAsync(
                    _configuration["SmtpSettings:Username"],
                    _configuration["SmtpSettings:Password"]
                );
 
                await smtpClient.SendAsync(emailMessage);
                await smtpClient.DisconnectAsync(true);
 
                _logger.LogInformation($"Goal reminder email sent successfully to {toEmail}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to send email to {toEmail}: {ex.Message}");
                return false;
            }
        }
 
        public async Task<bool> SendBulkGoalRemindersAsync(List<(string email, string name)> recipients)
        {
            var successCount = 0;
            foreach (var (email, name) in recipients)
            {
                var result = await SendGoalReminderEmailAsync(email, name, new List<string>());
                if (result) successCount++;
 
                // Add small delay to avoid rate limiting
                await Task.Delay(100);
            }
 
            _logger.LogInformation($"Bulk reminders sent: {successCount}/{recipients.Count} successful");
            return successCount == recipients.Count;
        }
 
        private string GenerateGoalReminderHtml(string userName, List<string> goalSuggestions)
        {
            var suggestionsHtml = string.Empty;
            if (goalSuggestions != null && goalSuggestions.Any())
            {
                suggestionsHtml = string.Join("", goalSuggestions.Select((s, i) =>
                    $@"<div class=""goal-item"">
                        <p class=""goal-number"">Goal {i + 1}</p>
                        <p class=""goal-text"">{s}</p>
                    </div>"
                ));
            }
 
            return $@"
<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <meta http-equiv=""X-UA-Compatible"" content=""IE=edge"">
    <meta name=""color-scheme"" content=""light dark"">
    <meta name=""supported-color-schemes"" content=""light dark"">
    <title>Set Your Career Development Goals</title>
    {BaseStyle}
</head>
<body>
    <table class=""email-wrapper"" width=""100%"" cellpadding=""0"" cellspacing=""0"" role=""presentation"">
        <tr>
            <td align=""center"">
                <table class=""email-container"" width=""600"" cellpadding=""0"" cellspacing=""0"" role=""presentation"">
                    <tr>
                        <td width=""4"" class=""brand-bar""></td>
                        <td>
                            <table width=""100%"" cellpadding=""0"" cellspacing=""0"" role=""presentation"">
                                <tr>
                                    <td class=""header-section"">
                                        <h1 class=""brand-name"">EEPZ</h1>
                                        <p class=""brand-subtitle"">Employee Engagement Platform</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td class=""section-title"">Career Development Goals Required</td>
                                </tr>
                                <tr>
                                    <td class=""content-area"">
                                        <p class=""greeting-text"">Dear {userName},</p>
                                        
                                        <p class=""text-primary"">
                                            We noticed you have not yet set your professional development goals. Setting clear goals is an essential part of your career progression and personal growth within the organization.
                                        </p>
                                        
                                        <div class=""divider-line""></div>
                                        
                                        <div class=""list-section"">
                                            <p class=""list-heading"">Why Set Goals</p>
                                            <p class=""list-item"">Focus on skills you want to develop</p>
                                            <p class=""list-item"">Track your career progress</p>
                                            <p class=""list-item"">Get support from your manager</p>
                                            <p class=""list-item"">Align your work with your career path</p>
                                        </div>
                                        
                                        {(goalSuggestions != null && goalSuggestions.Any() ? $@"
                                        <div class=""divider-line""></div>
                                        
                                        <div class=""list-section"">
                                            <p class=""list-heading"">Goal Suggestions For You</p>
                                            {suggestionsHtml}
                                        </div>" : "")}
                                        
                                        <div class=""divider-line""></div>
                                        
                                        <div class=""button-container"">
                                            <a href=""https://portal.company.com/goals"" class=""primary-button"">Set Your Goals Now</a>
                                        </div>
                                        
                                        <div class=""divider-line""></div>
                                        
                                        <div class=""notice-bar info"">
                                            <p class=""notice-title"">Action Needed</p>
                                            <p class=""notice-text"">
                                                Please set 2-3 goals by <strong>{DateTime.Now.AddDays(14):MMMM dd, yyyy}</strong>. This will help ensure your development plan is aligned with organizational objectives.
                                            </p>
                                        </div>
                                        
                                        <p class=""text-secondary"">
                                            If you require assistance choosing goals or have questions, please contact HR at <a href=""mailto:hr@company.com"" class=""footer-link"">hr@company.com</a>
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td class=""footer-section"">
                                        <div class=""footer-brand"">
                                            <p class=""footer-brand-name"">EEPZ</p>
                                            <p class=""footer-brand-desc"">Employee Engagement Platform</p>
                                        </div>
                                        <p class=""footer-text"">
                                            Support: <a href=""mailto:hr@company.com"" class=""footer-link"">hr@company.com</a>
                                        </p>
                                        <p class=""footer-copyright"">
                                            &copy; {DateTime.Now.Year} Company Name. All rights reserved.<br>
                                            This is an automated message from the HR Department.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
        }
 
        private string GenerateGoalReminderText(string userName, List<string> goalSuggestions)
        {
            var suggestionsText = string.Empty;
            if (goalSuggestions != null && goalSuggestions.Any())
            {
                suggestionsText = "\n\nGOAL SUGGESTIONS FOR YOU:\n" +
                    string.Join("\n", goalSuggestions.Select((s, i) => $"{i + 1}. {s}"));
            }
 
            return $@"
CAREER DEVELOPMENT GOALS REQUIRED

Dear {userName},

We noticed you have not yet set your professional development goals. Setting clear goals is an essential part of your career progression and personal growth within the organization.

WHY SET GOALS:
- Focus on skills you want to develop
- Track your career progress
- Get support from your manager
- Align your work with your career path
{suggestionsText}

ACTION NEEDED:
Please set 2-3 goals by {DateTime.Now.AddDays(14):MMMM dd, yyyy}.

If you require assistance, please contact HR at hr@company.com

---
This is an automated message from the HR Department.
© {DateTime.Now.Year} Company Name. All rights reserved.
";
        }
    }
}
