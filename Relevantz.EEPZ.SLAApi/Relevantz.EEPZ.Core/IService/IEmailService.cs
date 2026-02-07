namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface IEmailService
    {
        Task<bool> SendSlaReminderEmailAsync(string to, string name, string sla, DateTime due, int days);

        Task<bool> SendSlaOverdueEmailAsync(string to, string name, string sla, DateTime due, int days);

        Task<bool> SendEmployeeEscalationEmailAsync(string to, string name, string sla, string reason);

        Task<bool> SendManagerEscalationEmailAsync(string to, string mgr, string emp, string sla, DateTime due, int days);

        Task<bool> SendDeptHeadEscalationEmailAsync(string to, string dh, string emp, string mgr, string sla, DateTime due, int days);

        Task<bool> SendHrEscalationEmailAsync(string to, string emp, string mgr, string dh, string sla, DateTime due, int days);

        Task<bool> SendSlaReopenEmailAsync(string to, string name, string sla, DateTime newDue);

        Task<bool> SendSlaCompletionEmailAsync(string to, string name, string sla, DateTime done);

        Task<bool> SendSlaResubmissionEmailAsync(string to, string name, string sla, string reason, DateTime due);

        Task<bool> SendBulkSlaNotificationEmailAsync(string to, string name, string type, int total, int done, int pending, int esc);
    }
}
