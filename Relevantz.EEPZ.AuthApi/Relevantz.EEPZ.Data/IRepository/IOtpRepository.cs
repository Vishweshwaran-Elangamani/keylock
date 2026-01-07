using Relevantz.EEPZ.Common.Entities;
namespace Relevantz.EEPZ.Data.IRepository
{
    public interface IOtpRepository
    {
        Task<Otp?> GetByIdAsync(int otpId);
        Task<Otp?> GetValidOtpAsync(string email, string otpCode, string otpType);
        Task<List<Otp>> GetByEmailAsync(string email);
        Task<Otp> CreateAsync(Otp otp);
        Task<Otp> UpdateAsync(Otp otp);
        Task MarkAsUsedAsync(int otpId);
        Task DeleteExpiredOtpsAsync();
        Task<int> GetUnusedOtpCountAsync(string email, string otpType, DateTime fromTime);
    }
}
