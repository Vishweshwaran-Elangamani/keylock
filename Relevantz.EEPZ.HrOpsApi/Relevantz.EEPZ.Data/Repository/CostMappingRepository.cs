using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Common.Utils;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;


namespace Relevantz.EEPZ.Data.Repository
{
    public class CostMappingRepository : ICostMappingRepository
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<CostMappingRepository> _logger;


        public CostMappingRepository(EEPZDbContext context, ILogger<CostMappingRepository> logger)
        {
            _context = context;
            _logger = logger;
        }


        public async Task<Departmentbudget?> GetByIdAsync(int budgetId)
        {
            if (budgetId <= 0)
                return null;


            return await IncludeRelations()
                .FirstOrDefaultAsync(db => db.BudgetId == budgetId);
        }


        public async Task<List<Departmentbudget>> GetAllAsync()
        {
            return await IncludeRelations()
                .OrderByDescending(db => db.CreatedAt)
                .ToListAsync();
        }


        public async Task<List<Departmentbudget>> GetByDepartmentIdAsync(int departmentId)
        {
            if (departmentId <= 0)
                return new List<Departmentbudget>();


            return await IncludeRelations()
                .Where(db => db.DepartmentId == departmentId)
                .OrderByDescending(db => db.FiscalYear)
                .ToListAsync();
        }


        public async Task<List<Departmentbudget>> GetByFiscalYearAsync(int fiscalYear)
        {
            if (fiscalYear <= 0)
                return new List<Departmentbudget>();


            return await IncludeRelations()
                .Where(db => db.FiscalYear == fiscalYear)
                .OrderBy(db => db.Department!.DepartmentName)
                .ToListAsync();
        }


        public async Task<Departmentbudget?> GetByDepartmentAndFiscalYearAsync(int departmentId, int fiscalYear)
        {
            if (departmentId <= 0 || fiscalYear <= 0)
                return null;


            return await IncludeRelations()
                .FirstOrDefaultAsync(db =>
                    db.DepartmentId == departmentId &&
                    db.FiscalYear == fiscalYear);
        }


        public async Task<Departmentbudget> CreateAsync(Departmentbudget budget)
        {
            _context.Departmentbudgets.Add(budget);
            await _context.SaveChangesAsync();


            EEPZBusinessLog.LogRepositoryInformation(RepositoryMessages.CostMappingCreated, budget.BudgetId);


            return budget;
        }


        public async Task<Departmentbudget> UpdateAsync(Departmentbudget budget)
        {
            var existingBudget = await _context.Departmentbudgets.FindAsync(budget.BudgetId);
            if (existingBudget == null)
            {
                EEPZBusinessLog.LogRepositoryWarning(RepositoryMessages.CostMappingNotFound, budget.BudgetId);
                throw new InvalidOperationException($"Department budget with ID {budget.BudgetId} not found");
            }


            _context.Departmentbudgets.Update(budget);
            await _context.SaveChangesAsync();


            EEPZBusinessLog.LogRepositoryInformation(RepositoryMessages.CostMappingUpdated, budget.BudgetId);


            return budget;
        }


        public async Task<bool> DeleteAsync(int budgetId)
        {
            if (budgetId <= 0)
                return false;


            var budget = await _context.Departmentbudgets.FindAsync(budgetId);
            if (budget == null)
                return false;


            _context.Departmentbudgets.Remove(budget);
            await _context.SaveChangesAsync();


            EEPZBusinessLog.LogRepositoryInformation(RepositoryMessages.CostMappingDeleted, budgetId);


            return true;
        }


        public async Task<int> GetCurrentHeadcountAsync(int departmentId)
        {
            if (departmentId <= 0)
                return 0;


            return await _context.Employeedetailsmasters
                .Where(edm => edm.DepartmentId == departmentId)
                .Select(edm => edm.EmployeeId)
                .Distinct()
                .CountAsync();
        }


        private IQueryable<Departmentbudget> IncludeRelations()
        {
            return _context.Departmentbudgets
                .Include(db => db.Department);
        }
    }
}
