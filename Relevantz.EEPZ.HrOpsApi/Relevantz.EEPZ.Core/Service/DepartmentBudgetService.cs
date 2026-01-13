using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;  
using Relevantz.EEPZ.Core.IService;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Core.Service
{
    public class DepartmentBudgetService : IDepartmentBudgetService
    {
        private readonly IDepartmentBudgetRepository _budgetRepo;
        private readonly IDepartmentRepository _departmentRepo;
        private readonly ILogger<DepartmentBudgetService> _logger;

        public DepartmentBudgetService(
            IDepartmentBudgetRepository budgetRepo,       
            IDepartmentRepository departmentRepo,         
            ILogger<DepartmentBudgetService> logger)
        {
            _budgetRepo = budgetRepo;
            _departmentRepo = departmentRepo;
            _logger = logger;
        }

        public async Task<ApiResponseDto<List<object>>> GetAllDepartmentBudgetsAsync()
        {
            try
            {
                _logger.LogInformation("Fetching all department budgets");

                var budgets = await _budgetRepo.GetAllAsync();  

                _logger.LogInformation($"Found {budgets.Count} department budgets");

                var response = new List<object>();
                foreach (var budget in budgets)
                {
                    string departmentName = await GetDepartmentNameAsync(budget.DepartmentId);
                    response.Add(new
                    {
                        budget.BudgetId,
                        budget.DepartmentId,
                        DepartmentName = departmentName,
                        budget.FiscalYear,
                        budget.TotalBudget,
                        budget.AllocatedAmount,
                        budget.UtilizedAmount,
                        budget.UtilizationPercentage,
                        budget.Headcount,
                        budget.AvgCostPerEmployee,
                        budget.CreatedAt,
                        budget.UpdatedAt
                    });
                }

                return ApiResponseDto<List<object>>.SuccessResponse(
                    response, $"Retrieved {response.Count} department budgets");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching all department budgets: {ex.Message}");
                return ApiResponseDto<List<object>>.FailureResponse(
                    $"An error occurred while fetching department budgets: {ex.Message}");
            }
        }

        public async Task<ApiResponseDto<object>> GetDepartmentBudgetAsync(int departmentId)
        {
            try
            {
                _logger.LogInformation($"Fetching department budget for department {departmentId}");

                if (departmentId <= 0)
                    return ApiResponseDto<object>.FailureResponse("Invalid department ID");

                var budget = await _budgetRepo.GetByDepartmentIdAsync(departmentId);  

                if (budget == null)
                    return ApiResponseDto<object>.FailureResponse("Department budget not found");

                string departmentName = await GetDepartmentNameAsync(budget.DepartmentId);

                var response = new
                {
                    budget.BudgetId,
                    budget.DepartmentId,
                    DepartmentName = departmentName,
                    budget.FiscalYear,
                    budget.TotalBudget,
                    budget.AllocatedAmount,
                    budget.UtilizedAmount,
                    budget.UtilizationPercentage,
                    budget.Headcount,
                    budget.AvgCostPerEmployee,
                    budget.CreatedAt,
                    budget.UpdatedAt
                };

                return ApiResponseDto<object>.SuccessResponse(response, "Department budget retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching department budget: {ex.Message}");
                return ApiResponseDto<object>.FailureResponse("An error occurred while fetching department budget");
            }
        }

        public async Task<ApiResponseDto<List<object>>> GetDepartmentBudgetsByYearAsync(int fiscalYear)
        {
            try
            {
                _logger.LogInformation($"Fetching department budgets for fiscal year {fiscalYear}");

                if (fiscalYear <= 0)
                    return ApiResponseDto<List<object>>.FailureResponse("Fiscal year must be greater than zero");

                var budgets = await _budgetRepo.GetByFiscalYearAsync(fiscalYear);  

                var response = new List<object>();
                foreach (var budget in budgets)
                {
                    string departmentName = await GetDepartmentNameAsync(budget.DepartmentId);
                    response.Add(new
                    {
                        budget.BudgetId,
                        budget.DepartmentId,
                        DepartmentName = departmentName,
                        budget.FiscalYear,
                        budget.TotalBudget,
                        budget.AllocatedAmount,
                        budget.UtilizedAmount,
                        budget.UtilizationPercentage,
                        budget.Headcount,
                        budget.AvgCostPerEmployee,
                        budget.CreatedAt,
                        budget.UpdatedAt
                    });
                }

                return ApiResponseDto<List<object>>.SuccessResponse(
                    response, $"Retrieved {response.Count} department budgets for fiscal year {fiscalYear}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching department budgets by year: {ex.Message}");
                return ApiResponseDto<List<object>>.FailureResponse("An error occurred while fetching department budgets by year");
            }
        }

        public async Task<ApiResponseDto<object>> CreateDepartmentBudgetAsync(CreateDepartmentBudgetDto request)
        {
            try
            {
                _logger.LogInformation($"Creating department budget for department {request.DepartmentId}");

                if (request.DepartmentId <= 0)
                    return ApiResponseDto<object>.FailureResponse("Invalid department ID");

                if (request.FiscalYear <= 0)
                    return ApiResponseDto<object>.FailureResponse("Invalid fiscal year");

                if (request.TotalBudget <= 0)
                    return ApiResponseDto<object>.FailureResponse("Total budget must be greater than zero");

                var department = await _departmentRepo.GetByIdAsync(request.DepartmentId);
                if (department == null)
                    return ApiResponseDto<object>.FailureResponse("Department not found");

                var existingBudget = await _budgetRepo.GetByDepartmentAndFiscalYearAsync(request.DepartmentId, request.FiscalYear);
                if (existingBudget != null)
                    return ApiResponseDto<object>.FailureResponse("Budget already exists for this department and fiscal year");

                var newBudget = new Departmentbudget
                {
                    DepartmentId = request.DepartmentId,
                    FiscalYear = request.FiscalYear,
                    TotalBudget = request.TotalBudget,
                    AllocatedAmount = request.AllocatedAmount ?? request.TotalBudget,
                    UtilizedAmount = 0,
                    UtilizationPercentage = 0,
                    Headcount = 0,
                    AvgCostPerEmployee = 0,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                var createdBudget = await _budgetRepo.CreateAsync(newBudget);  

                _logger.LogInformation($"Budget created with ID: {createdBudget.BudgetId}");

                return ApiResponseDto<object>.SuccessResponse(new
                {
                    createdBudget.BudgetId,
                    createdBudget.DepartmentId,
                    createdBudget.FiscalYear,
                    createdBudget.TotalBudget,
                    createdBudget.AllocatedAmount,
                    createdBudget.CreatedAt
                }, "Department budget created successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating department budget: {ex.Message}");
                return ApiResponseDto<object>.FailureResponse("An error occurred while creating department budget");
            }
        }

        public async Task<ApiResponseDto<object>> UpdateDepartmentBudgetAsync(UpdateDepartmentBudgetDto request)
        {
            try
            {
                _logger.LogInformation($"Updating department budget {request.BudgetId}");

                if (request.BudgetId <= 0)
                    return ApiResponseDto<object>.FailureResponse("Invalid budget ID");

                var budget = await _budgetRepo.GetByIdAsync(request.BudgetId);  

                if (budget == null)
                    return ApiResponseDto<object>.FailureResponse("Department budget not found");

                if (request.TotalBudget <= 0)
                    return ApiResponseDto<object>.FailureResponse("Total budget must be greater than zero");

                if (request.AllocatedAmount > request.TotalBudget)
                    return ApiResponseDto<object>.FailureResponse("Allocated amount cannot exceed total budget");

                budget.TotalBudget = request.TotalBudget;
                budget.AllocatedAmount = request.AllocatedAmount;
                budget.UpdatedAt = DateTime.Now;

                var updatedBudget = await _budgetRepo.UpdateAsync(budget);  

                _logger.LogInformation("Budget updated successfully");

                return ApiResponseDto<object>.SuccessResponse(new
                {
                    updatedBudget.BudgetId,
                    updatedBudget.TotalBudget,
                    updatedBudget.AllocatedAmount,
                    updatedBudget.UpdatedAt
                }, "Department budget updated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating department budget: {ex.Message}");
                return ApiResponseDto<object>.FailureResponse("An error occurred while updating department budget");
            }
        }

        public async Task<ApiResponseDto<object>> DeleteDepartmentBudgetAsync(int budgetId)
        {
            try
            {
                _logger.LogInformation($"Deleting department budget {budgetId}");

                if (budgetId <= 0)
                    return ApiResponseDto<object>.FailureResponse("Invalid budget ID");

                var budget = await _budgetRepo.GetByIdAsync(budgetId);  

                if (budget == null)
                    return ApiResponseDto<object>.FailureResponse("Department budget not found");

                var allocationsDeleted = await _budgetRepo.DeleteAllocationsByDepartmentIdAsync(budget.DepartmentId);  

                if (allocationsDeleted > 0)
                    _logger.LogInformation($"Deleted {allocationsDeleted} associated allocations");

                var result = await _budgetRepo.DeleteAsync(budgetId);  

                if (!result)
                    return ApiResponseDto<object>.FailureResponse("Failed to delete department budget");

                _logger.LogInformation("Budget deleted successfully");

                return ApiResponseDto<object>.SuccessResponse(new { BudgetId = budgetId }, "Department budget deleted successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting department budget: {ex.Message}");
                return ApiResponseDto<object>.FailureResponse("An error occurred while deleting department budget");
            }
        }

        public async Task<ApiResponseDto<object>> UpdateUtilizedAmountAsync(UpdateUtilizedAmountDto request)
        {
            try
            {
                _logger.LogInformation("Updating utilized amount");

                if (request.BudgetId <= 0)
                    return ApiResponseDto<object>.FailureResponse("Invalid budget ID");

                var budget = await _budgetRepo.GetByIdAsync(request.BudgetId);  

                if (budget == null)
                    return ApiResponseDto<object>.FailureResponse("Department budget not found");

                if (request.UtilizedAmount < 0)
                    return ApiResponseDto<object>.FailureResponse("Utilized amount cannot be negative");

                if (request.UtilizedAmount > (budget.AllocatedAmount ?? 0))
                    return ApiResponseDto<object>.FailureResponse($"Utilized amount cannot exceed allocated budget (₹{budget.AllocatedAmount})");

                decimal utilizationPercentage = budget.AllocatedAmount > 0
                    ? (request.UtilizedAmount / budget.AllocatedAmount.Value) * 100
                    : 0;

                budget.UtilizedAmount = request.UtilizedAmount;
                budget.UtilizationPercentage = utilizationPercentage;
                budget.UpdatedAt = DateTime.Now;

                var updatedBudget = await _budgetRepo.UpdateAsync(budget);  

                _logger.LogInformation("Utilized amount updated successfully");

                return ApiResponseDto<object>.SuccessResponse(new
                {
                    updatedBudget.BudgetId,
                    updatedBudget.AllocatedAmount,
                    updatedBudget.UtilizedAmount,
                    updatedBudget.UtilizationPercentage,
                    updatedBudget.UpdatedAt
                }, "Utilized amount updated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating utilized amount: {ex.Message}");
                return ApiResponseDto<object>.FailureResponse("An error occurred while updating utilized amount");
            }
        }

        public async Task<ApiResponseDto<object>> UpdateUtilizationAsync(UpdateUtilizationDto request)
        {
            try
            {
                _logger.LogInformation($"Updating utilization for allocation {request.AllocationId}");

                if (request.AllocationId <= 0)
                    return ApiResponseDto<object>.FailureResponse("Invalid allocation ID");

                var allocation = await _budgetRepo.GetAllocationByIdAsync(request.AllocationId);  

                if (allocation == null)
                {
                    _logger.LogWarning($"Allocation not found: {request.AllocationId}");
                    return ApiResponseDto<object>.FailureResponse($"Budget allocation with ID {request.AllocationId} not found");
                }

                if (request.UtilizedAmount < 0)
                    return ApiResponseDto<object>.FailureResponse("Utilized amount cannot be negative");

                if (request.UtilizedAmount > allocation.Amount)
                    return ApiResponseDto<object>.FailureResponse($"Utilized amount (₹{request.UtilizedAmount}) cannot exceed allocated amount (₹{allocation.Amount})");

                allocation.UtilizedAmount = request.UtilizedAmount;
                allocation.UtilizationPercentage = request.UtilizationPercentage;
                if (!string.IsNullOrEmpty(request.Notes))
                    allocation.Notes = request.Notes;
                allocation.UpdatedAt = DateTime.UtcNow;

                var updatedAllocation = await _budgetRepo.UpdateAllocationAsync(allocation);  

                _logger.LogInformation($"Allocation {allocation.AllocationId} utilization updated successfully");

                await UpdateDepartmentBudgetTotalsAsync(allocation.DepartmentId);   

                return ApiResponseDto<object>.SuccessResponse(new
                {
                    updatedAllocation.AllocationId,
                    updatedAllocation.Amount,
                    updatedAllocation.UtilizedAmount,
                    updatedAllocation.UtilizationPercentage,
                    updatedAllocation.UpdatedAt
                }, "Utilization updated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating utilization: {ex.Message}");
                return ApiResponseDto<object>.FailureResponse("An error occurred while updating utilization");
            }
        }

        public async Task<ApiResponseDto<List<object>>> GetAllocationsByBudgetAsync(int budgetId)
        {
            try
            {
                _logger.LogInformation($"Getting allocations for budget: {budgetId}");

                var allocations = await _budgetRepo.GetAllocationsByBudgetIdAsync(budgetId);  

                var response = allocations.Select(a => new
                {
                    a.AllocationId,
                    a.BudgetId,
                    a.DepartmentId,
                    DepartmentName = a.Department != null ? a.Department.DepartmentName : "Unknown",
                    a.EmployeeUserId,
                    EmployeeEmail = a.EmployeeUser != null ? a.EmployeeUser.Email : null,
                    a.AllocationType,
                    a.Amount,
                    a.GoalStatus,
                    a.Notes,
                    a.AllocatedByUserId,
                    AllocatedByEmail = a.AllocatedByUser != null ? a.AllocatedByUser.Email : "Unknown",
                    a.AllocatedAt,
                    a.UtilizedAmount,
                    a.UtilizationPercentage,
                    a.UpdatedAt,
                    a.Period,
                    a.PeriodYear
                }).Cast<object>().ToList();

                _logger.LogInformation($"Found {response.Count} allocations for budget {budgetId}");

                return ApiResponseDto<List<object>>.SuccessResponse(response, $"Retrieved {response.Count} allocations");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting allocations: {ex.Message}");
                return ApiResponseDto<List<object>>.FailureResponse("An error occurred while fetching allocations");
            }
        }

        // Private helper methods
        private async Task<string> GetDepartmentNameAsync(int departmentId)
        {
            try
            {
                var dept = await _departmentRepo.GetByIdAsync(departmentId);  
                return dept != null && !string.IsNullOrEmpty(dept.DepartmentName)
                    ? dept.DepartmentName
                    : "Unknown";
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching department name: {ex.Message}");
                return "Unknown";
            }
        }

        private async Task UpdateDepartmentBudgetTotalsAsync(int departmentId)
        {
            try
            {
                var budget = await _budgetRepo.GetByDepartmentIdAsync(departmentId);  

                if (budget != null)
                {
                    var totalUtilized = await _budgetRepo.GetTotalUtilizedByDepartmentAsync(departmentId);  

                    budget.UtilizedAmount = totalUtilized;
                    budget.UtilizationPercentage = budget.AllocatedAmount > 0
                        ? (totalUtilized / budget.AllocatedAmount.Value) * 100
                        : 0;
                    budget.UpdatedAt = DateTime.UtcNow;

                    await _budgetRepo.UpdateAsync(budget);  

                    _logger.LogInformation("Department budget totals updated");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating department budget totals: {ex.Message}");
            }
        }
    }
}
