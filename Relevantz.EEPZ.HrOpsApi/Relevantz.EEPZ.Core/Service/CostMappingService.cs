using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Common.Utils;
using Microsoft.EntityFrameworkCore;
 
namespace Relevantz.EEPZ.Core.Service
{
   public class CostMappingService : ICostMappingService
    {
        private readonly ICostMappingRepository _costMappingRepository;
        private readonly IDepartmentRepository _departmentRepository;
        private readonly EEPZDbContext _context;
 
        public CostMappingService(ICostMappingRepository costMappingRepository, IDepartmentRepository departmentRepository, EEPZDbContext context)
        {
            _costMappingRepository = costMappingRepository;
            _departmentRepository = departmentRepository;
            _context = context;
        }
 
        public async Task<ApiResponseDto<HeadcountResponseDto>> GetDepartmentHeadcountAsync(int departmentId)
        {
            try
            {
                EEPZBusinessLog.Information($"Fetching headcount for DepartmentId: {departmentId}");
                var department = await _departmentRepository.GetByIdAsync(departmentId);
                if (department == null)
                {
                    EEPZBusinessLog.Warning($"Department not found: {departmentId}");
                    return ApiResponseDto<HeadcountResponseDto>.FailureResponse("Department not found");
                }
                var headcount = await GetCurrentHeadcountAsync(departmentId);
                var response = new HeadcountResponseDto { DepartmentId = departmentId, DepartmentName = department.DepartmentName ?? "Unknown", CurrentHeadcount = headcount, Timestamp = DateTime.UtcNow };
                EEPZBusinessLog.Information($"Headcount fetched successfully for {department.DepartmentName}: {headcount} employees");
                return ApiResponseDto<HeadcountResponseDto>.SuccessResponse(response, $"Current headcount for {department.DepartmentName}: {headcount} employees");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error fetching headcount: {ex.Message}");
                return ApiResponseDto<HeadcountResponseDto>.FailureResponse("An error occurred while fetching headcount");
            }
        }
 
        public async Task<ApiResponseDto<CostMappingResponseDto>> CreateCostMappingAsync(CreateCostMappingRequestDto request)
        {
            try
            {
                EEPZBusinessLog.Information($"Creating cost mapping for DepartmentId: {request.DepartmentId}, FiscalYear: {request.FiscalYear}");
                var department = await _departmentRepository.GetByIdAsync(request.DepartmentId);
                if (department == null)
                {
                    EEPZBusinessLog.Warning($"Department not found: {request.DepartmentId}");
                    return ApiResponseDto<CostMappingResponseDto>.FailureResponse("Department not found");
                }
                var existingMapping = await _costMappingRepository.GetByDepartmentAndFiscalYearAsync(request.DepartmentId, request.FiscalYear);
                if (existingMapping != null)
                {
                    EEPZBusinessLog.Warning($"Cost mapping already exists for DepartmentId: {request.DepartmentId}, FiscalYear: {request.FiscalYear}");
                    return ApiResponseDto<CostMappingResponseDto>.FailureResponse("Cost mapping already exists for this department and fiscal year combination");
                }
                int headcount;
                if (request.Headcount.HasValue && request.Headcount.Value > 0)
                {
                    headcount = request.Headcount.Value;
                    EEPZBusinessLog.Information($"Using provided headcount: {headcount}");
                    var actualHeadcount = await GetCurrentHeadcountAsync(request.DepartmentId);
                    if (Math.Abs(headcount - actualHeadcount) > 10)
                    {
                        EEPZBusinessLog.Warning($"Provided headcount ({headcount}) differs significantly from actual ({actualHeadcount})");
                    }
                }
                else
                {
                    headcount = await GetCurrentHeadcountAsync(request.DepartmentId);
                    EEPZBusinessLog.Information($"Auto-calculated headcount: {headcount}");
                    if (headcount == 0)
                    {
                        EEPZBusinessLog.Warning($"No employees found in department: {request.DepartmentId}");
                        return ApiResponseDto<CostMappingResponseDto>.FailureResponse("No employees found in this department. Cannot create budget with 0 headcount.");
                    }
                }
                decimal avgCostPerEmployee = headcount > 0 ? request.TotalBudget / headcount : 0;
                var budget = new Departmentbudget { DepartmentId = request.DepartmentId, FiscalYear = request.FiscalYear, TotalBudget = request.TotalBudget, AllocatedAmount = 0, UtilizedAmount = 0, UtilizationPercentage = 0, Headcount = headcount, AvgCostPerEmployee = avgCostPerEmployee, CreatedAt = DateTime.UtcNow };
                var createdBudget = await _costMappingRepository.CreateAsync(budget);
                var budgetWithDetails = await _costMappingRepository.GetByIdAsync(createdBudget.BudgetId);
                var response = MapToCostMappingResponse(budgetWithDetails!);
                EEPZBusinessLog.Information($"Cost mapping created successfully with BudgetId: {createdBudget.BudgetId}, Headcount: {headcount}");
                return ApiResponseDto<CostMappingResponseDto>.SuccessResponse(response, $"Cost mapping created successfully with {headcount} employees");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error creating cost mapping: {ex.Message}");
                return ApiResponseDto<CostMappingResponseDto>.FailureResponse("An error occurred while creating cost mapping");
            }
        }
 
