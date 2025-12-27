using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Core.IService
{
    /// <summary>
    /// Service interface for managing goal attachments with MongoDB GridFS storage
    /// </summary>
    /// <summary>
    /// Service interface for managing goal attachments with MongoDB GridFS storage
    /// </summary>
    public interface IGoalAttachmentService
    {
        /// <summary>
        /// Upload a file attachment to a goal
        /// </summary>
        /// <param name="goalId">The goal ID to attach the file to</param>
        /// <param name="file">The file to upload</param>
        /// <param name="title">Title/description for the attachment</param>
        /// <param name="currentUserEmployeeMasterId">Current user's employee master ID</param>
        /// <returns>File upload response with MongoDB ObjectId</returns>
        Task<FileUploadResponseDto> UploadFileAsync(
            int goalId,
            IFormFile file,
            string title,
            int currentUserEmployeeMasterId
        );

        /// <summary>
        /// Download a file attachment from MongoDB GridFS
        /// </summary>
        /// <param name="attachmentId">The attachment ID</param>
        /// <param name="currentUserEmployeeMasterId">Current user's employee master ID</param>
        /// <returns>File bytes, content type, and filename</returns>
        Task<(byte[] fileBytes, string contentType, string fileName)> DownloadFileAsync(
            int attachmentId,
            int currentUserEmployeeMasterId
        );

        /// <summary>
        /// Preview a file attachment (for inline display)
        /// </summary>
        /// <param name="attachmentId">The attachment ID</param>
        /// <param name="currentUserEmployeeMasterId">Current user's employee master ID</param>
        /// <returns>File bytes, content type, and filename, or null if not accessible</returns>
        Task<(byte[] fileBytes, string contentType, string fileName)?> PreviewFileAsync(
            int attachmentId,
            int currentUserEmployeeMasterId
        );

        /// <summary>
        /// Delete an attachment from both MongoDB GridFS and database
        /// </summary>
        /// <param name="attachmentId">The attachment ID to delete</param>
        /// <param name="currentUserEmployeeMasterId">Current user's employee master ID</param>
        /// <returns>True if deletion successful</returns>
        Task<bool> DeleteAttachmentAsync(
            int attachmentId,
            int currentUserEmployeeMasterId
        );

        /// <summary>
        /// List all attachments for a specific goal
        /// </summary>
        /// <param name="goalId">The goal ID</param>
        /// <returns>List of goal attachments</returns>
        Task<List<GoalAttachment>> ListAttachmentsAsync(int goalId);

        /// <summary>
        /// Get a single attachment by ID
        /// </summary>
        /// <param name="attachmentId">The attachment ID</param>
        /// <returns>Goal attachment entity</returns>
        Task<GoalAttachment> GetAttachmentAsync(int attachmentId);
    }
}
