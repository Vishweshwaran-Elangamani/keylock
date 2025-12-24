using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;

namespace Relevantz.EEPZ.Core.Service
{
    public class PeriodAllocationService : IPeriodAllocationService
    {
        private readonly IBudgetPeriodAllocationRepository _periodAllocationRepository;
        private readonly EEPZDbContext _context;

        public PeriodAllocationService(
            IBudgetPeriodAllocationRepository periodAllocationRepository,
            EEPZDbContext context)
        {
            _periodAllocationRepository = periodAllocationRepository;
            _context = context;
        }

        public async Task<ApiResponseDto<PeriodAllocationResponseDto>> CreatePeriodAllocationAsync(CreatePeriodAllocationDto request)
        {
            try
            {
                Console.WriteLine($" Service: Creating period allocation");
                Console.WriteLine($" BudgetId: {request.BudgetId}");
                Console.WriteLine($" Period: {request.Period}");
                Console.WriteLine($" Year: {request.PeriodYear}");
                Console.WriteLine($" Amount: {request.AllocatedAmount}");

                // Validate budget exists
                var budget = await _context.Departmentbudgets
                    .FirstOrDefaultAsync(b => b.BudgetId == request.BudgetId);

                if (budget == null)
                {
                    return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                        "Budget not found");
                }

                // Check if period already exists
                var existingPeriod = await _periodAllocationRepository
                    .GetByBudgetPeriodYearAsync(request.BudgetId, request.Period, request.PeriodYear);

                if (existingPeriod != null)
                {
                    return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                        $"Period allocation already exists for {request.Period} {request.PeriodYear}");
                }

                // Calculate total already allocated across all periods
                var totalAllocatedInPeriods = await _context.Budgetperiodallocations
                    .Where(p => p.BudgetId == request.BudgetId)
                    .SumAsync(p => p.AllocatedAmount);

                // Check if new allocation exceeds total budget
                if (totalAllocatedInPeriods + request.AllocatedAmount > budget.TotalBudget)
                {
                    return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                        $"Total period allocations ({totalAllocatedInPeriods + request.AllocatedAmount:N2}) would exceed total budget ({budget.TotalBudget:N2})");
                }

                var periodAllocation = new Budgetperiodallocation
                {
                    BudgetId = request.BudgetId,
                    Period = request.Period,
                    PeriodYear = request.PeriodYear,
                    AllocatedAmount = request.AllocatedAmount,
                    UtilizedAmount = 0,
                    UtilizationPercentage = 0,
                    AllocatedByUserId = request.AllocatedByUserId,
                    AllocatedAt = DateTime.UtcNow,
                    Notes = request.Notes
                };

                var created = await _periodAllocationRepository.CreateAsync(periodAllocation);

                // Update parent budget's allocated amount
                budget.AllocatedAmount = (budget.AllocatedAmount ?? 0) + request.AllocatedAmount;
                budget.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var response = await BuildPeriodAllocationResponse(created.PeriodAllocationId);

                Console.WriteLine($" Period allocation created with ID: {created.PeriodAllocationId}");

                return ApiResponseDto<PeriodAllocationResponseDto>.SuccessResponse(
                    response,
                    "Period allocation created successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Service Error: {ex.Message}");
                Console.WriteLine($"Stack Trace: {ex.StackTrace}");
                return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                    $"An error occurred while creating period allocation: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<PeriodAllocationResponseDto>> UpdatePeriodAllocationAsync(UpdatePeriodAllocationDto request)
        {
            try
            {
                Console.WriteLine($" Updating period allocation: {request.PeriodAllocationId}");

                var periodAllocation = await _periodAllocationRepository
                    .GetByIdAsync(request.PeriodAllocationId);

                if (periodAllocation == null)
                {
                    return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                        "Period allocation not found");
                }

                // Get parent budget
                var budget = await _context.Departmentbudgets
                    .FirstOrDefaultAsync(b => b.BudgetId == periodAllocation.BudgetId);

                if (budget == null)
                {
                    return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                        "Parent budget not found");
                }

                // Calculate other periods' total
                var otherPeriodsTotal = await _context.Budgetperiodallocations
                    .Where(p => p.BudgetId == periodAllocation.BudgetId
                             && p.PeriodAllocationId != request.PeriodAllocationId)
                    .SumAsync(p => p.AllocatedAmount);

