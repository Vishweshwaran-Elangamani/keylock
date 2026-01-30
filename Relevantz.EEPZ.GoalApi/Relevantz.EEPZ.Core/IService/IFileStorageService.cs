using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Core.IService
{
    /// <summary>
    /// Service interface for MongoDB GridFS file storage operations
    /// </summary>
    public interface IFileStorageService
    {
        Task<string> SaveFileAsync(IFormFile file, string subFolder);
        Task<byte[]> GetFileAsync(string fileId);
        Task<bool> DeleteFileAsync(string fileId);
        Task<(byte[] fileBytes, string contentType, string fileName)> GetFileForPreviewAsync(
            string fileId
        );
        Task<FileMetadata?> GetFileMetadataAsync(string fileId);
    }
}
