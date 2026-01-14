using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;

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
    }
}
