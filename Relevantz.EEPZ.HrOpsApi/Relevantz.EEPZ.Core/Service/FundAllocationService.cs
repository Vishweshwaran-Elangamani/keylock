using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.IRepository;
using MapsterMapper;
using Mapster;

namespace Relevantz.EEPZ.Core.Service
{
    /// <summary>
    /// Service for managing fund allocations with business rule validation.
    /// </summary>
    public class FundAllocationService : IFundAllocationService
    {
        private readonly IFundAllocationRepository _fundAllocationRepository;
        private readonly ILogger<FundAllocationService> _logger;
        private readonly IMapper _mapper;

        public FundAllocationService(
            IFundAllocationRepository fundAllocationRepository,
            ILogger<FundAllocationService> logger,
            IMapper mapper)
        {
            _fundAllocationRepository = fundAllocationRepository;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<ApiResponseDto<FundAllocationResponseDto>> CreateFundAllocationAsync(
            CreateFundAllocationRequestDto request)
        {
            try
            {
                var validationError = ValidateCreateRequest(request);
                if (validationError != null)
                {
                    EEPZBusinessLog.LogServiceWarning("Fund allocation creation validation failed: {Message}", validationError.Message);
                    return validationError;
                }

                EEPZBusinessLog.LogServiceInformation(
                    "Creating fund allocation. BudgetId: {BudgetId}, DepartmentId: {DepartmentId}, Type: {Type}, Amount: {Amount}",
                    request.BudgetId, request.DepartmentId, request.AllocationType, request.Amount);

                var budgetExists = await _fundAllocationRepository.BudgetExistsAsync(request.BudgetId);
                if (!budgetExists)
                {
                    EEPZBusinessLog.LogServiceWarning("Budget {BudgetId} not found for allocation", request.BudgetId);
                    return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                        string.Format(ServiceMessages.BudgetNotFoundForAllocation, request.BudgetId));
                }

                if (!string.IsNullOrEmpty(request.Period) && request.PeriodYear.HasValue)
                {
                    var periodValidationError = await ValidatePeriodAllocation(request);
                    if (periodValidationError != null)
                    {
                        EEPZBusinessLog.LogServiceWarning("Period validation failed for allocation: {Message}", periodValidationError.Message);
                        return periodValidationError;
                    }
                }

                var allocation = _mapper.Map<Budgetallocation>(request);
                allocation.UtilizedAmount = 0;
                allocation.UtilizationPercentage = 0;
                allocation.AllocatedAt = DateTime.UtcNow;
                allocation.UpdatedAt = DateTime.UtcNow;
                allocation.GoalStatus = request.GoalStatus ?? "Pending";

                var createdAllocation = await _fundAllocationRepository.CreateAsync(allocation);

                var response = await _fundAllocationRepository
                    .GetFundAllocationDetailsAsync(createdAllocation.AllocationId);

                EEPZBusinessLog.LogServiceInformation(
                    "Fund allocation created successfully. AllocationId: {Id}, BudgetId: {BudgetId}, Amount: {Amount}",
                    createdAllocation.AllocationId, request.BudgetId, request.Amount);

                return ApiResponseDto<FundAllocationResponseDto>.SuccessResponse(
                    response!, ServiceMessages.FundAllocationCreatedSuccess);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error creating fund allocation", ex);
                throw;
            }
        }

        public async Task<ApiResponseDto<FundAllocationResponseDto>> UpdateFundAllocationAsync(
            UpdateFundAllocationRequestDto request)
        {
            try
            {
                var validationError = ValidateUpdateRequest(request);
                if (validationError != null)
                {
                    EEPZBusinessLog.LogServiceWarning("Fund allocation update validation failed: {Message}", validationError.Message);
                    return validationError;
                }

                EEPZBusinessLog.LogServiceInformation("Updating fund allocation. AllocationId: {Id}", request.AllocationId);

                var allocation = await _fundAllocationRepository.GetByIdAsync(request.AllocationId);
                if (allocation == null)
                {
                    EEPZBusinessLog.LogServiceWarning("Fund allocation {AllocationId} not found", request.AllocationId);
                    return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                        ServiceMessages.FundAllocationNotFound);
                }

                if (request.Amount.HasValue)
                    allocation.Amount = request.Amount.Value;

                if (!string.IsNullOrEmpty(request.GoalStatus))
                    allocation.GoalStatus = request.GoalStatus;

                if (!string.IsNullOrEmpty(request.Notes))
                    allocation.Notes = request.Notes;

                allocation.UpdatedAt = DateTime.UtcNow;

                var updatedAllocation = await _fundAllocationRepository.UpdateAsync(allocation);

                var response = await _fundAllocationRepository
                    .GetFundAllocationDetailsAsync(updatedAllocation.AllocationId);

                EEPZBusinessLog.LogServiceInformation("Fund allocation {AllocationId} updated successfully", request.AllocationId);

                return ApiResponseDto<FundAllocationResponseDto>.SuccessResponse(
                    response!, ServiceMessages.FundAllocationUpdatedSuccess);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error updating fund allocation {AllocationId}", ex, request.AllocationId);
                throw;
            }
        }

