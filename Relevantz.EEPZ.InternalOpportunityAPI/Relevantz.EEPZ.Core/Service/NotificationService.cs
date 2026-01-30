using System;
using System.Threading.Tasks;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Utils;

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
            var subject = EmailConstants.Subjects.NominationCreated;
            var htmlBody = EmailTemplateHelper.GetNominationCreatedTemplate(employeeName, opportunityName, nominatedByName);
            await _emailService.SendEmailAsync(recipientEmail, subject, htmlBody);
            Console.WriteLine($"[NotificationService] Nomination created email sent to {recipientEmail}");
        }

        public async Task SendNominationApprovedEmailAsync(string recipientEmail, string employeeName, string opportunityName)
        {
            var subject = EmailConstants.Subjects.NominationApproved;
            var htmlBody = EmailTemplateHelper.GetDeptHeadApprovedTemplate(employeeName, opportunityName, "Department Head");
            await _emailService.SendEmailAsync(recipientEmail, subject, htmlBody);
            Console.WriteLine($"[NotificationService] Nomination approved email sent to {recipientEmail}");
        }

        public async Task SendNominationRejectedEmailAsync(string recipientEmail, string employeeName, string opportunityName, string reason)
        {
            var subject = EmailConstants.Subjects.NominationRejected;
            var htmlBody = EmailTemplateHelper.GetL2ReRejectedTemplate(employeeName, opportunityName, "Manager", reason);
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
            var subject = EmailConstants.Subjects.L2ReviewRequest;
            var htmlBody = EmailTemplateHelper.GetL2ReviewRequestTemplate(l2Name, nomineeName, opportunityName);
            await _emailService.SendEmailAsync(l2Email, subject, htmlBody);
            Console.WriteLine($"[NotificationService] L2 Review Request email sent to {l2Email}");
        }

        public async Task SendL2ApprovedEmailAsync(string nomineeEmail, string nomineeName, string opportunityName, string l2Name)
        {
            var subject = EmailConstants.Subjects.L2Approved;
            var htmlBody = EmailTemplateHelper.GetL2ApprovedTemplate(nomineeName, opportunityName, l2Name);
            await _emailService.SendEmailAsync(nomineeEmail, subject, htmlBody);
            Console.WriteLine($"[NotificationService] L2 Approved email sent to {nomineeEmail}");
        }

        public async Task SendL2RejectedEmailAsync(string nomineeEmail, string nomineeName, string opportunityName, string l2Name, string reason)
        {
            var subject = EmailConstants.Subjects.L2Rejected;
            var htmlBody = EmailTemplateHelper.GetL2RejectedTemplate(nomineeName, opportunityName, l2Name, reason);
            await _emailService.SendEmailAsync(nomineeEmail, subject, htmlBody);
            Console.WriteLine($"[NotificationService] L2 Rejected email sent to {nomineeEmail}");
        }

        public async Task SendDeptHeadReviewRequestEmailAsync(string deptHeadEmail, string deptHeadName, string nomineeName, string opportunityName)
        {
            var subject = EmailConstants.Subjects.DeptHeadReviewRequest;
            var htmlBody = EmailTemplateHelper.GetDeptHeadReviewRequestTemplate(deptHeadName, nomineeName, opportunityName);
            await _emailService.SendEmailAsync(deptHeadEmail, subject, htmlBody);
            Console.WriteLine($"[NotificationService] DeptHead Review Request email sent to {deptHeadEmail}");
        }

        public async Task SendDeptHeadApprovedEmailAsync(string nomineeEmail, string nomineeName, string opportunityName, string deptHeadName)
        {
            var subject = EmailConstants.Subjects.DeptHeadApproved;
            var htmlBody = EmailTemplateHelper.GetDeptHeadApprovedTemplate(nomineeName, opportunityName, deptHeadName);
            await _emailService.SendEmailAsync(nomineeEmail, subject, htmlBody);
            Console.WriteLine($"[NotificationService] DeptHead Approved email sent to {nomineeEmail}");
        }

        public async Task SendDeptHeadApprovedNotificationToL2Async(string l2Email, string l2Name, string nomineeName, string opportunityName)
        {
            var subject = EmailConstants.Subjects.DeptHeadApprovedToL2;
            var htmlBody = EmailTemplateHelper.GetDeptHeadApprovedToL2Template(l2Name, nomineeName, opportunityName);
            await _emailService.SendEmailAsync(l2Email, subject, htmlBody);
            Console.WriteLine($"[NotificationService] DeptHead Approval Notification sent to L2: {l2Email}");
        }

        public async Task SendDeptHeadRejectedToL2EmailAsync(string l2Email, string l2Name, string nomineeName, string opportunityName, string reason)
        {
            var subject = EmailConstants.Subjects.DeptHeadRejectedToL2;
            var htmlBody = EmailTemplateHelper.GetDeptHeadRejectedToL2Template(l2Name, nomineeName, opportunityName, reason);
            await _emailService.SendEmailAsync(l2Email, subject, htmlBody);
            Console.WriteLine($"[NotificationService] DeptHead Rejected to L2 email sent to {l2Email}");
        }

        public async Task SendDeptHeadRejectedNotificationToNomineeAsync(string nomineeEmail, string nomineeName, string opportunityName, string reason)
        {
            var subject = EmailConstants.Subjects.DeptHeadRejectedToNominee;
            var htmlBody = EmailTemplateHelper.GetDeptHeadRejectedToNomineeTemplate(nomineeName, opportunityName, reason);
            await _emailService.SendEmailAsync(nomineeEmail, subject, htmlBody);
            Console.WriteLine($"[NotificationService] DeptHead Rejection Notification sent to Nominee: {nomineeEmail}");
        }

        public async Task SendL2ReApprovedEmailAsync(string nomineeEmail, string nomineeName, string opportunityName, string l2Name)
        {
            var subject = EmailConstants.Subjects.L2ReApproved;
            var htmlBody = EmailTemplateHelper.GetL2ReApprovedTemplate(nomineeName, opportunityName, l2Name);
            await _emailService.SendEmailAsync(nomineeEmail, subject, htmlBody);
            Console.WriteLine($"[NotificationService] L2 Re-Approved email sent to {nomineeEmail}");
        }

        public async Task SendL2ReApprovedNotificationToDeptHeadAsync(string deptHeadEmail, string deptHeadName, string nomineeName, string opportunityName)
        {
            var subject = EmailConstants.Subjects.L2ReApprovedToDeptHead;
            var htmlBody = EmailTemplateHelper.GetL2ReApprovedToDeptHeadTemplate(deptHeadName, nomineeName, opportunityName);
            await _emailService.SendEmailAsync(deptHeadEmail, subject, htmlBody);
            Console.WriteLine($"[NotificationService] L2 Re-Approval Notification sent to DeptHead: {deptHeadEmail}");
        }

        public async Task SendL2ReRejectedEmailAsync(string nomineeEmail, string nomineeName, string opportunityName, string l2Name, string reason)
        {
            var subject = EmailConstants.Subjects.L2ReRejected;
            var htmlBody = EmailTemplateHelper.GetL2ReRejectedTemplate(nomineeName, opportunityName, l2Name, reason);
            await _emailService.SendEmailAsync(nomineeEmail, subject, htmlBody);
            Console.WriteLine($"[NotificationService] L2 Re-Rejected email sent to {nomineeEmail}");
        }
    }
}
