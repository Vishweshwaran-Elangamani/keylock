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
            try
            {
                if (budgetId <= 0)
                    return null;

                return await IncludeRelations()
                    .FirstOrDefaultAsync(db => db.BudgetId == budgetId);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching cost mapping {BudgetId}", ex, budgetId);
                throw;
            }
        }

        public async Task<List<Departmentbudget>> GetAllAsync()
        {
            try
            {
                return await IncludeRelations()
                    .OrderByDescending(db => db.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching all cost mappings", ex);
                throw;
            }
        }

        public async Task<List<Departmentbudget>> GetByDepartmentIdAsync(int departmentId)
        {
            try
            {
                if (departmentId <= 0)
                    return new List<Departmentbudget>();

                return await IncludeRelations()
                    .Where(db => db.DepartmentId == departmentId)
                    .OrderByDescending(db => db.FiscalYear)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching cost mappings for department {DepartmentId}", ex, departmentId);
                throw;
            }
        }

        public async Task<List<Departmentbudget>> GetByFiscalYearAsync(int fiscalYear)
        {
            try
            {
                if (fiscalYear <= 0)
                    return new List<Departmentbudget>();

                return await IncludeRelations()
                    .Where(db => db.FiscalYear == fiscalYear)
                    .OrderBy(db => db.Department!.DepartmentName)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching cost mappings for fiscal year {FiscalYear}", ex, fiscalYear);
                throw;
            }
        }

        public async Task<Departmentbudget?> GetByDepartmentAndFiscalYearAsync(int departmentId, int fiscalYear)
        {
            try
            {
                if (departmentId <= 0 || fiscalYear <= 0)
                    return null;

                return await IncludeRelations()
                    .FirstOrDefaultAsync(db =>
                        db.DepartmentId == departmentId &&
                        db.FiscalYear == fiscalYear);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching cost mapping for department {DepartmentId}, fiscal year {FiscalYear}", 
                    ex, departmentId, fiscalYear);
                throw;
            }
        }

        public async Task<Departmentbudget> CreateAsync(Departmentbudget budget)
        {
            try
            {
                _context.Departmentbudgets.Add(budget);
                await _context.SaveChangesAsync();

                EEPZBusinessLog.LogRepositoryInformation(RepositoryMessages.CostMappingCreated, budget.BudgetId);

                return budget;
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error creating cost mapping", ex);
                throw;
            }
        }

        public async Task<Departmentbudget> UpdateAsync(Departmentbudget budget)
        {
            try
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
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error updating cost mapping {BudgetId}", ex, budget.BudgetId);
                throw;
            }
        }

        public async Task<bool> DeleteAsync(int budgetId)
        {
            try
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
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error deleting cost mapping {BudgetId}", ex, budgetId);
                throw;
            }
        }

        public async Task<int> GetCurrentHeadcountAsync(int departmentId)
        {
            try
            {
                if (departmentId <= 0)
                    return 0;

                return await _context.Employeedetailsmasters
                    .Where(edm => edm.DepartmentId == departmentId)
                    .Select(edm => edm.EmployeeId)
                    .Distinct()
                    .CountAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching headcount for department {DepartmentId}", ex, departmentId);
                throw;
            }
        }

        private IQueryable<Departmentbudget> IncludeRelations()
        {
            return _context.Departmentbudgets
                .Include(db => db.Department);
        }
    }
}
