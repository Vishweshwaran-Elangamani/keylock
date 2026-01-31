namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    public interface IEmailClient
    {
        Task SendAsync(string toEmail, string subject, string body, bool isHtml = true);
    }
}
