using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;

namespace Relevantz.EEPZ.Data.Repository
{
    public class FundAllocationRepository : IFundAllocationRepository
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<FundAllocationRepository> _logger;

        public FundAllocationRepository(EEPZDbContext context, ILogger<FundAllocationRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Budgetallocation?> GetByIdAsync(int allocationId)
        {
            try
            {
                if (allocationId <= 0)
                    return null;

                return await BaseQuery()
                    .FirstOrDefaultAsync(b => b.AllocationId == allocationId);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching fund allocation {AllocationId}", ex, allocationId);
                throw;
            }
        }

        public async Task<List<Budgetallocation>> GetAllAsync()
        {
            try
            {
                return await BaseQuery()
                    .OrderByDescending(b => b.AllocatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching all fund allocations", ex);
                throw;
            }
        }

        public async Task<List<Budgetallocation>> GetByDepartmentIdAsync(int departmentId)
        {
            try
            {
                if (departmentId <= 0)
                    return new List<Budgetallocation>();

                return await BaseQuery()
                    .Where(b => b.DepartmentId == departmentId)
                    .OrderByDescending(b => b.AllocatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching fund allocations for department {DepartmentId}", ex, departmentId);
                throw;
            }
        }

        public async Task<List<Budgetallocation>> GetByAllocationTypeAsync(string allocationType)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(allocationType))
                    return new List<Budgetallocation>();

                return await BaseQuery()
                    .Where(b => b.AllocationType == allocationType)
                    .OrderByDescending(b => b.AllocatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching fund allocations by type {AllocationType}", ex, allocationType);
                throw;
            }
        }

        public async Task<List<Budgetallocation>> GetByEmployeeUserIdAsync(int employeeUserId)
        {
            try
            {
                if (employeeUserId <= 0)
                    return new List<Budgetallocation>();

                return await BaseQuery()
                    .Where(b => b.EmployeeUserId == employeeUserId)
                    .OrderByDescending(b => b.AllocatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching fund allocations for employee {EmployeeUserId}", ex, employeeUserId);
                throw;
            }
        }

        public async Task<Budgetallocation> CreateAsync(Budgetallocation allocation)
        {
            try
            {
                _context.Budgetallocations.Add(allocation);
                await _context.SaveChangesAsync();

                EEPZBusinessLog.LogRepositoryInformation(RepositoryMessages.FundAllocationCreated, allocation.AllocationId);

                return allocation;
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error creating fund allocation", ex);
                throw;
            }
        }

        public async Task<Budgetallocation> UpdateAsync(Budgetallocation allocation)
        {
            try
            {
                var existingAllocation = await _context.Budgetallocations.FindAsync(allocation.AllocationId);
                if (existingAllocation == null)
                {
                    EEPZBusinessLog.LogRepositoryWarning(RepositoryMessages.FundAllocationNotFound, allocation.AllocationId);
                    throw new InvalidOperationException($"Fund allocation with ID {allocation.AllocationId} not found");
                }

                _context.Budgetallocations.Update(allocation);
                await _context.SaveChangesAsync();

                EEPZBusinessLog.LogRepositoryInformation(RepositoryMessages.FundAllocationUpdated, allocation.AllocationId);

                return allocation;
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error updating fund allocation {AllocationId}", ex, allocation.AllocationId);
                throw;
            }
        }

        public async Task<bool> DeleteAsync(int allocationId)
        {
            try
            {
                if (allocationId <= 0)
                    return false;

                var allocation = await _context.Budgetallocations.FindAsync(allocationId);
                if (allocation == null)
                    return false;

                _context.Budgetallocations.Remove(allocation);
                await _context.SaveChangesAsync();

                EEPZBusinessLog.LogRepositoryInformation(RepositoryMessages.FundAllocationDeleted, allocationId);

                return true;
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error deleting fund allocation {AllocationId}", ex, allocationId);
                throw;
            }
        }

        public async Task<bool> BudgetExistsAsync(int budgetId)
        {
            try
            {
                if (budgetId <= 0)
                    return false;

                return await _context.Departmentbudgets
                    .AnyAsync(b => b.BudgetId == budgetId);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error checking budget existence {BudgetId}", ex, budgetId);
                throw;
            }
        }

        public async Task<(bool Exists, decimal AvailableAmount)> ValidatePeriodAndGetAvailableAsync(
            int budgetId,
            string period,
            int periodYear)
        {
            try
            {
                if (budgetId <= 0 || string.IsNullOrWhiteSpace(period) || periodYear <= 0)
                    return (false, 0m);

                var periodAllocation = await _context.Budgetperiodallocations
                    .FirstOrDefaultAsync(p => p.BudgetId == budgetId
                                           && p.Period == period
                                           && p.PeriodYear == periodYear);

                if (periodAllocation == null)
                {
                    return (false, 0m);
                }

                var periodSubAllocationsTotal = await _context.Budgetallocations
                    .Where(a => a.BudgetId == budgetId
                             && a.Period == period
                             && a.PeriodYear == periodYear)
                    .SumAsync(a => a.Amount);

                var availableInPeriod = periodAllocation.AllocatedAmount - periodSubAllocationsTotal;
                return (true, availableInPeriod);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error validating period for budget {BudgetId}, period {Period}, year {Year}", 
                    ex, budgetId, period, periodYear);
                throw;
            }
        }

        public async Task<FundAllocationResponseDto?> GetFundAllocationDetailsAsync(int allocationId)
        {
            try
            {
                if (allocationId <= 0)
                {
                    EEPZBusinessLog.LogRepositoryWarning("Invalid allocationId provided: {AllocationId}", allocationId);
                    return null;
                }

                // FIX: Added .Where() filter before .FirstOrDefaultAsync()
                var allocation = await _context.Budgetallocations
                    .Where(b => b.AllocationId == allocationId)
                    .Include(b => b.EmployeeUser)
                        .ThenInclude(u => u!.Employee)
                            .ThenInclude(e => e.Userprofile)
                    .Include(b => b.AllocatedByUser)
                        .ThenInclude(u => u.Employee)
                            .ThenInclude(e => e!.Userprofile)
                    .Include(b => b.Department)
                    .Include(b => b.Budget)
                    .FirstOrDefaultAsync();

                if (allocation == null)
                {
                    EEPZBusinessLog.LogRepositoryWarning("Fund allocation not found: {AllocationId}", allocationId);
                    return null;
                }

                return new FundAllocationResponseDto
                {
                    AllocationId = allocation.AllocationId,
                    BudgetId = allocation.BudgetId ?? 0,
                    DepartmentId = allocation.DepartmentId,
                    DepartmentName = allocation.Department?.DepartmentName ?? "Unknown",
                    EmployeeUserId = allocation.EmployeeUserId,
                    EmployeeEmail = allocation.EmployeeUser?.Email,
                    AllocationType = allocation.AllocationType,
                    Amount = allocation.Amount,
                    GoalStatus = allocation.GoalStatus,
                    Notes = allocation.Notes,
                    AllocatedByUserId = allocation.AllocatedByUserId,
                    AllocatedByEmail = allocation.AllocatedByUser?.Email ?? "Unknown",
                    AllocatedAt = allocation.AllocatedAt,
                    UtilizedAmount = allocation.UtilizedAmount ?? 0m,
                    UtilizationPercentage = allocation.UtilizationPercentage ?? 0m,
                    UpdatedAt = allocation.UpdatedAt,
                    Period = allocation.Period,
                    PeriodYear = allocation.PeriodYear ?? 0
                };
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching fund allocation details for allocation {AllocationId}", ex, allocationId);
                throw;
            }
        }

        public async Task<Budgetperiodallocation?> GetPeriodAllocationByBudgetPeriodYearAsync(
            int budgetId, string period, int periodYear)
        {
            try
            {
                return await _context.Budgetperiodallocations
                    .FirstOrDefaultAsync(p => p.BudgetId == budgetId
                                           && p.Period == period
                                           && p.PeriodYear == periodYear);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError(
                    "Error fetching period allocation for Budget={BudgetId}, Period={Period}, Year={Year}",
                    ex, budgetId, period, periodYear);
                throw;
            }
        }

        public async Task<List<Budgetallocation>> GetByBudgetPeriodYearAsync(
            int budgetId, string period, int periodYear)
        {
            try
            {
                return await _context.Budgetallocations
                    .Where(a => a.BudgetId == budgetId
                             && a.Period == period
                             && a.PeriodYear == periodYear)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError(
                    "Error fetching fund allocations for Budget={BudgetId}, Period={Period}, Year={Year}",
                    ex, budgetId, period, periodYear);
                throw;
            }
        }

        public async Task<Budgetperiodallocation> UpdatePeriodAllocationAsync(
            Budgetperiodallocation periodAllocation)
        {
            try
            {
                _context.Budgetperiodallocations.Update(periodAllocation);
                await _context.SaveChangesAsync();

                EEPZBusinessLog.LogRepositoryInformation(
                    "Period allocation {AllocationId} updated successfully",
                    periodAllocation.PeriodAllocationId);

                return periodAllocation;
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError(
                    "Error updating period allocation {AllocationId}",
                    ex, periodAllocation.PeriodAllocationId);
                throw;
            }
        }

        private IQueryable<Budgetallocation> BaseQuery()
        {
            return _context.Budgetallocations
                .Include(b => b.Department)
                .Include(b => b.EmployeeUser)
                    .ThenInclude(u => u!.Employee)
                        .ThenInclude(e => e.Userprofile)
                .Include(b => b.AllocatedByUser)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e!.Userprofile)
                .Include(b => b.Budget);
        }
    }
}
