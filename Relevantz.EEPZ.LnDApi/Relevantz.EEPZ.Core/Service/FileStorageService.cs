using Relevantz.EEPZ.Core.Services.Interface;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;


namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class FileStorageService : IFileStorageService
    {
        private readonly IWebHostEnvironment _environment;
        private readonly string _baseFolder = "uploads";

        public FileStorageService(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        public async Task<string> SaveFileAsync(IFormFile file, string subFolder)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty");

            var uploadsFolder = Path.Combine(_environment.WebRootPath, _baseFolder, subFolder);

            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            return Path.Combine(_baseFolder, subFolder, uniqueFileName).Replace("\\", "/");
        }

        public async Task<bool> DeleteFileAsync(string filePath)
        {
            try
            {
                var fullPath = Path.Combine(_environment.WebRootPath, filePath);
                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                    return true;
                }
                return false;
            }
            catch
            {
                return false;
            }
        }

        public async Task<byte[]> GetFileAsync(string filePath)
        {
            var fullPath = Path.Combine(_environment.WebRootPath, filePath);
            if (!File.Exists(fullPath))
                throw new FileNotFoundException("File not found");

            return await File.ReadAllBytesAsync(fullPath);
        }

        public string GetFileUrl(string filePath)
        {
            return $"/{filePath}";
        }
    }
}