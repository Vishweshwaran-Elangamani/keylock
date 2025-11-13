using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;

namespace Relevantz.EEPZ.Data.Repository
{
    public class PromotionHistoryRepository : IPromotionHistoryRepository
    {
        private readonly EEPZDbContext _context;

        public PromotionHistoryRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<Promotionhistory> GetByIdAsync(int id)
        {
            return await _context.Promotionhistories
                .Include(x => x.EmployeeUser)
                .Include(x => x.Promotion)
                .FirstOrDefaultAsync(x => x.HistoryId == id);
        }

        public async Task<List<Promotionhistory>> GetByEmployeeAsync(int employeeId)
        {
            return await _context.Promotionhistories
                .Where(x => x.EmployeeUserId == employeeId)
                .OrderByDescending(x => x.PromotionDate)
                .ToListAsync();
        }

        public async Task<List<Promotionhistory>> GetByPromotionAsync(int promotionId)
        {
            return await _context.Promotionhistories
                .Where(x => x.PromotionId == promotionId)
                .Include(x => x.EmployeeUser)
                .ToListAsync();
        }

        public async Task<Promotionhistory> CreateAsync(Promotionhistory history)
        {
            history.RecordedAt = DateTime.UtcNow;
            _context.Promotionhistories.Add(history);
            await _context.SaveChangesAsync();
            return history;
        }
    }
}
