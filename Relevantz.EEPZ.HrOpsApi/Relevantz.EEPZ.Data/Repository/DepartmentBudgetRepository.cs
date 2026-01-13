using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;
using Microsoft.EntityFrameworkCore;

namespace Relevantz.EEPZ.Data.Repository
{
    public class DepartmentBudgetRepository : IDepartmentBudgetRepository
    {
        private readonly EEPZDbContext _context;

        public DepartmentBudgetRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<Departmentbudget?> GetByIdAsync(int budgetId)
        {
            return await _context.Departmentbudgets.FindAsync(budgetId);
        }

        public async Task<Departmentbudget?> GetByDepartmentIdAsync(int departmentId)
        {
            return await _context.Departmentbudgets.FirstOrDefaultAsync(b => b.DepartmentId == departmentId);
        }

        public async Task<List<Departmentbudget>> GetAllAsync()
        {
            return await _context.Departmentbudgets.OrderBy(b => b.DepartmentId).ToListAsync();
        }

        public async Task<List<Departmentbudget>> GetByFiscalYearAsync(int fiscalYear)
        {
            return await _context.Departmentbudgets
                .Where(b => b.FiscalYear == fiscalYear)
                .OrderBy(b => b.DepartmentId)
                .ToListAsync();
        }

        public async Task<Departmentbudget?> GetByDepartmentAndFiscalYearAsync(int departmentId, int fiscalYear)
        {
            return await _context.Departmentbudgets
                .FirstOrDefaultAsync(b => b.DepartmentId == departmentId && b.FiscalYear == fiscalYear);
        }

        public async Task<Departmentbudget> CreateAsync(Departmentbudget budget)
        {
            _context.Departmentbudgets.Add(budget);
            await _context.SaveChangesAsync();
            return budget;
        }

        public async Task<Departmentbudget> UpdateAsync(Departmentbudget budget)
        {
            _context.Departmentbudgets.Update(budget);
            await _context.SaveChangesAsync();
            return budget;
        }

        public async Task<bool> DeleteAsync(int budgetId)
        {
            var budget = await _context.Departmentbudgets.FindAsync(budgetId);
            if (budget == null) return false;
            _context.Departmentbudgets.Remove(budget);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> DeleteAllocationsByDepartmentIdAsync(int departmentId)
        {
            var allocations = await _context.Budgetallocations
                .Where(a => a.DepartmentId == departmentId).ToListAsync();
            if (allocations.Count > 0)
            {
                _context.Budgetallocations.RemoveRange(allocations);
                await _context.SaveChangesAsync();
            }
            return allocations.Count;
        }

        public async Task<Budgetallocation?> GetAllocationByIdAsync(int allocationId)
        {
            return await _context.Budgetallocations.FindAsync(allocationId);
        }

        public async Task<List<Budgetallocation>> GetAllocationsByBudgetIdAsync(int budgetId)
        {
            return await _context.Budgetallocations
                .Include(a => a.Department)
                .Include(a => a.EmployeeUser)
                .Include(a => a.AllocatedByUser)
                .Where(a => a.BudgetId == budgetId)
                .ToListAsync();
        }

        public async Task<Budgetallocation> UpdateAllocationAsync(Budgetallocation allocation)
        {
            _context.Budgetallocations.Update(allocation);
            await _context.SaveChangesAsync();
            return allocation;
        }

        public async Task<decimal> GetTotalUtilizedByDepartmentAsync(int departmentId)
        {
            return await _context.Budgetallocations
                .Where(a => a.DepartmentId == departmentId)
                .SumAsync(a => a.UtilizedAmount ?? 0);
        }
    }
}