        public async Task<ApiResponseDto<bool>> DeleteFundAllocationAsync(int allocationId)
        {
            try
            {
                if (allocationId <= 0)
                {
                    EEPZBusinessLog.LogServiceWarning("Invalid allocation ID for deletion: {AllocationId}", allocationId);
                    return ApiResponseDto<bool>.FailureResponse(ServiceMessages.InvalidAllocationId);
                }

                EEPZBusinessLog.LogServiceInformation("Deleting fund allocation {Id}", allocationId);

                var allocation = await _fundAllocationRepository.GetByIdAsync(allocationId);
                if (allocation == null)
                {
                    EEPZBusinessLog.LogServiceWarning("Fund allocation {AllocationId} not found for deletion", allocationId);
                    return ApiResponseDto<bool>.FailureResponse(ServiceMessages.FundAllocationNotFound);
                }

                var result = await _fundAllocationRepository.DeleteAsync(allocationId);

                if (result)
                {
                    EEPZBusinessLog.LogServiceInformation("Fund allocation {AllocationId} deleted successfully", allocationId);
                    return ApiResponseDto<bool>.SuccessResponse(true, ServiceMessages.FundAllocationDeletedSuccess);
                }
                else
                {
                    EEPZBusinessLog.LogServiceError("Failed to delete fund allocation {AllocationId}", null, allocationId);
                    return ApiResponseDto<bool>.FailureResponse(ServiceMessages.FailedToDeleteFundAllocation);
                }
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error deleting fund allocation {AllocationId}", ex, allocationId);
                throw;
            }
        }

        public async Task<ApiResponseDto<FundAllocationResponseDto>> GetFundAllocationByIdAsync(int allocationId)
        {
            try
            {
                if (allocationId <= 0)
                {
                    EEPZBusinessLog.LogServiceWarning("Invalid allocation ID: {AllocationId}", allocationId);
                    return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(ServiceMessages.InvalidAllocationId);
                }

                EEPZBusinessLog.LogServiceInformation("Fetching fund allocation {AllocationId}", allocationId);

                var response = await _fundAllocationRepository.GetFundAllocationDetailsAsync(allocationId);

                if (response == null)
                {
                    EEPZBusinessLog.LogServiceWarning("Fund allocation {AllocationId} not found", allocationId);
                    return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(ServiceMessages.FundAllocationNotFound);
                }

                EEPZBusinessLog.LogServiceInformation("Fund allocation {AllocationId} retrieved successfully", allocationId);

                return ApiResponseDto<FundAllocationResponseDto>.SuccessResponse(
                    response, ServiceMessages.FundAllocationRetrievedSuccess);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error fetching fund allocation {AllocationId}", ex, allocationId);
                throw;
            }
        }

        public async Task<ApiResponseDto<List<FundAllocationResponseDto>>> GetAllFundAllocationsAsync()
        {
            try
            {
                EEPZBusinessLog.LogServiceInformation("Fetching all fund allocations");

                var allocations = await _fundAllocationRepository.GetAllAsync();
                var response = await BuildFundAllocationResponses(allocations);

                EEPZBusinessLog.LogServiceInformation("Retrieved {Count} fund allocations", response.Count);

                return ApiResponseDto<List<FundAllocationResponseDto>>.SuccessResponse(
                    response, string.Format(ServiceMessages.FundAllocationsRetrievedSuccess, response.Count));
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error fetching all fund allocations", ex);
                throw;
            }
        }

        public async Task<ApiResponseDto<List<FundAllocationResponseDto>>> GetFundAllocationsByDepartmentAsync(
            int departmentId)
        {
            try
            {
                if (departmentId <= 0)
                {
                    EEPZBusinessLog.LogServiceWarning("Invalid department ID: {DepartmentId}", departmentId);
                    return ApiResponseDto<List<FundAllocationResponseDto>>.FailureResponse(
                        ServiceMessages.InvalidDepartmentIdForAllocation);
                }

                EEPZBusinessLog.LogServiceInformation("Fetching fund allocations for department {DepartmentId}", departmentId);

                var allocations = await _fundAllocationRepository.GetByDepartmentIdAsync(departmentId);
                var response = await BuildFundAllocationResponses(allocations);

                EEPZBusinessLog.LogServiceInformation("Retrieved {Count} fund allocations for department {DepartmentId}", 
                    response.Count, departmentId);

                return ApiResponseDto<List<FundAllocationResponseDto>>.SuccessResponse(
                    response, string.Format(ServiceMessages.FundAllocationsByDepartmentRetrievedSuccess, response.Count));
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error fetching fund allocations for department {DepartmentId}", ex, departmentId);
                throw;
            }
        }