        public async Task<ApiResponseDto<CostMappingResponseDto>> UpdateCostMappingAsync(UpdateCostMappingRequestDto request)
        {
            try
            {
                EEPZBusinessLog.Information($"Updating cost mapping with BudgetId: {request.BudgetId}");
                var existingBudget = await _costMappingRepository.GetByIdAsync(request.BudgetId);
                if (existingBudget == null)
                {
                    EEPZBusinessLog.Warning($"Cost mapping not found: {request.BudgetId}");
                    return ApiResponseDto<CostMappingResponseDto>.FailureResponse("Cost mapping not found");
                }
                if (request.TotalBudget.HasValue) existingBudget.TotalBudget = request.TotalBudget.Value;
                if (request.AllocatedAmount.HasValue) existingBudget.AllocatedAmount = request.AllocatedAmount.Value;
                if (request.UtilizedAmount.HasValue) existingBudget.UtilizedAmount = request.UtilizedAmount.Value;
                if (request.Headcount.HasValue) existingBudget.Headcount = request.Headcount.Value;
                if (existingBudget.TotalBudget > 0) existingBudget.UtilizationPercentage = (existingBudget.UtilizedAmount / existingBudget.TotalBudget) * 100;
                if (existingBudget.Headcount > 0) existingBudget.AvgCostPerEmployee = existingBudget.TotalBudget / existingBudget.Headcount;
                existingBudget.UpdatedAt = DateTime.UtcNow;
                var updatedBudget = await _costMappingRepository.UpdateAsync(existingBudget);
                var budgetWithDetails = await _costMappingRepository.GetByIdAsync(updatedBudget.BudgetId);
                var response = MapToCostMappingResponse(budgetWithDetails!);
                EEPZBusinessLog.Information($"Cost mapping updated successfully: {request.BudgetId}");
                return ApiResponseDto<CostMappingResponseDto>.SuccessResponse(response, "Cost mapping updated successfully");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error updating cost mapping: {ex.Message}");
                return ApiResponseDto<CostMappingResponseDto>.FailureResponse("An error occurred while updating cost mapping");
            }
        }
 
        public async Task<ApiResponseDto<CostMappingResponseDto>> GetCostMappingByIdAsync(int budgetId)
        {
            try
            {
                EEPZBusinessLog.Information($"Fetching cost mapping with BudgetId: {budgetId}");
                var budget = await _costMappingRepository.GetByIdAsync(budgetId);
                if (budget == null)
                {
                    EEPZBusinessLog.Warning($"Cost mapping not found: {budgetId}");
                    return ApiResponseDto<CostMappingResponseDto>.FailureResponse("Cost mapping not found");
                }
                var response = MapToCostMappingResponse(budget);
                return ApiResponseDto<CostMappingResponseDto>.SuccessResponse(response, "Cost mapping retrieved successfully");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error fetching cost mapping: {ex.Message}");
                return ApiResponseDto<CostMappingResponseDto>.FailureResponse("An error occurred while fetching cost mapping");
            }
        }
 
