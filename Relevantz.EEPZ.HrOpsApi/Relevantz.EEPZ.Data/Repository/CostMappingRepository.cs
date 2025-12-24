using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;
using Microsoft.EntityFrameworkCore;

namespace Relevantz.EEPZ.Data.Repository
{
    public class CostMappingRepository : ICostMappingRepository
    {
        private readonly EEPZDbContext _context;

        public CostMappingRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<Departmentbudget?> GetByIdAsync(int budgetId)
        {
            return await _context.Departmentbudgets
                .Include(db => db.Department)
                .FirstOrDefaultAsync(db => db.BudgetId == budgetId);
        }

        public async Task<List<Departmentbudget>> GetAllAsync()
        {
            return await _context.Departmentbudgets
                .Include(db => db.Department)
                .OrderByDescending(db => db.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Departmentbudget>> GetByDepartmentIdAsync(int departmentId)
        {
            return await _context.Departmentbudgets
                .Include(db => db.Department)
                .Where(db => db.DepartmentId == departmentId)
                .OrderByDescending(db => db.FiscalYear)
                .ToListAsync();
        }

        public async Task<List<Departmentbudget>> GetByFiscalYearAsync(int fiscalYear)
        {
            return await _context.Departmentbudgets
                .Include(db => db.Department)
                .Where(db => db.FiscalYear == fiscalYear)
                .OrderBy(db => db.Department!.DepartmentName)
                .ToListAsync();
        }

        public async Task<Departmentbudget?> GetByDepartmentAndFiscalYearAsync(int departmentId, int fiscalYear)
        {
            return await _context.Departmentbudgets
                .FirstOrDefaultAsync(db =>
                    db.DepartmentId == departmentId &&
                    db.FiscalYear == fiscalYear);
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
    }

}

