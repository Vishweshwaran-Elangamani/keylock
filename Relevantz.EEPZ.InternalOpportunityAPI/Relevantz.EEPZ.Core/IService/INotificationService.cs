using System.Threading.Tasks;

namespace Relevantz.EEPZ.Core.IService
{
    public interface INotificationService
    {
        Task SendNominationCreatedEmailAsync(string recipientEmail, string employeeName, string opportunityName, string nominatedByName);
        Task SendNominationApprovedEmailAsync(string recipientEmail, string employeeName, string opportunityName);
        Task SendNominationRejectedEmailAsync(string recipientEmail, string employeeName, string opportunityName, string reason);
        Task SendManagerReviewEmailAsync(string recipientEmail, int nominationId, string nomineeName);
        Task SendDeptHeadReviewEmailAsync(string recipientEmail, int nominationId, string nomineeName);
        Task SendPromotionApprovedEmailAsync(string recipientEmail, string employeeName, string newRole, decimal newSalary);
    }
}
