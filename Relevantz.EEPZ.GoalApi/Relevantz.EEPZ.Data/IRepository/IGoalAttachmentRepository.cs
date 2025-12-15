using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interface
{
    public interface IGoalAttachmentRepository
    {
        Task AddAttachmentAsync(GoalAttachment attachment);
        Task<List<GoalAttachment>> GetAttachmentsByGoalAsync(int goalId);
        Task<GoalAttachment?> GetAttachmentByIdAsync(int attachmentId);
        Task MarkAttachmentsAsProofAsync(List<int> attachmentIds, int approvalId);
        Task DeleteAttachmentAsync(int attachmentId);
        Task<List<GoalAttachment>> GetProofAttachmentsForApprovalAsync(int approvalId);
        Task UnmarkProofAttachmentsAsync(int approvalId);
    }
}
