using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.IRepository;

namespace Relevantz.EEPZ.Core.Service
{
    public class FundAllocationService : IFundAllocationService
    {
        private readonly IFundAllocationRepository _fundAllocationRepository;
        private readonly ILogger<FundAllocationService> _logger;

        public FundAllocationService(
            IFundAllocationRepository fundAllocationRepository,
            ILogger<FundAllocationService> logger)
        {
            _fundAllocationRepository = fundAllocationRepository;
            _logger = logger;
        }

        public async Task<ApiResponseDto<FundAllocationResponseDto>> CreateFundAllocationAsync(CreateFundAllocationRequestDto request)
        {
            try
            {
                _logger.LogInformation(
                    "Service: Creating fund allocation. BudgetId: {BudgetId}, DepartmentId: {DepartmentId}, Type: {Type}, Amount: {Amount}, Period: {Period}, PeriodYear: {Year}",
                    request.BudgetId, request.DepartmentId, request.AllocationType, request.Amount, request.Period, request.PeriodYear);

                var budgetExists = await _fundAllocationRepository.BudgetExistsAsync(request.BudgetId);

                if (!budgetExists)
                {
                    return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                        $"Budget with ID {request.BudgetId} not found");
                }

                if (!string.IsNullOrEmpty(request.Period) && request.PeriodYear.HasValue)
                {
                    var (exists, availableInPeriod) = await _fundAllocationRepository
                        .ValidatePeriodAndGetAvailableAsync(request.BudgetId, request.Period, request.PeriodYear.Value);

                    if (!exists)
                    {
                        _logger.LogInformation("Period allocation not found for {Period} {Year}", request.Period, request.PeriodYear);
                        return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                            $"Period allocation not found for {request.Period} {request.PeriodYear}. Create period allocation first.");
                    }

                    if (request.Amount > availableInPeriod)
                    {
                        _logger.LogInformation("Amount exceeds period allocation. Available: {Available}", availableInPeriod);
                        return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                            $"Amount ({request.Amount:N2}) exceeds available period allocation ({availableInPeriod:N2})");
                    }

                    _logger.LogInformation("Period validation passed. Available: {Available}", availableInPeriod);
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

                var response = await _fundAllocationRepository.GetFundAllocationDetailsAsync(createdAllocation.AllocationId);

                _logger.LogInformation("Service: Fund allocation created with AllocationId: {Id}", createdAllocation.AllocationId);

                return ApiResponseDto<FundAllocationResponseDto>.SuccessResponse(
                    response!,
                    "Fund allocation created successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Service Error while creating fund allocation");
                return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                    $"An error occurred while creating fund allocation: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<FundAllocationResponseDto>> UpdateFundAllocationAsync(UpdateFundAllocationRequestDto request)
        {
            try
            {
                _logger.LogInformation("Updating fund allocation with AllocationId: {Id}", request.AllocationId);

                var allocation = await _fundAllocationRepository.GetByIdAsync(request.AllocationId);
                if (allocation == null)
                {
                    _logger.LogInformation("Fund allocation not found: {Id}", request.AllocationId);
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

                var response = await _fundAllocationRepository.GetFundAllocationDetailsAsync(updatedAllocation.AllocationId);

                _logger.LogInformation("Fund allocation updated successfully: {Id}", request.AllocationId);

                return ApiResponseDto<FundAllocationResponseDto>.SuccessResponse(
                    response!,
                    "Fund allocation updated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating fund allocation");
                return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                    "An error occurred while updating fund allocation");
            }
        }

        public async Task<ApiResponseDto<bool>> DeleteFundAllocationAsync(int allocationId)
        {
            try
            {
                _logger.LogInformation("Deleting fund allocation with AllocationId: {Id}", allocationId);

                var allocation = await _fundAllocationRepository.GetByIdAsync(allocationId);
                if (allocation == null)
                {
                    _logger.LogInformation("Fund allocation not found: {Id}", allocationId);
                    return ApiResponseDto<bool>.FailureResponse("Fund allocation not found");
                }

                var result = await _fundAllocationRepository.DeleteAsync(allocationId);

                if (result)
                {
                    _logger.LogInformation("Fund allocation deleted successfully: {Id}", allocationId);
                    return ApiResponseDto<bool>.SuccessResponse(true, "Fund allocation deleted successfully");
                }

                return ApiResponseDto<bool>.FailureResponse("Failed to delete fund allocation");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting fund allocation");
                return ApiResponseDto<bool>.FailureResponse(
                    "An error occurred while deleting fund allocation");
            }
        }

