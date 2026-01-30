using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Core.IService
{
    public interface IGoalAttachmentService
    {
        Task<FileUploadResponseModel> UploadFileAsync(
            int goalId,
            IFormFile file,
            string title,
            int currentUserEmployeeMasterId
        );
        Task<(byte[] fileBytes, string contentType, string fileName)> GetAttachmentFileAsync(
            int attachmentId,
            int currentUserEmployeeMasterId
        );
        Task<FilePreviewResult?> GetAttachmentFilePreviewAsync(
            int attachmentId,
            int currentUserEmployeeMasterId
        );
        Task<bool> DeleteAttachmentAsync(int attachmentId, int currentUserEmployeeMasterId);
        Task<List<GoalAttachment>> ListAttachmentsAsync(int goalId);
        Task<GoalAttachment> GetAttachmentAsync(int attachmentId);
    }
}
