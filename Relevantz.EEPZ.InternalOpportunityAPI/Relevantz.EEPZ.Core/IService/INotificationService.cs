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
        
        
        Task SendL2ReviewRequestEmailAsync(string l2Email, string l2Name, string nomineeName, string opportunityName);
        Task SendL2ApprovedEmailAsync(string nomineeEmail, string nomineeName, string opportunityName, string l2Name);
        Task SendL2RejectedEmailAsync(string nomineeEmail, string nomineeName, string opportunityName, string l2Name, string reason);
        
        
        Task SendDeptHeadReviewRequestEmailAsync(string deptHeadEmail, string deptHeadName, string nomineeName, string opportunityName);
        Task SendDeptHeadApprovedEmailAsync(string nomineeEmail, string nomineeName, string opportunityName, string deptHeadName);
        Task SendDeptHeadApprovedNotificationToL2Async(string l2Email, string l2Name, string nomineeName, string opportunityName);
        Task SendDeptHeadRejectedToL2EmailAsync(string l2Email, string l2Name, string nomineeName, string opportunityName, string reason);
        Task SendDeptHeadRejectedNotificationToNomineeAsync(string nomineeEmail, string nomineeName, string opportunityName, string reason);
        
        Task SendL2ReApprovedEmailAsync(string nomineeEmail, string nomineeName, string opportunityName, string l2Name);
        Task SendL2ReApprovedNotificationToDeptHeadAsync(string deptHeadEmail, string deptHeadName, string nomineeName, string opportunityName);
        Task SendL2ReRejectedEmailAsync(string nomineeEmail, string nomineeName, string opportunityName, string l2Name, string reason);
    }
}
