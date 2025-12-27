using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.DTOs;

namespace Relevantz.EEPZ.Core.IService
{
    /// <summary>
    /// Service interface for MongoDB GridFS file storage operations
    /// Handles all file upload, download, and deletion operations using GridFS
    /// </summary>
    public interface IFileStorageService
    {
        /// <summary>
        /// Save a file to MongoDB GridFS
        /// </summary>
        /// <param name="file">The file to save (IFormFile)</param>
        /// <param name="subFolder">Logical subfolder for organization (e.g., "goals/attachments", "assessments/123")</param>
        /// <returns>MongoDB ObjectId as string (24 characters)</returns>
        /// <exception cref="ArgumentException">Thrown when file is null or empty</exception>
        Task<string> SaveFileAsync(IFormFile file, string subFolder);

        /// <summary>
        /// Get file bytes from MongoDB GridFS
        /// </summary>
        /// <param name="fileId">MongoDB ObjectId (24-character hex string)</param>
        /// <returns>File content as byte array</returns>
        /// <exception cref="ArgumentException">Thrown when fileId is invalid</exception>
        /// <exception cref="FileNotFoundException">Thrown when file doesn't exist in GridFS</exception>
        Task<byte[]> GetFileAsync(string fileId);

        /// <summary>
        /// Delete a file from MongoDB GridFS
        /// </summary>
        /// <param name="fileId">MongoDB ObjectId (24-character hex string)</param>
        /// <returns>True if deletion successful, false if file not found</returns>
        Task<bool> DeleteFileAsync(string fileId);

        /// <summary>
        /// Get file with metadata for preview/download
        /// Returns file bytes, content type, and filename
        /// </summary>
        /// <param name="fileId">MongoDB ObjectId (24-character hex string)</param>
        /// <returns>Tuple containing file bytes, content type (MIME), and filename</returns>
        /// <exception cref="ArgumentException">Thrown when fileId is invalid</exception>
        /// <exception cref="FileNotFoundException">Thrown when file doesn't exist in GridFS</exception>
        Task<(byte[] fileBytes, string contentType, string fileName)> GetFileForPreviewAsync(string fileId);

        /// <summary>
        /// Get file metadata without downloading file content
        /// Useful for checking file existence, size, and other properties
        /// </summary>
        /// <param name="fileId">MongoDB ObjectId (24-character hex string)</param>
        /// <returns>File metadata or null if not found</returns>
        Task<FileMetadata?> GetFileMetadataAsync(string fileId);

        /// <summary>
        /// Check if a file exists in MongoDB GridFS
        /// </summary>
        /// <param name="fileId">MongoDB ObjectId (24-character hex string)</param>
        /// <returns>True if file exists, false otherwise</returns>
        Task<bool> FileExistsAsync(string fileId);

        /// <summary>
        /// Get multiple files by their IDs (batch operation)
        /// </summary>
        /// <param name="fileIds">List of MongoDB ObjectIds</param>
        /// <returns>Dictionary mapping fileId to file metadata</returns>
        Task<Dictionary<string, FileMetadata>> GetMultipleFileMetadataAsync(List<string> fileIds);
    }
}
