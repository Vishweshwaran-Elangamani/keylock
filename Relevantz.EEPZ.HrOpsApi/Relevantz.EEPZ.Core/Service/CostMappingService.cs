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
    public class CostMappingService : ICostMappingService
    {
        private readonly ICostMappingRepository _costMappingRepository;
        private readonly ILogger<CostMappingService> _logger;
        private readonly IMapper _mapper;

        public CostMappingService(
            ICostMappingRepository costMappingRepository,
            ILogger<CostMappingService> logger,
            IMapper mapper)
        {
            _costMappingRepository = costMappingRepository;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<ApiResponseDto<HeadcountResponseDto>> GetDepartmentHeadcountAsync(int departmentId)
        {
            if (departmentId <= 0)
                throw new ArgumentException("Invalid department ID");

            var headcount = await _costMappingRepository.GetCurrentHeadcountAsync(departmentId);

            var response = new HeadcountResponseDto
            {
                DepartmentId = departmentId,
                DepartmentName = "Department",
                CurrentHeadcount = headcount,
                Timestamp = DateTime.Now
            };

            return ApiResponseDto<HeadcountResponseDto>
                .SuccessResponse(response, "Headcount retrieved successfully");
        }

        public async Task<ApiResponseDto<CostMappingResponseDto>> CreateCostMappingAsync(CreateCostMappingRequestDto request)
        {
            _logger.LogInformation("Creating cost mapping for department {DepartmentId}", request.DepartmentId);

            // Map DTO to Entity using Mapster
            var budget = _mapper.Map<Departmentbudget>(request);

            var createdBudget = await _costMappingRepository.CreateAsync(budget);

            // Map Entity back to Response DTO
            var response = _mapper.Map<CostMappingResponseDto>(createdBudget);

            _logger.LogInformation(RepositoryMessages.CostMappingCreated, createdBudget.BudgetId);

            return ApiResponseDto<CostMappingResponseDto>
                .SuccessResponse(response, "Cost mapping created successfully");
        }

        public async Task<ApiResponseDto<CostMappingResponseDto>> UpdateCostMappingAsync(UpdateCostMappingRequestDto request)
        {
            var budget = await _costMappingRepository.GetByIdAsync(request.BudgetId)
                ?? throw new ArgumentException("Cost mapping not found");

            // Update only provided fields
            if (request.TotalBudget.HasValue)
                budget.TotalBudget = request.TotalBudget.Value;

            if (request.AllocatedAmount.HasValue)
                budget.AllocatedAmount = request.AllocatedAmount.Value;

            if (request.UtilizedAmount.HasValue)
                budget.UtilizedAmount = request.UtilizedAmount.Value;

            if (request.Headcount.HasValue)
                budget.Headcount = request.Headcount.Value;

            // Recalculate metrics
            if (budget.Headcount.HasValue && budget.Headcount.Value > 0)
                budget.AvgCostPerEmployee = budget.TotalBudget / budget.Headcount.Value;

            if (budget.AllocatedAmount.HasValue && budget.AllocatedAmount.Value > 0)
                budget.UtilizationPercentage = (budget.UtilizedAmount ?? 0) / budget.AllocatedAmount.Value * 100;

            budget.UpdatedAt = DateTime.Now;

            var updatedBudget = await _costMappingRepository.UpdateAsync(budget);

            // Map to response DTO using Mapster
            var response = _mapper.Map<CostMappingResponseDto>(updatedBudget);

            return ApiResponseDto<CostMappingResponseDto>
                .SuccessResponse(response, "Cost mapping updated successfully");
        }

        public async Task<ApiResponseDto<CostMappingResponseDto>> GetCostMappingByIdAsync(int budgetId)
        {
            var budget = await _costMappingRepository.GetByIdAsync(budgetId)
                ?? throw new ArgumentException("Cost mapping not found");

            // Map using Mapster
            var response = _mapper.Map<CostMappingResponseDto>(budget);

            return ApiResponseDto<CostMappingResponseDto>
                .SuccessResponse(response, "Cost mapping retrieved successfully");
        }

        public async Task<ApiResponseDto<List<CostMappingResponseDto>>> GetAllCostMappingsAsync()
        {
            var budgets = await _costMappingRepository.GetAllAsync();
            
            // Map list using Mapster
            var response = _mapper.Map<List<CostMappingResponseDto>>(budgets);

            return ApiResponseDto<List<CostMappingResponseDto>>
                .SuccessResponse(response, $"Retrieved {response.Count} cost mappings");
        }

        public async Task<ApiResponseDto<List<CostMappingResponseDto>>> GetCostMappingsByDepartmentAsync(int departmentId)
        {
            var budgets = await _costMappingRepository.GetByDepartmentIdAsync(departmentId);
            
            // Map using Mapster
            var response = _mapper.Map<List<CostMappingResponseDto>>(budgets);

            return ApiResponseDto<List<CostMappingResponseDto>>
                .SuccessResponse(response, "Cost mappings retrieved");
        }

        public async Task<ApiResponseDto<List<CostMappingResponseDto>>> GetCostMappingsByFiscalYearAsync(int fiscalYear)
        {
            var budgets = await _costMappingRepository.GetByFiscalYearAsync(fiscalYear);
            
            // Map using Mapster
            var response = _mapper.Map<List<CostMappingResponseDto>>(budgets);

            return ApiResponseDto<List<CostMappingResponseDto>>
                .SuccessResponse(response, "Cost mappings retrieved");
        }

        public async Task<ApiResponseDto<bool>> DeleteCostMappingAsync(int budgetId)
        {
            var budget = await _costMappingRepository.GetByIdAsync(budgetId)
                ?? throw new ArgumentException("Cost mapping not found");

            var deleted = await _costMappingRepository.DeleteAsync(budgetId);

            if (!deleted)
                throw new InvalidOperationException("Failed to delete cost mapping");

            return ApiResponseDto<bool>.SuccessResponse(true, "Cost mapping deleted successfully");
        }
    }
}
