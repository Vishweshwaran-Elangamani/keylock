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
                .Include(p => p.EmployeeUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(p => p.Department)
                .Include(p => p.ApprovedByUser)
                .FirstOrDefaultAsync(p => p.PromotionId == promotionId);
        }

        public async Task<Promotion?> GetPendingPromotionAsync(int employeeUserId)
        {
            return await _context.Promotions
                .Include(p => p.EmployeeUser)
                .FirstOrDefaultAsync(p => p.EmployeeUserId == employeeUserId && p.Status == "Pending");
        }

        public async Task<List<Promotion>> GetAllAsync()
        {
            return await _context.Promotions
                .Include(p => p.EmployeeUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(p => p.Department)
                .Include(p => p.ApprovedByUser)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Promotion>> GetByEmployeeUserIdAsync(int employeeUserId)
        {
            return await _context.Promotions
                .Include(p => p.EmployeeUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(p => p.Department)
                .Include(p => p.ApprovedByUser)
                .Where(p => p.EmployeeUserId == employeeUserId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Promotion>> GetByStatusAsync(string status)
        {
            return await _context.Promotions
                .Include(p => p.EmployeeUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(p => p.Department)
                .Include(p => p.ApprovedByUser)
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

        public async Task<bool> HasPendingPromotionAsync(int employeeUserId)
        {
            return await _context.Promotions
                .AnyAsync(p => p.EmployeeUserId == employeeUserId && p.Status == "Pending");
        }

        public async Task LoadPromotionRelations(Promotion promotion)
        {
            await _context.Entry(promotion).Reference(p => p.EmployeeUser).LoadAsync();
            await _context.Entry(promotion).Reference(p => p.Department).LoadAsync();
            await _context.Entry(promotion).Reference(p => p.ApprovedByUser).LoadAsync();
        }
    }
}
