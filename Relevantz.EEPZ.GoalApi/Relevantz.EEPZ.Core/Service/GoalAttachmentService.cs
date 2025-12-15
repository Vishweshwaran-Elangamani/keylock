using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Enums;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Data.Repository.Interface;
using Serilog;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class GoalAttachmentService : IGoalAttachmentService
    {
        private readonly IGoalAttachmentRepository _repo;
        private readonly IBaseGoalRepository _baseRepo;
        private readonly IBaseGoalService _baseService;
        private readonly IWebHostEnvironment _environment;

        public GoalAttachmentService(
            IGoalAttachmentRepository repo,
            IBaseGoalRepository baseRepo,
            IBaseGoalService baseService,
            IWebHostEnvironment environment
        )
        {
            _repo = repo;
            _baseRepo = baseRepo;
            _baseService = baseService;
            _environment = environment;
        }

        public async Task<(
            byte[] fileBytes,
            string contentType,
            string fileName
        )?> PreviewFileAsync(int attachmentId, int currentUserEmployeeMasterId)
        {
            // USE EXACT SAME LOGIC AS DownloadFileAsync
            var attachment = await _repo.GetAttachmentByIdAsync(attachmentId);

            if (attachment == null)
            {
                return null;
            }

            // Check access
            var goal = await _baseRepo.GetGoalByIdAsync(attachment.GoalId);
            if (goal == null)
            {
                return null;
            }

            var canView = await _baseService.CanViewGoalAsync(attachment.GoalId, currentUserEmployeeMasterId);
            if (!canView)
            {
                return null;
            }

            // === USE EXACT SAME FILE PATH LOGIC AS DownloadFileAsync ===
            string webRootPath = _environment.WebRootPath;
            if (string.IsNullOrEmpty(webRootPath))
            {
                webRootPath = Path.Combine(_environment.ContentRootPath, "wwwroot");
            }

            var fullPath = Path.Combine(webRootPath, attachment.Attachments?.TrimStart('/') ?? "");

            if (!File.Exists(fullPath))
            {
                Log.Error("File not found: {Path}", fullPath);
                return null;
            }

            var fileBytes = await File.ReadAllBytesAsync(fullPath);
            var contentType = GetContentType(attachment.Attachments ?? "");
            var fileName = !string.IsNullOrEmpty(attachment.AttachmentTitle)
                ? attachment.AttachmentTitle
                : Path.GetFileName(attachment.Attachments ?? "download");

            // Ensure extension
            if (!Path.HasExtension(fileName) && !string.IsNullOrEmpty(attachment.Attachments))
            {
                var extension = Path.GetExtension(attachment.Attachments);
                fileName += extension;
            }

            return (fileBytes, contentType, fileName);
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
                throw new KeyNotFoundException("Goal not found");

            // Check if user can upload to this goal
            var canView = await _baseService.CanViewGoalAsync(goalId, currentUserEmployeeMasterId);
            if (!canView)
                throw new UnauthorizedAccessException("You cannot upload files to this goal.");

            // Validate file
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty or null");

            // Validate file size (10MB limit)
            const long maxFileSize = 10 * 1024 * 1024;
            if (file.Length > maxFileSize)
                throw new InvalidOperationException("File size exceeds maximum limit of 10MB");

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
                throw new InvalidOperationException($"File type '{fileExtension}' is not allowed");

            // Handle null WebRootPath
            string webRootPath = _environment.WebRootPath;
            if (string.IsNullOrEmpty(webRootPath))
            {
                webRootPath = Path.Combine(_environment.ContentRootPath, FILE_STORAGE.WWWROOT);
            }

            // Create upload directory
            var uploadsFolder = Path.Combine(
                webRootPath,
                FILE_STORAGE.UPLOADS,
                FILE_STORAGE.GOAL_ATTACHMENTS
            );

            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            // Generate unique filename
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            // Save file
            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            // Store relative path in database
            var relativePath = Path.Combine(
                    FILE_STORAGE.UPLOADS,
                    FILE_STORAGE.GOAL_ATTACHMENTS,
                    uniqueFileName
                )
                .Replace("\\", "/");

            // Save attachment record
            var attachment = new GoalAttachment
            {
                GoalId = goalId,
                AttachmentTitle = title,
                Attachments = relativePath,
                AttachedBy = currentUserEmployeeMasterId,
                AttachedOn = DateTime.UtcNow,
            };

            await _repo.AddAttachmentAsync(attachment);
            await _baseRepo.SaveChangesAsync();

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

        public async Task<(
            byte[] fileBytes,
            string contentType,
            string fileName
        )> DownloadFileAsync(int attachmentId, int currentUserEmployeeMasterId)
        {
            var attachment = await _repo.GetAttachmentByIdAsync(attachmentId);
            if (attachment == null)
                throw new KeyNotFoundException("Attachment not found");

            // Check if user can access this goal
            var canView = await _baseService.CanViewGoalAsync(attachment.GoalId, currentUserEmployeeMasterId);
            if (!canView)
                throw new UnauthorizedAccessException("You cannot access this attachment.");

            // Handle null WebRootPath
            string webRootPath = _environment.WebRootPath;
            if (string.IsNullOrEmpty(webRootPath))
            {
                Path.Combine(_environment.ContentRootPath, FILE_STORAGE.WWWROOT);
            }

            // Get full file path
            var fullPath = Path.Combine(webRootPath, attachment.Attachments?.TrimStart('/') ?? "");

            if (!File.Exists(fullPath))
                throw new FileNotFoundException("Attachment file not found on server.");

            var fileBytes = await File.ReadAllBytesAsync(fullPath);
            var contentType = GetContentType(attachment.Attachments ?? "");

            // Use the original filename from attachment title or extract from path
            var fileName = !string.IsNullOrEmpty(attachment.AttachmentTitle)
                ? attachment.AttachmentTitle
                : Path.GetFileName(attachment.Attachments ?? "download");

            // Ensure filename has proper extension
            if (!Path.HasExtension(fileName) && !string.IsNullOrEmpty(attachment.Attachments))
            {
                var extension = Path.GetExtension(attachment.Attachments);
                fileName += extension;
            }

            return (fileBytes, contentType, fileName);
        }

        public async Task<bool> DeleteAttachmentAsync(
            int attachmentId,
            int currentUserEmployeeMasterId
        )
        {
            var attachment = await _repo.GetAttachmentByIdAsync(attachmentId);
            if (attachment == null)
                throw new KeyNotFoundException("Attachment not found");

            var goal = await _baseRepo.GetGoalByIdAsync(attachment.GoalId);
            if (goal == null)
                throw new KeyNotFoundException("Goal not found");

            // Only attachment uploader or goal creator can delete
            if (
                attachment.AttachedBy != currentUserEmployeeMasterId
                && goal.CreatedBy != currentUserEmployeeMasterId
            )
                throw new UnauthorizedAccessException("You cannot delete this attachment.");

            // Delete file from storage
            if (!string.IsNullOrEmpty(attachment.Attachments))
            {
                string webRootPath = _environment.WebRootPath;
                if (string.IsNullOrEmpty(webRootPath))
                {
                    webRootPath = Path.Combine(_environment.ContentRootPath, "wwwroot");
                }

                var fullPath = Path.Combine(webRootPath, attachment.Attachments.TrimStart('/'));
                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                }
            }

            // Delete from database
            await _repo.DeleteAttachmentAsync(attachmentId);
            await _baseRepo.SaveChangesAsync();

            return true;
        }

        private string GetContentType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            return extension switch
            {
                ".pdf" => "application/pdf",
                ".doc" => "application/msword",
                ".docx" =>
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xls" => "application/vnd.ms-excel",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".txt" => "text/plain",
                ".zip" => "application/zip",
                _ => "application/octet-stream",
            };
        }

        public async Task<List<GoalAttachment>> ListAttachmentsAsync(int goalId) =>
            await _repo.GetAttachmentsByGoalAsync(goalId);

        public async Task<GoalAttachment> GetAttachmentAsync(int attachmentId)
        {
            var attachment = await _repo.GetAttachmentByIdAsync(attachmentId);
            if (attachment == null)
                throw new KeyNotFoundException("Attachment not found");
            return attachment;
        }
    }
}
