using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Core.IService;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Core.Service
{
    public class DepartmentBudgetService : IDepartmentBudgetService
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<DepartmentBudgetService> _logger;

        public DepartmentBudgetService(
            EEPZDbContext context,
            ILogger<DepartmentBudgetService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<ApiResponseDto<List<object>>> GetAllDepartmentBudgetsAsync()
        {
            try
            {
                _logger.LogInformation("Fetching all department budgets");

                var budgets = await _context.Departmentbudgets
                    .AsNoTracking()
                    .OrderBy(b => b.DepartmentId)
                    .ToListAsync();

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
                    response,
                    $"Retrieved {response.Count} department budgets");
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
                {
                    return ApiResponseDto<object>.FailureResponse("Invalid department ID");
                }

                var budget = await _context.Departmentbudgets
                    .AsNoTracking()
                    .FirstOrDefaultAsync(b => b.DepartmentId == departmentId);

                if (budget == null)
                {
                    return ApiResponseDto<object>.FailureResponse("Department budget not found");
                }

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

                return ApiResponseDto<object>.SuccessResponse(
                    response,
                    "Department budget retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching department budget: {ex.Message}");
                return ApiResponseDto<object>.FailureResponse(
                    "An error occurred while fetching department budget");
            }
        }

        public async Task<ApiResponseDto<List<object>>> GetDepartmentBudgetsByYearAsync(int fiscalYear)
        {
            try
            {
                _logger.LogInformation($"Fetching department budgets for fiscal year {fiscalYear}");

                if (fiscalYear <= 0)
                {
                    return ApiResponseDto<List<object>>.FailureResponse(
                        "Fiscal year must be greater than zero");
                }

                var budgets = await _context.Departmentbudgets
                    .AsNoTracking()
                    .Where(b => b.FiscalYear == fiscalYear)
                    .OrderBy(b => b.DepartmentId)
                    .ToListAsync();

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
                    response,
                    $"Retrieved {response.Count} department budgets for fiscal year {fiscalYear}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching department budgets by year: {ex.Message}");
                return ApiResponseDto<List<object>>.FailureResponse(
                    "An error occurred while fetching department budgets by year");
            }
        }

        public async Task<ApiResponseDto<object>> CreateDepartmentBudgetAsync(CreateDepartmentBudgetDto request)
        {
            try
            {
                _logger.LogInformation($"Creating department budget for department {request.DepartmentId}");

                // Validations
                if (request.DepartmentId <= 0)
                {
                    return ApiResponseDto<object>.FailureResponse("Invalid department ID");
                }

                if (request.FiscalYear <= 0)
                {
                    return ApiResponseDto<object>.FailureResponse("Invalid fiscal year");
                }

                if (request.TotalBudget <= 0)
                {
                    return ApiResponseDto<object>.FailureResponse(
                        "Total budget must be greater than zero");
                }

                // Check if department exists
                var departmentExists = await _context.Departments
                    .AnyAsync(d => d.DepartmentId == request.DepartmentId);

                if (!departmentExists)
                {
                    return ApiResponseDto<object>.FailureResponse("Department not found");
                }

                // Check for duplicate
                var existingBudget = await _context.Departmentbudgets
                    .FirstOrDefaultAsync(b => b.DepartmentId == request.DepartmentId 
                                           && b.FiscalYear == request.FiscalYear);

                if (existingBudget != null)
                {
                    return ApiResponseDto<object>.FailureResponse(
                        "Budget already exists for this department and fiscal year");
                }

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

                _context.Departmentbudgets.Add(newBudget);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Budget created with ID: {newBudget.BudgetId}");

                return ApiResponseDto<object>.SuccessResponse(
                    new
                    {
                        newBudget.BudgetId,
                        newBudget.DepartmentId,
                        newBudget.FiscalYear,
                        newBudget.TotalBudget,
                        newBudget.AllocatedAmount,
                        newBudget.CreatedAt
                    },
                    "Department budget created successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating department budget: {ex.Message}");
                return ApiResponseDto<object>.FailureResponse(
                    "An error occurred while creating department budget");
            }
        }

        public async Task<ApiResponseDto<object>> UpdateDepartmentBudgetAsync(UpdateDepartmentBudgetDto request)
        {
            try
            {
                _logger.LogInformation($"Updating department budget {request.BudgetId}");

                if (request.BudgetId <= 0)
                {
                    return ApiResponseDto<object>.FailureResponse("Invalid budget ID");
                }

                var budget = await _context.Departmentbudgets
                    .FirstOrDefaultAsync(b => b.BudgetId == request.BudgetId);

                if (budget == null)
                {
                    return ApiResponseDto<object>.FailureResponse("Department budget not found");
                }

                if (request.TotalBudget <= 0)
                {
                    return ApiResponseDto<object>.FailureResponse(
                        "Total budget must be greater than zero");
                }

                if (request.AllocatedAmount > request.TotalBudget)
                {
                    return ApiResponseDto<object>.FailureResponse(
                        "Allocated amount cannot exceed total budget");
                }

                budget.TotalBudget = request.TotalBudget;
                budget.AllocatedAmount = request.AllocatedAmount;
                budget.UpdatedAt = DateTime.Now;

                _context.Departmentbudgets.Update(budget);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Budget updated successfully");

                return ApiResponseDto<object>.SuccessResponse(
                    new
                    {
                        budget.BudgetId,
                        budget.TotalBudget,
                        budget.AllocatedAmount,
                        budget.UpdatedAt
                    },
                    "Department budget updated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating department budget: {ex.Message}");
                return ApiResponseDto<object>.FailureResponse(
                    "An error occurred while updating department budget");
            }
        }

        public async Task<ApiResponseDto<object>> DeleteDepartmentBudgetAsync(int budgetId)
        {
            try
            {
                _logger.LogInformation($"Deleting department budget {budgetId}");

                if (budgetId <= 0)
                {
                    return ApiResponseDto<object>.FailureResponse("Invalid budget ID");
                }

                var budget = await _context.Departmentbudgets
                    .FirstOrDefaultAsync(b => b.BudgetId == budgetId);

                if (budget == null)
                {
                    return ApiResponseDto<object>.FailureResponse("Department budget not found");
                }

                // Delete associated allocations
                var allocations = await _context.Budgetallocations
                    .Where(a => a.DepartmentId == budget.DepartmentId)
                    .ToListAsync();

                if (allocations.Count > 0)
                {
                    _context.Budgetallocations.RemoveRange(allocations);
                    _logger.LogInformation($"Deleted {allocations.Count} associated allocations");
                }

                _context.Departmentbudgets.Remove(budget);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Budget deleted successfully");

                return ApiResponseDto<object>.SuccessResponse(
                    new { budget.BudgetId },
                    "Department budget deleted successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting department budget: {ex.Message}");
                return ApiResponseDto<object>.FailureResponse(
                    "An error occurred while deleting department budget");
            }
        }

        public async Task<ApiResponseDto<object>> UpdateUtilizedAmountAsync(UpdateUtilizedAmountDto request)
        {
            try
            {
                _logger.LogInformation("Updating utilized amount");

                if (request.BudgetId <= 0)
                {
                    return ApiResponseDto<object>.FailureResponse("Invalid budget ID");
                }

                var budget = await _context.Departmentbudgets
                    .FirstOrDefaultAsync(b => b.BudgetId == request.BudgetId);

                if (budget == null)
                {
                    return ApiResponseDto<object>.FailureResponse("Department budget not found");
                }

                if (request.UtilizedAmount < 0)
                {
                    return ApiResponseDto<object>.FailureResponse(
                        "Utilized amount cannot be negative");
                }

                if (request.UtilizedAmount > (budget.AllocatedAmount ?? 0))
                {
                    return ApiResponseDto<object>.FailureResponse(
                        $"Utilized amount cannot exceed allocated budget (₹{budget.AllocatedAmount})");
                }

                decimal utilizationPercentage = 0;
                if (budget.AllocatedAmount > 0)
                {
                    utilizationPercentage = (request.UtilizedAmount / budget.AllocatedAmount.Value) * 100;
                }

                budget.UtilizedAmount = request.UtilizedAmount;
                budget.UtilizationPercentage = utilizationPercentage;
                budget.UpdatedAt = DateTime.Now;

                _context.Departmentbudgets.Update(budget);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Utilized amount updated successfully");

                return ApiResponseDto<object>.SuccessResponse(
                    new
                    {
                        budget.BudgetId,
                        budget.AllocatedAmount,
                        budget.UtilizedAmount,
                        budget.UtilizationPercentage,
                        budget.UpdatedAt
                    },
                    "Utilized amount updated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating utilized amount: {ex.Message}");
                return ApiResponseDto<object>.FailureResponse(
                    "An error occurred while updating utilized amount");
            }
        }

        public async Task<ApiResponseDto<object>> UpdateUtilizationAsync(UpdateUtilizationDto request)
        {
            try
            {
                _logger.LogInformation($"Updating utilization for allocation {request.AllocationId}");

                if (request.AllocationId <= 0)
                {
                    return ApiResponseDto<object>.FailureResponse("Invalid allocation ID");
                }

                var allocation = await _context.Budgetallocations
                    .FirstOrDefaultAsync(a => a.AllocationId == request.AllocationId);

                if (allocation == null)
                {
                    _logger.LogWarning($"Allocation not found: {request.AllocationId}");
                    
                    // Debug: Check existing allocations
                    var existingAllocations = await _context.Budgetallocations
                        .Select(a => a.AllocationId)
                        .ToListAsync();
                    _logger.LogDebug($"Existing AllocationIds: {string.Join(", ", existingAllocations)}");

                    return ApiResponseDto<object>.FailureResponse(
                        $"Budget allocation with ID {request.AllocationId} not found");
                }

                if (request.UtilizedAmount < 0)
                {
                    return ApiResponseDto<object>.FailureResponse(
                        "Utilized amount cannot be negative");
                }

                if (request.UtilizedAmount > allocation.Amount)
                {
                    return ApiResponseDto<object>.FailureResponse(
                        $"Utilized amount (₹{request.UtilizedAmount}) cannot exceed allocated amount (₹{allocation.Amount})");
                }

                // Update allocation
                allocation.UtilizedAmount = request.UtilizedAmount;
                allocation.UtilizationPercentage = request.UtilizationPercentage;
                
                if (!string.IsNullOrEmpty(request.Notes))
                    allocation.Notes = request.Notes;
                
                allocation.UpdatedAt = DateTime.UtcNow;

                _context.Budgetallocations.Update(allocation);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Allocation {allocation.AllocationId} utilization updated successfully");

                // Update department budget totals
                await UpdateDepartmentBudgetTotalsAsync(allocation.DepartmentId);

                return ApiResponseDto<object>.SuccessResponse(
                    new
                    {
                        allocation.AllocationId,
                        allocation.Amount,
                        allocation.UtilizedAmount,
                        allocation.UtilizationPercentage,
                        allocation.UpdatedAt
                    },
                    "Utilization updated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating utilization: {ex.Message}");
                return ApiResponseDto<object>.FailureResponse(
                    "An error occurred while updating utilization");
            }
        }

        public async Task<ApiResponseDto<List<object>>> GetAllocationsByBudgetAsync(int budgetId)
        {
            try
            {
                _logger.LogInformation($"Getting allocations for budget: {budgetId}");

                var allocations = await _context.Budgetallocations
                    .AsNoTracking()
                    .Where(a => a.BudgetId == budgetId)
                    .Select(a => new
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
                    })
                    .ToListAsync();

                _logger.LogInformation($"Found {allocations.Count} allocations for budget {budgetId}");

                return ApiResponseDto<List<object>>.SuccessResponse(
                    allocations.Cast<object>().ToList(),
                    $"Retrieved {allocations.Count} allocations");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting allocations: {ex.Message}");
                return ApiResponseDto<List<object>>.FailureResponse(
                    "An error occurred while fetching allocations");
            }
        }

        // Private helper methods
        private async Task<string> GetDepartmentNameAsync(int departmentId)
        {
            try
            {
                var dept = await _context.Departments
                    .AsNoTracking()
                    .FirstOrDefaultAsync(d => d.DepartmentId == departmentId);

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
                var budget = await _context.Departmentbudgets
                    .FirstOrDefaultAsync(b => b.DepartmentId == departmentId);

                if (budget != null)
                {
                    var totalUtilized = await _context.Budgetallocations
                        .Where(a => a.DepartmentId == departmentId)
                        .SumAsync(a => a.UtilizedAmount ?? 0);

                    budget.UtilizedAmount = totalUtilized;
                    budget.UtilizationPercentage = budget.AllocatedAmount > 0
                        ? (totalUtilized / budget.AllocatedAmount.Value) * 100
                        : 0;
                    budget.UpdatedAt = DateTime.UtcNow;

                    _context.Departmentbudgets.Update(budget);
                    await _context.SaveChangesAsync();

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
