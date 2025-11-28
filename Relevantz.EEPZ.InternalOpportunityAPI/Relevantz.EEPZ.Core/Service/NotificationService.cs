using System;
using System.Threading.Tasks;
using Relevantz.EEPZ.Core.IService;

namespace Relevantz.EEPZ.Core.Service
{
    public class NotificationService : INotificationService
    {
        private readonly IEmailService _emailService;

        public NotificationService(IEmailService emailService)
        {
            _emailService = emailService;
        }

        public async Task SendNominationCreatedEmailAsync(string recipientEmail, string employeeName, string opportunityName, string nominatedByName)
        {
            var subject = "You have been nominated for an internal opportunity";
            var htmlBody = $@"
                <html>
                <body>
                    <p>Hi {employeeName},</p>
                    <p>You have been nominated for the internal opportunity <strong>{opportunityName}</strong>.</p>
                    <p>Nominated by: <strong>{nominatedByName}</strong></p>
                    <p>Please log in to the EEPZ portal to view more details.</p>
                    <br/>
                    <p>Regards,<br/>EEPZ System</p>
                </body>
                </html>";

            await _emailService.SendEmailAsync(recipientEmail, subject, htmlBody);
            Console.WriteLine($"[NotificationService] Nomination created email sent to {recipientEmail}");
        }

        public async Task SendNominationApprovedEmailAsync(string recipientEmail, string employeeName, string opportunityName)
        {
            var subject = "Your internal nomination has been approved";
            var htmlBody = $@"
                <html>
                <body>
                    <p>Hi {employeeName},</p>
                    <p>Congratulations! Your nomination for the internal opportunity <strong>{opportunityName}</strong> has been <strong>approved</strong> by the Department Head.</p>
                    <p>Please check the EEPZ portal for next steps.</p>
                    <br/>
                    <p>Regards,<br/>EEPZ System</p>
                </body>
                </html>";

            await _emailService.SendEmailAsync(recipientEmail, subject, htmlBody);
            Console.WriteLine($"[NotificationService] Nomination approved email sent to {recipientEmail}");
        }

        public async Task SendNominationRejectedEmailAsync(string recipientEmail, string employeeName, string opportunityName, string reason)
        {
            var subject = "Your internal nomination has been rejected";
            var htmlBody = $@"
                <html>
                <body>
                    <p>Hi {employeeName},</p>
                    <p>Your nomination for the internal opportunity <strong>{opportunityName}</strong> has been <strong>rejected</strong>.</p>
                    <p><strong>Reason:</strong> {reason}</p>
                    <p>If you need clarification, please contact your manager or HR.</p>
                    <br/>
                    <p>Regards,<br/>EEPZ System</p>
                </body>
                </html>";

            await _emailService.SendEmailAsync(recipientEmail, subject, htmlBody);
            Console.WriteLine($"[NotificationService] Nomination rejected email sent to {recipientEmail}");
        }

        public async Task SendManagerReviewEmailAsync(string recipientEmail, int nominationId, string nomineeName)
        {
            // Placeholder for future implementation
            await Task.CompletedTask;
        }

        public async Task SendDeptHeadReviewEmailAsync(string recipientEmail, int nominationId, string nomineeName)
        {
            // Placeholder for future implementation
            await Task.CompletedTask;
        }

        public async Task SendPromotionApprovedEmailAsync(string recipientEmail, string employeeName, string newRole, decimal newSalary)
        {
            // Placeholder for future implementation
            await Task.CompletedTask;
        }
    }
}
