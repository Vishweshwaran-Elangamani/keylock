using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;

namespace Relevantz.EEPZ.Core.Service
{
    public class CostMappingService : ICostMappingService
    {
        private readonly ICostMappingRepository _costMappingRepository;
        private readonly IDepartmentRepository _departmentRepository;

        public CostMappingService(
            ICostMappingRepository costMappingRepository,
            IDepartmentRepository departmentRepository)
        {
            _costMappingRepository = costMappingRepository;
            _departmentRepository = departmentRepository;
        }

        public async Task<ApiResponseDto<HeadcountResponseDto>> GetDepartmentHeadcountAsync(int departmentId)
        {
            EEPZBusinessLog.Information($"Fetching headcount for DepartmentId: {departmentId}");

            var department = await _departmentRepository.GetByIdAsync(departmentId)
                ?? throw new ArgumentException("Department not found");

            var headcount = await _costMappingRepository.GetCurrentHeadcountAsync(departmentId);

            var response = new HeadcountResponseDto
            {
                DepartmentId = departmentId,
                DepartmentName = department.DepartmentName ?? "Unknown",
                CurrentHeadcount = headcount,
                Timestamp = DateTime.UtcNow
            };

            return ApiResponseDto<HeadcountResponseDto>
                .SuccessResponse(response, $"Current headcount for {department.DepartmentName}: {headcount} employees");
        }

        public async Task<ApiResponseDto<CostMappingResponseDto>> CreateCostMappingAsync(CreateCostMappingRequestDto request)
        {
            EEPZBusinessLog.Information($"Creating cost mapping for DepartmentId: {request.DepartmentId}");

            var department = await _departmentRepository.GetByIdAsync(request.DepartmentId)
                ?? throw new ArgumentException("Department not found");

            var existingMapping =
                await _costMappingRepository.GetByDepartmentAndFiscalYearAsync(
                    request.DepartmentId, request.FiscalYear);

            if (existingMapping != null)
                throw new InvalidOperationException("Cost mapping already exists for this department and fiscal year");

            int headcount;

            if (request.Headcount.HasValue && request.Headcount.Value > 0)
            {
                headcount = request.Headcount.Value;
            }
            else
            {
                headcount = await _costMappingRepository.GetCurrentHeadcountAsync(request.DepartmentId);

                if (headcount == 0)
                    throw new InvalidOperationException("No employees found in this department. Cannot create budget.");
            }

            var avgCostPerEmployee = request.TotalBudget / headcount;

            var budget = new Departmentbudget
            {
                DepartmentId = request.DepartmentId,
                FiscalYear = request.FiscalYear,
                TotalBudget = request.TotalBudget,
                AllocatedAmount = 0,
                UtilizedAmount = 0,
                UtilizationPercentage = 0,
                Headcount = headcount,
                AvgCostPerEmployee = avgCostPerEmployee,
                CreatedAt = DateTime.UtcNow
            };

            var createdBudget = await _costMappingRepository.CreateAsync(budget);
            var budgetWithDetails = await _costMappingRepository.GetByIdAsync(createdBudget.BudgetId)
                ?? throw new InvalidOperationException("Failed to retrieve created cost mapping");

            return ApiResponseDto<CostMappingResponseDto>
                .SuccessResponse(
                    MapToCostMappingResponse(budgetWithDetails),
                    "Cost mapping created successfully");
        }

        public async Task<ApiResponseDto<CostMappingResponseDto>> UpdateCostMappingAsync(UpdateCostMappingRequestDto request)
        {
            var budget = await _costMappingRepository.GetByIdAsync(request.BudgetId)
                ?? throw new ArgumentException("Cost mapping not found");

            if (request.TotalBudget.HasValue) budget.TotalBudget = request.TotalBudget.Value;
            if (request.AllocatedAmount.HasValue) budget.AllocatedAmount = request.AllocatedAmount.Value;
            if (request.UtilizedAmount.HasValue) budget.UtilizedAmount = request.UtilizedAmount.Value;
            if (request.Headcount.HasValue) budget.Headcount = request.Headcount.Value;

            if (budget.TotalBudget > 0)
                budget.UtilizationPercentage = (budget.UtilizedAmount / budget.TotalBudget) * 100;

            if (budget.Headcount > 0)
                budget.AvgCostPerEmployee = budget.TotalBudget / budget.Headcount;

            budget.UpdatedAt = DateTime.UtcNow;

            var updated = await _costMappingRepository.UpdateAsync(budget);

            var updatedBudget = await _costMappingRepository.GetByIdAsync(updated.BudgetId)
                ?? throw new InvalidOperationException("Failed to retrieve updated cost mapping");

            return ApiResponseDto<CostMappingResponseDto>
                .SuccessResponse(
                    MapToCostMappingResponse(updatedBudget),
                    "Cost mapping updated successfully");
        }

        public async Task<ApiResponseDto<CostMappingResponseDto>> GetCostMappingByIdAsync(int budgetId)
        {
            var budget = await _costMappingRepository.GetByIdAsync(budgetId)
                ?? throw new ArgumentException("Cost mapping not found");

            return ApiResponseDto<CostMappingResponseDto>
                .SuccessResponse(
                    MapToCostMappingResponse(budget),
                    "Cost mapping retrieved successfully");
        }

        public async Task<ApiResponseDto<List<CostMappingResponseDto>>> GetAllCostMappingsAsync()
        {
            var budgets = await _costMappingRepository.GetAllAsync();
            var response = budgets.Select(MapToCostMappingResponse).ToList();

            return ApiResponseDto<List<CostMappingResponseDto>>
                .SuccessResponse(response, $"Retrieved {response.Count} cost mappings");
        }

        public async Task<ApiResponseDto<List<CostMappingResponseDto>>> GetCostMappingsByDepartmentAsync(int departmentId)
        {
            var budgets = await _costMappingRepository.GetByDepartmentIdAsync(departmentId);
            var response = budgets.Select(MapToCostMappingResponse).ToList();

            return ApiResponseDto<List<CostMappingResponseDto>>
                .SuccessResponse(response, "Cost mappings retrieved");
        }

        public async Task<ApiResponseDto<List<CostMappingResponseDto>>> GetCostMappingsByFiscalYearAsync(int fiscalYear)
        {
            var budgets = await _costMappingRepository.GetByFiscalYearAsync(fiscalYear);
            var response = budgets.Select(MapToCostMappingResponse).ToList();

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

        private CostMappingResponseDto MapToCostMappingResponse(Departmentbudget budget)
        {
            return new CostMappingResponseDto
            {
                BudgetId = budget.BudgetId,
                DepartmentId = budget.DepartmentId,
                DepartmentName = budget.Department?.DepartmentName ?? "Unknown",
                FiscalYear = budget.FiscalYear,
                TotalBudget = budget.TotalBudget,
                AllocatedAmount = budget.AllocatedAmount ?? 0,
                UtilizedAmount = budget.UtilizedAmount ?? 0,
                UtilizationPercentage = budget.UtilizationPercentage ?? 0,
                Headcount = budget.Headcount ?? 0,
                AvgCostPerEmployee = budget.AvgCostPerEmployee ?? 0,
                CreatedAt = budget.CreatedAt,
                UpdatedAt = budget.UpdatedAt
            };
        }
    }
}
