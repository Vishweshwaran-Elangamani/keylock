using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.Repository.Interface;
using Relevantz.EEPZ.Core.Services.Interface;
using Serilog;

namespace Relevantz.EEPZ.Core.Service
{
    public class GoalAttachmentService : IGoalAttachmentService
    {
        private readonly IGoalAttachmentRepository _repo;
        private readonly IBaseGoalRepository _baseRepo;
        private readonly IBaseGoalService _baseService;
        private readonly IFileStorageService _fileStorage;

        public GoalAttachmentService(
            IGoalAttachmentRepository repo,
            IBaseGoalRepository baseRepo,
            IBaseGoalService baseService,
            IFileStorageService fileStorage
        )
        {
            _repo = repo;
            _baseRepo = baseRepo;
            _baseService = baseService;
            _fileStorage = fileStorage;
        }

        public async Task<(
            byte[] fileBytes,
            string contentType,
            string fileName
        )?> PreviewFileAsync(int attachmentId, int currentUserEmployeeMasterId)
        {
            try
            {
                var attachment = await _repo.GetAttachmentByIdAsync(attachmentId);

                if (attachment == null)
                {
                    Log.Warning("Attachment {AttachmentId} not found", attachmentId);
                    return null;
                }

                // Check access
                var goal = await _baseRepo.GetGoalByIdAsync(attachment.GoalId);
                if (goal == null)
                {
                    Log.Warning("Goal {GoalId} not found for attachment {AttachmentId}", 
                        attachment.GoalId, attachmentId);
                    return null;
                }

                var canView = await _baseService.CanViewGoalAsync(
                    attachment.GoalId, 
                    currentUserEmployeeMasterId);
                
                if (!canView)
                {
                    Log.Warning(
                        "User {UserId} does not have access to view attachment {AttachmentId}", 
                        currentUserEmployeeMasterId, 
                        attachmentId);
                    return null;
                }

                // Get file from MongoDB GridFS
                var (fileBytes, contentType, fileName) = await _fileStorage.GetFileForPreviewAsync(
                    attachment.Attachments ?? "");

                // Use attachment title if available, otherwise use filename from GridFS
                var displayFileName = !string.IsNullOrEmpty(attachment.AttachmentTitle)
                    ? attachment.AttachmentTitle
                    : fileName;

                // Ensure filename has proper extension
                if (!Path.HasExtension(displayFileName))
                {
                    var extension = Path.GetExtension(fileName);
                    displayFileName += extension;
                }

                Log.Information(
                    "User {UserId} previewing attachment {AttachmentId}", 
                    currentUserEmployeeMasterId, 
                    attachmentId);

                return (fileBytes, contentType, displayFileName);
            }
            catch (FileNotFoundException ex)
            {
                Log.Error(ex, "File not found for attachment {AttachmentId}", attachmentId);
                return null;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error previewing attachment {AttachmentId}", attachmentId);
                return null;
            }
        }

        public async Task<FileUploadResponseDto> UploadFileAsync(
            int goalId,
            IFormFile file,
            string title,
            int currentUserEmployeeMasterId 
        ) 
        {
            var goal = await _baseRepo.GetGoalByIdAsync(goalId);
            if (goal == null)
            {
                Log.Warning("Goal {GoalId} not found for file upload", goalId);
                throw new KeyNotFoundException("Goal not found");
            }

            // Check if user can upload to this goal
            var canView = await _baseService.CanViewGoalAsync(goalId, currentUserEmployeeMasterId);
            if (!canView)
            {
                Log.Warning(
                    "User {UserId} attempted to upload file to goal {GoalId} without permission", 
                    currentUserEmployeeMasterId, 
                    goalId);
                throw new UnauthorizedAccessException("You cannot upload files to this goal.");
            }

            // Validate file
            if (file == null || file.Length == 0)
            {
                throw new ArgumentException("File is empty or null");
            }

            // Validate file size (10MB limit)
            const long maxFileSize = 10 * 1024 * 1024;
            if (file.Length > maxFileSize)
            {
                throw new InvalidOperationException("File size exceeds maximum limit of 10MB");
            }

            // Validate file extension
            var allowedExtensions = new[]
            {
                ".pdf",
                ".doc",
                ".docx",
                ".xls",
                ".xlsx",
                ".png",
                ".jpg",
                ".jpeg",
                ".txt",
                ".zip",
            };
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(fileExtension))
            {
                throw new InvalidOperationException($"File type '{fileExtension}' is not allowed");
            }

