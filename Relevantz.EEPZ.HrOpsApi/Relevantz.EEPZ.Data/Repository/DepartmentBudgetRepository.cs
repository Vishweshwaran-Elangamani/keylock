using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Utils;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Relevantz.EEPZ.Data.Repository
{
    /// <summary>
    /// Repository for managing department budgets and their allocations.
    /// Handles CRUD operations for department budgets and related budget allocations.
    /// </summary>
    public class DepartmentBudgetRepository : IDepartmentBudgetRepository
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<DepartmentBudgetRepository> _logger;

        public DepartmentBudgetRepository(EEPZDbContext context, ILogger<DepartmentBudgetRepository> logger)
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

                return await _context.Departmentbudgets.FindAsync(budgetId);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching department budget {BudgetId}", ex, budgetId);
                throw;
            }
        }

        public async Task<Departmentbudget?> GetByDepartmentIdAsync(int departmentId)
        {
            try
            {
                if (departmentId <= 0)
                    return null;

                return await _context.Departmentbudgets
                    .FirstOrDefaultAsync(b => b.DepartmentId == departmentId);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching budget for department {DepartmentId}", ex, departmentId);
                throw;
            }
        }

        public async Task<List<Departmentbudget>> GetAllAsync()
        {
            try
            {
                return await _context.Departmentbudgets
                    .OrderBy(b => b.DepartmentId)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching all department budgets", ex);
                throw;
            }
        }

        public async Task<List<Departmentbudget>> GetByFiscalYearAsync(int fiscalYear)
        {
            try
            {
                if (fiscalYear <= 0)
                    return new List<Departmentbudget>();

                return await _context.Departmentbudgets
                    .Where(b => b.FiscalYear == fiscalYear)
                    .OrderBy(b => b.DepartmentId)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching budgets for fiscal year {FiscalYear}", ex, fiscalYear);
                throw;
            }
        }

        public async Task<Departmentbudget?> GetByDepartmentAndFiscalYearAsync(int departmentId, int fiscalYear)
        {
            try
            {
                if (departmentId <= 0 || fiscalYear <= 0)
                    return null;

                return await _context.Departmentbudgets
                    .FirstOrDefaultAsync(b =>
                        b.DepartmentId == departmentId &&
                        b.FiscalYear == fiscalYear);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching budget for department {DepartmentId}, fiscal year {FiscalYear}", 
                    ex, departmentId, fiscalYear);
                throw;
            }
        }

        public async Task<Departmentbudget> CreateAsync(Departmentbudget budget)
        {
            try
            {
                budget.CreatedAt = DateTime.Now;
                budget.UpdatedAt = DateTime.Now;

                _context.Departmentbudgets.Add(budget);
                await _context.SaveChangesAsync();

                EEPZBusinessLog.LogRepositoryInformation(RepositoryMessages.DepartmentBudgetCreated, budget.BudgetId);

                return budget;
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error creating department budget", ex);
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
                    EEPZBusinessLog.LogRepositoryWarning(RepositoryMessages.DepartmentBudgetNotFound, budget.BudgetId);
                    throw new InvalidOperationException($"Department budget with ID {budget.BudgetId} not found");
                }

                budget.UpdatedAt = DateTime.Now;
                _context.Departmentbudgets.Update(budget);
                await _context.SaveChangesAsync();

                EEPZBusinessLog.LogRepositoryInformation(RepositoryMessages.DepartmentBudgetUpdated, budget.BudgetId);

                return budget;
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error updating department budget {BudgetId}", ex, budget.BudgetId);
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

                EEPZBusinessLog.LogRepositoryInformation(RepositoryMessages.DepartmentBudgetDeleted, budgetId);

                return true;
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error deleting department budget {BudgetId}", ex, budgetId);
                throw;
            }
        }

        public async Task<int> DeleteAllocationsByDepartmentIdAsync(int departmentId)
        {
            try
            {
                if (departmentId <= 0)
                    return 0;

                var allocations = await _context.Budgetallocations
                    .Where(a => a.DepartmentId == departmentId)
                    .ToListAsync();

                if (allocations.Count > 0)
                {
                    _context.Budgetallocations.RemoveRange(allocations);
                    await _context.SaveChangesAsync();

                    EEPZBusinessLog.LogRepositoryInformation(
                        RepositoryMessages.AllocationsDeletedByDepartment,
                        allocations.Count,
                        departmentId
                    );
                }

                return allocations.Count;
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error deleting allocations for department {DepartmentId}", ex, departmentId);
                throw;
            }
        }

        public async Task<Budgetallocation?> GetAllocationByIdAsync(int allocationId)
        {
            try
            {
                if (allocationId <= 0)
                    return null;

                return await _context.Budgetallocations.FindAsync(allocationId);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching allocation {AllocationId}", ex, allocationId);
                throw;
            }
        }

        public async Task<List<Budgetallocation>> GetAllocationsByBudgetIdAsync(int budgetId)
        {
            try
            {
                if (budgetId <= 0)
                    return new List<Budgetallocation>();

                return await BaseAllocationQuery()
                    .Where(a => a.BudgetId == budgetId)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching allocations for budget {BudgetId}", ex, budgetId);
                throw;
            }
        }

        public async Task<Budgetallocation> UpdateAllocationAsync(Budgetallocation allocation)
        {
            try
            {
                var existingAllocation = await _context.Budgetallocations.FindAsync(allocation.AllocationId);
                if (existingAllocation == null)
                {
                    EEPZBusinessLog.LogRepositoryWarning(RepositoryMessages.AllocationNotFound, allocation.AllocationId);
                    throw new InvalidOperationException($"Budget allocation with ID {allocation.AllocationId} not found");
                }

                allocation.UpdatedAt = DateTime.Now;
                _context.Budgetallocations.Update(allocation);
                await _context.SaveChangesAsync();

                EEPZBusinessLog.LogRepositoryInformation(RepositoryMessages.AllocationUpdated, allocation.AllocationId);

                return allocation;
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error updating allocation {AllocationId}", ex, allocation.AllocationId);
                throw;
            }
        }

        public async Task<decimal> GetTotalUtilizedByDepartmentAsync(int departmentId)
        {
            try
            {
                if (departmentId <= 0)
                    return 0;

                return await _context.Budgetallocations
                    .Where(a => a.DepartmentId == departmentId)
                    .SumAsync(a => a.UtilizedAmount ?? 0);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error calculating total utilized for department {DepartmentId}", ex, departmentId);
                throw;
            }
        }

        private IQueryable<Budgetallocation> BaseAllocationQuery()
        {
            return _context.Budgetallocations
                .Include(a => a.Department)
                .Include(a => a.EmployeeUser)
                .Include(a => a.AllocatedByUser);
        }
    }
}
