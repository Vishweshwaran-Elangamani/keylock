using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Data.Repository.Interface
{
    public interface IGoalAttachmentRepository
    {
        Task AddAttachment(GoalAttachment attachment);
        Task<List<GoalAttachment>> GetAttachmentsByGoal(int goalId);
        Task<GoalAttachment?> GetAttachmentById(int attachmentId);
        Task MarkAttachmentsAsProof(List<int> attachmentIds, int approvalId);
        Task DeleteAttachment(int attachmentId);
        Task<List<GoalAttachment>> GetProofAttachmentsForApproval(int approvalId);
        Task UnmarkProofAttachments(int approvalId);
    }
}
