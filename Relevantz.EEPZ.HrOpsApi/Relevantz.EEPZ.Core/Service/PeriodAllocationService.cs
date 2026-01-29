using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Data.IRepository;
using MapsterMapper;
using Mapster;
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
        private readonly IMapper _mapper;

        public PeriodAllocationService(
            IBudgetPeriodAllocationRepository periodAllocationRepository,
            IDepartmentBudgetRepository budgetRepository,
            ILogger<PeriodAllocationService> logger,
            IMapper mapper)
        {
            _periodAllocationRepository = periodAllocationRepository;
            _budgetRepository = budgetRepository;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<ApiResponseDto<PeriodAllocationResponseDto>> CreatePeriodAllocationAsync(
            CreatePeriodAllocationDto request)
        {
            var validationError = ValidateCreateRequest(request);
            if (validationError != null)
                return validationError;

            _logger.LogInformation(
                "Creating period allocation. BudgetId: {BudgetId}, Period: {Period}, Year: {Year}, Amount: {Amount}",
                request.BudgetId, request.Period, request.PeriodYear, request.AllocatedAmount);

            var budget = await _budgetRepository.GetByIdAsync(request.BudgetId);
            if (budget == null)
                return ApiResponseDto<PeriodAllocationResponseDto>
                    .FailureResponse(ServiceMessages.BudgetNotFound);

            var existingPeriod = await _periodAllocationRepository.GetByBudgetPeriodYearAsync(
                request.BudgetId, request.Period, request.PeriodYear);
            if (existingPeriod != null)
            {
                return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                    string.Format(
                        ServiceMessages.PeriodAllocationAlreadyExists,
                        request.Period,
                        request.PeriodYear));
            }

            var totalAllocated = await _periodAllocationRepository.GetTotalAllocatedByBudgetAsync(request.BudgetId);
            if (totalAllocated + request.AllocatedAmount > budget.TotalBudget)
            {
                return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                    string.Format(
                        ServiceMessages.TotalBudgetExceeded,
                        totalAllocated + request.AllocatedAmount,
                        budget.TotalBudget));
            }

            // Map using Mapster
            var periodAllocation = _mapper.Map<Budgetperiodallocation>(request);
            periodAllocation.UtilizedAmount = 0;
            periodAllocation.UtilizationPercentage = 0;
            periodAllocation.AllocatedAt = DateTime.UtcNow;

            var created = await _periodAllocationRepository.CreateAsync(periodAllocation);

            budget.AllocatedAmount = (budget.AllocatedAmount ?? 0) + request.AllocatedAmount;
            budget.UpdatedAt = DateTime.UtcNow;
            await _budgetRepository.UpdateAsync(budget);

            var response = await _periodAllocationRepository.GetPeriodAllocationDetailsAsync(
                created.PeriodAllocationId);

            return ApiResponseDto<PeriodAllocationResponseDto>.SuccessResponse(
                response!,
                ServiceMessages.PeriodAllocationCreatedSuccess);
        }

        public async Task<ApiResponseDto<PeriodAllocationResponseDto>> UpdatePeriodAllocationAsync(
            UpdatePeriodAllocationDto request)
        {
            var validationError = ValidateUpdateRequest(request);
            if (validationError != null)
                return validationError;

            _logger.LogInformation(
                "Updating period allocation {Id}",
                request.PeriodAllocationId);

            var periodAllocation = await _periodAllocationRepository.GetByIdAsync(request.PeriodAllocationId);
            if (periodAllocation == null)
                return ApiResponseDto<PeriodAllocationResponseDto>
                    .FailureResponse(ServiceMessages.PeriodAllocationNotFound);

            var budget = await _budgetRepository.GetByIdAsync(periodAllocation.BudgetId);
            if (budget == null)
                return ApiResponseDto<PeriodAllocationResponseDto>
                    .FailureResponse(ServiceMessages.ParentBudgetNotFound);

            var otherPeriodsTotal = await _periodAllocationRepository.GetTotalAllocatedByBudgetExceptIdAsync(
                periodAllocation.BudgetId,
                request.PeriodAllocationId);

            if (otherPeriodsTotal + request.AllocatedAmount > budget.TotalBudget)
            {
                var available = budget.TotalBudget - otherPeriodsTotal;
                return ApiResponseDto<PeriodAllocationResponseDto>.FailureResponse(
                    string.Format(ServiceMessages.UpdatedAmountExceedsBudget, available));
            }

            var oldAmount = periodAllocation.AllocatedAmount;
            periodAllocation.AllocatedAmount = request.AllocatedAmount;
            periodAllocation.Notes = request.Notes;
            periodAllocation.UpdatedAt = DateTime.UtcNow;

            if (periodAllocation.AllocatedAmount > 0)
            {
                periodAllocation.UtilizationPercentage = 
                    (periodAllocation.UtilizedAmount / periodAllocation.AllocatedAmount) * 100;
            }

            await _periodAllocationRepository.UpdateAsync(periodAllocation);

            budget.AllocatedAmount = (budget.AllocatedAmount ?? 0) - oldAmount + request.AllocatedAmount;
            budget.UpdatedAt = DateTime.UtcNow;
            await _budgetRepository.UpdateAsync(budget);

            var response = await _periodAllocationRepository.GetPeriodAllocationDetailsAsync(
                periodAllocation.PeriodAllocationId);

            return ApiResponseDto<PeriodAllocationResponseDto>.SuccessResponse(
                response!,
                ServiceMessages.PeriodAllocationUpdatedSuccess);
        }

        public async Task<ApiResponseDto<bool>> DeletePeriodAllocationAsync(int periodAllocationId)
        {
            if (periodAllocationId <= 0)
                return ApiResponseDto<bool>
                    .FailureResponse(ServiceMessages.InvalidPeriodAllocationId);

            _logger.LogInformation("Deleting period allocation {Id}", periodAllocationId);

            var periodAllocation = await _periodAllocationRepository.GetByIdAsync(periodAllocationId);
            if (periodAllocation == null)
                return ApiResponseDto<bool>
                    .FailureResponse(ServiceMessages.PeriodAllocationNotFound);

            var hasSubAllocations = await _periodAllocationRepository.HasSubAllocationsAsync(
                periodAllocation.BudgetId,
                periodAllocation.Period,
                periodAllocation.PeriodYear);

            if (hasSubAllocations)
                return ApiResponseDto<bool>
                    .FailureResponse(ServiceMessages.CannotDeleteWithSubAllocations);

            var budget = await _budgetRepository.GetByIdAsync(periodAllocation.BudgetId);
            var amount = periodAllocation.AllocatedAmount;

            var deleted = await _periodAllocationRepository.DeleteAsync(periodAllocationId);

            if (deleted && budget != null)
            {
                budget.AllocatedAmount = (budget.AllocatedAmount ?? 0) - amount;
                budget.UpdatedAt = DateTime.UtcNow;
                await _budgetRepository.UpdateAsync(budget);
            }

            return ApiResponseDto<bool>.SuccessResponse(
                true,
                ServiceMessages.PeriodAllocationDeletedSuccess);
        }

        public async Task<ApiResponseDto<PeriodAllocationResponseDto>> GetPeriodAllocationByIdAsync(
            int periodAllocationId)
        {
            if (periodAllocationId <= 0)
                return ApiResponseDto<PeriodAllocationResponseDto>
                    .FailureResponse(ServiceMessages.InvalidPeriodAllocationId);

            var response = await _periodAllocationRepository.GetPeriodAllocationDetailsAsync(periodAllocationId);

            if (response == null)
                return ApiResponseDto<PeriodAllocationResponseDto>
                    .FailureResponse(ServiceMessages.PeriodAllocationNotFound);

            return ApiResponseDto<PeriodAllocationResponseDto>.SuccessResponse(
                response,
                ServiceMessages.PeriodAllocationRetrievedSuccess);
        }

        public async Task<ApiResponseDto<List<PeriodAllocationResponseDto>>> GetAllPeriodAllocationsAsync()
        {
            var periodAllocations = await _periodAllocationRepository.GetAllAsync();
            var response = new List<PeriodAllocationResponseDto>();

            foreach (var allocation in periodAllocations)
            {
                var dto = await _periodAllocationRepository.GetPeriodAllocationDetailsAsync(
                    allocation.PeriodAllocationId);
                if (dto != null)
                    response.Add(dto);
            }

            return ApiResponseDto<List<PeriodAllocationResponseDto>>.SuccessResponse(
                response,
                string.Format(
                    ServiceMessages.PeriodAllocationsRetrievedSuccess,
                    response.Count));
        }

        public async Task<ApiResponseDto<List<PeriodAllocationResponseDto>>> GetPeriodAllocationsByBudgetAsync(
            int budgetId)
        {
            if (budgetId <= 0)
                return ApiResponseDto<List<PeriodAllocationResponseDto>>
                    .FailureResponse(ServiceMessages.InvalidBudgetId);

            var periodAllocations = await _periodAllocationRepository.GetByBudgetIdAsync(budgetId);
            var response = new List<PeriodAllocationResponseDto>();

            foreach (var allocation in periodAllocations)
            {
                var dto = await _periodAllocationRepository.GetPeriodAllocationDetailsAsync(
                    allocation.PeriodAllocationId);
                if (dto != null)
                    response.Add(dto);
            }

            return ApiResponseDto<List<PeriodAllocationResponseDto>>.SuccessResponse(
                response,
                string.Format(
                    ServiceMessages.PeriodAllocationsRetrievedSuccess,
                    response.Count));
        }

        #region Private Validation Methods

        private ApiResponseDto<PeriodAllocationResponseDto>? ValidateCreateRequest(
            CreatePeriodAllocationDto request)
        {
            if (request.BudgetId <= 0)
                return ApiResponseDto<PeriodAllocationResponseDto>
                    .FailureResponse(ServiceMessages.InvalidBudgetId);

            if (request.AllocatedAmount <= 0)
                return ApiResponseDto<PeriodAllocationResponseDto>
                    .FailureResponse(ServiceMessages.InvalidAllocatedAmount);

            if (string.IsNullOrWhiteSpace(request.Period))
                return ApiResponseDto<PeriodAllocationResponseDto>
                    .FailureResponse(ServiceMessages.InvalidPeriod);

            if (request.PeriodYear <= 0)
                return ApiResponseDto<PeriodAllocationResponseDto>
                    .FailureResponse(ServiceMessages.InvalidPeriodYear);

            return null;
        }

        private ApiResponseDto<PeriodAllocationResponseDto>? ValidateUpdateRequest(
            UpdatePeriodAllocationDto request)
        {
            if (request.PeriodAllocationId <= 0)
                return ApiResponseDto<PeriodAllocationResponseDto>
                    .FailureResponse(ServiceMessages.InvalidPeriodAllocationId);

            if (request.AllocatedAmount <= 0)
                return ApiResponseDto<PeriodAllocationResponseDto>
                    .FailureResponse(ServiceMessages.InvalidAllocatedAmount);

            return null;
        }

        #endregion
    }
}
