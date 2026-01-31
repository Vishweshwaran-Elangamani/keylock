using Mapster;
using MapsterMapper;
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
        private readonly IMapper _mapper;

        public GoalAttachmentService(
            IGoalAttachmentRepository repo,
            IBaseGoalRepository baseRepo,
            IBaseGoalService baseService,
            IFileStorageService fileStorage,
            IMapper mapper
        )
        {
            _repo = repo;
            _baseRepo = baseRepo;
            _baseService = baseService;
            _fileStorage = fileStorage;
            _mapper = mapper;
        }

        public async Task<FilePreviewResult> GetAttachmentFilePreview(
            int attachmentId,
            int currentUserEmployeeMasterId
        )
        {
            var attachment = await _repo.GetAttachmentById(attachmentId);

            if (attachment == null)
            {
                throw new FileNotFoundCustomException(attachmentId);
            }

            var goal = await _baseRepo.GetGoalById(attachment.GoalId);
            if (goal == null)
            {
                throw new GoalNotFoundException(attachment.GoalId);
            }

            var canView = await _baseService.CanViewGoal(
                attachment.GoalId,
                currentUserEmployeeMasterId
            );

            if (!canView)
            {
                throw new FileAccessDeniedException();
            }

            var (fileBytes, contentType, fileName) = await _fileStorage.GetFileForPreview(
                attachment.Attachments ?? string.Empty
            );

            if (fileBytes == null || fileBytes.Length == 0)
            {
                throw new ArgumentException("File is empty or corrupted.");
            }
            if (string.IsNullOrWhiteSpace(contentType))
            {
                throw new ArgumentException("Invalid content type.");
            }

            var displayFileName = GetDisplayFileName(attachment.AttachmentTitle, fileName);

            return new FilePreviewResult
            {
                FileBytes = fileBytes,
                ContentType = contentType,
                FileName = displayFileName,
            };
        }

        public async Task<FileUploadResponseModel> UploadFile(
            int goalId,
            IFormFile file,
            string title,
            int currentUserEmployeeMasterId
        )
        {
            var goal = await _baseRepo.GetGoalById(goalId);
            if (goal == null)
            {
                throw new GoalNotFoundException(goalId);
            }

            var canView = await _baseService.CanViewGoal(goalId, currentUserEmployeeMasterId);
            if (!canView)
            {
                throw new FileAccessDeniedException();
            }

            ValidateFile(file);

            var fileId = await _fileStorage.SaveFile(file, "goals/attachments");

            var attachment = new GoalAttachment
            {
                GoalId = goalId,
                AttachmentTitle = title,
                Attachments = fileId,
                AttachedBy = currentUserEmployeeMasterId,
                AttachedOn = DateTime.UtcNow,
            };

            await _repo.AddAttachment(attachment);
            await _baseRepo.SaveChanges();

            var response = _mapper.Map<FileUploadResponseModel>(attachment);
            response.FileName = file.FileName;
            response.FileSize = file.Length;
            response.ContentType = file.ContentType;

            return response;
        }

        public async Task<(
            byte[] fileBytes,
            string contentType,
            string fileName
        )> GetAttachmentFile(int attachmentId, int currentUserEmployeeMasterId)
        {
            var attachment = await _repo.GetAttachmentById(attachmentId);
            if (attachment == null)
            {
                throw new FileNotFoundCustomException(attachmentId);
            }

            var canView = await _baseService.CanViewGoal(
                attachment.GoalId,
                currentUserEmployeeMasterId
            );

            if (!canView)
            {
                throw new FileAccessDeniedException();
            }

            var (fileBytes, contentType, fileName) = await _fileStorage.GetFileForPreview(
                attachment.Attachments ?? ""
            );

            var downloadFileName = GetDisplayFileName(attachment.AttachmentTitle, fileName);

            return (fileBytes, contentType, downloadFileName);
        }

        public async Task<bool> DeleteAttachment(
            int attachmentId,
            int currentUserEmployeeMasterId
        )
        {
            var attachment = await _repo.GetAttachmentById(attachmentId);
            if (attachment == null)
            {
                throw new FileNotFoundCustomException(attachmentId);
            }

            var goal = await _baseRepo.GetGoalById(attachment.GoalId);
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
                await _fileStorage.DeleteFile(attachment.Attachments);
            }

            await _repo.DeleteAttachment(attachmentId);
            await _baseRepo.SaveChanges();

            return true;
        }

        public async Task<List<GoalAttachment>> ListAttachments(int goalId)
        {
            var attachments = await _repo.GetAttachmentsByGoal(goalId);
            return attachments;
        }

        public async Task<GoalAttachment> GetAttachment(int attachmentId)
        {
            var attachment = await _repo.GetAttachmentById(attachmentId);
            if (attachment == null)
            {
                throw new FileNotFoundCustomException(attachmentId);
            }

            return attachment;
        }

        private void ValidateFile(IFormFile file)
        {
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
        }

        private string GetDisplayFileName(string? attachmentTitle, string originalFileName)
        {
            var displayFileName = !string.IsNullOrEmpty(attachmentTitle)
                ? attachmentTitle
                : originalFileName;

            if (!Path.HasExtension(displayFileName))
            {
                var extension = Path.GetExtension(originalFileName);
                displayFileName += extension;
            }

            displayFileName = Path.GetFileName(displayFileName);

            return displayFileName;
        }
    }
}
