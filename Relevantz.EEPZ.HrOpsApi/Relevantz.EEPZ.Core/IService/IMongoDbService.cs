using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Core.IService
{
    public interface IMongoDbService
    {
        Task<string> UploadFileAsync(byte[] fileData, string fileName, string contentType, long fileSize, int userId);
        Task<PolicyFileDocument> GetFileAsync(string fileId);
        Task<bool> DeleteFileAsync(string fileId);
    }
}
