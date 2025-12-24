using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface IGoalAttachmentService
    {
        Task<(byte[] fileBytes, string contentType, string fileName)?> PreviewFileAsync(
            int attachmentId,
            int currentUserEmployeeMasterId
        ); 
        Task<List<GoalAttachment>> ListAttachmentsAsync(int goalId);
        Task<GoalAttachment> GetAttachmentAsync(int attachmentId);
        Task<FileUploadResponseDto> UploadFileAsync(
            int goalId,
            IFormFile file,
            string title,
            int currentUserEmployeeMasterId
        );
        Task<(byte[] fileBytes, string contentType, string fileName)> DownloadFileAsync(
            int attachmentId,
            int currentUserEmployeeMasterId
        );
        Task<bool> DeleteAttachmentAsync(int attachmentId, int currentUserEmployeeMasterId);
    }
}
