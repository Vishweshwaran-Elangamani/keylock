using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Microsoft.EntityFrameworkCore;
namespace Relevantz.EEPZ.Data.Repository
{
    public class OtpRepository : IOtpRepository
    {
        private readonly EEPZDbContext _context;
        public OtpRepository(EEPZDbContext context)
        {
            _context = context;
        }
        public async Task<Otp?> GetByIdAsync(int otpId)
        {
            return await _context.Otps.FindAsync(otpId);
        }
        public async Task<Otp?> GetValidOtpAsync(string email, string otpCode, string otpType)
        {
            return await _context.Otps
                .FirstOrDefaultAsync(o =>
                    o.Email == email &&
                    o.OtpCode == otpCode &&
                    o.OtpType == otpType &&
                    o.IsUsed == false &&
                    o.ExpiresAt > DateTime.UtcNow);
        }
        public async Task<List<Otp>> GetByEmailAsync(string email)
        {
            return await _context.Otps
                .Where(o => o.Email == email)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
        }
        public async Task<Otp> CreateAsync(Otp otp)
        {
            _context.Otps.Add(otp);
            await _context.SaveChangesAsync();
            return otp;
        }
        public async Task<Otp> UpdateAsync(Otp otp)
        {
            _context.Otps.Update(otp);
            await _context.SaveChangesAsync();
            return otp;
        }
        public async Task MarkAsUsedAsync(int otpId)
        {
            var otp = await _context.Otps.FindAsync(otpId);
            if (otp != null)
            {
                otp.IsUsed = true;
                otp.UsedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }
        public async Task DeleteExpiredOtpsAsync()
        {
            var expiredOtps = await _context.Otps
                .Where(o => o.ExpiresAt < DateTime.UtcNow || o.IsUsed == true)
                .ToListAsync();
            _context.Otps.RemoveRange(expiredOtps);
            await _context.SaveChangesAsync();
        }
        public async Task<int> GetUnusedOtpCountAsync(string email, string otpType, DateTime fromTime)
        {
            return await _context.Otps
                .CountAsync(o =>
                    o.Email == email &&
                    o.OtpType == otpType &&
                    o.IsUsed == false &&
                    o.CreatedAt >= fromTime);
        }
    }
}