                // Check if update exceeds budget
                if (otherPeriodsTotal + request.AllocatedAmount > budget.TotalBudget)
                {
                    return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                        $"Updated amount would exceed total budget. Available: {budget.TotalBudget - otherPeriodsTotal:N2}");
                }

                var oldAmount = periodAllocation.AllocatedAmount;
                periodAllocation.AllocatedAmount = request.AllocatedAmount;
                periodAllocation.Notes = request.Notes;
                periodAllocation.UpdatedAt = DateTime.UtcNow;

                // Recalculate utilization percentage
                if (periodAllocation.AllocatedAmount > 0)
                {
                    periodAllocation.UtilizationPercentage =
                        (periodAllocation.UtilizedAmount / periodAllocation.AllocatedAmount) * 100;
                }

                await _periodAllocationRepository.UpdateAsync(periodAllocation);

                // Update parent budget's allocated amount
                budget.AllocatedAmount = (budget.AllocatedAmount ?? 0) - oldAmount + request.AllocatedAmount;
                budget.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var response = await BuildPeriodAllocationResponse(periodAllocation.PeriodAllocationId);

                Console.WriteLine($" Period allocation updated successfully");

                return ApiResponseDto<PeriodAllocationResponseDto>.SuccessResponse(
                    response,
                    "Period allocation updated successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Error updating period allocation: {ex.Message}");
                return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                    $"An error occurred while updating period allocation: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<bool>> DeletePeriodAllocationAsync(int periodAllocationId)
        {
            try
            {
                Console.WriteLine($" Deleting period allocation: {periodAllocationId}");

                var periodAllocation = await _periodAllocationRepository
                    .GetByIdAsync(periodAllocationId);

                if (periodAllocation == null)
                {
                    return ApiResponseDto<bool>.FailureResponse("Period allocation not found");
                }

                // Check if any HR allocations exist for this period
                var hasSubAllocations = await _context.Budgetallocations
                    .AnyAsync(a => a.BudgetId == periodAllocation.BudgetId
                                && a.Period == periodAllocation.Period
                                && a.PeriodYear == periodAllocation.PeriodYear);

                if (hasSubAllocations)
                {
                    return ApiResponseDto<bool>.FailureResponse(
                        "Cannot delete period allocation with existing sub-allocations. Delete sub-allocations first.");
                }

                // Get parent budget
                var budget = await _context.Departmentbudgets
                    .FirstOrDefaultAsync(b => b.BudgetId == periodAllocation.BudgetId);

                var amount = periodAllocation.AllocatedAmount;
                var result = await _periodAllocationRepository.DeleteAsync(periodAllocationId);

                if (result && budget != null)
                {
                    // Update parent budget
                    budget.AllocatedAmount = (budget.AllocatedAmount ?? 0) - amount;
                    budget.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                Console.WriteLine($" Period allocation deleted successfully");

                return ApiResponseDto<bool>.SuccessResponse(
                    true,
                    "Period allocation deleted successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Error deleting period allocation: {ex.Message}");
                return ApiResponseDto<bool>.FailureResponse(
                    $"An error occurred while deleting period allocation: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<PeriodAllocationResponseDto>> GetPeriodAllocationByIdAsync(int periodAllocationId)
        {
            try
            {
                var periodAllocation = await _periodAllocationRepository.GetByIdAsync(periodAllocationId);

                if (periodAllocation == null)
                {
                    return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                        "Period allocation not found");
                }

                var response = await BuildPeriodAllocationResponse(periodAllocationId);

                return ApiResponseDto<PeriodAllocationResponseDto>.SuccessResponse(
                    response,
                    "Period allocation retrieved successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Error fetching period allocation: {ex.Message}");
                return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                    $"An error occurred while fetching period allocation: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<List<PeriodAllocationResponseDto>>> GetAllPeriodAllocationsAsync()
        {
            try
            {
                var periodAllocations = await _periodAllocationRepository.GetAllAsync();
                var response = new List<PeriodAllocationResponseDto>();

                foreach (var allocation in periodAllocations)
                {
                    response.Add(await BuildPeriodAllocationResponse(allocation.PeriodAllocationId));
                }

                return ApiResponseDto<List<PeriodAllocationResponseDto>>.SuccessResponse(
                    response,
                    $"Retrieved {response.Count} period allocations");
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Error fetching all period allocations: {ex.Message}");
                return ApiResponseDto<List<PeriodAllocationResponseDto>>.FailureResponse(
                    $"An error occurred while fetching period allocations: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<List<PeriodAllocationResponseDto>>> GetPeriodAllocationsByBudgetAsync(int budgetId)
        {
            try
            {
                Console.WriteLine($" Fetching period allocations for budget: {budgetId}");

                var periodAllocations = await _periodAllocationRepository.GetByBudgetIdAsync(budgetId);
                var response = new List<PeriodAllocationResponseDto>();

                foreach (var allocation in periodAllocations)
                {
                    response.Add(await BuildPeriodAllocationResponse(allocation.PeriodAllocationId));
                }

                return ApiResponseDto<List<PeriodAllocationResponseDto>>.SuccessResponse(
                    response,
                    $"Retrieved {response.Count} period allocations");
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Error fetching period allocations by budget: {ex.Message}");
                return ApiResponseDto<List<PeriodAllocationResponseDto>>.FailureResponse(
                    $"An error occurred while fetching period allocations: {ex.Message}");
            }
        }

        private async Task<PeriodAllocationResponseDto> BuildPeriodAllocationResponse(int periodAllocationId)
        {
            var periodAllocation = await _context.Budgetperiodallocations
                .Include(p => p.Budget)
                    .ThenInclude(b => b.Department)
                .Include(p => p.AllocatedByUser)
                .FirstOrDefaultAsync(p => p.PeriodAllocationId == periodAllocationId);

            if (periodAllocation == null)
            {
                throw new Exception($"Period allocation with ID {periodAllocationId} not found");
            }

            // Count sub-allocations for this period
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
    }
}