            try
            {
                // Upload to MongoDB GridFS
                var fileId = await _fileStorage.SaveFileAsync(file, "goals/attachments");

                Log.Information(
                    "File uploaded to MongoDB GridFS with ID {FileId} for goal {GoalId}", 
                    fileId, 
                    goalId);

                // Save attachment record with MongoDB file ID
                var attachment = new GoalAttachment
                {
                    GoalId = goalId,
                    AttachmentTitle = title,
                    Attachments = fileId, // Store MongoDB ObjectId
                    AttachedBy = currentUserEmployeeMasterId,
                    AttachedOn = DateTime.UtcNow,
                };

                await _repo.AddAttachmentAsync(attachment);
                await _baseRepo.SaveChangesAsync();

                Log.Information(
                    "Attachment {AttachmentId} created for goal {GoalId} by user {UserId}", 
                    attachment.Goalattachmentsid, 
                    goalId, 
                    currentUserEmployeeMasterId);

                return new FileUploadResponseDto
                {
                    AttachmentId = attachment.Goalattachmentsid,
                    AttachmentTitle = attachment.AttachmentTitle ?? "",
                    FilePath = attachment.Attachments ?? "",
                    FileName = file.FileName,
                    FileSize = file.Length,
                    ContentType = file.ContentType,
                    UploadedOn = attachment.AttachedOn ?? DateTime.UtcNow,
                };
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex, 
                    "Error uploading file for goal {GoalId} by user {UserId}", 
                    goalId, 
                    currentUserEmployeeMasterId);
                throw;
            }
        }

        public async Task<(
            byte[] fileBytes,
            string contentType,
            string fileName
        )> DownloadFileAsync(int attachmentId, int currentUserEmployeeMasterId)
        {
            var attachment = await _repo.GetAttachmentByIdAsync(attachmentId);
            if (attachment == null)
            {
                Log.Warning("Attachment {AttachmentId} not found for download", attachmentId);
                throw new KeyNotFoundException("Attachment not found");
            }

            // Check if user can access this goal
            var canView = await _baseService.CanViewGoalAsync(
                attachment.GoalId, 
                currentUserEmployeeMasterId);
            
            if (!canView)
            {
                Log.Warning(
                    "User {UserId} attempted to download attachment {AttachmentId} without permission", 
                    currentUserEmployeeMasterId, 
                    attachmentId);
                throw new UnauthorizedAccessException("You cannot access this attachment.");
            }

            try
            {
                // Get file from MongoDB GridFS
                var (fileBytes, contentType, fileName) = await _fileStorage.GetFileForPreviewAsync(
                    attachment.Attachments ?? "");

                // Use the original filename from attachment title or from GridFS
                var downloadFileName = !string.IsNullOrEmpty(attachment.AttachmentTitle)
                    ? attachment.AttachmentTitle
                    : fileName;

                // Ensure filename has proper extension
                if (!Path.HasExtension(downloadFileName))
                {
                    var extension = Path.GetExtension(fileName);
                    downloadFileName += extension;
                }

                Log.Information(
                    "User {UserId} downloaded attachment {AttachmentId}", 
                    currentUserEmployeeMasterId, 
                    attachmentId);

                return (fileBytes, contentType, downloadFileName);
            }
            catch (FileNotFoundException ex)
            {
                Log.Error(ex, "File not found for attachment {AttachmentId}", attachmentId);
                throw new FileNotFoundException("Attachment file not found on server.", ex);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error downloading attachment {AttachmentId}", attachmentId);
                throw;
            }
        }

        public async Task<bool> DeleteAttachmentAsync(
            int attachmentId,
            int currentUserEmployeeMasterId
        )
        {
            var attachment = await _repo.GetAttachmentByIdAsync(attachmentId);
            if (attachment == null)
            {
                Log.Warning("Attachment {AttachmentId} not found for deletion", attachmentId);
                throw new KeyNotFoundException("Attachment not found");
            }

            var goal = await _baseRepo.GetGoalByIdAsync(attachment.GoalId);
            if (goal == null)
            {
                Log.Warning(
                    "Goal {GoalId} not found for attachment {AttachmentId}", 
                    attachment.GoalId, 
                    attachmentId);
                throw new KeyNotFoundException("Goal not found");
            }

            // Only attachment uploader or goal creator can delete
            if (
                attachment.AttachedBy != currentUserEmployeeMasterId
                && goal.CreatedBy != currentUserEmployeeMasterId
            )
            {
                Log.Warning(
                    "User {UserId} attempted to delete attachment {AttachmentId} without permission", 
                    currentUserEmployeeMasterId, 
                    attachmentId);
                throw new UnauthorizedAccessException("You cannot delete this attachment.");
            }

            try
            {
                // Delete file from MongoDB GridFS
                if (!string.IsNullOrEmpty(attachment.Attachments))
                {
                    var deleted = await _fileStorage.DeleteFileAsync(attachment.Attachments);
                    if (deleted)
                    {
                        Log.Information(
                            "File {FileId} deleted from MongoDB GridFS", 
                            attachment.Attachments);
                    }
                    else
                    {
                        Log.Warning(
                            "File {FileId} not found in MongoDB GridFS during deletion", 
                            attachment.Attachments);
                    }
                }

                // Delete from database
                await _repo.DeleteAttachmentAsync(attachmentId);
                await _baseRepo.SaveChangesAsync();

                Log.Information(
                    "Attachment {AttachmentId} deleted by user {UserId}", 
                    attachmentId, 
                    currentUserEmployeeMasterId);

                return true;
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex, 
                    "Error deleting attachment {AttachmentId} by user {UserId}", 
                    attachmentId, 
                    currentUserEmployeeMasterId);
                throw;
            }
        }

        public async Task<List<GoalAttachment>> ListAttachmentsAsync(int goalId)
        {
            try
            {
                var attachments = await _repo.GetAttachmentsByGoalAsync(goalId);
                Log.Information(
                    "Retrieved {Count} attachments for goal {GoalId}", 
                    attachments.Count, 
                    goalId);
                return attachments;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error listing attachments for goal {GoalId}", goalId);
                throw;
            }
        }


        public async Task<GoalAttachment> GetAttachmentAsync(int attachmentId)
        {
            var attachment = await _repo.GetAttachmentByIdAsync(attachmentId);
            if (attachment == null)
            {
                Log.Warning("Attachment {AttachmentId} not found", attachmentId);
                throw new KeyNotFoundException("Attachment not found");
            }

            return attachment;
        }
    }
}
