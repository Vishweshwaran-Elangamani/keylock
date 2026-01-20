using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;
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
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingCostMapping, budgetId);
                throw;
            }
        }

        public async Task<List<Departmentbudget>> GetAllAsync()
        {
            try
            {
                // Note: Consider adding pagination if dataset grows large
                return await IncludeRelations()
                    .OrderByDescending(db => db.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingAllCostMappings);
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
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingCostMappingsByDepartment, departmentId);
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
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingCostMappingsByFiscalYear, fiscalYear);
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
                _logger.LogError(ex, "Error fetching department budget for department {DepartmentId} and fiscal year {FiscalYear}", departmentId, fiscalYear);
                throw;
            }
        }

        public async Task<Departmentbudget> CreateAsync(Departmentbudget budget)
        {
            try
            {
                _context.Departmentbudgets.Add(budget);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation(RepositoryMessages.CostMappingCreated, budget.BudgetId);
                
                return budget;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorCreatingCostMapping);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorCreatingCostMapping);
                throw;
            }
        }

        public async Task<Departmentbudget> UpdateAsync(Departmentbudget budget)
        {
            try
            {
                // Check if entity exists before updating
                var existingBudget = await _context.Departmentbudgets.FindAsync(budget.BudgetId);
                if (existingBudget == null)
                {
                    _logger.LogWarning(RepositoryMessages.CostMappingNotFound, budget.BudgetId);
                    throw new InvalidOperationException($"Department budget with ID {budget.BudgetId} not found");
                }

                _context.Departmentbudgets.Update(budget);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation(RepositoryMessages.CostMappingUpdated, budget.BudgetId);
                
                return budget;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorUpdatingCostMapping, budget.BudgetId);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorUpdatingCostMapping, budget.BudgetId);
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
                
                _logger.LogInformation(RepositoryMessages.CostMappingDeleted, budgetId);
                
                return true;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorDeletingCostMapping, budgetId);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorDeletingCostMapping, budgetId);
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
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingCurrentHeadcount, departmentId);
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
