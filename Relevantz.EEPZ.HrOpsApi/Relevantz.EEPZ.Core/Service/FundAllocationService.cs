using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
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
            var validationError = ValidateCreateRequest(request);
            if (validationError != null)
                return validationError;

            _logger.LogInformation(
                "Creating fund allocation. BudgetId: {BudgetId}, DepartmentId: {DepartmentId}, Type: {Type}, Amount: {Amount}",
                request.BudgetId, request.DepartmentId, request.AllocationType, request.Amount);

            var budgetExists = await _fundAllocationRepository.BudgetExistsAsync(request.BudgetId);
            if (!budgetExists)
            {
                return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                    string.Format(ServiceMessages.BudgetNotFoundForAllocation, request.BudgetId));
            }

            if (!string.IsNullOrEmpty(request.Period) && request.PeriodYear.HasValue)
            {
                var periodValidationError = await ValidatePeriodAllocation(request);
                if (periodValidationError != null)
                    return periodValidationError;
            }

            // Map using Mapster
            var allocation = _mapper.Map<Budgetallocation>(request);
            allocation.UtilizedAmount = 0;
            allocation.UtilizationPercentage = 0;
            allocation.AllocatedAt = DateTime.UtcNow;
            allocation.UpdatedAt = DateTime.UtcNow;
            allocation.GoalStatus = request.GoalStatus ?? "Pending";

            var createdAllocation = await _fundAllocationRepository.CreateAsync(allocation);

            var response = await _fundAllocationRepository
                .GetFundAllocationDetailsAsync(createdAllocation.AllocationId);

            _logger.LogInformation(
                "Fund allocation created successfully. AllocationId: {Id}",
                createdAllocation.AllocationId);

            return ApiResponseDto<FundAllocationResponseDto>.SuccessResponse(
                response!,
                ServiceMessages.FundAllocationCreatedSuccess);
        }

        public async Task<ApiResponseDto<FundAllocationResponseDto>> UpdateFundAllocationAsync(
            UpdateFundAllocationRequestDto request)
        {
            var validationError = ValidateUpdateRequest(request);
            if (validationError != null)
                return validationError;

            _logger.LogInformation(
                "Updating fund allocation. AllocationId: {Id}",
                request.AllocationId);

            var allocation = await _fundAllocationRepository.GetByIdAsync(request.AllocationId);
            if (allocation == null)
            {
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

            return ApiResponseDto<FundAllocationResponseDto>.SuccessResponse(
                response!,
                ServiceMessages.FundAllocationUpdatedSuccess);
        }

        public async Task<ApiResponseDto<bool>> DeleteFundAllocationAsync(int allocationId)
        {
            if (allocationId <= 0)
                return ApiResponseDto<bool>.FailureResponse(ServiceMessages.InvalidAllocationId);

            _logger.LogInformation("Deleting fund allocation {Id}", allocationId);

            var allocation = await _fundAllocationRepository.GetByIdAsync(allocationId);
            if (allocation == null)
            {
                return ApiResponseDto<bool>.FailureResponse(
                    ServiceMessages.FundAllocationNotFound);
            }

            var result = await _fundAllocationRepository.DeleteAsync(allocationId);

            return result
                ? ApiResponseDto<bool>.SuccessResponse(true, ServiceMessages.FundAllocationDeletedSuccess)
                : ApiResponseDto<bool>.FailureResponse(ServiceMessages.FailedToDeleteFundAllocation);
        }

        public async Task<ApiResponseDto<FundAllocationResponseDto>> GetFundAllocationByIdAsync(int allocationId)
        {
            if (allocationId <= 0)
                return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                    ServiceMessages.InvalidAllocationId);

            var response = await _fundAllocationRepository
                .GetFundAllocationDetailsAsync(allocationId);

            if (response == null)
            {
                return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                    ServiceMessages.FundAllocationNotFound);
            }

            return ApiResponseDto<FundAllocationResponseDto>.SuccessResponse(
                response,
                ServiceMessages.FundAllocationRetrievedSuccess);
        }

        public async Task<ApiResponseDto<List<FundAllocationResponseDto>>> GetAllFundAllocationsAsync()
        {
            _logger.LogInformation("Fetching all fund allocations");

            var allocations = await _fundAllocationRepository.GetAllAsync();
            var response = await BuildFundAllocationResponses(allocations);

            return ApiResponseDto<List<FundAllocationResponseDto>>.SuccessResponse(
                response,
                string.Format(ServiceMessages.FundAllocationsRetrievedSuccess, response.Count));
        }

        public async Task<ApiResponseDto<List<FundAllocationResponseDto>>> GetFundAllocationsByDepartmentAsync(
            int departmentId)
        {
            if (departmentId <= 0)
                return ApiResponseDto<List<FundAllocationResponseDto>>.FailureResponse(
                    ServiceMessages.InvalidDepartmentIdForAllocation);

            var allocations = await _fundAllocationRepository.GetByDepartmentIdAsync(departmentId);
            var response = await BuildFundAllocationResponses(allocations);

            return ApiResponseDto<List<FundAllocationResponseDto>>.SuccessResponse(
                response,
                string.Format(ServiceMessages.FundAllocationsByDepartmentRetrievedSuccess, response.Count));
        }

        public async Task<ApiResponseDto<List<FundAllocationResponseDto>>> GetFundAllocationsByTypeAsync(
            string allocationType)
        {
            if (string.IsNullOrWhiteSpace(allocationType))
                return ApiResponseDto<List<FundAllocationResponseDto>>.FailureResponse(
                    "Allocation type cannot be empty");

            var allocations = await _fundAllocationRepository
                .GetByAllocationTypeAsync(allocationType);
            var response = await BuildFundAllocationResponses(allocations);

            return ApiResponseDto<List<FundAllocationResponseDto>>.SuccessResponse(
                response,
                string.Format(
                    ServiceMessages.FundAllocationsByTypeRetrievedSuccess,
                    response.Count,
                    allocationType));
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
                return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                    string.Format(
                        ServiceMessages.PeriodAllocationNotFoundForFund,
                        request.Period,
                        request.PeriodYear));
            }

            if (request.Amount > availableInPeriod)
            {
                return ApiResponseDto<FundAllocationResponseDto>.FailureResponse(
                    string.Format(
                        ServiceMessages.AmountExceedsPeriodAllocation,
                        request.Amount,
                        availableInPeriod));
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