        public async Task<ApiResponseDto<List<CostMappingResponseDto>>> GetAllCostMappingsAsync()
        {
            try
            {
                EEPZBusinessLog.Information("Fetching all cost mappings");
                var budgets = await _costMappingRepository.GetAllAsync();
                var response = budgets.Select(MapToCostMappingResponse).ToList();
                return ApiResponseDto<List<CostMappingResponseDto>>.SuccessResponse(response, $"Retrieved {response.Count} cost mappings");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error fetching all cost mappings: {ex.Message}");
                return ApiResponseDto<List<CostMappingResponseDto>>.FailureResponse("An error occurred while fetching cost mappings");
            }
        }
 
        public async Task<ApiResponseDto<List<CostMappingResponseDto>>> GetCostMappingsByDepartmentAsync(int departmentId)
        {
            try
            {
                EEPZBusinessLog.Information($"Fetching cost mappings for DepartmentId: {departmentId}");
                var budgets = await _costMappingRepository.GetByDepartmentIdAsync(departmentId);
                var response = budgets.Select(MapToCostMappingResponse).ToList();
                return ApiResponseDto<List<CostMappingResponseDto>>.SuccessResponse(response, $"Retrieved {response.Count} cost mappings for department");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error fetching cost mappings by department: {ex.Message}");
                return ApiResponseDto<List<CostMappingResponseDto>>.FailureResponse("An error occurred while fetching cost mappings");
            }
        }
 
        public async Task<ApiResponseDto<List<CostMappingResponseDto>>> GetCostMappingsByFiscalYearAsync(int fiscalYear)
        {
            try
            {
                EEPZBusinessLog.Information($"Fetching cost mappings for FiscalYear: {fiscalYear}");
                var budgets = await _costMappingRepository.GetByFiscalYearAsync(fiscalYear);
                var response = budgets.Select(MapToCostMappingResponse).ToList();
                return ApiResponseDto<List<CostMappingResponseDto>>.SuccessResponse(response, $"Retrieved {response.Count} cost mappings for fiscal year");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error fetching cost mappings by fiscal year: {ex.Message}");
                return ApiResponseDto<List<CostMappingResponseDto>>.FailureResponse("An error occurred while fetching cost mappings");
            }
        }
 
        public async Task<ApiResponseDto<bool>> DeleteCostMappingAsync(int budgetId)
        {
            try
            {
                EEPZBusinessLog.Information($"Deleting cost mapping with BudgetId: {budgetId}");
                var budget = await _costMappingRepository.GetByIdAsync(budgetId);
                if (budget == null)
                {
                    EEPZBusinessLog.Warning($"Cost mapping not found: {budgetId}");
                    return ApiResponseDto<bool>.FailureResponse("Cost mapping not found");
                }
                var result = await _costMappingRepository.DeleteAsync(budgetId);
                if (result)
                {
                    EEPZBusinessLog.Information($"Cost mapping deleted successfully: {budgetId}");
                    return ApiResponseDto<bool>.SuccessResponse(true, "Cost mapping deleted successfully");
                }
                return ApiResponseDto<bool>.FailureResponse("Failed to delete cost mapping");
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.Error($"Error deleting cost mapping: {ex.Message}");
                return ApiResponseDto<bool>.FailureResponse("An error occurred while deleting cost mapping");
            }
        }
 
        private CostMappingResponseDto MapToCostMappingResponse(Departmentbudget budget)
        {
            return new CostMappingResponseDto { BudgetId = budget.BudgetId, DepartmentId = budget.DepartmentId, DepartmentName = budget.Department?.DepartmentName ?? "Unknown", FiscalYear = budget.FiscalYear, TotalBudget = budget.TotalBudget, AllocatedAmount = budget.AllocatedAmount ?? 0, UtilizedAmount = budget.UtilizedAmount ?? 0, UtilizationPercentage = budget.UtilizationPercentage ?? 0, Headcount = budget.Headcount ?? 0, AvgCostPerEmployee = budget.AvgCostPerEmployee ?? 0, CreatedAt = budget.CreatedAt, UpdatedAt = budget.UpdatedAt };
        }
 
        private async Task<int> GetCurrentHeadcountAsync(int departmentId)
        {
            return await _context.Employeedetailsmasters.Where(edm => edm.DepartmentId == departmentId).Select(edm => edm.EmployeeId).Distinct().CountAsync();
        }
    }
 
 
}
 
 