using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Exceptions;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Core.Services.Interface;
using Relevantz.EEPZ.Data.Repository.Interface;

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
            var attachment = await _repo.GetAttachmentByIdAsync(attachmentId);

            if (attachment == null)
            {
                throw new FileNotFoundCustomException(attachmentId);
            }

            var goal = await _baseRepo.GetGoalByIdAsync(attachment.GoalId);
            if (goal == null)
            {
                throw new GoalNotFoundException(attachment.GoalId);
            }

            var canView = await _baseService.CanViewGoalAsync(
                attachment.GoalId,
                currentUserEmployeeMasterId
            );

            if (!canView)
            {
                throw new FileAccessDeniedException();
            }

            var (fileBytes, contentType, fileName) = await _fileStorage.GetFileForPreviewAsync(
                attachment.Attachments ?? ""
            );

            var displayFileName = !string.IsNullOrEmpty(attachment.AttachmentTitle)
                ? attachment.AttachmentTitle
                : fileName;

            if (!Path.HasExtension(displayFileName))
            {
                var extension = Path.GetExtension(fileName);
                displayFileName += extension;
            }

            return (fileBytes, contentType, displayFileName);
        }

        public async Task<FileUploadResponseModel> UploadFileAsync(
            int goalId,
            IFormFile file,
            string title,
            int currentUserEmployeeMasterId
        )
        {
            var goal = await _baseRepo.GetGoalByIdAsync(goalId);
            if (goal == null)
            {
                throw new GoalNotFoundException(goalId);
            }

            var canView = await _baseService.CanViewGoalAsync(goalId, currentUserEmployeeMasterId);
            if (!canView)
            {
                throw new FileAccessDeniedException();
            }

            if (file == null || file.Length == 0)
            {
                throw new BadRequestException(
                    ResponseMessages.Codes.BadRequest,
                    "File is empty or null"
                );
            }

            const long maxFileSize = 10 * 1024 * 1024;
            if (file.Length > maxFileSize)
            {
                throw new BadRequestException(
                    ResponseMessages.Codes.FILE_SIZE_EXCEEDED,
                    "File size exceeds maximum limit of 10MB"
                );
            }

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
                throw new BadRequestException(
                    ResponseMessages.Codes.FILE_TYPE_INVALID,
                    $"File type '{fileExtension}' is not allowed"
                );
            }

            var fileId = await _fileStorage.SaveFileAsync(file, "goals/attachments");

            var attachment = new GoalAttachment
            {
                GoalId = goalId,
                AttachmentTitle = title,
                Attachments = fileId,
                AttachedBy = currentUserEmployeeMasterId,
                AttachedOn = DateTime.UtcNow,
            };

            await _repo.AddAttachmentAsync(attachment);
            await _baseRepo.SaveChangesAsync();

            return new FileUploadResponseModel
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
            {
                throw new FileNotFoundCustomException(attachmentId);
            }

            var canView = await _baseService.CanViewGoalAsync(
                attachment.GoalId,
                currentUserEmployeeMasterId
            );

            if (!canView)
            {
                throw new FileAccessDeniedException();
            }

            var (fileBytes, contentType, fileName) = await _fileStorage.GetFileForPreviewAsync(
                attachment.Attachments ?? ""
            );

            var downloadFileName = !string.IsNullOrEmpty(attachment.AttachmentTitle)
                ? attachment.AttachmentTitle
                : fileName;

            if (!Path.HasExtension(downloadFileName))
            {
                var extension = Path.GetExtension(fileName);
                downloadFileName += extension;
            }

            return (fileBytes, contentType, downloadFileName);
        }

        public async Task<bool> DeleteAttachmentAsync(
            int attachmentId,
            int currentUserEmployeeMasterId
        )
        {
            var attachment = await _repo.GetAttachmentByIdAsync(attachmentId);
            if (attachment == null)
            {
                throw new FileNotFoundCustomException(attachmentId);
            }

            var goal = await _baseRepo.GetGoalByIdAsync(attachment.GoalId);
            if (goal == null)
            {
                throw new GoalNotFoundException(attachment.GoalId);
            }

            if (
                attachment.AttachedBy != currentUserEmployeeMasterId
                && goal.CreatedBy != currentUserEmployeeMasterId
            )
            {
                throw new FileAccessDeniedException();
            }

            if (!string.IsNullOrEmpty(attachment.Attachments))
            {
                await _fileStorage.DeleteFileAsync(attachment.Attachments);
            }

            await _repo.DeleteAttachmentAsync(attachmentId);
            await _baseRepo.SaveChangesAsync();

            return true;
        }

        public async Task<List<GoalAttachment>> ListAttachmentsAsync(int goalId)
        {
            var attachments = await _repo.GetAttachmentsByGoalAsync(goalId);
            return attachments;
        }

        public async Task<GoalAttachment> GetAttachmentAsync(int attachmentId)
        {
            var attachment = await _repo.GetAttachmentByIdAsync(attachmentId);
            if (attachment == null)
            {
                throw new FileNotFoundCustomException(attachmentId);
            }

            return attachment;
        }
    }
}
