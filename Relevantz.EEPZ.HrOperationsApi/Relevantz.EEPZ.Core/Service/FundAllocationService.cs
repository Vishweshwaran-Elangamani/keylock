using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Microsoft.EntityFrameworkCore;

namespace Relevantz.EEPZ.Core.Service
{
    public class FundAllocationService : IFundAllocationService
    {
        private readonly IFundAllocationRepository _fundAllocationRepository;
        private readonly EEPZDbContext _context;

        public FundAllocationService(
            IFundAllocationRepository fundAllocationRepository,
            EEPZDbContext context)
        {
            _fundAllocationRepository = fundAllocationRepository;
            _context = context;
        }

        public async Task<ApiResponseDto<FundAllocationResponseDto>> CreateFundAllocationAsync(CreateFundAllocationRequestDto request)
        {
            try
            {
                Console.WriteLine($" Service: Creating fund allocation");
                Console.WriteLine($"   BudgetId: {request.BudgetId}");
                Console.WriteLine($"   DepartmentId: {request.DepartmentId}");
                Console.WriteLine($"   Type: {request.AllocationType}");
                Console.WriteLine($"   Amount: {request.Amount}");
                Console.WriteLine($"   Period: {request.Period}");
                Console.WriteLine($"   PeriodYear: {request.PeriodYear}");

                // Validate budget exists
                var budgetExists = await _context.Departmentbudgets
                    .AnyAsync(b => b.BudgetId == request.BudgetId);

                if (!budgetExists)
                {
                    return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                        $"Budget with ID {request.BudgetId} not found");
                }

                // Validate period allocation if period is specified
                if (!string.IsNullOrEmpty(request.Period) && request.PeriodYear.HasValue)
                {
                    var periodAllocation = await _context.Budgetperiodallocations
                        .FirstOrDefaultAsync(p => p.BudgetId == request.BudgetId 
                                                && p.Period == request.Period 
                                                && p.PeriodYear == request.PeriodYear.Value);

                    if (periodAllocation == null)
                    {
                        Console.WriteLine($" Period allocation not found for {request.Period} {request.PeriodYear}");
                        return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                            $"Period allocation not found for {request.Period} {request.PeriodYear}. Create period allocation first.");
                    }

                    // Check if amount exceeds period allocation
                    var periodSubAllocationsTotal = await _context.Budgetallocations
                        .Where(a => a.BudgetId == request.BudgetId 
                                 && a.Period == request.Period 
                                 && a.PeriodYear == request.PeriodYear)
                        .SumAsync(a => a.Amount);

                    var availableInPeriod = periodAllocation.AllocatedAmount - periodSubAllocationsTotal;

                    if (request.Amount > availableInPeriod)
                    {
                        Console.WriteLine($" Amount exceeds period allocation. Available: {availableInPeriod}");
                        return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                            $"Amount ({request.Amount:N2}) exceeds available period allocation ({availableInPeriod:N2})");
                    }

                    Console.WriteLine($" Period validation passed. Available: {availableInPeriod}");
                }

                var allocation = new Budgetallocation
                {
                    BudgetId = request.BudgetId,
                    DepartmentId = request.DepartmentId,
                    EmployeeUserId = request.EmployeeUserId,
                    AllocationType = request.AllocationType,
                    Amount = request.Amount,
                    GoalStatus = request.GoalStatus ?? "Pending",
                    Notes = request.Notes,
                    AllocatedByUserId = request.AllocatedByUserId,
                    AllocatedAt = DateTime.UtcNow,
                    UtilizedAmount = 0,
                    UtilizationPercentage = 0,
                    UpdatedAt = DateTime.UtcNow,
                    Period = request.Period, 
                    PeriodYear = request.PeriodYear  
                };

                var createdAllocation = await _fundAllocationRepository.CreateAsync(allocation);

                var response = await BuildFundAllocationResponse(createdAllocation.AllocationId);

                Console.WriteLine($" Service: Fund allocation created with AllocationId: {createdAllocation.AllocationId}");
               
