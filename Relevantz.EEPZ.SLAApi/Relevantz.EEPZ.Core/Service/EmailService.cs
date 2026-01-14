using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Relevantz.EEPZ.Core.Services
{
    public class EmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration config, ILogger<EmailService> logger)
        {
            _config = config;
            _logger = logger;
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
            {
                _logger.LogError("SMTP credentials are missing or empty.");
                throw new InvalidOperationException("SMTP credentials not configured.");
            }

            return new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(username, password),
                EnableSsl = enableSsl,
                Timeout = timeout * 1000
            };
        }

        protected virtual MailMessage CreateMessage(string toEmail, string subject, string body)
        {
            var fromEmail = _config["SmtpSettings:FromEmail"];
            var fromName = _config["SmtpSettings:FromName"];

            if (string.IsNullOrWhiteSpace(toEmail))
            {
                throw new ArgumentException("Recipient email is required.");
            }

            var message = new MailMessage
            {
                From = new MailAddress(fromEmail, fromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = false
            };

            message.To.Add(toEmail);
            return message;
        }


        public virtual async Task<bool> SendSlaReminderEmailAsync(
    string toEmail,
    string employeeName,
    string slaType,
    DateTime dueDate,
    int daysRemaining)
        {
            try
            {
                var client = CreateSmtpClient();

                var reminderText = daysRemaining switch
                {
                    2 => "due in 2 days",
                    1 => "due TOMORROW",
                    0 => "due TODAY",
                    _ => $"due in {daysRemaining} days"
                };

                var urgencyEmoji = daysRemaining switch
                {
                    2 => "⏰",
                    1 => "⚠️",
                    0 => "🔴",
                    _ => "📋"
                };

                // Build HTML body
                var body = $@"
            <html>
            <body style='font-family: Arial, sans-serif; color: #333;'>
                <h2 style='color:#0F62FE;'>{urgencyEmoji} SLA Reminder</h2>
                <p>Hello <strong>{employeeName}</strong>,</p>
                <p>Your SLA <strong>{slaType}</strong> is <span style='color:#E01950;'>{reminderText}</span>.</p>
                <p><b>Due Date:</b> {dueDate:MMMM dd, yyyy}</p>
                <hr />
                <p style='font-size:14px;'>
                    Please log in to <a href='https://eepz.com' style='color:#0F62FE;'>EEPZ</a> and complete this task.
                </p>
                <p style='margin-top:20px;'>Best regards,<br/><em>EEPZ SLA Notifications</em></p>
            </body>
            </html>";

                var message = CreateMessage(
                    toEmail,
                    $"{urgencyEmoji} SLA Reminder: {slaType} {reminderText}",
                    body
                );

                // Mark the message as HTML
                message.IsBodyHtml = true;

                _logger.LogInformation(
                    "Sending SLA reminder ({DaysRemaining} days) to {Email} for {SlaType}",
                    daysRemaining, toEmail, slaType);

                await client.SendMailAsync(message);
                _logger.LogInformation("SLA reminder sent to {Email}", toEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send SLA reminder to {Email}", toEmail);
                return false;
            }
        }


        public virtual async Task<bool> SendSlaOverdueEmailAsync(
    string toEmail,
    string employeeName,
    string slaType,
    DateTime dueDate,
    int daysOverdue)
        {
            try
            {
                var client = CreateSmtpClient();

                var urgencyEmoji = daysOverdue switch
                {
                    <= 1 => "🔴",   // very urgent
                    <= 3 => "⚠️",   // warning
                    _ => "⏰"       // overdue
                };

                var body = $@"
            <html>
            <body style='font-family: Arial, sans-serif; color: #333;'>
                <h2 style='color:#E01950;'>{urgencyEmoji} SLA Overdue Alert</h2>
                <p>Hello <strong>{employeeName}</strong>,</p>
                <p>
                    Your SLA <strong>{slaType}</strong> was due on 
                    <span style='color:#0F62FE;'>{dueDate:MMMM dd, yyyy}</span> 
                    and is now <span style='color:#E01950;'>{daysOverdue} day(s) overdue</span>.
                </p>
                <p style='font-size:15px; color:#E01950; font-weight:bold;'>
                    Please complete this task immediately to avoid escalation.
                </p>
                <hr />
                <p style='margin-top:20px; font-size:14px;'>
                    Best regards,<br/>
                    <em>EEPZ SLA Notifications</em>
                </p>
            </body>
            </html>";

                var message = CreateMessage(
                    toEmail,
                    $"URGENT: SLA Overdue - {slaType}",
                    body
                );

                message.IsBodyHtml = true;

                _logger.LogInformation("Sending SLA overdue notification to {Email} for {SlaType}",
                    toEmail, slaType);

                await client.SendMailAsync(message);
                _logger.LogInformation("SLA overdue email sent to {Email}", toEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send SLA overdue email to {Email}", toEmail);
                return false;
            }
        }


        public virtual async Task<bool> SendEmployeeEscalationEmailAsync(
     string toEmail,
     string employeeName,
     string slaType,
     string escalationReason)
        {
            try
            {
                var client = CreateSmtpClient();

                var body = $@"
            <html>
            <body style='font-family: Arial, sans-serif; color: #333;'>
                <h2 style='color:#0F62FE;'>📢 SLA Escalation Submitted</h2>
                <p>Hello <strong>{employeeName}</strong>,</p>
                <p>Your escalation for <strong>{slaType}</strong> has been received.</p>
                <p><b>Reason:</b> {escalationReason}</p>
                <p>Your manager will review this shortly.</p>
                <hr />
                <p style='margin-top:20px; font-size:14px;'>
                    Best regards,<br/>
                    <em>EEPZ SLA Notifications</em>
                </p>
            </body>
            </html>";

                var message = CreateMessage(
                    toEmail,
                    $"SLA Escalation Submitted - {slaType}",
                    body
                );

                message.IsBodyHtml = true;

                _logger.LogInformation("Sending escalation acknowledgment to {Email} for {SlaType}", toEmail, slaType);

                await client.SendMailAsync(message);
                _logger.LogInformation("Escalation acknowledgment sent to {Email}", toEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send escalation acknowledgment to {Email}", toEmail);
                return false;
            }
        }


        public virtual async Task<bool> SendManagerEscalationEmailAsync(
    string toEmail,
    string managerName,
    string employeeName,
    string slaType,
    DateTime dueDate,
    int daysOverdue)
        {
            try
            {
                var client = CreateSmtpClient();

                var urgencyEmoji = daysOverdue switch
                {
                    <= 1 => "🔴",
                    <= 3 => "⚠️",
                    _ => "⏰"
                };

                var body = $@"
            <html>
            <body style='font-family: Arial, sans-serif; color: #333;'>
                <h2 style='color:#E01950;'>{urgencyEmoji} SLA Escalation Alert</h2>
                <p>Hello <strong>{managerName}</strong>,</p>
                <p>Your team member has an overdue SLA that requires your attention:</p>
                <ul>
                    <li><b>Employee:</b> {employeeName}</li>
                    <li><b>SLA Type:</b> {slaType}</li>
                    <li><b>Due Date:</b> {dueDate:MMMM dd, yyyy}</li>
                    <li><b>Days Overdue:</b> {daysOverdue}</li>
                </ul>
                <p style='color:#E01950; font-weight:bold;'>
                    Please review and take appropriate action immediately.
                </p>
                <hr />
                <p style='margin-top:20px; font-size:14px;'>
                    Best regards,<br/>
                    <em>EEPZ SLA Notifications</em>
                </p>
            </body>
            </html>";

                var message = CreateMessage(
                    toEmail,
                    $"SLA Escalation - {slaType}",
                    body
                );

                message.IsBodyHtml = true;

                _logger.LogInformation("Sending SLA escalation (Manager level) to {Email} for employee {EmployeeName}", toEmail, employeeName);

                await client.SendMailAsync(message);
                _logger.LogInformation("Manager escalation email sent to {Email}", toEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send manager escalation email to {Email}", toEmail);
                return false;
            }
        }


        public virtual async Task<bool> SendDeptHeadEscalationEmailAsync(
    string toEmail,
    string deptHeadName,
    string employeeName,
    string managerName,
    string slaType,
    DateTime dueDate,
    int daysOverdue)
        {
            try
            {
                var client = CreateSmtpClient();

                var urgencyEmoji = daysOverdue switch
                {
                    <= 1 => "🔴",
                    <= 3 => "⚠️",
                    _ => "⏰"
                };

                var body = $@"
            <html>
            <body style='font-family: Arial, sans-serif; color: #333;'>
                <h2 style='color:#E01950;'>{urgencyEmoji} SLA Escalation (Level 2)</h2>
                <p>Hello <strong>{deptHeadName}</strong>,</p>
                <p>
                    An SLA escalation from Manager <strong>{managerName}</strong> requires your review.
                </p>
                <table style='border-collapse: collapse; margin-top:10px;'>
                    <tr>
                        <td style='padding:5px; font-weight:bold;'>Employee:</td>
                        <td style='padding:5px;'>{employeeName}</td>
                    </tr>
                    <tr>
                        <td style='padding:5px; font-weight:bold;'>Manager:</td>
                        <td style='padding:5px;'>{managerName}</td>
                    </tr>
                    <tr>
                        <td style='padding:5px; font-weight:bold;'>SLA Type:</td>
                        <td style='padding:5px;'>{slaType}</td>
                    </tr>
                    <tr>
                        <td style='padding:5px; font-weight:bold;'>Due Date:</td>
                        <td style='padding:5px; color:#0F62FE;'>{dueDate:MMMM dd, yyyy}</td>
                    </tr>
                    <tr>
                        <td style='padding:5px; font-weight:bold;'>Days Overdue:</td>
                        <td style='padding:5px; color:#E01950;'>{daysOverdue}</td>
                    </tr>
                </table>
                <p style='margin-top:15px; color:#E01950; font-weight:bold;'>
                    Please review and take appropriate action immediately.
                </p>
                <hr />
                <p style='margin-top:20px; font-size:14px;'>
                    Best regards,<br/>
                    <em>EEPZ SLA Notifications</em>
                </p>
            </body>
            </html>";

                var message = CreateMessage(
                    toEmail,
                    $"SLA Escalation (Level 2) - {slaType}",
                    body
                );

                message.IsBodyHtml = true;

                _logger.LogInformation(
                    "Sending SLA escalation (DeptHead level) to {Email} for employee {EmployeeName}",
                    toEmail, employeeName);

                await client.SendMailAsync(message);
                _logger.LogInformation("Department head escalation email sent to {Email}", toEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send dept head escalation email to {Email}", toEmail);
                return false;
            }
        }

        public virtual async Task<bool> SendHrEscalationEmailAsync(
            string toEmail,
            string employeeName,
            string managerName,
            string deptHeadName,
            string slaType,
            DateTime dueDate,
            int daysOverdue)
        {
            try
            {
                var client = CreateSmtpClient();
                var message = CreateMessage(
                    toEmail,
                    $"CRITICAL: SLA Escalation (Level 3) - {slaType}",
                    $"Hello HR Team,\n\n" +
                    $"An SLA escalation has reached the HR level and requires immediate attention.\n\n" +
                    $"Employee: {employeeName}\n" +
                    $"Manager: {managerName}\n" +
                    $"Department Head: {deptHeadName}\n" +
                    $"SLA Type: {slaType}\n" +
                    $"Due Date: {dueDate:MMMM dd, yyyy}\n" +
                    $"Days Overdue: {daysOverdue}\n\n" +
                    $"Please take necessary action as per organizational policies.\n\n" +
                    $"Best regards,\n" +
                    $"EEPZ SLA Notifications"
                );

                _logger.LogInformation(
                    "Sending SLA escalation (HR level) to {Email} for employee {EmployeeName}",
                    toEmail, employeeName);

                await client.SendMailAsync(message);
                _logger.LogInformation("HR escalation email sent to {Email}", toEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send HR escalation email to {Email}", toEmail);
                return false;
            }
        }

        public virtual async Task<bool> SendSlaReopenEmailAsync(
    string toEmail,
    string employeeName,
    string slaType,
    DateTime newDueDate)
        {
            try
            {
                var client = CreateSmtpClient();

                var body = $@"
            <html>
            <body style='font-family: Arial, sans-serif; color: #333;'>
                <h2 style='color:#0F62FE;'>🔄 SLA Reopened</h2>
                <p>Hello <strong>{employeeName}</strong>,</p>
                <p>
                    Your SLA <strong>{slaType}</strong> has been reopened 
                    for <span style='color:#24A148;'>1 additional day</span> by your manager.
                </p>
                <p>
                    <b>New Due Date:</b> 
                    <span style='color:#0F62FE;'>{newDueDate:MMMM dd, yyyy}</span>
                </p>
                <p style='margin-top:15px;'>
                    Please complete this task by the new deadline to stay compliant.
                </p>
                <hr />
                <p style='margin-top:20px; font-size:14px;'>
                    Best regards,<br/>
                    <em>EEPZ SLA Notifications</em>
                </p>
            </body>
            </html>";

                var message = CreateMessage(
                    toEmail,
                    $"SLA Extended - {slaType}",
                    body
                );

                message.IsBodyHtml = true;

                _logger.LogInformation("Sending SLA reopen email to {Email} for {SlaType}", toEmail, slaType);

                await client.SendMailAsync(message);
                _logger.LogInformation("SLA reopen email sent to {Email}", toEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send SLA reopen email to {Email}", toEmail);
                return false;
            }
        }

        public virtual async Task<bool> SendSlaCompletionEmailAsync(
    string toEmail,
    string employeeName,
    string slaType,
    DateTime completionDate)
        {
            try
            {
                var client = CreateSmtpClient();

                var body = $@"<html><body style='font-family:Arial,sans-serif;color:#333;'>
            <h2 style='color:#24A148;'>✅ SLA Completed</h2>
            <p>Hello <strong>{employeeName}</strong>,</p>
            <p>Your SLA <strong>{slaType}</strong> has been marked as complete.</p>
            <p><b>Completion Date:</b> {completionDate:MMMM dd, yyyy}</p>
            <p style='margin-top:15px;color:#24A148;font-weight:bold;'>Thank you for meeting the deadline!</p>
            <hr/><p style='font-size:14px;'>Best regards,<br/><em>EEPZ SLA Notifications</em></p>
        </body></html>";

                var message = CreateMessage(toEmail, $"SLA Completed - {slaType}", body);
                message.IsBodyHtml = true;

                _logger.LogInformation("Sending SLA completion email to {Email}", toEmail);
                await client.SendMailAsync(message);
                _logger.LogInformation("SLA completion email sent to {Email}", toEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send SLA completion email to {Email}", toEmail);
                return false;
            }
        }

        public virtual async Task<bool> SendSlaResubmissionEmailAsync(
            string toEmail,
            string employeeName,
            string slaType,
            string rejectionReason,
            DateTime newDueDate)
        {
            try
            {
                var client = CreateSmtpClient();

                var body = $@"<html><body style='font-family:Arial,sans-serif;color:#333;'>
            <h2 style='color:#E01950;'>⚠️ SLA Requires Resubmission</h2>
            <p>Hello <strong>{employeeName}</strong>,</p>
            <p>Your SLA <strong>{slaType}</strong> submission has been reviewed and requires resubmission.</p>
            <p><b>Reason:</b> {rejectionReason}</p>
            <p><b>New Due Date:</b> <span style='color:#0F62FE;'>{newDueDate:MMMM dd, yyyy}</span></p>
            <p style='margin-top:15px;'>Please address the feedback and resubmit.</p>
            <hr/><p style='font-size:14px;'>Best regards,<br/><em>EEPZ SLA Notifications</em></p>
        </body></html>";

                var message = CreateMessage(toEmail, $"SLA Requires Resubmission - {slaType}", body);
                message.IsBodyHtml = true;

                _logger.LogInformation("Sending SLA resubmission email to {Email} for {SlaType}", toEmail, slaType);
                await client.SendMailAsync(message);
                _logger.LogInformation("SLA resubmission email sent to {Email}", toEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send SLA resubmission email to {Email}", toEmail);
                return false;
            }
        }

        public virtual async Task<bool> SendBulkSlaNotificationEmailAsync(
            string toEmail,
            string recipientName,
            string notificationType,
            int totalSlas,
            int completedSlas,
            int pendingSlas,
            int escalatedSlas)
        {
            try
            {
                var client = CreateSmtpClient();
                var compliancePercentage = totalSlas > 0 ? (completedSlas * 100) / totalSlas : 0;

                var body = $@"<html><body style='font-family:Arial,sans-serif;color:#333;'>
            <h2 style='color:#0F62FE;'>📊 SLA Compliance Report</h2>
            <p>Hello <strong>{recipientName}</strong>,</p>
            <p>Here is your SLA compliance summary:</p>
            <table style='border-collapse:collapse;margin-top:10px;'>
                <tr><td style='padding:5px;font-weight:bold;'>Total SLAs:</td><td style='padding:5px;'>{totalSlas}</td></tr>
                <tr><td style='padding:5px;font-weight:bold;'>Completed:</td><td style='padding:5px;color:#24A148;'>{completedSlas}</td></tr>
                <tr><td style='padding:5px;font-weight:bold;'>Pending:</td><td style='padding:5px;color:#F1C21B;'>{pendingSlas}</td></tr>
                <tr><td style='padding:5px;font-weight:bold;'>Escalated:</td><td style='padding:5px;color:#E01950;'>{escalatedSlas}</td></tr>
                <tr><td style='padding:5px;font-weight:bold;'>Compliance Rate:</td><td style='padding:5px;'>{compliancePercentage}%</td></tr>
            </table>
            <p style='margin-top:15px;'>Please log into EEPZ for detailed information.</p>
            <hr/><p style='font-size:14px;'>Best regards,<br/><em>EEPZ SLA Notifications</em></p>
        </body></html>";

                var message = CreateMessage(toEmail, $"SLA Compliance Report - {notificationType}", body);
                message.IsBodyHtml = true;

                _logger.LogInformation("Sending bulk SLA notification to {Email} for {NotificationType}", toEmail, notificationType);
                await client.SendMailAsync(message);
                _logger.LogInformation("Bulk SLA notification sent to {Email}", toEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send bulk SLA notification to {Email}", toEmail);
                return false;
            }
        }
    }
}
