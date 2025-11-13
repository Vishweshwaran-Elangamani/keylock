using System;
using System.Threading.Tasks;
using Relevantz.EEPZ.Core.IService;

namespace Relevantz.EEPZ.Core.Service
{
    public class NotificationService : INotificationService
    {
        public async Task SendNominationCreatedEmailAsync(string recipientEmail, string employeeName, string opportunityName)
        {
            // TODO: Implement email sending logic
            await Task.CompletedTask;
        }

        public async Task SendNominationApprovedEmailAsync(string recipientEmail, string employeeName, string opportunityName)
        {
            // TODO: Implement email sending logic
            await Task.CompletedTask;
        }

        public async Task SendNominationRejectedEmailAsync(string recipientEmail, string employeeName, string opportunityName, string reason)
        {
            // TODO: Implement email sending logic
            await Task.CompletedTask;
        }

        public async Task SendManagerReviewEmailAsync(string recipientEmail, int nominationId, string nomineeName)
        {
            // TODO: Implement email sending logic
            await Task.CompletedTask;
        }

        public async Task SendDeptHeadReviewEmailAsync(string recipientEmail, int nominationId, string nomineeName)
        {
            // TODO: Implement email sending logic
            await Task.CompletedTask;
        }

        public async Task SendPromotionApprovedEmailAsync(string recipientEmail, string employeeName, string newRole, decimal newSalary)
        {
            // TODO: Implement email sending logic
            await Task.CompletedTask;
        }
    }
}
