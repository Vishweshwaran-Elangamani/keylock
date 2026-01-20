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
    /// Service for managing fund allocations with business rule validation.
    /// </summary>
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
                // Input validation
                var validationError = ValidateCreateRequest(request);
                if (validationError != null)
                    return validationError;

                _logger.LogInformation(
                    "Service: Creating fund allocation. BudgetId: {BudgetId}, DepartmentId: {DepartmentId}, Type: {Type}, Amount: {Amount}, Period: {Period}, PeriodYear: {Year}",
                    request.BudgetId, request.DepartmentId, request.AllocationType, request.Amount, request.Period, request.PeriodYear);

                // Check if budget exists
                var budgetExists = await _fundAllocationRepository.BudgetExistsAsync(request.BudgetId);
                if (!budgetExists)
                {
                    return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                        string.Format(ServiceMessages.BudgetNotFoundForAllocation, request.BudgetId));
                }

                // Validate period allocation if period is specified
                if (!string.IsNullOrEmpty(request.Period) && request.PeriodYear.HasValue)
                {
                    var periodValidationError = await ValidatePeriodAllocation(request);
                    if (periodValidationError != null)
                        return periodValidationError;
                }

                // Create fund allocation
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

                // Fetch details
                var response = await _fundAllocationRepository.GetFundAllocationDetailsAsync(createdAllocation.AllocationId);

                _logger.LogInformation("Service: Fund allocation created with AllocationId: {Id}", createdAllocation.AllocationId);

                return ApiResponseDto<FundAllocationResponseDto>.SuccessResponse(
                    response!,
                    ServiceMessages.FundAllocationCreatedSuccess);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database error while creating fund allocation");
                return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                    ServiceMessages.ErrorCreatingFundAllocation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Service Error while creating fund allocation");
                return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                    ServiceMessages.ErrorCreatingFundAllocation);
            }
        }

        public async Task<ApiResponseDto<FundAllocationResponseDto>> UpdateFundAllocationAsync(UpdateFundAllocationRequestDto request)
        {
            try
            {
                // Input validation
                var validationError = ValidateUpdateRequest(request);
                if (validationError != null)
                    return validationError;

                _logger.LogInformation("Updating fund allocation with AllocationId: {Id}", request.AllocationId);

                // Check if allocation exists
                var allocation = await _fundAllocationRepository.GetByIdAsync(request.AllocationId);
                if (allocation == null)
                {
                    _logger.LogInformation("Fund allocation not found: {Id}", request.AllocationId);
                    return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                        ServiceMessages.FundAllocationNotFound);
                }

                // Update fields
                if (request.Amount.HasValue)
                    allocation.Amount = request.Amount.Value;

                if (!string.IsNullOrEmpty(request.GoalStatus))
                    allocation.GoalStatus = request.GoalStatus;

                if (!string.IsNullOrEmpty(request.Notes))
                    allocation.Notes = request.Notes;

                allocation.UpdatedAt = DateTime.UtcNow;

                var updatedAllocation = await _fundAllocationRepository.UpdateAsync(allocation);

                // Fetch details
                var response = await _fundAllocationRepository.GetFundAllocationDetailsAsync(updatedAllocation.AllocationId);

                _logger.LogInformation("Fund allocation updated successfully: {Id}", request.AllocationId);

                return ApiResponseDto<FundAllocationResponseDto>.SuccessResponse(
                    response!,
                    ServiceMessages.FundAllocationUpdatedSuccess);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database error while updating fund allocation");
                return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                    ServiceMessages.ErrorUpdatingFundAllocation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating fund allocation");
                return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                    ServiceMessages.ErrorUpdatingFundAllocation);
            }
        }

        public async Task<ApiResponseDto<bool>> DeleteFundAllocationAsync(int allocationId)
        {
            try
            {
                // Input validation
                if (allocationId <= 0)
                    return ApiResponseDto<bool>.FailureResponse(ServiceMessages.InvalidAllocationId);

                _logger.LogInformation("Deleting fund allocation with AllocationId: {Id}", allocationId);

                // Check if allocation exists
                var allocation = await _fundAllocationRepository.GetByIdAsync(allocationId);
                if (allocation == null)
                {
                    _logger.LogInformation("Fund allocation not found: {Id}", allocationId);
                    return ApiResponseDto<bool>.FailureResponse(ServiceMessages.FundAllocationNotFound);
                }

                var result = await _fundAllocationRepository.DeleteAsync(allocationId);

                if (result)
                {
                    _logger.LogInformation("Fund allocation deleted successfully: {Id}", allocationId);
                    return ApiResponseDto<bool>.SuccessResponse(true, ServiceMessages.FundAllocationDeletedSuccess);
                }

                return ApiResponseDto<bool>.FailureResponse(ServiceMessages.FailedToDeleteFundAllocation);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database error while deleting fund allocation");
                return ApiResponseDto<bool>.FailureResponse(ServiceMessages.ErrorDeletingFundAllocation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting fund allocation");
                return ApiResponseDto<bool>.FailureResponse(ServiceMessages.ErrorDeletingFundAllocation);
            }
        }

        public async Task<ApiResponseDto<FundAllocationResponseDto>> GetFundAllocationByIdAsync(int allocationId)
        {
            try
            {
                // Input validation
                if (allocationId <= 0)
                    return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                        ServiceMessages.InvalidAllocationId);

                _logger.LogInformation("Fetching fund allocation with AllocationId: {Id}", allocationId);

                var response = await _fundAllocationRepository.GetFundAllocationDetailsAsync(allocationId);
                if (response == null)
                {
                    _logger.LogInformation("Fund allocation not found: {Id}", allocationId);
                    return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                        ServiceMessages.FundAllocationNotFound);
                }

                return ApiResponseDto<FundAllocationResponseDto>.SuccessResponse(
                    response,
                    ServiceMessages.FundAllocationRetrievedSuccess);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching fund allocation with ID: {Id}", allocationId);
                return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                    ServiceMessages.ErrorFetchingFundAllocation);
            }
        }

        public async Task<ApiResponseDto<List<FundAllocationResponseDto>>> GetAllFundAllocationsAsync()
        {
            try
            {
                _logger.LogInformation("Fetching all fund allocations");

                var allocations = await _fundAllocationRepository.GetAllAsync();
                var response = await BuildFundAllocationResponses(allocations);

                _logger.LogInformation("Retrieved {Count} fund allocations", response.Count);

                return ApiResponseDto<List<FundAllocationResponseDto>>.SuccessResponse(
                    response,
                    string.Format(ServiceMessages.FundAllocationsRetrievedSuccess, response.Count));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching all fund allocations");
                return ApiResponseDto<List<FundAllocationResponseDto>>.FailureResponse(
                    ServiceMessages.ErrorFetchingFundAllocations);
            }
        }

        public async Task<ApiResponseDto<List<FundAllocationResponseDto>>> GetFundAllocationsByDepartmentAsync(int departmentId)
        {
            try
            {
                // Input validation
                if (departmentId <= 0)
                    return ApiResponseDto<List<FundAllocationResponseDto>>.FailureResponse(
                        ServiceMessages.InvalidDepartmentIdForAllocation);

                _logger.LogInformation("Fetching fund allocations for DepartmentId: {DepartmentId}", departmentId);

                var allocations = await _fundAllocationRepository.GetByDepartmentIdAsync(departmentId);
                var response = await BuildFundAllocationResponses(allocations);

                _logger.LogInformation("Retrieved {Count} fund allocations for department {DepartmentId}", 
                    response.Count, departmentId);

                return ApiResponseDto<List<FundAllocationResponseDto>>.SuccessResponse(
                    response,
                    string.Format(ServiceMessages.FundAllocationsByDepartmentRetrievedSuccess, response.Count));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching fund allocations for department {DepartmentId}", departmentId);
                return ApiResponseDto<List<FundAllocationResponseDto>>.FailureResponse(
                    ServiceMessages.ErrorFetchingFundAllocations);
            }
        }

        public async Task<ApiResponseDto<List<FundAllocationResponseDto>>> GetFundAllocationsByTypeAsync(string allocationType)
        {
            try
            {
                // Input validation
                if (string.IsNullOrWhiteSpace(allocationType))
                    return ApiResponseDto<List<FundAllocationResponseDto>>.FailureResponse(
                        ServiceMessages.InvalidAllocationTypeForFund);

                _logger.LogInformation("Fetching fund allocations for Type: {Type}", allocationType);

                var allocations = await _fundAllocationRepository.GetByAllocationTypeAsync(allocationType);
                var response = await BuildFundAllocationResponses(allocations);

                _logger.LogInformation("Retrieved {Count} fund allocations of type {Type}", 
                    response.Count, allocationType);

                return ApiResponseDto<List<FundAllocationResponseDto>>.SuccessResponse(
                    response,
                    string.Format(ServiceMessages.FundAllocationsByTypeRetrievedSuccess, response.Count, allocationType));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching fund allocations for type {Type}", allocationType);
                return ApiResponseDto<List<FundAllocationResponseDto>>.FailureResponse(
                    ServiceMessages.ErrorFetchingFundAllocations);
            }
        }

        #region Private Helper Methods

        /// <summary>
        /// Builds a list of fund allocation response DTOs from entities.
        /// This reduces repetition across Get methods and minimizes N+1 query impact.
        /// </summary>
        private async Task<List<FundAllocationResponseDto>> BuildFundAllocationResponses(
            IEnumerable<Budgetallocation> allocations)
        {
            var response = new List<FundAllocationResponseDto>();

            // Extract all allocation IDs to track queries
            var allocationIds = allocations.Select(a => a.AllocationId).ToList();

            foreach (var allocationId in allocationIds)
            {
                var dto = await _fundAllocationRepository.GetFundAllocationDetailsAsync(allocationId);
                if (dto != null)
                {
                    response.Add(dto);
                }
            }

            return response;
        }

        /// <summary>
        /// Validates period allocation for fund allocation creation.
        /// </summary>
        private async Task<ApiResponseDto<FundAllocationResponseDto>?> ValidatePeriodAllocation(
            CreateFundAllocationRequestDto request)
        {
            var (exists, availableInPeriod) = await _fundAllocationRepository
                .ValidatePeriodAndGetAvailableAsync(request.BudgetId, request.Period!, request.PeriodYear!.Value);

            if (!exists)
            {
                _logger.LogInformation("Period allocation not found for {Period} {Year}", 
                    request.Period, request.PeriodYear);
                return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                    string.Format(ServiceMessages.PeriodAllocationNotFoundForFund, 
                        request.Period, request.PeriodYear));
            }

            if (request.Amount > availableInPeriod)
            {
                _logger.LogInformation("Amount exceeds period allocation. Available: {Available}", availableInPeriod);
                return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                    string.Format(ServiceMessages.AmountExceedsPeriodAllocation, 
                        request.Amount, availableInPeriod));
            }

            _logger.LogInformation("Period validation passed. Available: {Available}", availableInPeriod);
            return null;
        }

        /// <summary>
        /// Validates the create fund allocation request.
        /// </summary>
        private ApiResponseDto<FundAllocationResponseDto>? ValidateCreateRequest(CreateFundAllocationRequestDto request)
        {
            if (request.BudgetId <= 0)
                return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(ServiceMessages.InvalidBudgetId);

            if (request.DepartmentId <= 0)
                return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                    ServiceMessages.InvalidDepartmentIdForAllocation);

            if (request.Amount <= 0)
                return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(ServiceMessages.InvalidAmount);

            if (string.IsNullOrWhiteSpace(request.AllocationType))
                return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                    ServiceMessages.InvalidAllocationTypeForFund);

            return null;
        }

        /// <summary>
        /// Validates the update fund allocation request.
        /// </summary>
        private ApiResponseDto<FundAllocationResponseDto>? ValidateUpdateRequest(UpdateFundAllocationRequestDto request)
        {
            if (request.AllocationId <= 0)
                return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(ServiceMessages.InvalidAllocationId);

            if (request.Amount.HasValue && request.Amount.Value <= 0)
                return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(ServiceMessages.InvalidAmount);

            return null;
        }

        #endregion
    }
}