                return ApiResponseDto<FundAllocationResponseDto>.SuccessResponse(
                    response,
                    "Fund allocation created successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Service Error: {ex.Message}");
                Console.WriteLine($"Stack Trace: {ex.StackTrace}");
                return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                    $"An error occurred while creating fund allocation: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<FundAllocationResponseDto>> UpdateFundAllocationAsync(UpdateFundAllocationRequestDto request)
        {
            try
            {
                Console.WriteLine($"Updating fund allocation with AllocationId: {request.AllocationId}");

                var allocation = await _fundAllocationRepository.GetByIdAsync(request.AllocationId);
                if (allocation == null)
                {
                    Console.WriteLine($"Fund allocation not found: {request.AllocationId}");
                    return ApiResponseDto<FundAllocationResponseDto>.FailureResponse("Fund allocation not found");
                }

                if (request.Amount.HasValue)
                    allocation.Amount = request.Amount.Value;

                if (!string.IsNullOrEmpty(request.GoalStatus))
                    allocation.GoalStatus = request.GoalStatus;

                if (!string.IsNullOrEmpty(request.Notes))
                    allocation.Notes = request.Notes;

                allocation.UpdatedAt = DateTime.UtcNow;

                var updatedAllocation = await _fundAllocationRepository.UpdateAsync(allocation);

                var response = await BuildFundAllocationResponse(updatedAllocation.AllocationId);

                Console.WriteLine($"Fund allocation updated successfully: {request.AllocationId}");
                return ApiResponseDto<FundAllocationResponseDto>.SuccessResponse(
                    response,
                    "Fund allocation updated successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating fund allocation: {ex.Message}");
                return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                    "An error occurred while updating fund allocation");
            }
        }

        public async Task<ApiResponseDto<bool>> DeleteFundAllocationAsync(int allocationId)
        {
            try
            {
                Console.WriteLine($"Deleting fund allocation with AllocationId: {allocationId}");

                var allocation = await _fundAllocationRepository.GetByIdAsync(allocationId);
                if (allocation == null)
                {
                    Console.WriteLine($"Fund allocation not found: {allocationId}");
                    return ApiResponseDto<bool>.FailureResponse("Fund allocation not found");
                }

                var result = await _fundAllocationRepository.DeleteAsync(allocationId);

                if (result)
                {
                    Console.WriteLine($"Fund allocation deleted successfully: {allocationId}");
                    return ApiResponseDto<bool>.SuccessResponse(true, "Fund allocation deleted successfully");
                }

                return ApiResponseDto<bool>.FailureResponse("Failed to delete fund allocation");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting fund allocation: {ex.Message}");
                return ApiResponseDto<bool>.FailureResponse(
                    "An error occurred while deleting fund allocation");
            }
        }

        public async Task<ApiResponseDto<FundAllocationResponseDto>> GetFundAllocationByIdAsync(int allocationId)
        {
            try
            {
                Console.WriteLine($"Fetching fund allocation with AllocationId: {allocationId}");

                var allocation = await _fundAllocationRepository.GetByIdAsync(allocationId);
                if (allocation == null)
                {
                    Console.WriteLine($"Fund allocation not found: {allocationId}");
                    return ApiResponseDto<FundAllocationResponseDto>.FailureResponse("Fund allocation not found");
                }

                var response = await BuildFundAllocationResponse(allocationId);
                return ApiResponseDto<FundAllocationResponseDto>.SuccessResponse(
                    response,
                    "Fund allocation retrieved successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching fund allocation: {ex.Message}");
                return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                    "An error occurred while fetching fund allocation");
            }
        }

        public async Task<ApiResponseDto<List<FundAllocationResponseDto>>> GetAllFundAllocationsAsync()
        {
            try
            {
                Console.WriteLine("Fetching all fund allocations");

                var allocations = await _fundAllocationRepository.GetAllAsync();
                var response = new List<FundAllocationResponseDto>();

                foreach (var allocation in allocations)
                {
                    response.Add(await BuildFundAllocationResponse(allocation.AllocationId));
                }

                return ApiResponseDto<List<FundAllocationResponseDto>>.SuccessResponse(
                    response,
                    $"Retrieved {response.Count} fund allocations");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching all fund allocations: {ex.Message}");
                return ApiResponseDto<List<FundAllocationResponseDto>>.FailureResponse(
                    "An error occurred while fetching fund allocations");
            }
        }

        public async Task<ApiResponseDto<List<FundAllocationResponseDto>>> GetFundAllocationsByDepartmentAsync(int departmentId)
        {
            try
            {
                Console.WriteLine($"Fetching fund allocations for DepartmentId: {departmentId}");

                var allocations = await _fundAllocationRepository.GetByDepartmentIdAsync(departmentId);
                var response = new List<FundAllocationResponseDto>();

                foreach (var allocation in allocations)
                {
                    response.Add(await BuildFundAllocationResponse(allocation.AllocationId));
                }

                return ApiResponseDto<List<FundAllocationResponseDto>>.SuccessResponse(
                    response,
                    $"Retrieved {response.Count} fund allocations for department");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching fund allocations by department: {ex.Message}");
                return ApiResponseDto<List<FundAllocationResponseDto>>.FailureResponse(
                    "An error occurred while fetching fund allocations");
            }
        }

        public async Task<ApiResponseDto<List<FundAllocationResponseDto>>> GetFundAllocationsByTypeAsync(string allocationType)
        {
            try
            {
                Console.WriteLine($"Fetching fund allocations for Type: {allocationType}");

                var allocations = await _fundAllocationRepository.GetByAllocationTypeAsync(allocationType);
                var response = new List<FundAllocationResponseDto>();

                foreach (var allocation in allocations)
                {
                    response.Add(await BuildFundAllocationResponse(allocation.AllocationId));
                }

                return ApiResponseDto<List<FundAllocationResponseDto>>.SuccessResponse(
                    response,
                    $"Retrieved {allocations.Count} fund allocations of type: {allocationType}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching fund allocations by type: {ex.Message}");
                return ApiResponseDto<List<FundAllocationResponseDto>>.FailureResponse(
                    "An error occurred while fetching fund allocations");
            }
        }

        private async Task<FundAllocationResponseDto> BuildFundAllocationResponse(int allocationId)
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
        throw new Exception($"Fund allocation with ID {allocationId} not found");
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
