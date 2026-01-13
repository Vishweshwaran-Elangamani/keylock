using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.IRepository; 
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Core.Service
{
    public class PeriodAllocationService : IPeriodAllocationService
    {
        private readonly IBudgetPeriodAllocationRepository _periodAllocationRepository;
        private readonly IDepartmentBudgetRepository _budgetRepository;
        private readonly ILogger<PeriodAllocationService> _logger;

        public PeriodAllocationService(
            IBudgetPeriodAllocationRepository periodAllocationRepository,
            IDepartmentBudgetRepository budgetRepository,
            ILogger<PeriodAllocationService> logger)
        {
            _periodAllocationRepository = periodAllocationRepository;
            _budgetRepository = budgetRepository;
            _logger = logger;
        }

        public async Task<ApiResponseDto<PeriodAllocationResponseDto>> CreatePeriodAllocationAsync(CreatePeriodAllocationDto request)
        {
            try
            {
                _logger.LogInformation("Service: Creating period allocation. BudgetId: {BudgetId}, Period: {Period}, Year: {Year}, Amount: {Amount}",
                    request.BudgetId, request.Period, request.PeriodYear, request.AllocatedAmount);

                var budget = await _budgetRepository.GetByIdAsync(request.BudgetId);
                if (budget == null)
                    return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse("Budget not found");

                var existingPeriod = await _periodAllocationRepository
                    .GetByBudgetPeriodYearAsync(request.BudgetId, request.Period, request.PeriodYear);

                if (existingPeriod != null)
                    return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                        $"Period allocation already exists for {request.Period} {request.PeriodYear}");

                var totalAllocatedInPeriods = await _periodAllocationRepository.GetTotalAllocatedByBudgetAsync(request.BudgetId);

                if (totalAllocatedInPeriods + request.AllocatedAmount > budget.TotalBudget)
                    return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                        $"Total period allocations ({totalAllocatedInPeriods + request.AllocatedAmount:N2}) would exceed total budget ({budget.TotalBudget:N2})");

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

                budget.AllocatedAmount = (budget.AllocatedAmount ?? 0) + request.AllocatedAmount;
                budget.UpdatedAt = DateTime.UtcNow;
                await _budgetRepository.UpdateAsync(budget);

                var response = await _periodAllocationRepository.GetPeriodAllocationDetailsAsync(created.PeriodAllocationId);

                _logger.LogInformation("Period allocation created with ID: {Id}", created.PeriodAllocationId);

                return ApiResponseDto<PeriodAllocationResponseDto>.SuccessResponse(
                    response!, "Period allocation created successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Service Error while creating period allocation");
                return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                    $"An error occurred while creating period allocation: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<PeriodAllocationResponseDto>> UpdatePeriodAllocationAsync(UpdatePeriodAllocationDto request)
        {
            try
            {
                _logger.LogInformation("Updating period allocation: {Id}", request.PeriodAllocationId);

                var periodAllocation = await _periodAllocationRepository.GetByIdAsync(request.PeriodAllocationId);
                if (periodAllocation == null)
                    return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse("Period allocation not found");

                var budget = await _budgetRepository.GetByIdAsync(periodAllocation.BudgetId);
                if (budget == null)
                    return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse("Parent budget not found");

                var otherPeriodsTotal = await _periodAllocationRepository.GetTotalAllocatedByBudgetExceptIdAsync(
                    periodAllocation.BudgetId, request.PeriodAllocationId);

                if (otherPeriodsTotal + request.AllocatedAmount > budget.TotalBudget)
                    return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                        $"Updated amount would exceed total budget. Available: {budget.TotalBudget - otherPeriodsTotal:N2}");

                var oldAmount = periodAllocation.AllocatedAmount;
                periodAllocation.AllocatedAmount = request.AllocatedAmount;
                periodAllocation.Notes = request.Notes;
                periodAllocation.UpdatedAt = DateTime.UtcNow;

                if (periodAllocation.AllocatedAmount > 0)
                    periodAllocation.UtilizationPercentage = (periodAllocation.UtilizedAmount / periodAllocation.AllocatedAmount) * 100;

                await _periodAllocationRepository.UpdateAsync(periodAllocation);

                budget.AllocatedAmount = (budget.AllocatedAmount ?? 0) - oldAmount + request.AllocatedAmount;
                budget.UpdatedAt = DateTime.UtcNow;
                await _budgetRepository.UpdateAsync(budget);

                var response = await _periodAllocationRepository.GetPeriodAllocationDetailsAsync(periodAllocation.PeriodAllocationId);

                _logger.LogInformation("Period allocation updated successfully. Id: {Id}", periodAllocation.PeriodAllocationId);

                return ApiResponseDto<PeriodAllocationResponseDto>.SuccessResponse(
                    response!, "Period allocation updated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating period allocation");
                return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                    $"An error occurred while updating period allocation: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<bool>> DeletePeriodAllocationAsync(int periodAllocationId)
        {
            try
            {
                _logger.LogInformation("Deleting period allocation: {Id}", periodAllocationId);

                var periodAllocation = await _periodAllocationRepository.GetByIdAsync(periodAllocationId);
                if (periodAllocation == null)
                    return ApiResponseDto<bool>.FailureResponse("Period allocation not found");

                var hasSubAllocations = await _periodAllocationRepository.HasSubAllocationsAsync(
                    periodAllocation.BudgetId, periodAllocation.Period, periodAllocation.PeriodYear);

                if (hasSubAllocations)
                    return ApiResponseDto<bool>.FailureResponse(
                        "Cannot delete period allocation with existing sub-allocations. Delete sub-allocations first.");

                var budget = await _budgetRepository.GetByIdAsync(periodAllocation.BudgetId);
                var amount = periodAllocation.AllocatedAmount;
                var result = await _periodAllocationRepository.DeleteAsync(periodAllocationId);

                if (result && budget != null)
                {
                    budget.AllocatedAmount = (budget.AllocatedAmount ?? 0) - amount;
                    budget.UpdatedAt = DateTime.UtcNow;
                    await _budgetRepository.UpdateAsync(budget);
                }

                _logger.LogInformation("Period allocation deleted successfully. Id: {Id}", periodAllocationId);

                return ApiResponseDto<bool>.SuccessResponse(true, "Period allocation deleted successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting period allocation");
                return ApiResponseDto<bool>.FailureResponse($"An error occurred while deleting period allocation: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<PeriodAllocationResponseDto>> GetPeriodAllocationByIdAsync(int periodAllocationId)
        {
            try
            {
                var response = await _periodAllocationRepository.GetPeriodAllocationDetailsAsync(periodAllocationId);
                if (response == null)
                    return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse("Period allocation not found");

                return ApiResponseDto<PeriodAllocationResponseDto>.SuccessResponse(response, "Period allocation retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching period allocation");
                return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse($"An error occurred while fetching period allocation: {ex.Message}");
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
                    var dto = await _periodAllocationRepository.GetPeriodAllocationDetailsAsync(allocation.PeriodAllocationId);
                    if (dto != null)
                        response.Add(dto);
                }

                return ApiResponseDto<List<PeriodAllocationResponseDto>>.SuccessResponse(
                    response, $"Retrieved {response.Count} period allocations");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching all period allocations");
                return ApiResponseDto<List<PeriodAllocationResponseDto>>.FailureResponse(
                    $"An error occurred while fetching period allocations: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<List<PeriodAllocationResponseDto>>> GetPeriodAllocationsByBudgetAsync(int budgetId)
        {
            try
            {
                _logger.LogInformation("Fetching period allocations for budget: {BudgetId}", budgetId);

                var periodAllocations = await _periodAllocationRepository.GetByBudgetIdAsync(budgetId);
                var response = new List<PeriodAllocationResponseDto>();

                foreach (var allocation in periodAllocations)
                {
                    var dto = await _periodAllocationRepository.GetPeriodAllocationDetailsAsync(allocation.PeriodAllocationId);
                    if (dto != null)
                        response.Add(dto);
                }

                return ApiResponseDto<List<PeriodAllocationResponseDto>>.SuccessResponse(
                    response, $"Retrieved {response.Count} period allocations");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching period allocations by budget");
                return ApiResponseDto<List<PeriodAllocationResponseDto>>.FailureResponse(
                    $"An error occurred while fetching period allocations: {ex.Message}");
            }
        }
    }
}