        public async Task<ApiResponseDto<FundAllocationResponseDto>> GetFundAllocationByIdAsync(int allocationId)
        {
            try
            {
                _logger.LogInformation("Fetching fund allocation with AllocationId: {Id}", allocationId);

                var response = await _fundAllocationRepository.GetFundAllocationDetailsAsync(allocationId);
                if (response == null)
                {
                    _logger.LogInformation("Fund allocation not found: {Id}", allocationId);
                    return ApiResponseDto<FundAllocationResponseDto>.FailureResponse("Fund allocation not found");
                }

                return ApiResponseDto<FundAllocationResponseDto>.SuccessResponse(
                    response,
                    "Fund allocation retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching fund allocation");
                return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                    "An error occurred while fetching fund allocation");
            }
        }

        public async Task<ApiResponseDto<List<FundAllocationResponseDto>>> GetAllFundAllocationsAsync()
        {
            try
            {
                _logger.LogInformation("Fetching all fund allocations");

                var allocations = await _fundAllocationRepository.GetAllAsync();
                var response = new List<FundAllocationResponseDto>();

                foreach (var allocation in allocations)
                {
                    var dto = await _fundAllocationRepository.GetFundAllocationDetailsAsync(allocation.AllocationId);
                    if (dto != null)
                    {
                        response.Add(dto);
                    }
                }

                return ApiResponseDto<List<FundAllocationResponseDto>>.SuccessResponse(
                    response,
                    $"Retrieved {response.Count} fund allocations");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching all fund allocations");
                return ApiResponseDto<List<FundAllocationResponseDto>>.FailureResponse(
                    "An error occurred while fetching fund allocations");
            }
        }

        public async Task<ApiResponseDto<List<FundAllocationResponseDto>>> GetFundAllocationsByDepartmentAsync(int departmentId)
        {
            try
            {
                _logger.LogInformation("Fetching fund allocations for DepartmentId: {DepartmentId}", departmentId);

                var allocations = await _fundAllocationRepository.GetByDepartmentIdAsync(departmentId);
                var response = new List<FundAllocationResponseDto>();

                foreach (var allocation in allocations)
                {
                    var dto = await _fundAllocationRepository.GetFundAllocationDetailsAsync(allocation.AllocationId);
                    if (dto != null)
                    {
                        response.Add(dto);
                    }
                }

                return ApiResponseDto<List<FundAllocationResponseDto>>.SuccessResponse(
                    response,
                    $"Retrieved {response.Count} fund allocations for department");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching fund allocations by department");
                return ApiResponseDto<List<FundAllocationResponseDto>>.FailureResponse(
                    "An error occurred while fetching fund allocations");
            }
        }

        public async Task<ApiResponseDto<List<FundAllocationResponseDto>>> GetFundAllocationsByTypeAsync(string allocationType)
        {
            try
            {
                _logger.LogInformation("Fetching fund allocations for Type: {Type}", allocationType);

                var allocations = await _fundAllocationRepository.GetByAllocationTypeAsync(allocationType);
                var response = new List<FundAllocationResponseDto>();

                foreach (var allocation in allocations)
                {
                    var dto = await _fundAllocationRepository.GetFundAllocationDetailsAsync(allocation.AllocationId);
                    if (dto != null)
                    {
                        response.Add(dto);
                    }
                }

                return ApiResponseDto<List<FundAllocationResponseDto>>.SuccessResponse(
                    response,
                    $"Retrieved {allocations.Count} fund allocations of type: {allocationType}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching fund allocations by type");
                return ApiResponseDto<List<FundAllocationResponseDto>>.FailureResponse(
                    "An error occurred while fetching fund allocations");
            }
        }
    }
}
