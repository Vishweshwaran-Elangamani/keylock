using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;
namespace Relevantz.EEPZ.Data.Repository
{
    public class BudgetPeriodAllocationRepository : IBudgetPeriodAllocationRepository
    {
        private readonly EEPZDbContext _context;
        public BudgetPeriodAllocationRepository(EEPZDbContext context)
        {
            _context = context;
        }
        public async Task<Budgetperiodallocation> CreateAsync(Budgetperiodallocation periodAllocation)
        {
            _context.Budgetperiodallocations.Add(periodAllocation);
            await _context.SaveChangesAsync();
            return periodAllocation;
        }
        public async Task<Budgetperiodallocation> UpdateAsync(Budgetperiodallocation periodAllocation)
        {
            _context.Budgetperiodallocations.Update(periodAllocation);
            await _context.SaveChangesAsync();
            return periodAllocation;
        }
        public async Task<bool> DeleteAsync(int periodAllocationId)
        {
            var periodAllocation = await GetByIdAsync(periodAllocationId);
            if (periodAllocation == null)
                return false;
            _context.Budgetperiodallocations.Remove(periodAllocation);
            await _context.SaveChangesAsync();
            return true;
        }
        public async Task<Budgetperiodallocation?> GetByIdAsync(int periodAllocationId)
        {
            return await _context.Budgetperiodallocations
                .Include(p => p.Budget)
                    .ThenInclude(b => b.Department)
                .Include(p => p.AllocatedByUser)
                .FirstOrDefaultAsync(p => p.PeriodAllocationId == periodAllocationId);
        }
        public async Task<List<Budgetperiodallocation>> GetAllAsync()
        {
            return await _context.Budgetperiodallocations
                .Include(p => p.Budget)
                    .ThenInclude(b => b.Department)
                .Include(p => p.AllocatedByUser)
                .OrderByDescending(p => p.AllocatedAt)
                .ToListAsync();
        }
        public async Task<List<Budgetperiodallocation>> GetByBudgetIdAsync(int budgetId)
        {
            return await _context.Budgetperiodallocations
                .Include(p => p.Budget)
                    .ThenInclude(b => b.Department)
                .Include(p => p.AllocatedByUser)
                .Where(p => p.BudgetId == budgetId)
                .OrderBy(p => p.PeriodYear)
                .ThenBy(p => p.Period)
                .ToListAsync();
        }
        public async Task<Budgetperiodallocation?> GetByBudgetPeriodYearAsync(int budgetId, string period, int periodYear)
        {
            return await _context.Budgetperiodallocations
                .Include(p => p.Budget)
                    .ThenInclude(b => b.Department)
                .FirstOrDefaultAsync(p => p.BudgetId == budgetId
                    && p.Period == period
                    && p.PeriodYear == periodYear);
        }
    }
}