        public async Task<ApiResponseDto<List<FundAllocationResponseDto>>> GetFundAllocationsByTypeAsync(
            string allocationType)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(allocationType))
                {
                    EEPZBusinessLog.LogServiceWarning("Empty allocation type provided");
                    return ApiResponseDto<List<FundAllocationResponseDto>>.FailureResponse("Allocation type cannot be empty");
                }

                 allocationType = allocationType.Trim().ToLowerInvariant();

                EEPZBusinessLog.LogServiceInformation("Fetching fund allocations by type: {AllocationType}", allocationType);

                var allocations = await _fundAllocationRepository.GetByAllocationTypeAsync(allocationType);
                var response = await BuildFundAllocationResponses(allocations);

                EEPZBusinessLog.LogServiceInformation("Retrieved {Count} fund allocations for type {AllocationType}", 
                    response.Count, allocationType);

                return ApiResponseDto<List<FundAllocationResponseDto>>.SuccessResponse(
                    response,
                    string.Format(ServiceMessages.FundAllocationsByTypeRetrievedSuccess, response.Count, allocationType));
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error fetching fund allocations by type {AllocationType}", ex, allocationType);
                throw;
            }
        }

        #region Private Helper Methods

        private async Task<List<FundAllocationResponseDto>> BuildFundAllocationResponses(
            IEnumerable<Budgetallocation> allocations)
        {
            var response = new List<FundAllocationResponseDto>();
            foreach (var allocation in allocations)
            {
                var dto = await _fundAllocationRepository
                    .GetFundAllocationDetailsAsync(allocation.AllocationId);
                if (dto != null)
                    response.Add(dto);
            }
            return response;
        }

        private async Task<ApiResponseDto<FundAllocationResponseDto>?> ValidatePeriodAllocation(
            CreateFundAllocationRequestDto request)
        {
            var (exists, availableInPeriod) = await _fundAllocationRepository.ValidatePeriodAndGetAvailableAsync(
                request.BudgetId,
                request.Period!,
                request.PeriodYear!.Value);

            if (!exists)
            {
                EEPZBusinessLog.LogServiceWarning("Period allocation not found: Budget={BudgetId}, Period={Period}, Year={Year}",
                    request.BudgetId, request.Period, request.PeriodYear);

                return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                    string.Format(ServiceMessages.PeriodAllocationNotFoundForFund, request.Period, request.PeriodYear));
            }

            if (request.Amount > availableInPeriod)
            {
                EEPZBusinessLog.LogServiceWarning("Amount {Amount} exceeds available period allocation {Available}",
                    request.Amount, availableInPeriod);

                return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                    string.Format(ServiceMessages.AmountExceedsPeriodAllocation, request.Amount, availableInPeriod));
            }

            return null;
        }

        private ApiResponseDto<FundAllocationResponseDto>? ValidateCreateRequest(
            CreateFundAllocationRequestDto request)
        {
            if (request.BudgetId <= 0)
                return ApiResponseDto<FundAllocationResponseDto>
                    .FailureResponse(ServiceMessages.InvalidBudgetId);

            if (request.DepartmentId <= 0)
                return ApiResponseDto<FundAllocationResponseDto>
                    .FailureResponse(ServiceMessages.InvalidDepartmentIdForAllocation);

            if (request.Amount <= 0)
                return ApiResponseDto<FundAllocationResponseDto>
                    .FailureResponse(ServiceMessages.InvalidAmount);

            if (string.IsNullOrWhiteSpace(request.AllocationType))
                return ApiResponseDto<FundAllocationResponseDto>
                    .FailureResponse("Allocation type is required");

            return null;
        }

        private ApiResponseDto<FundAllocationResponseDto>? ValidateUpdateRequest(
            UpdateFundAllocationRequestDto request)
        {
            if (request.AllocationId <= 0)
                return ApiResponseDto<FundAllocationResponseDto>
                    .FailureResponse(ServiceMessages.InvalidAllocationId);

            if (request.Amount.HasValue && request.Amount.Value <= 0)
                return ApiResponseDto<FundAllocationResponseDto>
                    .FailureResponse(ServiceMessages.InvalidAmount);

            return null;
        }

        #endregion
    }
}
