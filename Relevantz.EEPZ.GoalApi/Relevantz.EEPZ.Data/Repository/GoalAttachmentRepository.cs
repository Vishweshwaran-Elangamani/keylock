using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interface;
using Serilog;

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

            Log.Debug("GoalAttachmentRepository initialized.");
        }

        public async Task AddAttachment(GoalAttachment attachment)
        {
            Log.Information(
                "AddAttachment START | GoalId={GoalId} | Title={Title} | AttachedBy={UserId}",
                attachment?.GoalId,
                attachment?.AttachmentTitle,
                attachment?.AttachedBy
            );

            await _db.GoalAttachments.AddAsync(attachment);

            Log.Information("AddAttachment END | Attachment added (not saved yet)");
        }

        public async Task<List<GoalAttachment>> GetAttachmentsByGoal(int goalId)
        {
            Log.Information("GetAttachmentsByGoal START | GoalId={GoalId}", goalId);

            var result = await _db.GoalAttachments
                .Where(a => a.GoalId == goalId)
                .OrderByDescending(a => a.AttachedOn)
                .ToListAsync();

            Log.Information(
                "GetAttachmentsByGoal END | GoalId={GoalId} | Count={Count}",
                goalId, result.Count
            );

            return result;
        }

        public async Task<GoalAttachment?> GetAttachmentById(int attachmentId)
        {
            Log.Information("GetAttachmentById START | AttachmentId={Id}", attachmentId);

            var result = await _db.GoalAttachments
                .FirstOrDefaultAsync(a => a.Goalattachmentsid == attachmentId);

            Log.Information(
                "GetAttachmentById END | AttachmentId={Id} | Found={Found}",
                attachmentId, result != null
            );

            return result;
        }

        public async Task MarkAttachmentsAsProof(List<int> attachmentIds, int approvalId)
        {
            Log.Information(
                "MarkAttachmentsAsProof START | ApprovalId={ApprovalId} | AttachmentCount={Count}",
                approvalId, attachmentIds?.Count ?? 0
            );

            var attachments = await _db.GoalAttachments
                .Where(a => attachmentIds.Contains(a.Goalattachmentsid))
                .ToListAsync();

            foreach (var attachment in attachments)
            {
                attachment.IsProofOfCompletion = true;
                attachment.LinkedApprovalId = approvalId;
                _db.GoalAttachments.Update(attachment);

                Log.Debug(
                    "Marked as proof | AttachmentId={Id} | ApprovalId={ApprovalId}",
                    attachment.Goalattachmentsid,
                    approvalId
                );
            }

            Log.Information(
                "MarkAttachmentsAsProof END | ApprovalId={ApprovalId} | UpdatedCount={Count}",
                approvalId,
                attachments.Count
            );
        }

        public async Task DeleteAttachment(int attachmentId)
        {
            Log.Information("DeleteAttachment START | AttachmentId={Id}", attachmentId);

            var attachment = await _db.GoalAttachments
                .FirstOrDefaultAsync(a => a.Goalattachmentsid == attachmentId);

            if (attachment != null)
            {
                _db.GoalAttachments.Remove(attachment);

                Log.Information(
                    "DeleteAttachment | Attachment removed | AttachmentId={Id} | GoalId={GoalId}",
                    attachmentId, attachment.GoalId
                );
            }
            else
            {
                Log.Warning(
                    "DeleteAttachment | Attachment not found | AttachmentId={Id}",
                    attachmentId
                );
            }

            Log.Information("DeleteAttachment END | AttachmentId={Id}", attachmentId);
        }

        public async Task<List<GoalAttachment>> GetProofAttachmentsForApproval(int approvalId)
        {
            Log.Information(
                "GetProofAttachmentsForApproval START | ApprovalId={ApprovalId}",
                approvalId
            );

            var result = await _db.GoalAttachments
                .Where(a =>
                    a.LinkedApprovalId == approvalId &&
                    a.IsProofOfCompletion == true
                )
                .OrderByDescending(a => a.AttachedOn)
                .ToListAsync();

            Log.Information(
                "GetProofAttachmentsForApproval END | ApprovalId={ApprovalId} | Count={Count}",
                approvalId, result.Count
            );

            return result;
        }

        public async Task UnmarkProofAttachments(int approvalId)
        {
            Log.Information(
                "UnmarkProofAttachments START | ApprovalId={ApprovalId}",
                approvalId
            );

            var attachments = await _db.GoalAttachments
                .Where(a => a.LinkedApprovalId == approvalId)
                .ToListAsync();

            foreach (var attachment in attachments)
            {
                attachment.IsProofOfCompletion = false;
                attachment.LinkedApprovalId = null;
                _db.GoalAttachments.Update(attachment);

                Log.Debug(
                    "Unmarked proof attachment | AttachmentId={Id}",
                    attachment.Goalattachmentsid
                );
            }

            Log.Information(
                "UnmarkProofAttachments END | ApprovalId={ApprovalId} | UpdatedCount={Count}",
                approvalId, attachments.Count
            );
        }
    }
}