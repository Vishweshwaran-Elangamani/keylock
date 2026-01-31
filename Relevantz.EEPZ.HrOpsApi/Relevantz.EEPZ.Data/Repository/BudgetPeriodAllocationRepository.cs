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
    public class BudgetPeriodAllocationRepository : IBudgetPeriodAllocationRepository
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<BudgetPeriodAllocationRepository> _logger;

        public BudgetPeriodAllocationRepository(EEPZDbContext context, ILogger<BudgetPeriodAllocationRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Budgetperiodallocation> CreateAsync(Budgetperiodallocation periodAllocation)
        {
            try
            {
                _context.Budgetperiodallocations.Add(periodAllocation);
                await _context.SaveChangesAsync();

                EEPZBusinessLog.LogRepositoryInformation(RepositoryMessages.PeriodAllocationCreated, periodAllocation.PeriodAllocationId);

                return periodAllocation;
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error creating period allocation", ex);
                throw;
            }
        }

        public async Task<Budgetperiodallocation> UpdateAsync(Budgetperiodallocation periodAllocation)
        {
            try
            {
                _context.Budgetperiodallocations.Update(periodAllocation);
                await _context.SaveChangesAsync();

                EEPZBusinessLog.LogRepositoryInformation(RepositoryMessages.PeriodAllocationUpdated, periodAllocation.PeriodAllocationId);

                return periodAllocation;
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error updating period allocation {AllocationId}", ex, periodAllocation.PeriodAllocationId);
                throw;
            }
        }

        public async Task<bool> DeleteAsync(int periodAllocationId)
        {
            try
            {
                if (periodAllocationId <= 0)
                    return false;

                var periodAllocation = await _context.Budgetperiodallocations.FindAsync(periodAllocationId);
                if (periodAllocation == null)
                    return false;

                _context.Budgetperiodallocations.Remove(periodAllocation);
                await _context.SaveChangesAsync();

                EEPZBusinessLog.LogRepositoryInformation(RepositoryMessages.PeriodAllocationDeleted, periodAllocationId);

                return true;
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error deleting period allocation {AllocationId}", ex, periodAllocationId);
                throw;
            }
        }

        public async Task<Budgetperiodallocation?> GetByIdAsync(int periodAllocationId)
        {
            try
            {
                if (periodAllocationId <= 0)
                    return null;

                return await IncludeRelations()
                    .FirstOrDefaultAsync(p => p.PeriodAllocationId == periodAllocationId);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching period allocation {AllocationId}", ex, periodAllocationId);
                throw;
            }
        }

        public async Task<List<Budgetperiodallocation>> GetAllAsync()
        {
            try
            {
                return await IncludeRelations()
                    .OrderByDescending(p => p.AllocatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching all period allocations", ex);
                throw;
            }
        }

        public async Task<List<Budgetperiodallocation>> GetByBudgetIdAsync(int budgetId)
        {
            try
            {
                if (budgetId <= 0)
                    return new List<Budgetperiodallocation>();

                return await IncludeRelations()
                    .Where(p => p.BudgetId == budgetId)
                    .OrderBy(p => p.PeriodYear)
                    .ThenBy(p => p.Period)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching period allocations for budget {BudgetId}", ex, budgetId);
                throw;
            }
        }

        public async Task<Budgetperiodallocation?> GetByBudgetPeriodYearAsync(int budgetId, string period, int periodYear)
        {
            try
            {
                if (budgetId <= 0 || string.IsNullOrWhiteSpace(period) || periodYear <= 0)
                    return null;

                return await _context.Budgetperiodallocations
                    .Include(p => p.Budget)
                        .ThenInclude(b => b.Department)
                    .FirstOrDefaultAsync(p => p.BudgetId == budgetId
                        && p.Period == period
                        && p.PeriodYear == periodYear);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error fetching period allocation for budget {BudgetId}, period {Period}, year {Year}", 
                    ex, budgetId, period, periodYear);
                throw;
            }
        }

        public async Task<PeriodAllocationResponseDto?> GetPeriodAllocationDetailsAsync(int periodAllocationId)
{
    try
    {
        if (periodAllocationId <= 0)
        {
            EEPZBusinessLog.LogRepositoryWarning("Invalid periodAllocationId provided: {PeriodAllocationId}", periodAllocationId);
            return null;
        }

        var allocation = await _context.Budgetperiodallocations
            .Where(b => b.PeriodAllocationId == periodAllocationId)
            .Include(b => b.AllocatedByUser)
                .ThenInclude(u => u!.Employee)
                    .ThenInclude(e => e.Userprofile)
            .Include(b => b.Budget)
                .ThenInclude(b => b!.Department)
            .FirstOrDefaultAsync();

        if (allocation == null)
        {
            EEPZBusinessLog.LogRepositoryWarning("Period allocation not found: {PeriodAllocationId}", periodAllocationId);
            return null;
        }

        // Calculate sub-allocations total and count
        var subAllocations = await _context.Budgetallocations
            .Where(a => a.BudgetId == allocation.BudgetId
                     && a.Period == allocation.Period
                     && a.PeriodYear == allocation.PeriodYear)
            .ToListAsync();

        var totalSubAllocated = subAllocations.Sum(a => a.Amount);
        var subAllocationCount = subAllocations.Count;

        return new PeriodAllocationResponseDto
        {
            PeriodAllocationId = allocation.PeriodAllocationId,
            BudgetId = allocation.BudgetId,
            DepartmentId = allocation.Budget?.DepartmentId ?? 0,
            DepartmentName = allocation.Budget?.Department?.DepartmentName ?? "Unknown",
            Period = allocation.Period,
            PeriodYear = allocation.PeriodYear,
            AllocatedAmount = allocation.AllocatedAmount,
            UtilizedAmount = totalSubAllocated,  // This is the sum of all sub-allocations
            UtilizationPercentage = allocation.AllocatedAmount > 0
                ? Math.Round((totalSubAllocated / allocation.AllocatedAmount) * 100, 2)
                : 0,
            AllocatedByUserId = allocation.AllocatedByUserId,
            AllocatedByEmail = allocation.AllocatedByUser?.Email ?? "Unknown",
            AllocatedAt = allocation.AllocatedAt,
            UpdatedAt = allocation.UpdatedAt,
            Notes = allocation.Notes,
            RemainingAmount = allocation.AllocatedAmount - totalSubAllocated,
            SubAllocationCount = subAllocationCount
        };
    }
    catch (Exception ex)
    {
        EEPZBusinessLog.LogRepositoryError("Error fetching period allocation details for allocation {PeriodAllocationId}", ex, periodAllocationId);
        throw;
    }
}


        public async Task<decimal> GetTotalAllocatedByBudgetAsync(int budgetId)
        {
            try
            {
                if (budgetId <= 0)
                    return 0;

                return await _context.Budgetperiodallocations
                    .Where(p => p.BudgetId == budgetId)
                    .SumAsync(p => p.AllocatedAmount);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error calculating total allocated for budget {BudgetId}", ex, budgetId);
                throw;
            }
        }

        public async Task<decimal> GetTotalAllocatedByBudgetExceptIdAsync(int budgetId, int periodAllocationId)
        {
            try
            {
                if (budgetId <= 0)
                    return 0;

                return await _context.Budgetperiodallocations
                    .Where(p => p.BudgetId == budgetId && p.PeriodAllocationId != periodAllocationId)
                    .SumAsync(p => p.AllocatedAmount);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error calculating total allocated excluding {AllocationId}", ex, periodAllocationId);
                throw;
            }
        }

        public async Task<bool> HasSubAllocationsAsync(int budgetId, string period, int periodYear)
        {
            try
            {
                if (budgetId <= 0 || string.IsNullOrWhiteSpace(period) || periodYear <= 0)
                    return false;

                return await _context.Budgetallocations
                    .AnyAsync(a => a.BudgetId == budgetId
                                 && a.Period == period
                                 && a.PeriodYear == periodYear);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogRepositoryError("Error checking sub-allocations for budget {BudgetId}", ex, budgetId);
                throw;
            }
        }

        private IQueryable<Budgetperiodallocation> IncludeRelations()
        {
            return _context.Budgetperiodallocations
                .Include(p => p.Budget)
                    .ThenInclude(b => b.Department)
                .Include(p => p.AllocatedByUser);
        }
    }
}
