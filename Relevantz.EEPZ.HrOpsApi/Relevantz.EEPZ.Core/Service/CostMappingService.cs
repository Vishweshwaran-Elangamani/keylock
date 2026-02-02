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
            {
                EEPZBusinessLog.LogServiceWarning("Invalid department ID provided: {DepartmentId}", departmentId);
                throw new ArgumentException("Invalid department ID");
            }


            EEPZBusinessLog.LogServiceInformation("Fetching headcount for department {DepartmentId}", departmentId);


            var headcount = await _costMappingRepository.GetCurrentHeadcountAsync(departmentId);


            var response = new HeadcountResponseDto
            {
                DepartmentId = departmentId,
                DepartmentName = "Department",
                CurrentHeadcount = headcount,
                Timestamp = DateTime.Now
            };


            EEPZBusinessLog.LogServiceInformation("Headcount retrieved for department {DepartmentId}: {Headcount}", 
                departmentId, headcount);


            return ApiResponseDto<HeadcountResponseDto>
                .SuccessResponse(response, "Headcount retrieved successfully");
        }


        public async Task<ApiResponseDto<CostMappingResponseDto>> CreateCostMappingAsync(CreateCostMappingRequestDto request)
        {
            EEPZBusinessLog.LogServiceInformation("Creating cost mapping for department {DepartmentId}, fiscal year {FiscalYear}", 
                request.DepartmentId, request.FiscalYear);


            var budget = _mapper.Map<Departmentbudget>(request);


            var createdBudget = await _costMappingRepository.CreateAsync(budget);


            var response = _mapper.Map<CostMappingResponseDto>(createdBudget);


            EEPZBusinessLog.LogServiceInformation("Cost mapping created successfully: BudgetId={BudgetId}, Department={DepartmentId}", 
                createdBudget.BudgetId, request.DepartmentId);


            return ApiResponseDto<CostMappingResponseDto>
                .SuccessResponse(response, "Cost mapping created successfully");
        }


        public async Task<ApiResponseDto<CostMappingResponseDto>> UpdateCostMappingAsync(UpdateCostMappingRequestDto request)
        {
            EEPZBusinessLog.LogServiceInformation("Updating cost mapping {BudgetId}", request.BudgetId);


            var budget = await _costMappingRepository.GetByIdAsync(request.BudgetId);
            
            if (budget == null)
            {
                EEPZBusinessLog.LogServiceWarning("Cost mapping not found: {BudgetId}", request.BudgetId);
                throw new ArgumentException("Cost mapping not found");
            }


            if (request.TotalBudget.HasValue)
                budget.TotalBudget = request.TotalBudget.Value;


            if (request.AllocatedAmount.HasValue)
                budget.AllocatedAmount = request.AllocatedAmount.Value;


            if (request.UtilizedAmount.HasValue)
                budget.UtilizedAmount = request.UtilizedAmount.Value;


            if (request.Headcount.HasValue)
                budget.Headcount = request.Headcount.Value;


            if (budget.Headcount.HasValue && budget.Headcount.Value > 0)
                budget.AvgCostPerEmployee = budget.TotalBudget / budget.Headcount.Value;


            if (budget.AllocatedAmount.HasValue && budget.AllocatedAmount.Value > 0)
                budget.UtilizationPercentage = (budget.UtilizedAmount ?? 0) / budget.AllocatedAmount.Value * 100;


            budget.UpdatedAt = DateTime.Now;


            var updatedBudget = await _costMappingRepository.UpdateAsync(budget);


            var response = _mapper.Map<CostMappingResponseDto>(updatedBudget);


            EEPZBusinessLog.LogServiceInformation("Cost mapping {BudgetId} updated successfully", request.BudgetId);


            return ApiResponseDto<CostMappingResponseDto>
                .SuccessResponse(response, "Cost mapping updated successfully");
        }


        public async Task<ApiResponseDto<CostMappingResponseDto>> GetCostMappingByIdAsync(int budgetId)
        {
            EEPZBusinessLog.LogServiceInformation("Fetching cost mapping {BudgetId}", budgetId);


            var budget = await _costMappingRepository.GetByIdAsync(budgetId);
            
            if (budget == null)
            {
                EEPZBusinessLog.LogServiceWarning("Cost mapping {BudgetId} not found", budgetId);
                throw new ArgumentException("Cost mapping not found");
            }


            var response = _mapper.Map<CostMappingResponseDto>(budget);


            EEPZBusinessLog.LogServiceInformation("Cost mapping {BudgetId} retrieved successfully", budgetId);


            return ApiResponseDto<CostMappingResponseDto>
                .SuccessResponse(response, "Cost mapping retrieved successfully");
        }


        public async Task<ApiResponseDto<List<CostMappingResponseDto>>> GetAllCostMappingsAsync()
        {
            EEPZBusinessLog.LogServiceInformation("Fetching all cost mappings");


            var budgets = await _costMappingRepository.GetAllAsync();
            
            var response = _mapper.Map<List<CostMappingResponseDto>>(budgets);


            EEPZBusinessLog.LogServiceInformation("Retrieved {Count} cost mappings", response.Count);


            return ApiResponseDto<List<CostMappingResponseDto>>
                .SuccessResponse(response, $"Retrieved {response.Count} cost mappings");
        }


        public async Task<ApiResponseDto<List<CostMappingResponseDto>>> GetCostMappingsByDepartmentAsync(int departmentId)
        {
            EEPZBusinessLog.LogServiceInformation("Fetching cost mappings for department {DepartmentId}", departmentId);


            var budgets = await _costMappingRepository.GetByDepartmentIdAsync(departmentId);
            
            var response = _mapper.Map<List<CostMappingResponseDto>>(budgets);


            EEPZBusinessLog.LogServiceInformation("Retrieved {Count} cost mappings for department {DepartmentId}", 
                response.Count, departmentId);


            return ApiResponseDto<List<CostMappingResponseDto>>
                .SuccessResponse(response, "Cost mappings retrieved");
        }


        public async Task<ApiResponseDto<List<CostMappingResponseDto>>> GetCostMappingsByFiscalYearAsync(int fiscalYear)
        {
            EEPZBusinessLog.LogServiceInformation("Fetching cost mappings for fiscal year {FiscalYear}", fiscalYear);


            var budgets = await _costMappingRepository.GetByFiscalYearAsync(fiscalYear);
            
            var response = _mapper.Map<List<CostMappingResponseDto>>(budgets);


            EEPZBusinessLog.LogServiceInformation("Retrieved {Count} cost mappings for fiscal year {FiscalYear}", 
                response.Count, fiscalYear);


            return ApiResponseDto<List<CostMappingResponseDto>>
                .SuccessResponse(response, "Cost mappings retrieved");
        }


        public async Task<ApiResponseDto<bool>> DeleteCostMappingAsync(int budgetId)
        {
            EEPZBusinessLog.LogServiceInformation("Deleting cost mapping {BudgetId}", budgetId);


            var budget = await _costMappingRepository.GetByIdAsync(budgetId);
            
            if (budget == null)
            {
                EEPZBusinessLog.LogServiceWarning("Cost mapping {BudgetId} not found for deletion", budgetId);
                throw new ArgumentException("Cost mapping not found");
            }


            var deleted = await _costMappingRepository.DeleteAsync(budgetId);


            if (!deleted)
            {
                EEPZBusinessLog.LogServiceError("Failed to delete cost mapping {BudgetId}", null, budgetId);
                throw new InvalidOperationException("Failed to delete cost mapping");
            }


            EEPZBusinessLog.LogServiceInformation("Cost mapping {BudgetId} deleted successfully", budgetId);


            return ApiResponseDto<bool>.SuccessResponse(true, "Cost mapping deleted successfully");
        }
    }
}
