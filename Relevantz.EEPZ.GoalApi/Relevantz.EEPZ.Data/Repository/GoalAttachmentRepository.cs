using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interface;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class GoalAttachmentRepository : IGoalAttachmentRepository
    {
        private readonly EEPZDbContext _db;
        private readonly IWebHostEnvironment environment;

        public GoalAttachmentRepository(EEPZDbContext db, IWebHostEnvironment _environment)
        {
            _db = db;
            environment = _environment;
        }

        public async Task AddAttachment(GoalAttachment attachment)
        {
            await _db.GoalAttachments.AddAsync(attachment);
        }

        public async Task<List<GoalAttachment>> GetAttachmentsByGoal(int goalId)
        {
            var result = await _db
                .GoalAttachments.Where(a => a.GoalId == goalId)
                .OrderByDescending(a => a.AttachedOn)
                .ToListAsync();

            return result;
        }

        public async Task<GoalAttachment?> GetAttachmentById(int attachmentId)
        {
            var result = await _db.GoalAttachments.FirstOrDefaultAsync(a =>
                a.Goalattachmentsid == attachmentId
            );

            return result;
        }

        public async Task MarkAttachmentsAsProof(List<int> attachmentIds, int approvalId)
        {
            var attachments = await _db
                .GoalAttachments.Where(a => attachmentIds.Contains(a.Goalattachmentsid))
                .ToListAsync();

            foreach (var attachment in attachments)
            {
                attachment.IsProofOfCompletion = true;
                attachment.LinkedApprovalId = approvalId;
                _db.GoalAttachments.Update(attachment);
            }
        }

        public async Task DeleteAttachment(int attachmentId)
        {
            var attachment = await _db.GoalAttachments.FirstOrDefaultAsync(a =>
                a.Goalattachmentsid == attachmentId
            );

            if (attachment != null)
            {
                _db.GoalAttachments.Remove(attachment);
            }
        }

        public async Task<List<GoalAttachment>> GetProofAttachmentsForApproval(int approvalId)
        {
            var result = await _db
                .GoalAttachments.Where(a =>
                    a.LinkedApprovalId == approvalId && a.IsProofOfCompletion == true
                )
                .OrderByDescending(a => a.AttachedOn)
                .ToListAsync();

            return result;
        }

        public async Task UnmarkProofAttachments(int approvalId)
        {
            var attachments = await _db
                .GoalAttachments.Where(a => a.LinkedApprovalId == approvalId)
                .ToListAsync();

            foreach (var attachment in attachments)
            {
                attachment.IsProofOfCompletion = false;
                attachment.LinkedApprovalId = null;
                _db.GoalAttachments.Update(attachment);
            }
        }
    }
}
