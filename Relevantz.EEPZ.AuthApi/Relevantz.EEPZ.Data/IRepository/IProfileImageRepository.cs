using Relevantz.EEPZ.Common.Entities;
namespace Relevantz.EEPZ.Data.IRepository
{
    public interface IProfileImageRepository
    {
        Task<string> UploadImageAsync(int employeeId, byte[] imageData, string fileName, string contentType);
        Task<ProfileImageDocument?> GetImageAsync(int employeeId);
        Task<bool> DeleteImageAsync(int employeeId);
        Task<bool> UpdateImageAsync(int employeeId, byte[] imageData, string fileName, string contentType);
        Task<bool> ImageExistsAsync(int employeeId);
    }
}
