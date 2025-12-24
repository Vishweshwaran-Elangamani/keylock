using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;
using Microsoft.EntityFrameworkCore;

namespace Relevantz.EEPZ.Data.Repository
{
    public class CareerProgressionRepository : ICareerProgressionRepository
    {
        private readonly EEPZDbContext _context;

        public CareerProgressionRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<Promotion?> GetByIdAsync(int promotionId)
        {
            return await _context.Promotions
                .FirstOrDefaultAsync(p => p.PromotionId == promotionId);
        }

        public async Task<List<Promotion>> GetAllAsync()
        {
            return await _context.Promotions
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Promotion>> GetByEmployeeUserIdAsync(int EmployeeUserId)
        {
            return await _context.Promotions
                .Where(p => p.EmployeeUserId == EmployeeUserId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Promotion>> GetByStatusAsync(string status)
        {
            return await _context.Promotions
                .Where(p => p.Status == status)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<Promotion> CreateAsync(Promotion promotion)
        {
            _context.Promotions.Add(promotion);
            await _context.SaveChangesAsync();
            return promotion;
        }

        public async Task<Promotion> UpdateAsync(Promotion promotion)
        {
            _context.Promotions.Update(promotion);
            await _context.SaveChangesAsync();
            return promotion;
        }

        public async Task<bool> HasPendingPromotionAsync(int EmployeeUserId)
        {
            return await _context.Promotions
                .AnyAsync(p => p.EmployeeUserId == EmployeeUserId && p.Status == "Pending");
        }
    }

}

