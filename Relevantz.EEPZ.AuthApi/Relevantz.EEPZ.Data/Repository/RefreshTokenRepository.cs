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
    public class RefreshTokenRepository : IRefreshTokenRepository
    {
        private readonly EEPZDbContext _context;
        public RefreshTokenRepository(EEPZDbContext context)
        {
            _context = context;
        }
        public async Task<Refreshtoken?> GetByIdAsync(int tokenId)
        {
            return await _context.Refreshtokens.FindAsync(tokenId);
        }
        public async Task<Refreshtoken?> GetByTokenAsync(string token)
        {
            return await _context.Refreshtokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == token);
        }
        public async Task<List<Refreshtoken>> GetByUserIdAsync(int userId)
        {
            return await _context.Refreshtokens
                .Where(rt => rt.UserId == userId)
                .OrderByDescending(rt => rt.CreatedAt)
                .ToListAsync();
        }
        public async Task<Refreshtoken> CreateAsync(Refreshtoken refreshToken)
        {
            _context.Refreshtokens.Add(refreshToken);
            await _context.SaveChangesAsync();
            return refreshToken;
        }
        public async Task<Refreshtoken> UpdateAsync(Refreshtoken refreshToken)
        {
            _context.Refreshtokens.Update(refreshToken);
            await _context.SaveChangesAsync();
            return refreshToken;
        }
        public async Task RevokeTokenAsync(string token)
        {
            var refreshToken = await _context.Refreshtokens
                .FirstOrDefaultAsync(rt => rt.Token == token);
            if (refreshToken != null)
            {
                refreshToken.IsRevoked = true;
                await _context.SaveChangesAsync();
            }
        }
        public async Task RevokeAllUserTokensAsync(int userId)
        {
            var tokens = await _context.Refreshtokens
                .Where(rt => rt.UserId == userId && !rt.IsRevoked)
                .ToListAsync();
            foreach (var token in tokens)
            {
                token.IsRevoked = true;
            }
            await _context.SaveChangesAsync();
        }
        public async Task DeleteExpiredTokensAsync()
        {
            var expiredTokens = await _context.Refreshtokens
                .Where(rt => rt.ExpiresAt < DateTime.UtcNow || rt.IsRevoked)
                .ToListAsync();
            _context.Refreshtokens.RemoveRange(expiredTokens);
            await _context.SaveChangesAsync();
        }
    }
}
