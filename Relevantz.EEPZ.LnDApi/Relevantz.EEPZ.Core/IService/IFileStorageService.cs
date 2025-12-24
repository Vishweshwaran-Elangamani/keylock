using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.DTOs;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface IFileStorageService
    {
        Task<string> SaveFileAsync(IFormFile file, string subFolder);
        Task<byte[]> GetFileAsync(string fileId);
        Task<bool> DeleteFileAsync(string fileId);
        Task<(byte[] fileBytes, string contentType, string fileName)> GetFileForPreviewAsync(string fileId);
        Task<FileMetadata?> GetFileMetadataAsync(string fileId);
    }
}
