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
using Serilog;

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

            Log.Debug("GoalAttachmentService initialized.");
        }

        public async Task<FilePreviewResult> GetAttachmentFilePreview(
            int attachmentId,
            int currentUserEmployeeMasterId
        )
        {
            Log.Information(
                "GetAttachmentFilePreview START | AttachmentId={AttachmentId} | UserId={UserId}",
                attachmentId,
                currentUserEmployeeMasterId
            );

            var attachment = await _repo.GetAttachmentById(attachmentId);

            if (attachment == null)
            {
                Log.Warning(
                    "GetAttachmentFilePreview FAILED | Attachment not found | AttachmentId={AttachmentId}",
                    attachmentId
                );
                throw new FileNotFoundCustomException(attachmentId);
            }

            var goal = await _baseRepo.GetGoalById(attachment.GoalId);
            if (goal == null)
            {
                Log.Warning(
                    "GetAttachmentFilePreview FAILED | Goal not found | GoalId={GoalId}",
                    attachment.GoalId
                );
                throw new GoalNotFoundException(attachment.GoalId);
            }

            var canView = await _baseService.CanViewGoal(
                attachment.GoalId,
                currentUserEmployeeMasterId
            );

            if (!canView)
            {
                Log.Warning(
                    "GetAttachmentFilePreview ACCESS DENIED | AttachmentId={AttachmentId} | GoalId={GoalId} | UserId={UserId}",
                    attachmentId,
                    attachment.GoalId,
                    currentUserEmployeeMasterId
                );
                throw new FileAccessDeniedException();
            }

            var (fileBytes, contentType, fileName) = await _fileStorage.GetFileForPreview(
                attachment.Attachments ?? string.Empty
            );

            Log.Information(
                "GetAttachmentFilePreview FETCHED | AttachmentId={AttachmentId} | FileName={FileName} | ContentType={ContentType} | Size={Size}",
                attachmentId,
                fileName,
                contentType,
                fileBytes?.Length
            );

            if (fileBytes == null || fileBytes.Length == 0)
            {
                Log.Warning(
                    "GetAttachmentFilePreview FAILED | Empty or corrupted file | AttachmentId={AttachmentId}",
                    attachmentId
                );
                throw new ArgumentException("File is empty or corrupted.");
            }
            if (string.IsNullOrWhiteSpace(contentType))
            {
                Log.Warning(
                    "GetAttachmentFilePreview FAILED | Invalid content type | AttachmentId={AttachmentId}",
                    attachmentId
                );
                throw new ArgumentException("Invalid content type.");
            }

            var displayFileName = GetDisplayFileName(attachment.AttachmentTitle, fileName);

            Log.Information(
                "GetAttachmentFilePreview END | AttachmentId={AttachmentId} | DisplayName={DisplayName}",
                attachmentId,
                displayFileName
            );

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
            Log.Information(
                "UploadFile START | GoalId={GoalId} | UserId={UserId} | Title={Title} | IncomingFileName={FileName} | ContentType={ContentType} | Size={Size}",
                goalId,
                currentUserEmployeeMasterId,
                title,
                file?.FileName,
                file?.ContentType,
                file?.Length
            );

            var goal = await _baseRepo.GetGoalById(goalId);
            if (goal == null)
            {
                Log.Warning("UploadFile FAILED | Goal not found | GoalId={GoalId}", goalId);
                throw new GoalNotFoundException(goalId);
            }

            var canView = await _baseService.CanViewGoal(goalId, currentUserEmployeeMasterId);
            if (!canView)
            {
                Log.Warning(
                    "UploadFile ACCESS DENIED | GoalId={GoalId} | UserId={UserId}",
                    goalId,
                    currentUserEmployeeMasterId
                );
                throw new FileAccessDeniedException();
            }

            Log.Debug("UploadFile | Validating file...");
            ValidateFile(file);

            var fileId = await _fileStorage.SaveFile(file, "goals/attachments");
            Log.Information(
                "UploadFile | Stored in FileStorage | FileId={FileId} | GoalId={GoalId}",
                fileId,
                goalId
            );

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

            Log.Information(
                "UploadFile END | GoalId={GoalId} | AttachmentTitle={AttachmentTitle} | FileId={FileId}",
                goalId,
                title,
                fileId
            );

            return response;
        }

        public async Task<(byte[] fileBytes, string contentType, string fileName)> GetAttachmentFile(
            int attachmentId, int currentUserEmployeeMasterId)
        {
            Log.Information(
                "GetAttachmentFile START | AttachmentId={AttachmentId} | UserId={UserId}",
                attachmentId,
                currentUserEmployeeMasterId
            );

            var attachment = await _repo.GetAttachmentById(attachmentId);
            if (attachment == null)
            {
                Log.Warning(
                    "GetAttachmentFile FAILED | Attachment not found | AttachmentId={AttachmentId}",
                    attachmentId
                );
                throw new FileNotFoundCustomException(attachmentId);
            }

            var canView = await _baseService.CanViewGoal(
                attachment.GoalId,
                currentUserEmployeeMasterId
            );

            if (!canView)
            {
                Log.Warning(
                    "GetAttachmentFile ACCESS DENIED | AttachmentId={AttachmentId} | GoalId={GoalId} | UserId={UserId}",
                    attachmentId,
                    attachment.GoalId,
                    currentUserEmployeeMasterId
                );
                throw new FileAccessDeniedException();
            }

            var (fileBytes, contentType, fileName) = await _fileStorage.GetFileForPreview(
                attachment.Attachments ?? ""
            );

            var downloadFileName = GetDisplayFileName(attachment.AttachmentTitle, fileName);

            Log.Information(
                "GetAttachmentFile END | AttachmentId={AttachmentId} | FileName={FileName} | ContentType={ContentType} | Size={Size}",
                attachmentId,
                downloadFileName,
                contentType,
                fileBytes?.Length
            );

            return (fileBytes, contentType, downloadFileName);
        }

        public async Task<bool> DeleteAttachment(
            int attachmentId,
            int currentUserEmployeeMasterId
        )
        {
            Log.Information(
                "DeleteAttachment START | AttachmentId={AttachmentId} | UserId={UserId}",
                attachmentId,
                currentUserEmployeeMasterId
            );

            var attachment = await _repo.GetAttachmentById(attachmentId);
            if (attachment == null)
            {
                Log.Warning(
                    "DeleteAttachment FAILED | Attachment not found | AttachmentId={AttachmentId}",
                    attachmentId
                );
                throw new FileNotFoundCustomException(attachmentId);
            }

            var goal = await _baseRepo.GetGoalById(attachment.GoalId);
            if (goal == null)
            {
                Log.Warning(
                    "DeleteAttachment FAILED | Goal not found | GoalId={GoalId}",
                    attachment.GoalId
                );
                throw new GoalNotFoundException(attachment.GoalId);
            }

            if (
                attachment.AttachedBy != currentUserEmployeeMasterId
                && goal.CreatedBy != currentUserEmployeeMasterId
            )
            {
                Log.Warning(
                    "DeleteAttachment ACCESS DENIED | AttachmentId={AttachmentId} | GoalId={GoalId} | UserId={UserId}",
                    attachmentId,
                    attachment.GoalId,
                    currentUserEmployeeMasterId
                );
                throw new FileAccessDeniedException();
            }

            if (!string.IsNullOrEmpty(attachment.Attachments))
            {
                Log.Information(
                    "DeleteAttachment | Deleting from FileStorage | FileId={FileId}",
                    attachment.Attachments
                );
                await _fileStorage.DeleteFile(attachment.Attachments);
            }

            await _repo.DeleteAttachment(attachmentId);
            await _baseRepo.SaveChanges();

            Log.Information(
                "DeleteAttachment END | AttachmentId={AttachmentId} | Deleted=true",
                attachmentId
            );

            return true;
        }

        public async Task<List<GoalAttachment>> ListAttachments(int goalId)
        {
            Log.Information("ListAttachments START | GoalId={GoalId}", goalId);

            var attachments = await _repo.GetAttachmentsByGoal(goalId);

            Log.Information(
                "ListAttachments END | GoalId={GoalId} | Count={Count}",
                goalId,
                attachments?.Count ?? 0
            );

            return attachments;
        }

        public async Task<GoalAttachment> GetAttachment(int attachmentId)
        {
            Log.Information("GetAttachment START | AttachmentId={AttachmentId}", attachmentId);

            var attachment = await _repo.GetAttachmentById(attachmentId);
            if (attachment == null)
            {
                Log.Warning(
                    "GetAttachment FAILED | Attachment not found | AttachmentId={AttachmentId}",
                    attachmentId
                );
                throw new FileNotFoundCustomException(attachmentId);
            }

            Log.Information("GetAttachment END | AttachmentId={AttachmentId}", attachmentId);
            return attachment;
        }

        private void ValidateFile(IFormFile file)
        {
            Log.Debug(
                "ValidateFile START | FileName={FileName} | ContentType={ContentType} | Size={Size}",
                file?.FileName,
                file?.ContentType,
                file?.Length
            );

            if (file == null || file.Length == 0)
            {
                Log.Warning("ValidateFile FAILED | Empty or null file");
                throw new BadRequestException(
                    ResponseMessages.Codes.BadRequest,
                    "File is empty or null"
                );
            }

            const long maxFileSize = 10 * 1024 * 1024;
            if (file.Length > maxFileSize)
            {
                Log.Warning(
                    "ValidateFile FAILED | File too large | Size={Size} | Max={Max}",
                    file.Length,
                    maxFileSize
                );
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
                Log.Warning(
                    "ValidateFile FAILED | Disallowed extension | Extension={Extension} | FileName={FileName}",
                    fileExtension,
                    file.FileName
                );
                throw new BadRequestException(
                    ResponseMessages.Codes.FILE_TYPE_INVALID,
                    $"File type '{fileExtension}' is not allowed"
                );
            }

            Log.Debug("ValidateFile END | Validation passed");
        }

        private string GetDisplayFileName(string? attachmentTitle, string originalFileName)
        {
            Log.Debug(
                "GetDisplayFileName START | Title={Title} | Original={Original}",
                attachmentTitle,
                originalFileName
            );

            var displayFileName = !string.IsNullOrEmpty(attachmentTitle)
                ? attachmentTitle
                : originalFileName;

            if (!Path.HasExtension(displayFileName))
            {
                var extension = Path.GetExtension(originalFileName);
                displayFileName += extension;
            }

            displayFileName = Path.GetFileName(displayFileName);

            Log.Debug(
                "GetDisplayFileName END | Result={Result}",
                displayFileName
            );

            return displayFileName;
        }
    }
}