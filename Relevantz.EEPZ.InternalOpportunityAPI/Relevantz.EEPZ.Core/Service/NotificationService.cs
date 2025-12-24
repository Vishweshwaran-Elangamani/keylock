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

            await Task.CompletedTask;
        }

        public async Task SendDeptHeadReviewEmailAsync(string recipientEmail, int nominationId, string nomineeName)
        {
            await Task.CompletedTask;
        }

        public async Task SendPromotionApprovedEmailAsync(string recipientEmail, string employeeName, string newRole, decimal newSalary)
        {
            await Task.CompletedTask;
        }


        public async Task SendL2ReviewRequestEmailAsync(string l2Email, string l2Name, string nomineeName, string opportunityName)
        {
            var subject = $"Action Required - Review Nomination for {opportunityName}";
            var htmlBody = $@"
                <html>
                <body>
                    <p>Hi {l2Name},</p>
                    <p><strong>{nomineeName}</strong> has been nominated for the internal opportunity <strong>{opportunityName}</strong>.</p>
                    <p>As the reporting manager (L2), your review is required.</p>
                    <p>Please log in to the EEPZ portal to review and approve/reject this nomination.</p>
                    <br/>
                    <p>Regards,<br/>EEPZ System</p>
                </body>
                </html>";

            await _emailService.SendEmailAsync(l2Email, subject, htmlBody);
            Console.WriteLine($"[NotificationService] L2 Review Request email sent to {l2Email}");
        }

        public async Task SendL2ApprovedEmailAsync(string nomineeEmail, string nomineeName, string opportunityName, string l2Name)
        {
            var subject = "Your nomination has been approved by your Manager";
            var htmlBody = $@"
                <html>
                <body>
                    <p>Hi {nomineeName},</p>
                    <p>Good news! Your manager <strong>{l2Name}</strong> has approved your nomination for the internal opportunity <strong>{opportunityName}</strong>.</p>
                    <p>Your nomination is now pending <strong>Department Head review</strong>.</p>
                    <p>Please check the EEPZ portal for updates.</p>
                    <br/>
                    <p>Regards,<br/>EEPZ System</p>
                </body>
                </html>";

            await _emailService.SendEmailAsync(nomineeEmail, subject, htmlBody);
            Console.WriteLine($"[NotificationService] L2 Approved email sent to {nomineeEmail}");
        }

        public async Task SendL2RejectedEmailAsync(string nomineeEmail, string nomineeName, string opportunityName, string l2Name, string reason)
        {
            var subject = "Your nomination has been rejected by your Manager";
            var htmlBody = $@"
                <html>
                <body>
                    <p>Hi {nomineeName},</p>
                    <p>Unfortunately, your nomination for the internal opportunity <strong>{opportunityName}</strong> has been <strong>rejected</strong> by your manager <strong>{l2Name}</strong>.</p>
                    <p><strong>Reason:</strong> {reason}</p>
                    <p>If you have questions, please contact your manager for clarification.</p>
                    <br/>
                    <p>Regards,<br/>EEPZ System</p>
                </body>
                </html>";

            await _emailService.SendEmailAsync(nomineeEmail, subject, htmlBody);
            Console.WriteLine($"[NotificationService] L2 Rejected email sent to {nomineeEmail}");
        }

        public async Task SendDeptHeadReviewRequestEmailAsync(string deptHeadEmail, string deptHeadName, string nomineeName, string opportunityName)
        {
            var subject = $"Action Required - Final Review for {nomineeName}'s Nomination";
            var htmlBody = $@"
                <html>
                <body>
                    <p>Hi {deptHeadName},</p>
                    <p><strong>{nomineeName}</strong>'s nomination for the internal opportunity <strong>{opportunityName}</strong> requires your <strong>final approval</strong>.</p>
                    <p>The reporting manager has already approved this nomination.</p>
                    <p>Please log in to the EEPZ portal to review and provide your decision.</p>
                    <br/>
                    <p>Regards,<br/>EEPZ System</p>
                </body>
                </html>";

            await _emailService.SendEmailAsync(deptHeadEmail, subject, htmlBody);
            Console.WriteLine($"[NotificationService] DeptHead Review Request email sent to {deptHeadEmail}");
        }

        public async Task SendDeptHeadApprovedEmailAsync(string nomineeEmail, string nomineeName, string opportunityName, string deptHeadName)
        {
            var subject = "🎉 Congratulations! Your nomination has been APPROVED";
            var htmlBody = $@"
                <html>
                <body>
                    <p>Hi {nomineeName},</p>
                    <p><strong>Congratulations!</strong> Your nomination for the internal opportunity <strong>{opportunityName}</strong> has been <strong>APPROVED</strong> by Department Head <strong>{deptHeadName}</strong>.</p>
                    <p>This is the final approval. The HR team will contact you shortly with next steps.</p>
                    <p>Well done!</p>
                    <br/>
                    <p>Regards,<br/>EEPZ System</p>
                </body>
                </html>";

            await _emailService.SendEmailAsync(nomineeEmail, subject, htmlBody);
            Console.WriteLine($"[NotificationService] DeptHead Approved email sent to {nomineeEmail}");
        }

        public async Task SendDeptHeadApprovedNotificationToL2Async(string l2Email, string l2Name, string nomineeName, string opportunityName)
        {
            var subject = $"Nomination Approved - {nomineeName} for {opportunityName}";
            var htmlBody = $@"
                <html>
                <body>
                    <p>Hi {l2Name},</p>
                    <p>This is to inform you that <strong>{nomineeName}</strong>'s nomination for the internal opportunity <strong>{opportunityName}</strong> has been <strong>approved</strong> by the Department Head.</p>
                    <p>Congratulations to your team member!</p>
                    <br/>
                    <p>Regards,<br/>EEPZ System</p>
                </body>
                </html>";

            await _emailService.SendEmailAsync(l2Email, subject, htmlBody);
            Console.WriteLine($"[NotificationService] DeptHead Approval Notification sent to L2: {l2Email}");
        }

        public async Task SendDeptHeadRejectedToL2EmailAsync(string l2Email, string l2Name, string nomineeName, string opportunityName, string reason)
        {
            var subject = $"Action Required - Re-review Nomination for {nomineeName}";
            var htmlBody = $@"
                <html>
                <body>
                    <p>Hi {l2Name},</p>
                    <p>The Department Head has sent back <strong>{nomineeName}</strong>'s nomination for the internal opportunity <strong>{opportunityName}</strong> for <strong>re-review</strong>.</p>
                    <p><strong>Department Head Feedback:</strong> {reason}</p>
                    <p>Please log in to the EEPZ portal to review this nomination again and provide your updated decision.</p>
                    <br/>
                    <p>Regards,<br/>EEPZ System</p>
                </body>
                </html>";

            await _emailService.SendEmailAsync(l2Email, subject, htmlBody);
            Console.WriteLine($"[NotificationService] DeptHead Rejected to L2 email sent to {l2Email}");
        }

        public async Task SendDeptHeadRejectedNotificationToNomineeAsync(string nomineeEmail, string nomineeName, string opportunityName, string reason)
        {
            var subject = $"Update on your nomination for {opportunityName}";
            var htmlBody = $@"
                <html>
                <body>
                    <p>Hi {nomineeName},</p>
                    <p>Your nomination for the internal opportunity <strong>{opportunityName}</strong> is currently under <strong>re-review</strong> by your manager.</p>
                    <p>The Department Head has provided feedback and requested additional review.</p>
                    <p><strong>Feedback:</strong> {reason}</p>
                    <p>You will be notified once your manager completes the re-review.</p>
                    <br/>
                    <p>Regards,<br/>EEPZ System</p>
                </body>
                </html>";

            await _emailService.SendEmailAsync(nomineeEmail, subject, htmlBody);
            Console.WriteLine($"[NotificationService] DeptHead Rejection Notification sent to Nominee: {nomineeEmail}");
        }

        public async Task SendL2ReApprovedEmailAsync(string nomineeEmail, string nomineeName, string opportunityName, string l2Name)
        {
            var subject = "Your nomination has been re-approved by your Manager";
            var htmlBody = $@"
                <html>
                <body>
                    <p>Hi {nomineeName},</p>
                    <p>Good news! Your manager <strong>{l2Name}</strong> has <strong>re-approved</strong> your nomination for the internal opportunity <strong>{opportunityName}</strong>.</p>
                    <p>Your nomination is now pending <strong>Department Head final review</strong>.</p>
                    <p>Please check the EEPZ portal for updates.</p>
                    <br/>
                    <p>Regards,<br/>EEPZ System</p>
                </body>
                </html>";

            await _emailService.SendEmailAsync(nomineeEmail, subject, htmlBody);
            Console.WriteLine($"[NotificationService] L2 Re-Approved email sent to {nomineeEmail}");
        }

        public async Task SendL2ReApprovedNotificationToDeptHeadAsync(string deptHeadEmail, string deptHeadName, string nomineeName, string opportunityName)
        {
            var subject = $"Action Required - Re-review Nomination for {nomineeName}";
            var htmlBody = $@"
                <html>
                <body>
                    <p>Hi {deptHeadName},</p>
                    <p><strong>{nomineeName}</strong>'s nomination for the internal opportunity <strong>{opportunityName}</strong> has been <strong>re-approved</strong> by the reporting manager.</p>
                    <p>Please log in to the EEPZ portal to review this nomination again for final approval.</p>
                    <br/>
                    <p>Regards,<br/>EEPZ System</p>
                </body>
                </html>";

            await _emailService.SendEmailAsync(deptHeadEmail, subject, htmlBody);
            Console.WriteLine($"[NotificationService] L2 Re-Approval Notification sent to DeptHead: {deptHeadEmail}");
        }

        public async Task SendL2ReRejectedEmailAsync(string nomineeEmail, string nomineeName, string opportunityName, string l2Name, string reason)
        {
            var subject = "Your nomination has been rejected - FINAL";
            var htmlBody = $@"
                <html>
                <body>
                    <p>Hi {nomineeName},</p>
                    <p>Unfortunately, your nomination for the internal opportunity <strong>{opportunityName}</strong> has been <strong>rejected</strong> by your manager <strong>{l2Name}</strong> after re-review.</p>
                    <p><strong>Reason:</strong> {reason}</p>
                    <p>This is a <strong>final decision</strong>. If you have questions, please contact your manager for clarification.</p>
                    <br/>
                    <p>Regards,<br/>EEPZ System</p>
                </body>
                </html>";

            await _emailService.SendEmailAsync(nomineeEmail, subject, htmlBody);
            Console.WriteLine($"[NotificationService] L2 Re-Rejected email sent to {nomineeEmail}");
        }
    }
}
