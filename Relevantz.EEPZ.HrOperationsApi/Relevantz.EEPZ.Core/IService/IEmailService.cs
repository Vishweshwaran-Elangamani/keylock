namespace Relevantz.EEPZ.Core.IService
{
    public interface IEmailService
    {
        Task<bool> SendGoalReminderEmailAsync(string toEmail, string userName, List<string> goalSuggestions);
        Task<bool> SendBulkGoalRemindersAsync(List<(string email, string name)> recipients);
    }
}
