using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Data.Repositories.Interface
{
    public interface ILnDApprovalRepository
    {
        Task<Lndapproval?> GetApprovalById(int approvalId);
        Task<Lndapproval?> GetPendingSmeRegistration(int employeeId, int skillId);
        Task<Lndapproval> AddApproval(Lndapproval approval);
        Task UpdateApproval(Lndapproval approval);
        Task<(List<ApprovalResponseModel> Items, int TotalCount)> GetMyApprovals(
            int employeeId,
            MyApprovalsRequestModel request
        );
        Task<(List<ApprovalResponseModel> Items, int TotalCount)> GetApprovalHistory(
            int employeeId,
            ApprovalHistoryRequestModel request
        );
        Task<Lndapproval?> GetPendingAssignmentApproval(int assignmentId, string approvalType);
        Task<Lndattachment> AddAttachment(Lndattachment attachment);
        Task<Lndattachment?> GetAttachmentById(int attachmentId);

        // Add these methods to your existing ILnDApprovalRepository interface
        Task<Lndapproval?> GetPendingReopenRequestByAssignment(int assignmentId);
        Task<(List<ReopenRequestResponseModel> Items, int TotalCount)> GetMyReopenRequests(
            int employeeId,
            MyApprovalsRequestModel request);
        Task<(List<ReopenRequestResponseModel> Items, int TotalCount)> GetTeamReopenRequests(
            int managerId,
            MyApprovalsRequestModel request);

    }
}
