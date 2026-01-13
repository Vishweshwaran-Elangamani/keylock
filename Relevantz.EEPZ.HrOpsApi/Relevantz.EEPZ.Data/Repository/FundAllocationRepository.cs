using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;

namespace Relevantz.EEPZ.Data.Repository
{
    public class FundAllocationRepository : IFundAllocationRepository
    {
        private readonly EEPZDbContext _context;

        public FundAllocationRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<Budgetallocation?> GetByIdAsync(int allocationId)
        {
            return await _context.Budgetallocations
                .FirstOrDefaultAsync(b => b.AllocationId == allocationId);
        }

        public async Task<List<Budgetallocation>> GetAllAsync()
        {
            return await _context.Budgetallocations
                .OrderByDescending(b => b.AllocatedAt)
                .ToListAsync();
        }

        public async Task<List<Budgetallocation>> GetByDepartmentIdAsync(int departmentId)
        {
            return await _context.Budgetallocations
                .Where(b => b.DepartmentId == departmentId)
                .OrderByDescending(b => b.AllocatedAt)
                .ToListAsync();
        }

        public async Task<List<Budgetallocation>> GetByAllocationTypeAsync(string allocationType)
        {
            return await _context.Budgetallocations
                .Where(b => b.AllocationType == allocationType)
                .OrderByDescending(b => b.AllocatedAt)
                .ToListAsync();
        }

        public async Task<List<Budgetallocation>> GetByEmployeeUserIdAsync(int employeeUserId)
        {
            return await _context.Budgetallocations
                .Where(b => b.EmployeeUserId == employeeUserId)
                .OrderByDescending(b => b.AllocatedAt)
                .ToListAsync();
        }

        public async Task<Budgetallocation> CreateAsync(Budgetallocation allocation)
        {
            _context.Budgetallocations.Add(allocation);
            await _context.SaveChangesAsync();
            return allocation;
        }

        public async Task<Budgetallocation> UpdateAsync(Budgetallocation allocation)
        {
            _context.Budgetallocations.Update(allocation);
            await _context.SaveChangesAsync();
            return allocation;
        }

        public async Task<bool> DeleteAsync(int allocationId)
        {
            var allocation = await GetByIdAsync(allocationId);
            if (allocation == null)
                return false;

            _context.Budgetallocations.Remove(allocation);
            await _context.SaveChangesAsync();
            return true;
        }

        // New: budget existence check
        public async Task<bool> BudgetExistsAsync(int budgetId)
        {
            return await _context.Departmentbudgets
                .AnyAsync(b => b.BudgetId == budgetId);
        }

        // New: period validation + available amount calculation
        public async Task<(bool Exists, decimal AvailableAmount)> ValidatePeriodAndGetAvailableAsync(
            int budgetId,
            string period,
            int periodYear)
        {
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

        // New: projection logic (was BuildFundAllocationResponse)
        public async Task<FundAllocationResponseDto?> GetFundAllocationDetailsAsync(int allocationId)
        {
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
    }
}
