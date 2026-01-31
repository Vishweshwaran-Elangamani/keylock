namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public static class EmailTemplates
    {
        public static string SlaReminder(string name, string slaType, DateTime dueDate) =>
            $"<h2>⏰ SLA Reminder</h2><p>Hello <b>{name}</b>, SLA <b>{slaType}</b> is due on {dueDate:MMMM dd, yyyy}.</p>";

        public static string SlaOverdue(string name, string slaType, DateTime dueDate, int days) =>
            $"<h2>🔴 SLA Overdue</h2><p>Hello {name}, SLA {slaType} due {dueDate:MMMM dd} is overdue by {days} days.</p>";

        public static string Escalation(string name, string slaType, string reason) =>
            $"<h2>📢 Escalation Submitted</h2><p>{name} escalated SLA {slaType}<br/>Reason: {reason}</p>";

        public static string Completion(string name, string slaType, DateTime date) =>
            $"<h2>✅ SLA Completed</h2><p>{name}, SLA {slaType} completed on {date:MMMM dd}</p>";
    }
}
