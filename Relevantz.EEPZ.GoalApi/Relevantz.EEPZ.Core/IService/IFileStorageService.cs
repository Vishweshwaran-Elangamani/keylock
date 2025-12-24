using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.DTOs;

namespace Relevantz.EEPZ.Core.IService
{
    /// <summary>
    /// Service interface for MongoDB GridFS file storage operations
    /// </summary>
    public interface IFileStorageService
    {
        /// <summary>
        /// Save a file to MongoDB GridFS
        /// </summary>
        /// <param name="file">The file to save</param>
        /// <param name="subFolder">Logical subfolder for organization (e.g., "goals/attachments")</param>
        /// <returns>MongoDB ObjectId as string</returns>
        Task<string> SaveFileAsync(IFormFile file, string subFolder);

        /// <summary>
        /// Get file bytes from MongoDB GridFS
        /// </summary>
        /// <param name="fileId">MongoDB ObjectId</param>
        /// <returns>File content as byte array</returns>
        Task<byte[]> GetFileAsync(string fileId);

        /// <summary>
        /// Delete a file from MongoDB GridFS
        /// </summary>
        /// <param name="fileId">MongoDB ObjectId</param>
        /// <returns>True if deletion successful</returns>
        Task<bool> DeleteFileAsync(string fileId);

        /// <summary>
        /// Get file with metadata for preview/download
        /// </summary>
        /// <param name="fileId">MongoDB ObjectId</param>
        /// <returns>File bytes, content type, and filename</returns>
        Task<(byte[] fileBytes, string contentType, string fileName)> GetFileForPreviewAsync(string fileId);

        /// <summary>
        /// Get file metadata without downloading content
        /// </summary>
        /// <param name="fileId">MongoDB ObjectId</param>
        /// <returns>File metadata or null if not found</returns>
        Task<FileMetadata?> GetFileMetadataAsync(string fileId);
    }
}
