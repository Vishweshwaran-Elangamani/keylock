using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repositories.Interface
{
    public interface ILnDApprovalRepository
    {
        Task<Lndapproval?> GetApprovalByIdAsync(int approvalId);
        Task<Lndapproval?> GetPendingSmeRegistrationAsync(int employeeId, int skillId);
        Task<Lndapproval> AddApprovalAsync(Lndapproval approval);
        Task UpdateApprovalAsync(Lndapproval approval);
        Task<(List<Lndapproval> Items, int TotalCount)> GetMyApprovalsAsync(
            int employeeId,
            MyApprovalsRequestModel request
        );
        Task<(List<Lndapproval> Items, int TotalCount)> GetApprovalHistoryAsync(
            int employeeId,
            ApprovalHistoryRequestModel request
        );
        Task<Lndapproval?> GetPendingAssignmentApprovalAsync(int assignmentId, string approvalType);
        Task<Lndattachment> AddAttachmentAsync(Lndattachment attachment);
        Task<Lndattachment?> GetAttachmentByIdAsync(int attachmentId);
    }
}
