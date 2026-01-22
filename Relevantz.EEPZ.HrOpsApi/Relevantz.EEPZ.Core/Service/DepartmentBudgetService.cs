using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.IRepository;
using Relevantz.EEPZ.Core.IService;

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
            _logger.LogInformation("Fetching all department budgets");

            var budgets = await _budgetRepo.GetAllAsync();
            var response = new List<object>();

            foreach (var budget in budgets)
            {
                var departmentName = await GetDepartmentNameAsync(budget.DepartmentId);
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

            return ApiResponseDto<List<object>>
                .SuccessResponse(response, $"Retrieved {response.Count} department budgets");
        }

        public async Task<ApiResponseDto<object>> GetDepartmentBudgetAsync(int departmentId)
        {
            if (departmentId <= 0)
                throw new ArgumentException("Invalid department ID");

            var budget = await _budgetRepo.GetByDepartmentIdAsync(departmentId)
                ?? throw new ArgumentException("Department budget not found");

            var departmentName = await GetDepartmentNameAsync(budget.DepartmentId);

            return ApiResponseDto<object>.SuccessResponse(new
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
            }, "Department budget retrieved successfully");
        }

        public async Task<ApiResponseDto<List<object>>> GetDepartmentBudgetsByYearAsync(int fiscalYear)
        {
            if (fiscalYear <= 0)
                throw new ArgumentException("Fiscal year must be greater than zero");

            var budgets = await _budgetRepo.GetByFiscalYearAsync(fiscalYear);
            var response = new List<object>();

            foreach (var budget in budgets)
            {
                var departmentName = await GetDepartmentNameAsync(budget.DepartmentId);
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

            return ApiResponseDto<List<object>>
                .SuccessResponse(response, $"Retrieved {response.Count} department budgets for fiscal year {fiscalYear}");
        }

        public async Task<ApiResponseDto<object>> CreateDepartmentBudgetAsync(CreateDepartmentBudgetDto request)
        {
            if (request.DepartmentId <= 0)
                throw new ArgumentException("Invalid department ID");

            if (request.FiscalYear <= 0)
                throw new ArgumentException("Invalid fiscal year");

            if (request.TotalBudget <= 0)
                throw new ArgumentException("Total budget must be greater than zero");

            var department = await _departmentRepo.GetByIdAsync(request.DepartmentId)
                ?? throw new ArgumentException("Department not found");

            var existingBudget = await _budgetRepo
                .GetByDepartmentAndFiscalYearAsync(request.DepartmentId, request.FiscalYear);

            if (existingBudget != null)
                throw new InvalidOperationException("Budget already exists for this department and fiscal year");

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
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var createdBudget = await _budgetRepo.CreateAsync(newBudget);

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

        public async Task<ApiResponseDto<object>> UpdateDepartmentBudgetAsync(UpdateDepartmentBudgetDto request)
        {
            if (request.BudgetId <= 0)
                throw new ArgumentException("Invalid budget ID");

            if (request.TotalBudget <= 0)
                throw new ArgumentException("Total budget must be greater than zero");

            var budget = await _budgetRepo.GetByIdAsync(request.BudgetId)
                ?? throw new ArgumentException("Department budget not found");

            if (request.AllocatedAmount > request.TotalBudget)
                throw new InvalidOperationException("Allocated amount cannot exceed total budget");

            budget.TotalBudget = request.TotalBudget;
            budget.AllocatedAmount = request.AllocatedAmount;
            budget.UpdatedAt = DateTime.UtcNow;

            var updatedBudget = await _budgetRepo.UpdateAsync(budget);

            return ApiResponseDto<object>.SuccessResponse(new
            {
                updatedBudget.BudgetId,
                updatedBudget.TotalBudget,
                updatedBudget.AllocatedAmount,
                updatedBudget.UpdatedAt
            }, "Department budget updated successfully");
        }

        public async Task<ApiResponseDto<object>> DeleteDepartmentBudgetAsync(int budgetId)
        {
            if (budgetId <= 0)
                throw new ArgumentException("Invalid budget ID");

            var budget = await _budgetRepo.GetByIdAsync(budgetId)
                ?? throw new ArgumentException("Department budget not found");

            await _budgetRepo.DeleteAllocationsByDepartmentIdAsync(budget.DepartmentId);

            var result = await _budgetRepo.DeleteAsync(budgetId);

            if (!result)
                throw new InvalidOperationException("Failed to delete department budget");

            return ApiResponseDto<object>
                .SuccessResponse(new { BudgetId = budgetId }, "Department budget deleted successfully");
        }

        public async Task<ApiResponseDto<object>> UpdateUtilizedAmountAsync(UpdateUtilizedAmountDto request)
        {
            if (request.BudgetId <= 0)
                throw new ArgumentException("Invalid budget ID");

            if (request.UtilizedAmount < 0)
                throw new ArgumentException("Utilized amount cannot be negative");

            var budget = await _budgetRepo.GetByIdAsync(request.BudgetId)
                ?? throw new ArgumentException("Department budget not found");

            if (request.UtilizedAmount > (budget.AllocatedAmount ?? 0))
                throw new InvalidOperationException("Utilized amount cannot exceed allocated budget");

            budget.UtilizedAmount = request.UtilizedAmount;
            budget.UtilizationPercentage = budget.AllocatedAmount > 0
                ? (request.UtilizedAmount / budget.AllocatedAmount.Value) * 100
                : 0;

            budget.UpdatedAt = DateTime.UtcNow;

            var updatedBudget = await _budgetRepo.UpdateAsync(budget);

            return ApiResponseDto<object>.SuccessResponse(new
            {
                updatedBudget.BudgetId,
                updatedBudget.AllocatedAmount,
                updatedBudget.UtilizedAmount,
                updatedBudget.UtilizationPercentage,
                updatedBudget.UpdatedAt
            }, "Utilized amount updated successfully");
        }

        public async Task<ApiResponseDto<object>> UpdateUtilizationAsync(UpdateUtilizationDto request)
        {
            if (request.AllocationId <= 0)
                throw new ArgumentException("Invalid allocation ID");

            if (request.UtilizedAmount < 0)
                throw new ArgumentException("Utilized amount cannot be negative");

            var allocation = await _budgetRepo.GetAllocationByIdAsync(request.AllocationId)
                ?? throw new ArgumentException($"Budget allocation with ID {request.AllocationId} not found");

            if (request.UtilizedAmount > allocation.Amount)
                throw new InvalidOperationException("Utilized amount cannot exceed allocated amount");

            allocation.UtilizedAmount = request.UtilizedAmount;
            allocation.UtilizationPercentage = request.UtilizationPercentage;
            allocation.Notes = request.Notes;
            allocation.UpdatedAt = DateTime.UtcNow;

            var updatedAllocation = await _budgetRepo.UpdateAllocationAsync(allocation);

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

        public async Task<ApiResponseDto<List<object>>> GetAllocationsByBudgetAsync(int budgetId)
        {
            var allocations = await _budgetRepo.GetAllocationsByBudgetIdAsync(budgetId);

            var response = allocations.Select(a => new
            {
                a.AllocationId,
                a.BudgetId,
                a.DepartmentId,
                DepartmentName = a.Department?.DepartmentName ?? "Unknown",
                a.EmployeeUserId,
                EmployeeEmail = a.EmployeeUser?.Email,
                a.AllocationType,
                a.Amount,
                a.GoalStatus,
                a.Notes,
                a.AllocatedByUserId,
                AllocatedByEmail = a.AllocatedByUser?.Email ?? "Unknown",
                a.AllocatedAt,
                a.UtilizedAmount,
                a.UtilizationPercentage,
                a.UpdatedAt,
                a.Period,
                a.PeriodYear
            }).Cast<object>().ToList();

            return ApiResponseDto<List<object>>
                .SuccessResponse(response, $"Retrieved {response.Count} allocations");
        }

        private async Task<string> GetDepartmentNameAsync(int departmentId)
        {
            var dept = await _departmentRepo.GetByIdAsync(departmentId);
            return !string.IsNullOrEmpty(dept?.DepartmentName) ? dept.DepartmentName : "Unknown";
        }

        private async Task UpdateDepartmentBudgetTotalsAsync(int departmentId)
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
            }
        }
    }
}
