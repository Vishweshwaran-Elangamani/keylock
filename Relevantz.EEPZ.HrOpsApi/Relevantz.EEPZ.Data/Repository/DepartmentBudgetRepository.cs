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

        public async Task<Departmentbudget?> GetByIdAsync(int budgetId)
        {
            if (budgetId <= 0)
                return null;

            return await _context.Departmentbudgets.FindAsync(budgetId);
        }

        public async Task<Departmentbudget?> GetByDepartmentIdAsync(int departmentId)
        {
            if (departmentId <= 0)
                return null;

            return await _context.Departmentbudgets
                .FirstOrDefaultAsync(b => b.DepartmentId == departmentId);
        }

        public async Task<List<Departmentbudget>> GetAllAsync()
        {
            return await _context.Departmentbudgets
                .OrderBy(b => b.DepartmentId)
                .ToListAsync();
        }

        public async Task<List<Departmentbudget>> GetByFiscalYearAsync(int fiscalYear)
        {
            if (fiscalYear <= 0)
                return new List<Departmentbudget>();

            return await _context.Departmentbudgets
                .Where(b => b.FiscalYear == fiscalYear)
                .OrderBy(b => b.DepartmentId)
                .ToListAsync();
        }

        public async Task<Departmentbudget?> GetByDepartmentAndFiscalYearAsync(int departmentId, int fiscalYear)
        {
            if (departmentId <= 0 || fiscalYear <= 0)
                return null;

            return await _context.Departmentbudgets
                .FirstOrDefaultAsync(b =>
                    b.DepartmentId == departmentId &&
                    b.FiscalYear == fiscalYear);
        }

        public async Task<Departmentbudget> CreateAsync(Departmentbudget budget)
        {
            budget.CreatedAt = DateTime.Now;
            budget.UpdatedAt = DateTime.Now;

            _context.Departmentbudgets.Add(budget);
            await _context.SaveChangesAsync();

            _logger.LogInformation(RepositoryMessages.DepartmentBudgetCreated, budget.BudgetId);

            return budget;
        }

        public async Task<Departmentbudget> UpdateAsync(Departmentbudget budget)
        {
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

        public async Task<bool> DeleteAsync(int budgetId)
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

        public async Task<int> DeleteAllocationsByDepartmentIdAsync(int departmentId)
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

                _logger.LogInformation(
                    RepositoryMessages.AllocationsDeletedByDepartment,
                    allocations.Count,
                    departmentId
                );
            }

            return allocations.Count;
        }

        public async Task<Budgetallocation?> GetAllocationByIdAsync(int allocationId)
        {
            if (allocationId <= 0)
                return null;

            return await _context.Budgetallocations.FindAsync(allocationId);
        }

        public async Task<List<Budgetallocation>> GetAllocationsByBudgetIdAsync(int budgetId)
        {
            if (budgetId <= 0)
                return new List<Budgetallocation>();

            return await BaseAllocationQuery()
                .Where(a => a.BudgetId == budgetId)
                .ToListAsync();
        }

        public async Task<Budgetallocation> UpdateAllocationAsync(Budgetallocation allocation)
        {
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

        public async Task<decimal> GetTotalUtilizedByDepartmentAsync(int departmentId)
        {
            if (departmentId <= 0)
                return 0;

            return await _context.Budgetallocations
                .Where(a => a.DepartmentId == departmentId)
                .SumAsync(a => a.UtilizedAmount ?? 0);
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
