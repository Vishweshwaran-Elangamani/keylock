using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Core.IService
{
    /// <summary>
    /// Service interface for MongoDB GridFS file storage operations
    /// </summary>
    public interface IFileStorageService
    {
        Task<string> SaveFile(IFormFile file, string subFolder);
        Task<byte[]> GetFile(string fileId);
        Task<bool> DeleteFile(string fileId);
        Task<(byte[] fileBytes, string contentType, string fileName)> GetFileForPreview(
            string fileId
        );
        Task<FileMetadata?> GetFileMetadata(string fileId);
    }
}
