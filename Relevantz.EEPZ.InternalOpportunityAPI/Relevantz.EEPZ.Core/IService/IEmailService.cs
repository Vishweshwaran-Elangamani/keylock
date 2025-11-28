using System.Threading.Tasks;

namespace Relevantz.EEPZ.Core.IService
{
    public interface IEmailService
    {
        Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody);
    }
}
