using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class EmailService
    {
        private readonly IEmailClient _emailClient;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IEmailClient emailClient, ILogger<EmailService> logger)
        {
            _emailClient = emailClient;
            _logger = logger;
        }

        public Task<bool> SendSlaReminderEmailAsync(string to, string name, string sla, DateTime due, int days) =>
            SendWrapped(() => _emailClient.SendAsync(to, $"SLA Reminder - {sla}", EmailTemplates.SlaReminder(name, sla, due)), to);

        public Task<bool> SendSlaOverdueEmailAsync(string to, string name, string sla, DateTime due, int days) =>
            SendWrapped(() => _emailClient.SendAsync(to, $"URGENT: SLA Overdue - {sla}", EmailTemplates.SlaOverdue(name, sla, due, days)), to);

        public Task<bool> SendEmployeeEscalationEmailAsync(string to, string name, string sla, string reason) =>
            SendWrapped(() => _emailClient.SendAsync(to, $"Escalation Submitted - {sla}", EmailTemplates.Escalation(name, sla, reason)), to);

        public Task<bool> SendManagerEscalationEmailAsync(string to, string mgr, string emp, string sla, DateTime due, int days) =>
            SendWrapped(() => _emailClient.SendAsync(to, $"Manager Escalation - {sla}", EmailTemplates.Escalation(emp, sla, "Manager Escalation")), to);

        public Task<bool> SendDeptHeadEscalationEmailAsync(string to, string dh, string emp, string mgr, string sla, DateTime due, int days) =>
            SendWrapped(() => _emailClient.SendAsync(to, $"DeptHead Escalation - {sla}", EmailTemplates.Escalation(emp, sla, "Dept Head Escalation")), to);

        public Task<bool> SendHrEscalationEmailAsync(string to, string emp, string mgr, string dh, string sla, DateTime due, int days) =>
            SendWrapped(() => _emailClient.SendAsync(to, $"HR Escalation - {sla}", EmailTemplates.Escalation(emp, sla, "HR Escalation")), to);

        public Task<bool> SendSlaReopenEmailAsync(string to, string name, string sla, DateTime newDue) =>
            SendWrapped(() => _emailClient.SendAsync(to, $"SLA Reopened - {sla}", EmailTemplates.SlaReminder(name, sla, newDue)), to);

        public Task<bool> SendSlaCompletionEmailAsync(string to, string name, string sla, DateTime done) =>
            SendWrapped(() => _emailClient.SendAsync(to, $"SLA Completed - {sla}", EmailTemplates.Completion(name, sla, done)), to);

        public Task<bool> SendSlaResubmissionEmailAsync(string to, string name, string sla, string reason, DateTime due) =>
            SendWrapped(() => _emailClient.SendAsync(to, $"Resubmission Required - {sla}", EmailTemplates.Escalation(name, sla, reason)), to);

        public Task<bool> SendBulkSlaNotificationEmailAsync(string to, string name, string type, int total, int done, int pending, int esc) =>
            SendWrapped(() => _emailClient.SendAsync(to, $"SLA Report - {type}", $"Total: {total}, Completed: {done}"), to);

        private async Task<bool> SendWrapped(Func<Task> action, string email)
        {
            try
            {
                await action();
                _logger.LogInformation("Email sent to {Email}", email);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Email failed to {Email}", email);
                return false;
            }
        }
    }
}
