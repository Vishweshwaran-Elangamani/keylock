// Services/EmailService.cs
using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
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
            var username = _config["Email:Username"];
            var password = _config["Email:Password"];

            if (string.IsNullOrWhiteSpace(username) ||
                string.IsNullOrWhiteSpace(password))
            {
                _logger.LogError("SMTP credentials are missing or empty.");
                throw new InvalidOperationException("SMTP credentials not configured.");
            }

            return new SmtpClient("smtp.gmail.com")
            {
                Port = 587,
                Credentials = new NetworkCredential(username, password),
                EnableSsl = true,
                Timeout = 10000
            };
        }

        protected virtual MailMessage CreateMessage(string toEmail, string subject, string body)
        {
            var fromEmail = _config["Email:Username"];

            if (string.IsNullOrWhiteSpace(toEmail))
            {
                throw new ArgumentException("Recipient email is required.");
            }

            var message = new MailMessage
            {
                From = new MailAddress(fromEmail, "EEPZ SLA Notifications"),
                Subject = subject,
                Body = body,
                IsBodyHtml = false
            };

            message.To.Add(toEmail);
            return message;
        }

        // ===== SLA REMINDER EMAILS (Day -2, -1, SLA Day) =====

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

                var message = CreateMessage(
                    toEmail,
                    $"{urgencyEmoji} SLA Reminder: {slaType} {reminderText}",
                    $"Hello {employeeName},\n\n" +
                    $"Your '{slaType}' SLA is {reminderText}.\n" +
                    $"Due Date: {dueDate:MMMM dd, yyyy}\n\n" +
                    $"Please log in to EEPZ and complete this task.\n\n" +
                    $"Best regards,\n" +
                    $"EEPZ SLA Notifications"
                );

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

        // ===== SLA OVERDUE NOTIFICATION =====

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
                var message = CreateMessage(
                    toEmail,
                    $"🔴 URGENT: SLA Overdue - {slaType}",
                    $"Hello {employeeName},\n\n" +
                    $"Your '{slaType}' SLA was due on {dueDate:MMMM dd, yyyy} and is now {daysOverdue} day(s) overdue.\n\n" +
                    $"Please complete this task immediately to avoid escalation.\n\n" +
                    $"Best regards,\n" +
                    $"EEPZ SLA Notifications"
                );

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

        // ===== EMPLOYEE ESCALATION ACKNOWLEDGMENT =====

        public virtual async Task<bool> SendEmployeeEscalationEmailAsync(
            string toEmail,
            string employeeName,
            string slaType,
            string escalationReason)
        {
            try
            {
                var client = CreateSmtpClient();
                var message = CreateMessage(
                    toEmail,
                    $"✅ SLA Escalation Submitted - {slaType}",
                    $"Hello {employeeName},\n\n" +
                    $"Your escalation for '{slaType}' has been received.\n\n" +
                    $"Reason: {escalationReason}\n\n" +
                    $"Your manager will review this shortly.\n\n" +
                    $"Best regards,\n" +
                    $"EEPZ SLA Notifications"
                );

                _logger.LogInformation(
                    "Sending escalation acknowledgment to {Email} for {SlaType}",
                    toEmail, slaType);

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

        // ===== MANAGER LEVEL ESCALATION =====

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
                var message = CreateMessage(
                    toEmail,
                    $"⚡ SLA Escalation - {slaType}",
                    $"Hello {managerName},\n\n" +
                    $"Your team member has an overdue SLA that requires your attention.\n\n" +
                    $"Employee: {employeeName}\n" +
                    $"SLA Type: {slaType}\n" +
                    $"Due Date: {dueDate:MMMM dd, yyyy}\n" +
                    $"Days Overdue: {daysOverdue}\n\n" +
                    $"Please review and take appropriate action.\n\n" +
                    $"Best regards,\n" +
                    $"EEPZ SLA Notifications"
                );

                _logger.LogInformation(
                    "Sending SLA escalation (Manager level) to {Email} for employee {EmployeeName}",
                    toEmail, employeeName);

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

        // ===== DEPARTMENT HEAD ESCALATION =====

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
                var message = CreateMessage(
                    toEmail,
                    $"⚡ SLA Escalation (Level 2) - {slaType}",
                    $"Hello {deptHeadName},\n\n" +
                    $"An SLA escalation from Manager {managerName} requires your review.\n\n" +
                    $"Employee: {employeeName}\n" +
                    $"Manager: {managerName}\n" +
                    $"SLA Type: {slaType}\n" +
                    $"Due Date: {dueDate:MMMM dd, yyyy}\n" +
                    $"Days Overdue: {daysOverdue}\n\n" +
                    $"Please review and take appropriate action.\n\n" +
                    $"Best regards,\n" +
                    $"EEPZ SLA Notifications"
                );

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

        // ===== HR LEVEL ESCALATION =====

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
                    $"⚠️ CRITICAL: SLA Escalation (Level 3) - {slaType}",
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

        // ===== SLA REOPEN NOTIFICATION =====

        public virtual async Task<bool> SendSlaReopenEmailAsync(
            string toEmail,
            string employeeName,
            string slaType,
            DateTime newDueDate)
        {
            try
            {
                var client = CreateSmtpClient();
                var message = CreateMessage(
                    toEmail,
                    $"🔄 SLA Extended - {slaType}",
                    $"Hello {employeeName},\n\n" +
                    $"Your '{slaType}' SLA has been reopened for 1 additional day by your manager.\n\n" +
                    $"New Due Date: {newDueDate:MMMM dd, yyyy}\n\n" +
                    $"Please complete this task by the new deadline.\n\n" +
                    $"Best regards,\n" +
                    $"EEPZ SLA Notifications"
                );

                _logger.LogInformation("Sending SLA reopen email to {Email} for {SlaType}",
                    toEmail, slaType);

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

        // ===== SLA COMPLETION CONFIRMATION =====

        public virtual async Task<bool> SendSlaCompletionEmailAsync(
            string toEmail,
            string employeeName,
            string slaType,
            DateTime completionDate)
        {
            try
            {
                var client = CreateSmtpClient();
                var message = CreateMessage(
                    toEmail,
                    $"✅ SLA Completed - {slaType}",
                    $"Hello {employeeName},\n\n" +
                    $"Your '{slaType}' SLA has been marked as complete.\n\n" +
                    $"Completion Date: {completionDate:MMMM dd, yyyy}\n\n" +
                    $"Thank you for meeting the deadline!\n\n" +
                    $"Best regards,\n" +
                    $"EEPZ SLA Notifications"
                );

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

        // ===== SLA REJECTION/RESUBMISSION NOTIFICATION =====

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
                var message = CreateMessage(
                    toEmail,
                    $"📋 SLA Requires Resubmission - {slaType}",
                    $"Hello {employeeName},\n\n" +
                    $"Your '{slaType}' SLA submission has been reviewed and requires resubmission.\n\n" +
                    $"Reason: {rejectionReason}\n\n" +
                    $"New Due Date: {newDueDate:MMMM dd, yyyy}\n\n" +
                    $"Please address the feedback and resubmit.\n\n" +
                    $"Best regards,\n" +
                    $"EEPZ SLA Notifications"
                );

                _logger.LogInformation("Sending SLA resubmission email to {Email} for {SlaType}",
                    toEmail, slaType);

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

        // ===== BULK SLA NOTIFICATION (For Department/Organization) =====

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
                var compliancePercentage = totalSlas > 0 
                    ? (completedSlas * 100) / totalSlas 
                    : 0;

                var message = CreateMessage(
                    toEmail,
                    $"📊 SLA Compliance Report - {notificationType}",
                    $"Hello {recipientName},\n\n" +
                    $"Here is your SLA compliance summary:\n\n" +
                    $"Total SLAs: {totalSlas}\n" +
                    $"Completed: {completedSlas}\n" +
                    $"Pending: {pendingSlas}\n" +
                    $"Escalated: {escalatedSlas}\n" +
                    $"Compliance Rate: {compliancePercentage}%\n\n" +
                    $"Please log into EEPZ for detailed information.\n\n" +
                    $"Best regards,\n" +
                    $"EEPZ SLA Notifications"
                );

                _logger.LogInformation("Sending bulk SLA notification to {Email} for {NotificationType}",
                    toEmail, notificationType);

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
