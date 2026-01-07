using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Microsoft.EntityFrameworkCore;
namespace Relevantz.EEPZ.Data.Repository
{
    public class LoginAttemptRepository : ILoginAttemptRepository
    {
        private readonly EEPZDbContext _context;
        public LoginAttemptRepository(EEPZDbContext context)
        {
            _context = context;
        }
        public async Task<Loginattempt?> GetByIdAsync(int attemptId)
        {
            return await _context.Loginattempts.FindAsync(attemptId);
        }
        public async Task<List<Loginattempt>> GetByEmailAsync(string email, int limit = 10)
        {
            return await _context.Loginattempts
                .Where(la => la.Email == email)
                .OrderByDescending(la => la.AttemptTime)
                .Take(limit)
                .ToListAsync();
        }
        public async Task<List<Loginattempt>> GetByUserIdAsync(int userId, int limit = 10)
        {
            return await _context.Loginattempts
                .Where(la => la.UserId == userId)
                .OrderByDescending(la => la.AttemptTime)
                .Take(limit)
                .ToListAsync();
        }
        public async Task<Loginattempt> CreateAsync(Loginattempt loginAttempt)
        {
            _context.Loginattempts.Add(loginAttempt);
            await _context.SaveChangesAsync();
            return loginAttempt;
        }
        public async Task<int> GetFailedAttemptsCountAsync(string email, DateTime fromTime)
        {
            return await _context.Loginattempts
                .CountAsync(la =>
                    la.Email == email &&
                    !la.IsSuccessful &&
                    la.AttemptTime >= fromTime);
        }
        public async Task<List<Loginattempt>> GetRecentFailedAttemptsAsync(string email, int minutes = 30)
        {
            var fromTime = DateTime.UtcNow.AddMinutes(-minutes);
            return await _context.Loginattempts
                .Where(la =>
                    la.Email == email &&
                    !la.IsSuccessful &&
                    la.AttemptTime >= fromTime)
                .OrderByDescending(la => la.AttemptTime)
                .ToListAsync();
        }
    }
}
