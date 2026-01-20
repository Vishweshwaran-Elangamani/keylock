using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;
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
    /// <summary>
    /// Service for managing budget period allocations with business rule validation.
    /// </summary>
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
                // Input validation
                var validationError = ValidateCreateRequest(request);
                if (validationError != null)
                    return validationError;

                _logger.LogInformation("Service: Creating period allocation. BudgetId: {BudgetId}, Period: {Period}, Year: {Year}, Amount: {Amount}",
                    request.BudgetId, request.Period, request.PeriodYear, request.AllocatedAmount);

                // Check if budget exists
                var budget = await _budgetRepository.GetByIdAsync(request.BudgetId);
                if (budget == null)
                    return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(ServiceMessages.BudgetNotFound);

                // Check for duplicate period
                var existingPeriod = await _periodAllocationRepository
                    .GetByBudgetPeriodYearAsync(request.BudgetId, request.Period, request.PeriodYear);

                if (existingPeriod != null)
                    return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                        string.Format(ServiceMessages.PeriodAllocationAlreadyExists, request.Period, request.PeriodYear));

                // Check if total would exceed budget
                var totalAllocatedInPeriods = await _periodAllocationRepository.GetTotalAllocatedByBudgetAsync(request.BudgetId);

                if (totalAllocatedInPeriods + request.AllocatedAmount > budget.TotalBudget)
                    return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                        string.Format(ServiceMessages.TotalBudgetExceeded, 
                            totalAllocatedInPeriods + request.AllocatedAmount, 
                            budget.TotalBudget));

                // Create period allocation
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

                // Update parent budget
                budget.AllocatedAmount = (budget.AllocatedAmount ?? 0) + request.AllocatedAmount;
                budget.UpdatedAt = DateTime.UtcNow;
                await _budgetRepository.UpdateAsync(budget);

                // Fetch details
                var response = await _periodAllocationRepository.GetPeriodAllocationDetailsAsync(created.PeriodAllocationId);

                _logger.LogInformation("Period allocation created with ID: {Id}", created.PeriodAllocationId);

                return ApiResponseDto<PeriodAllocationResponseDto>.SuccessResponse(
                    response!, ServiceMessages.PeriodAllocationCreatedSuccess);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database error while creating period allocation");
                return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                    ServiceMessages.ErrorCreatingPeriodAllocation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Service Error while creating period allocation");
                return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                    ServiceMessages.ErrorCreatingPeriodAllocation);
            }
        }

        public async Task<ApiResponseDto<PeriodAllocationResponseDto>> UpdatePeriodAllocationAsync(UpdatePeriodAllocationDto request)
        {
            try
            {
                // Input validation
                var validationError = ValidateUpdateRequest(request);
                if (validationError != null)
                    return validationError;

                _logger.LogInformation("Updating period allocation: {Id}", request.PeriodAllocationId);

                // Check if period allocation exists
                var periodAllocation = await _periodAllocationRepository.GetByIdAsync(request.PeriodAllocationId);
                if (periodAllocation == null)
                    return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                        ServiceMessages.PeriodAllocationNotFound);

                // Check if parent budget exists
                var budget = await _budgetRepository.GetByIdAsync(periodAllocation.BudgetId);
                if (budget == null)
                    return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                        ServiceMessages.ParentBudgetNotFound);

                // Check if updated amount would exceed budget
                var otherPeriodsTotal = await _periodAllocationRepository.GetTotalAllocatedByBudgetExceptIdAsync(
                    periodAllocation.BudgetId, request.PeriodAllocationId);

                if (otherPeriodsTotal + request.AllocatedAmount > budget.TotalBudget)
                {
                    var available = budget.TotalBudget - otherPeriodsTotal;
                    return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                        string.Format(ServiceMessages.UpdatedAmountExceedsBudget, available));
                }

                // Update period allocation
                var oldAmount = periodAllocation.AllocatedAmount;
                periodAllocation.AllocatedAmount = request.AllocatedAmount;
                periodAllocation.Notes = request.Notes;
                periodAllocation.UpdatedAt = DateTime.UtcNow;

                // Recalculate utilization percentage
                if (periodAllocation.AllocatedAmount > 0)
                    periodAllocation.UtilizationPercentage = (periodAllocation.UtilizedAmount / periodAllocation.AllocatedAmount) * 100;

                await _periodAllocationRepository.UpdateAsync(periodAllocation);

                // Update parent budget
                budget.AllocatedAmount = (budget.AllocatedAmount ?? 0) - oldAmount + request.AllocatedAmount;
                budget.UpdatedAt = DateTime.UtcNow;
                await _budgetRepository.UpdateAsync(budget);

                // Fetch details
                var response = await _periodAllocationRepository.GetPeriodAllocationDetailsAsync(periodAllocation.PeriodAllocationId);

                _logger.LogInformation("Period allocation updated successfully. Id: {Id}", periodAllocation.PeriodAllocationId);

                return ApiResponseDto<PeriodAllocationResponseDto>.SuccessResponse(
                    response!, ServiceMessages.PeriodAllocationUpdatedSuccess);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database error while updating period allocation");
                return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                    ServiceMessages.ErrorUpdatingPeriodAllocation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating period allocation");
                return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                    ServiceMessages.ErrorUpdatingPeriodAllocation);
            }
        }

        public async Task<ApiResponseDto<bool>> DeletePeriodAllocationAsync(int periodAllocationId)
        {
            try
            {
                // Input validation
                if (periodAllocationId <= 0)
                    return ApiResponseDto<bool>.FailureResponse(ServiceMessages.InvalidPeriodAllocationId);

                _logger.LogInformation("Deleting period allocation: {Id}", periodAllocationId);

                // Check if period allocation exists
                var periodAllocation = await _periodAllocationRepository.GetByIdAsync(periodAllocationId);
                if (periodAllocation == null)
                    return ApiResponseDto<bool>.FailureResponse(ServiceMessages.PeriodAllocationNotFound);

                // Check for sub-allocations
                var hasSubAllocations = await _periodAllocationRepository.HasSubAllocationsAsync(
                    periodAllocation.BudgetId, periodAllocation.Period, periodAllocation.PeriodYear);

                if (hasSubAllocations)
                    return ApiResponseDto<bool>.FailureResponse(ServiceMessages.CannotDeleteWithSubAllocations);

                // Get budget and delete
                var budget = await _budgetRepository.GetByIdAsync(periodAllocation.BudgetId);
                var amount = periodAllocation.AllocatedAmount;
                var result = await _periodAllocationRepository.DeleteAsync(periodAllocationId);

                // Update parent budget
                if (result && budget != null)
                {
                    budget.AllocatedAmount = (budget.AllocatedAmount ?? 0) - amount;
                    budget.UpdatedAt = DateTime.UtcNow;
                    await _budgetRepository.UpdateAsync(budget);
                }

                _logger.LogInformation("Period allocation deleted successfully. Id: {Id}", periodAllocationId);

                return ApiResponseDto<bool>.SuccessResponse(true, ServiceMessages.PeriodAllocationDeletedSuccess);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database error while deleting period allocation");
                return ApiResponseDto<bool>.FailureResponse(ServiceMessages.ErrorDeletingPeriodAllocation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting period allocation");
                return ApiResponseDto<bool>.FailureResponse(ServiceMessages.ErrorDeletingPeriodAllocation);
            }
        }

        public async Task<ApiResponseDto<PeriodAllocationResponseDto>> GetPeriodAllocationByIdAsync(int periodAllocationId)
        {
            try
            {
                // Input validation
                if (periodAllocationId <= 0)
                    return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                        ServiceMessages.InvalidPeriodAllocationId);

                var response = await _periodAllocationRepository.GetPeriodAllocationDetailsAsync(periodAllocationId);
                if (response == null)
                    return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                        ServiceMessages.PeriodAllocationNotFound);

                return ApiResponseDto<PeriodAllocationResponseDto>.SuccessResponse(
                    response, ServiceMessages.PeriodAllocationRetrievedSuccess);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching period allocation with ID: {Id}", periodAllocationId);
                return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                    ServiceMessages.ErrorFetchingPeriodAllocation);
            }
        }

        public async Task<ApiResponseDto<List<PeriodAllocationResponseDto>>> GetAllPeriodAllocationsAsync()
        {
            try
            {
                var periodAllocations = await _periodAllocationRepository.GetAllAsync();
                
                // Solve N+1 problem: Fetch all IDs and get details in batch if possible
                // Since repository doesn't have bulk details method, we minimize impact by tracking IDs
                var allocationIds = periodAllocations.Select(a => a.PeriodAllocationId).ToList();
                var response = new List<PeriodAllocationResponseDto>();

                // Process in batches or use existing method
                foreach (var allocationId in allocationIds)
                {
                    var dto = await _periodAllocationRepository.GetPeriodAllocationDetailsAsync(allocationId);
                    if (dto != null)
                        response.Add(dto);
                }

                _logger.LogInformation("Retrieved {Count} period allocations", response.Count);

                return ApiResponseDto<List<PeriodAllocationResponseDto>>.SuccessResponse(
                    response, string.Format(ServiceMessages.PeriodAllocationsRetrievedSuccess, response.Count));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching all period allocations");
                return ApiResponseDto<List<PeriodAllocationResponseDto>>.FailureResponse(
                    ServiceMessages.ErrorFetchingPeriodAllocations);
            }
        }

        public async Task<ApiResponseDto<List<PeriodAllocationResponseDto>>> GetPeriodAllocationsByBudgetAsync(int budgetId)
        {
            try
            {
                // Input validation
                if (budgetId <= 0)
                    return ApiResponseDto<List<PeriodAllocationResponseDto>>.FailureResponse(
                        ServiceMessages.InvalidBudgetId);

                _logger.LogInformation("Fetching period allocations for budget: {BudgetId}", budgetId);

                var periodAllocations = await _periodAllocationRepository.GetByBudgetIdAsync(budgetId);
                
                // Solve N+1 problem: Fetch all IDs and get details
                var allocationIds = periodAllocations.Select(a => a.PeriodAllocationId).ToList();
                var response = new List<PeriodAllocationResponseDto>();

                foreach (var allocationId in allocationIds)
                {
                    var dto = await _periodAllocationRepository.GetPeriodAllocationDetailsAsync(allocationId);
                    if (dto != null)
                        response.Add(dto);
                }

                _logger.LogInformation("Retrieved {Count} period allocations for budget {BudgetId}", response.Count, budgetId);

                return ApiResponseDto<List<PeriodAllocationResponseDto>>.SuccessResponse(
                    response, string.Format(ServiceMessages.PeriodAllocationsRetrievedSuccess, response.Count));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching period allocations for budget {BudgetId}", budgetId);
                return ApiResponseDto<List<PeriodAllocationResponseDto>>.FailureResponse(
                    ServiceMessages.ErrorFetchingPeriodAllocations);
            }
        }

        #region Private Validation Methods

        /// <summary>
        /// Validates the create period allocation request.
        /// </summary>
        private ApiResponseDto<PeriodAllocationResponseDto>? ValidateCreateRequest(CreatePeriodAllocationDto request)
        {
            if (request.BudgetId <= 0)
                return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(ServiceMessages.InvalidBudgetId);

            if (request.AllocatedAmount <= 0)
                return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(ServiceMessages.InvalidAllocatedAmount);

            if (string.IsNullOrWhiteSpace(request.Period))
                return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(ServiceMessages.InvalidPeriod);

            if (request.PeriodYear <= 0)
                return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(ServiceMessages.InvalidPeriodYear);

            return null;
        }

        /// <summary>
        /// Validates the update period allocation request.
        /// </summary>
        private ApiResponseDto<PeriodAllocationResponseDto>? ValidateUpdateRequest(UpdatePeriodAllocationDto request)
        {
            if (request.PeriodAllocationId <= 0)
                return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(ServiceMessages.InvalidPeriodAllocationId);

            if (request.AllocatedAmount <= 0)
                return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(ServiceMessages.InvalidAllocatedAmount);

            return null;
        }

        #endregion
    }
}
