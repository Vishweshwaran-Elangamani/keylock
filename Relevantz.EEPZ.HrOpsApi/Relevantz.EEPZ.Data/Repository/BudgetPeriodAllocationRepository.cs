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
            _context.Budgetperiodallocations.Add(periodAllocation);
            await _context.SaveChangesAsync();

            _logger.LogInformation(RepositoryMessages.PeriodAllocationCreated, periodAllocation.PeriodAllocationId);

            return periodAllocation;
        }

        public async Task<Budgetperiodallocation> UpdateAsync(Budgetperiodallocation periodAllocation)
        {
            _context.Budgetperiodallocations.Update(periodAllocation);
            await _context.SaveChangesAsync();

            _logger.LogInformation(RepositoryMessages.PeriodAllocationUpdated, periodAllocation.PeriodAllocationId);

            return periodAllocation;
        }

        public async Task<bool> DeleteAsync(int periodAllocationId)
        {
            if (periodAllocationId <= 0)
                return false;

            var periodAllocation = await _context.Budgetperiodallocations.FindAsync(periodAllocationId);
            if (periodAllocation == null)
                return false;

            _context.Budgetperiodallocations.Remove(periodAllocation);
            await _context.SaveChangesAsync();

            _logger.LogInformation(RepositoryMessages.PeriodAllocationDeleted, periodAllocationId);

            return true;
        }

        public async Task<Budgetperiodallocation?> GetByIdAsync(int periodAllocationId)
        {
            if (periodAllocationId <= 0)
                return null;

            return await IncludeRelations()
                .FirstOrDefaultAsync(p => p.PeriodAllocationId == periodAllocationId);
        }

        public async Task<List<Budgetperiodallocation>> GetAllAsync()
        {
            return await IncludeRelations()
                .OrderByDescending(p => p.AllocatedAt)
                .ToListAsync();
        }

        public async Task<List<Budgetperiodallocation>> GetByBudgetIdAsync(int budgetId)
        {
            if (budgetId <= 0)
                return new List<Budgetperiodallocation>();

            return await IncludeRelations()
                .Where(p => p.BudgetId == budgetId)
                .OrderBy(p => p.PeriodYear)
                .ThenBy(p => p.Period)
                .ToListAsync();
        }

        public async Task<Budgetperiodallocation?> GetByBudgetPeriodYearAsync(int budgetId, string period, int periodYear)
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

        public async Task<PeriodAllocationResponseDto?> GetPeriodAllocationDetailsAsync(int periodAllocationId)
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

        public async Task<decimal> GetTotalAllocatedByBudgetAsync(int budgetId)
        {
            if (budgetId <= 0)
                return 0;

            return await _context.Budgetperiodallocations
                .Where(p => p.BudgetId == budgetId)
                .SumAsync(p => p.AllocatedAmount);
        }

        public async Task<decimal> GetTotalAllocatedByBudgetExceptIdAsync(int budgetId, int periodAllocationId)
        {
            if (budgetId <= 0)
                return 0;

            return await _context.Budgetperiodallocations
                .Where(p => p.BudgetId == budgetId && p.PeriodAllocationId != periodAllocationId)
                .SumAsync(p => p.AllocatedAmount);
        }

        public async Task<bool> HasSubAllocationsAsync(int budgetId, string period, int periodYear)
        {
            if (budgetId <= 0 || string.IsNullOrWhiteSpace(period) || periodYear <= 0)
                return false;

            return await _context.Budgetallocations
                .AnyAsync(a => a.BudgetId == budgetId
                             && a.Period == period
                             && a.PeriodYear == periodYear);
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
