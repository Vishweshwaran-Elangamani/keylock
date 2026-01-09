using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Enums;
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
        }

        public async Task AddAttachmentAsync(GoalAttachment attachment)
        {
            try
            {
                Log.Information(
                    "[AddAttachmentAsync] Adding attachment for goal {GoalId}",
                    attachment.GoalId
                );
                await _db.GoalAttachments.AddAsync(attachment);
                Log.Information("[AddAttachmentAsync] Attachment added successfully");
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[AddAttachmentAsync] Error adding attachment");
                throw;
            }
        }

        public async Task<List<GoalAttachment>> GetAttachmentsByGoalAsync(int goalId)
        {
            try
            {
                Log.Information(
                    "[GetAttachmentsByGoalAsync] Fetching attachments for goal {GoalId}",
                    goalId
                );
                var result = await _db
                    .GoalAttachments.Where(a => a.GoalId == goalId)
                    .OrderByDescending(a => a.AttachedOn)
                    .ToListAsync();
                Log.Information(
                    "[GetAttachmentsByGoalAsync] Found {Count} attachments",
                    result.Count
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetAttachmentsByGoalAsync] Error fetching attachments");
                throw;
            }
        }

        public async Task<GoalAttachment?> GetAttachmentByIdAsync(int attachmentId)
        {
            try
            {
                Log.Information(
                    "[GetAttachmentByIdAsync] Fetching attachment {AttachmentId}",
                    attachmentId
                );
                var result = await _db.GoalAttachments.FirstOrDefaultAsync(a =>
                    a.Goalattachmentsid == attachmentId
                );
                Log.Information(
                    "[GetAttachmentByIdAsync] Attachment found: {Found}",
                    result != null
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetAttachmentByIdAsync] Error fetching attachment");
                throw;
            }
        }

        public async Task MarkAttachmentsAsProofAsync(List<int> attachmentIds, int approvalId)
        {
            try
            {
                Log.Information(
                    "[MarkAttachmentsAsProofAsync] Marking {Count} attachments as proof for approval {ApprovalId}",
                    attachmentIds.Count,
                    approvalId
                );
                var attachments = await _db
                    .GoalAttachments.Where(a => attachmentIds.Contains(a.Goalattachmentsid))
                    .ToListAsync();

                foreach (var attachment in attachments)
                {
                    attachment.IsProofOfCompletion = true;
                    attachment.LinkedApprovalId = approvalId;
                    _db.GoalAttachments.Update(attachment);
                }
                Log.Information(
                    "[MarkAttachmentsAsProofAsync] Marked {Count} attachments",
                    attachments.Count
                );
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[MarkAttachmentsAsProofAsync] Error marking attachments as proof");
                throw;
            }
        }

        public async Task DeleteAttachmentAsync(int attachmentId)
        {
            try
            {
                Log.Information(
                    "[DeleteAttachmentAsync] Deleting attachment {AttachmentId}",
                    attachmentId
                );
                var attachment = await _db.GoalAttachments.FirstOrDefaultAsync(a =>
                    a.Goalattachmentsid == attachmentId
                );
                if (attachment != null)
                {
                    _db.GoalAttachments.Remove(attachment);
                    Log.Information("[DeleteAttachmentAsync] Attachment deleted successfully");
                }
                else
                {
                    Log.Warning(
                        "[DeleteAttachmentAsync] Attachment {AttachmentId} not found",
                        attachmentId
                    );
                }
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[DeleteAttachmentAsync] Error deleting attachment");
                throw;
            }
        }

        public async Task<List<GoalAttachment>> GetProofAttachmentsForApprovalAsync(int approvalId)
        {
            try
            {
                Log.Information(
                    "[GetProofAttachmentsForApprovalAsync] Fetching proof attachments for approval {ApprovalId}",
                    approvalId
                );
                var result = await _db
                    .GoalAttachments.Where(a =>
                        a.LinkedApprovalId == approvalId && a.IsProofOfCompletion == true
                    )
                    .OrderByDescending(a => a.AttachedOn)
                    .ToListAsync();
                Log.Information(
                    "[GetProofAttachmentsForApprovalAsync] Found {Count} proof attachments",
                    result.Count
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "[GetProofAttachmentsForApprovalAsync] Error fetching proof attachments"
                );
                throw;
            }
        }

        public async Task UnmarkProofAttachmentsAsync(int approvalId)
        {
            try
            {
                Log.Information(
                    "[UnmarkProofAttachmentsAsync] Unmarking proof attachments for approval {ApprovalId}",
                    approvalId
                );
                var attachments = await _db
                    .GoalAttachments.Where(a => a.LinkedApprovalId == approvalId)
                    .ToListAsync();

                foreach (var attachment in attachments)
                {
                    attachment.IsProofOfCompletion = false;
                    attachment.LinkedApprovalId = null;
                    _db.GoalAttachments.Update(attachment);
                }
                Log.Information(
                    "[UnmarkProofAttachmentsAsync] Unmarked {Count} attachments', attachments.Count"
                );
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[UnmarkProofAttachmentsAsync] Error unmarking proof attachments");
                throw;
            }
        }
    }
}
    