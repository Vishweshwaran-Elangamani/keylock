using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Common.Constants;
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

        /// <summary>
        /// Retrieves a department budget by its ID.
        /// </summary>
        /// <param name="budgetId">The budget ID to search for</param>
        /// <returns>The department budget if found, otherwise null</returns>
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
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingDepartmentBudget, budgetId);
                throw;
            }
        }

        /// <summary>
        /// Retrieves the department budget for a specific department.
        /// </summary>
        /// <param name="departmentId">The department ID</param>
        /// <returns>The department budget if found, otherwise null</returns>
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
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingDepartmentBudgetByDepartment, departmentId);
                throw;
            }
        }

        /// <summary>
        /// Retrieves all department budgets ordered by department ID.
        /// </summary>
        /// <returns>List of all department budgets</returns>
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
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingAllDepartmentBudgets);
                throw;
            }
        }

        /// <summary>
        /// Retrieves all department budgets for a specific fiscal year.
        /// </summary>
        /// <param name="fiscalYear">The fiscal year to filter by</param>
        /// <returns>List of department budgets for the specified fiscal year</returns>
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
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingDepartmentBudgetsByFiscalYear, fiscalYear);
                throw;
            }
        }

        /// <summary>
        /// Retrieves a department budget by department ID and fiscal year.
        /// </summary>
        /// <param name="departmentId">The department ID</param>
        /// <param name="fiscalYear">The fiscal year</param>
        /// <returns>The department budget if found, otherwise null</returns>
        public async Task<Departmentbudget?> GetByDepartmentAndFiscalYearAsync(int departmentId, int fiscalYear)
        {
            try
            {
                if (departmentId <= 0 || fiscalYear <= 0)
                    return null;

                return await _context.Departmentbudgets
                    .FirstOrDefaultAsync(b => b.DepartmentId == departmentId && b.FiscalYear == fiscalYear);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingDepartmentBudgetByDepartmentAndYear, departmentId, fiscalYear);
                throw;
            }
        }

        /// <summary>
        /// Creates a new department budget.
        /// </summary>
        /// <param name="budget">The department budget to create</param>
        /// <returns>The created department budget with generated ID</returns>
        public async Task<Departmentbudget> CreateAsync(Departmentbudget budget)
        {
            try
            {
                budget.CreatedAt = DateTime.Now;
                budget.UpdatedAt = DateTime.Now;

                _context.Departmentbudgets.Add(budget);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation(RepositoryMessages.DepartmentBudgetCreated, budget.BudgetId);
                
                return budget;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorCreatingDepartmentBudget);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorCreatingDepartmentBudget);
                throw;
            }
        }

        /// <summary>
        /// Updates an existing department budget.
        /// </summary>
        /// <param name="budget">The department budget to update</param>
        /// <returns>The updated department budget</returns>
        public async Task<Departmentbudget> UpdateAsync(Departmentbudget budget)
        {
            try
            {
                // Check if entity exists before updating
                var existingBudget = await _context.Departmentbudgets.FindAsync(budget.BudgetId);
                if (existingBudget == null)
                {
                    _logger.LogWarning(RepositoryMessages.DepartmentBudgetNotFound, budget.BudgetId);
                    throw new InvalidOperationException($"Department budget with ID {budget.BudgetId} not found");
                }

                budget.UpdatedAt = DateTime.Now;
                _context.Departmentbudgets.Update(budget);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation(RepositoryMessages.DepartmentBudgetUpdated, budget.BudgetId);
                
                return budget;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorUpdatingDepartmentBudget, budget.BudgetId);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorUpdatingDepartmentBudget, budget.BudgetId);
                throw;
            }
        }

        /// <summary>
        /// Deletes a department budget by its ID.
        /// </summary>
        /// <param name="budgetId">The budget ID to delete</param>
        /// <returns>True if deleted successfully, false if not found</returns>
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
                
                _logger.LogInformation(RepositoryMessages.DepartmentBudgetDeleted, budgetId);
                
                return true;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorDeletingDepartmentBudget, budgetId);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorDeletingDepartmentBudget, budgetId);
                throw;
            }
        }

        /// <summary>
        /// Deletes all budget allocations for a specific department.
        /// </summary>
        /// <param name="departmentId">The department ID</param>
        /// <returns>The number of allocations deleted</returns>
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
                    
                    _logger.LogInformation(RepositoryMessages.AllocationsDeletedByDepartment, allocations.Count, departmentId);
                }

                return allocations.Count;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorDeletingAllocationsByDepartment, departmentId);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorDeletingAllocationsByDepartment, departmentId);
                throw;
            }
        }

        /// <summary>
        /// Retrieves a budget allocation by its ID.
        /// </summary>
        /// <param name="allocationId">The allocation ID</param>
        /// <returns>The budget allocation if found, otherwise null</returns>
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
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingAllocation, allocationId);
                throw;
            }
        }

        /// <summary>
        /// Retrieves all budget allocations for a specific budget, including related entities.
        /// </summary>
        /// <param name="budgetId">The budget ID</param>
        /// <returns>List of budget allocations with related Department, EmployeeUser, and AllocatedByUser</returns>
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
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingAllocationsByBudget, budgetId);
                throw;
            }
        }

        /// <summary>
        /// Updates an existing budget allocation.
        /// </summary>
        /// <param name="allocation">The budget allocation to update</param>
        /// <returns>The updated budget allocation</returns>
        public async Task<Budgetallocation> UpdateAllocationAsync(Budgetallocation allocation)
        {
            try
            {
                // Check if entity exists before updating
                var existingAllocation = await _context.Budgetallocations.FindAsync(allocation.AllocationId);
                if (existingAllocation == null)
                {
                    _logger.LogWarning(RepositoryMessages.AllocationNotFound, allocation.AllocationId);
                    throw new InvalidOperationException($"Budget allocation with ID {allocation.AllocationId} not found");
                }

                allocation.UpdatedAt = DateTime.Now;
                _context.Budgetallocations.Update(allocation);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation(RepositoryMessages.AllocationUpdated, allocation.AllocationId);
                
                return allocation;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorUpdatingAllocation, allocation.AllocationId);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorUpdatingAllocation, allocation.AllocationId);
                throw;
            }
        }

        /// <summary>
        /// Calculates the total utilized amount for all budget allocations in a department.
        /// </summary>
        /// <param name="departmentId">The department ID</param>
        /// <returns>The total utilized amount</returns>
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
                _logger.LogError(ex, RepositoryMessages.ErrorGettingTotalUtilizedByDepartment, departmentId);
                throw;
            }
        }

        /// <summary>
        /// Base query for budget allocations with related entities eagerly loaded.
        /// </summary>
        /// <returns>IQueryable of budget allocations with Department, EmployeeUser, and AllocatedByUser included</returns>
        private IQueryable<Budgetallocation> BaseAllocationQuery()
        {
            return _context.Budgetallocations
                .Include(a => a.Department)
                .Include(a => a.EmployeeUser)
                .Include(a => a.AllocatedByUser);
        }
    }
}
