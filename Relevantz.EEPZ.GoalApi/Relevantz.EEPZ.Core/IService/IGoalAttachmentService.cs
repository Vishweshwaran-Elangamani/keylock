using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Core.IService
{
    public interface IGoalAttachmentService
    {
        Task<FileUploadResponseModel> UploadFile(
            int goalId,
            IFormFile file,
            string title,
            int currentUserEmployeeMasterId
        );
        Task<(byte[] fileBytes, string contentType, string fileName)> GetAttachmentFile(
            int attachmentId,
            int currentUserEmployeeMasterId
        );
        Task<FilePreviewResult?> GetAttachmentFilePreview(
            int attachmentId,
            int currentUserEmployeeMasterId
        );
        Task<bool> DeleteAttachment(int attachmentId, int currentUserEmployeeMasterId);
        Task<List<GoalAttachment>> ListAttachments(int goalId);
        Task<GoalAttachment> GetAttachment(int attachmentId);
    }
}
