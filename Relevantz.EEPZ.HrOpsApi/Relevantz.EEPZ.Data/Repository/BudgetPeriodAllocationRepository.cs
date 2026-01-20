using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Constants;
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
                
                _logger.LogInformation(RepositoryMessages.PeriodAllocationCreated, periodAllocation.PeriodAllocationId);
                
                return periodAllocation;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorCreatingPeriodAllocation);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorCreatingPeriodAllocation);
                throw;
            }
        }

        public async Task<Budgetperiodallocation> UpdateAsync(Budgetperiodallocation periodAllocation)
        {
            try
            {
                _context.Budgetperiodallocations.Update(periodAllocation);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation(RepositoryMessages.PeriodAllocationUpdated, periodAllocation.PeriodAllocationId);
                
                return periodAllocation;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorUpdatingPeriodAllocation, periodAllocation.PeriodAllocationId);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorUpdatingPeriodAllocation, periodAllocation.PeriodAllocationId);
                throw;
            }
        }

        public async Task<bool> DeleteAsync(int periodAllocationId)
        {
            try
            {
                if (periodAllocationId <= 0)
                    return false;

                // Use FindAsync for efficient delete - no need to load related entities
                var periodAllocation = await _context.Budgetperiodallocations.FindAsync(periodAllocationId);
                if (periodAllocation == null)
                    return false;

                _context.Budgetperiodallocations.Remove(periodAllocation);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation(RepositoryMessages.PeriodAllocationDeleted, periodAllocationId);
                
                return true;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorDeletingPeriodAllocation, periodAllocationId);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorDeletingPeriodAllocation, periodAllocationId);
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
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingPeriodAllocation, periodAllocationId);
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
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingAllPeriodAllocations);
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
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingPeriodAllocationsByBudget, budgetId);
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
                _logger.LogError(ex, "Error fetching period allocation for budget {BudgetId}, period {Period}, year {PeriodYear}", budgetId, period, periodYear);
                throw;
            }
        }

        public async Task<PeriodAllocationResponseDto?> GetPeriodAllocationDetailsAsync(int periodAllocationId)
        {
            try
            {
                if (periodAllocationId <= 0)
                    return null;

                var periodAllocation = await IncludeRelations()
                    .FirstOrDefaultAsync(p => p.PeriodAllocationId == periodAllocationId);

                if (periodAllocation == null)
                    return null;

                var subAllocationCount = await _context.Budgetallocations
                    .CountAsync(a => a.BudgetId == periodAllocation.BudgetId
                                  && a.Period == periodAllocation.Period
                                  && a.PeriodYear == periodAllocation.PeriodYear);

                return new PeriodAllocationResponseDto
                {
                    PeriodAllocationId = periodAllocation.PeriodAllocationId,
                    BudgetId = periodAllocation.BudgetId,
                    DepartmentId = periodAllocation.Budget?.DepartmentId ?? 0,
                    DepartmentName = periodAllocation.Budget?.Department?.DepartmentName ?? "Unknown",
                    Period = periodAllocation.Period,
                    PeriodYear = periodAllocation.PeriodYear,
                    AllocatedAmount = periodAllocation.AllocatedAmount,
                    UtilizedAmount = periodAllocation.UtilizedAmount,
                    UtilizationPercentage = periodAllocation.UtilizationPercentage,
                    AllocatedByUserId = periodAllocation.AllocatedByUserId,
                    AllocatedByEmail = periodAllocation.AllocatedByUser?.Email ?? "Unknown",
                    AllocatedAt = periodAllocation.AllocatedAt,
                    UpdatedAt = periodAllocation.UpdatedAt,
                    Notes = periodAllocation.Notes,
                    RemainingAmount = periodAllocation.AllocatedAmount - periodAllocation.UtilizedAmount,
                    SubAllocationCount = subAllocationCount
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingPeriodAllocationDetails, periodAllocationId);
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
                _logger.LogError(ex, "Error calculating total allocated for budget {BudgetId}", budgetId);
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
                _logger.LogError(ex, "Error calculating total allocated for budget {BudgetId} excluding {PeriodAllocationId}", budgetId, periodAllocationId);
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
                _logger.LogError(ex, "Error checking sub-allocations for budget {BudgetId}, period {Period}, year {PeriodYear}", budgetId, period, periodYear);
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
