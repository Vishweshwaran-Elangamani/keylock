using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Constants;
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

                return await _context.Budgetallocations
                    .FirstOrDefaultAsync(b => b.AllocationId == allocationId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingFundAllocation, allocationId);
                throw;
            }
        }

        public async Task<List<Budgetallocation>> GetAllAsync()
        {
            try
            {
                return await BaseQuery().ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingAllFundAllocations);
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
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingFundAllocationsByDepartment, departmentId);
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
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingFundAllocationsByType, allocationType);
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
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingFundAllocationsByEmployee, employeeUserId);
                throw;
            }
        }

        public async Task<Budgetallocation> CreateAsync(Budgetallocation allocation)
        {
            try
            {
                _context.Budgetallocations.Add(allocation);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation(RepositoryMessages.FundAllocationCreated, allocation.AllocationId);
                
                return allocation;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorCreatingFundAllocation);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorCreatingFundAllocation);
                throw;
            }
        }

        public async Task<Budgetallocation> UpdateAsync(Budgetallocation allocation)
        {
            try
            {
                // Check if entity exists before updating
                var existingAllocation = await _context.Budgetallocations.FindAsync(allocation.AllocationId);
                if (existingAllocation == null)
                {
                    _logger.LogWarning(RepositoryMessages.FundAllocationNotFound, allocation.AllocationId);
                    throw new InvalidOperationException($"Fund allocation with ID {allocation.AllocationId} not found");
                }

                _context.Budgetallocations.Update(allocation);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation(RepositoryMessages.FundAllocationUpdated, allocation.AllocationId);
                
                return allocation;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorUpdatingFundAllocation, allocation.AllocationId);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorUpdatingFundAllocation, allocation.AllocationId);
                throw;
            }
        }

        public async Task<bool> DeleteAsync(int allocationId)
        {
            try
            {
                if (allocationId <= 0)
                    return false;

                // Use FindAsync for efficient delete - no need to load related entities
                var allocation = await _context.Budgetallocations.FindAsync(allocationId);
                if (allocation == null)
                    return false;

                _context.Budgetallocations.Remove(allocation);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation(RepositoryMessages.FundAllocationDeleted, allocationId);
                
                return true;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorDeletingFundAllocation, allocationId);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorDeletingFundAllocation, allocationId);
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
                _logger.LogError(ex, RepositoryMessages.ErrorCheckingBudgetExists, budgetId);
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
                _logger.LogError(ex, RepositoryMessages.ErrorValidatingPeriod, budgetId, period, periodYear);
                throw;
            }
        }

        public async Task<FundAllocationResponseDto?> GetFundAllocationDetailsAsync(int allocationId)
        {
            try
            {
                if (allocationId <= 0)
                    return null;

                var allocation = await _context.Budgetallocations
                    .Where(b => b.AllocationId == allocationId)
                    .Select(b => new
                    {
                        b.AllocationId,
                        b.BudgetId,
                        b.DepartmentId,
                        DepartmentName = _context.Departments
                            .Where(d => d.DepartmentId == b.DepartmentId)
                            .Select(d => d.DepartmentName)
                            .FirstOrDefault() ?? "Unknown",
                        b.EmployeeUserId,
                        EmployeeEmail = b.EmployeeUserId.HasValue
                            ? _context.Userauthentications
                                .Where(u => u.UserId == b.EmployeeUserId)
                                .Select(u => u.Email)
                                .FirstOrDefault()
                            : null,
                        b.AllocationType,
                        b.Amount,
                        b.GoalStatus,
                        b.Notes,
                        b.AllocatedByUserId,
                        AllocatedByEmail = _context.Userauthentications
                            .Where(u => u.UserId == b.AllocatedByUserId)
                            .Select(u => u.Email)
                            .FirstOrDefault() ?? "Unknown",
                        b.AllocatedAt,
                        b.UtilizedAmount,
                        b.UtilizationPercentage,
                        b.UpdatedAt,
                        b.Period,
                        b.PeriodYear
                    })
                    .FirstOrDefaultAsync();

                if (allocation == null)
                {
                    return null;
                }

                return new FundAllocationResponseDto
                {
                    AllocationId = allocation.AllocationId,
                    BudgetId = allocation.BudgetId ?? 0,
                    DepartmentId = allocation.DepartmentId,
                    DepartmentName = allocation.DepartmentName,
                    EmployeeUserId = allocation.EmployeeUserId,
                    EmployeeEmail = allocation.EmployeeEmail,
                    AllocationType = allocation.AllocationType ?? "Unknown",
                    Amount = allocation.Amount,
                    GoalStatus = allocation.GoalStatus,
                    Notes = allocation.Notes,
                    AllocatedByUserId = allocation.AllocatedByUserId,
                    AllocatedByEmail = allocation.AllocatedByEmail,
                    AllocatedAt = allocation.AllocatedAt,
                    UtilizedAmount = allocation.UtilizedAmount ?? 0,
                    UtilizationPercentage = allocation.UtilizationPercentage ?? 0,
                    UpdatedAt = allocation.UpdatedAt,
                    Period = allocation.Period,
                    PeriodYear = allocation.PeriodYear
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, RepositoryMessages.ErrorFetchingFundAllocationDetails, allocationId);
                throw;
            }
        }

        private IQueryable<Budgetallocation> BaseQuery()
        {
            return _context.Budgetallocations
                .OrderByDescending(b => b.AllocatedAt);
        }
    }
}
