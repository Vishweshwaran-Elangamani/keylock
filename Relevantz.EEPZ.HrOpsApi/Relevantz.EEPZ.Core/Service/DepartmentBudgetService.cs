using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Utils;
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
            EEPZBusinessLog.LogServiceInformation("Fetching all department budgets");


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


            EEPZBusinessLog.LogServiceInformation("Retrieved {Count} department budgets", response.Count);


            return ApiResponseDto<List<object>>
                .SuccessResponse(response, $"Retrieved {response.Count} department budgets");
        }


        public async Task<ApiResponseDto<object>> GetDepartmentBudgetAsync(int departmentId)
        {
            if (departmentId <= 0)
            {
                EEPZBusinessLog.LogServiceWarning("Invalid department ID: {DepartmentId}", departmentId);
                throw new ArgumentException("Invalid department ID");
            }


            EEPZBusinessLog.LogServiceInformation("Fetching budget for department {DepartmentId}", departmentId);


            var budget = await _budgetRepo.GetByDepartmentIdAsync(departmentId);
            
            if (budget == null)
            {
                EEPZBusinessLog.LogServiceWarning("Department budget not found for department {DepartmentId}", departmentId);
                throw new ArgumentException("Department budget not found");
            }


            var departmentName = await GetDepartmentNameAsync(budget.DepartmentId);


            EEPZBusinessLog.LogServiceInformation("Budget retrieved for department {DepartmentId}: BudgetId={BudgetId}", 
                departmentId, budget.BudgetId);


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
            {
                EEPZBusinessLog.LogServiceWarning("Invalid fiscal year: {FiscalYear}", fiscalYear);
                throw new ArgumentException("Fiscal year must be greater than zero");
            }


            EEPZBusinessLog.LogServiceInformation("Fetching budgets for fiscal year {FiscalYear}", fiscalYear);


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


            EEPZBusinessLog.LogServiceInformation("Retrieved {Count} budgets for fiscal year {FiscalYear}", 
                response.Count, fiscalYear);


            return ApiResponseDto<List<object>>
                .SuccessResponse(response, $"Retrieved {response.Count} department budgets for fiscal year {fiscalYear}");
        }


        public async Task<ApiResponseDto<object>> CreateDepartmentBudgetAsync(CreateDepartmentBudgetDto request)
        {
            if (request.DepartmentId <= 0)
            {
                EEPZBusinessLog.LogServiceWarning("Invalid department ID in create request: {DepartmentId}", request.DepartmentId);
                throw new ArgumentException("Invalid department ID");
            }


            if (request.FiscalYear <= 0)
            {
                EEPZBusinessLog.LogServiceWarning("Invalid fiscal year in create request: {FiscalYear}", request.FiscalYear);
                throw new ArgumentException("Invalid fiscal year");
            }


            if (request.TotalBudget <= 0)
            {
                EEPZBusinessLog.LogServiceWarning("Invalid total budget in create request: {TotalBudget}", request.TotalBudget);
                throw new ArgumentException("Total budget must be greater than zero");
            }


            EEPZBusinessLog.LogServiceInformation("Creating budget for department {DepartmentId}, fiscal year {FiscalYear}, amount: {TotalBudget}", 
                request.DepartmentId, request.FiscalYear, request.TotalBudget);


            var department = await _departmentRepo.GetByIdAsync(request.DepartmentId);
            
            if (department == null)
            {
                EEPZBusinessLog.LogServiceWarning("Department {DepartmentId} not found", request.DepartmentId);
                throw new ArgumentException("Department not found");
            }


            var existingBudget = await _budgetRepo
                .GetByDepartmentAndFiscalYearAsync(request.DepartmentId, request.FiscalYear);


            if (existingBudget != null)
            {
                EEPZBusinessLog.LogServiceWarning("Budget already exists for department {DepartmentId}, fiscal year {FiscalYear}", 
                    request.DepartmentId, request.FiscalYear);
                throw new InvalidOperationException("Budget already exists for this department and fiscal year");
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
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };


            var createdBudget = await _budgetRepo.CreateAsync(newBudget);


            EEPZBusinessLog.LogServiceInformation("Budget created successfully: BudgetId={BudgetId}, Department={DepartmentId}, FiscalYear={FiscalYear}", 
                createdBudget.BudgetId, request.DepartmentId, request.FiscalYear);


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
            {
                EEPZBusinessLog.LogServiceWarning("Invalid budget ID in update request: {BudgetId}", request.BudgetId);
                throw new ArgumentException("Invalid budget ID");
            }


            if (request.TotalBudget <= 0)
            {
                EEPZBusinessLog.LogServiceWarning("Invalid total budget in update request: {TotalBudget}", request.TotalBudget);
                throw new ArgumentException("Total budget must be greater than zero");
            }


            EEPZBusinessLog.LogServiceInformation("Updating budget {BudgetId}", request.BudgetId);


            var budget = await _budgetRepo.GetByIdAsync(request.BudgetId);
            
            if (budget == null)
            {
                EEPZBusinessLog.LogServiceWarning("Budget {BudgetId} not found", request.BudgetId);
                throw new ArgumentException("Department budget not found");
            }


            if (request.AllocatedAmount > request.TotalBudget)
            {
                EEPZBusinessLog.LogServiceWarning("Allocated amount {AllocatedAmount} exceeds total budget {TotalBudget} for budget {BudgetId}", 
                    request.AllocatedAmount, request.TotalBudget, request.BudgetId);
                throw new InvalidOperationException("Allocated amount cannot exceed total budget");
            }


            budget.TotalBudget = request.TotalBudget;
            budget.AllocatedAmount = request.AllocatedAmount;
            budget.UpdatedAt = DateTime.UtcNow;


            var updatedBudget = await _budgetRepo.UpdateAsync(budget);


            EEPZBusinessLog.LogServiceInformation("Budget {BudgetId} updated successfully", request.BudgetId);


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
            {
                EEPZBusinessLog.LogServiceWarning("Invalid budget ID for deletion: {BudgetId}", budgetId);
                throw new ArgumentException("Invalid budget ID");
            }


            EEPZBusinessLog.LogServiceInformation("Deleting budget {BudgetId}", budgetId);


            var budget = await _budgetRepo.GetByIdAsync(budgetId);
            
            if (budget == null)
            {
                EEPZBusinessLog.LogServiceWarning("Budget {BudgetId} not found for deletion", budgetId);
                throw new ArgumentException("Department budget not found");
            }


            await _budgetRepo.DeleteAllocationsByDepartmentIdAsync(budget.DepartmentId);


            var result = await _budgetRepo.DeleteAsync(budgetId);


            if (!result)
            {
                EEPZBusinessLog.LogServiceError("Failed to delete budget {BudgetId}", null, budgetId);
                throw new InvalidOperationException("Failed to delete department budget");
            }


            EEPZBusinessLog.LogServiceInformation("Budget {BudgetId} deleted successfully", budgetId);


            return ApiResponseDto<object>
                .SuccessResponse(new { BudgetId = budgetId }, "Department budget deleted successfully");
        }


        public async Task<ApiResponseDto<object>> UpdateUtilizedAmountAsync(UpdateUtilizedAmountDto request)
        {
            if (request.BudgetId <= 0)
            {
                EEPZBusinessLog.LogServiceWarning("Invalid budget ID: {BudgetId}", request.BudgetId);
                throw new ArgumentException("Invalid budget ID");
            }


            if (request.UtilizedAmount < 0)
            {
                EEPZBusinessLog.LogServiceWarning("Negative utilized amount: {UtilizedAmount}", request.UtilizedAmount);
                throw new ArgumentException("Utilized amount cannot be negative");
            }


            EEPZBusinessLog.LogServiceInformation("Updating utilized amount for budget {BudgetId} to {UtilizedAmount}", 
                request.BudgetId, request.UtilizedAmount);


            var budget = await _budgetRepo.GetByIdAsync(request.BudgetId);
            
            if (budget == null)
            {
                EEPZBusinessLog.LogServiceWarning("Budget {BudgetId} not found", request.BudgetId);
                throw new ArgumentException("Department budget not found");
            }


            if (request.UtilizedAmount > (budget.AllocatedAmount ?? 0))
            {
                EEPZBusinessLog.LogServiceWarning("Utilized amount {UtilizedAmount} exceeds allocated budget {AllocatedAmount} for budget {BudgetId}", 
                    request.UtilizedAmount, budget.AllocatedAmount, request.BudgetId);
                throw new InvalidOperationException("Utilized amount cannot exceed allocated budget");
            }


            budget.UtilizedAmount = request.UtilizedAmount;
            budget.UtilizationPercentage = budget.AllocatedAmount > 0
                ? (request.UtilizedAmount / budget.AllocatedAmount.Value) * 100
                : 0;


            budget.UpdatedAt = DateTime.UtcNow;


            var updatedBudget = await _budgetRepo.UpdateAsync(budget);


            EEPZBusinessLog.LogServiceInformation("Utilized amount updated for budget {BudgetId}: {UtilizedAmount}, Utilization: {UtilizationPercentage}%", 
                request.BudgetId, request.UtilizedAmount, budget.UtilizationPercentage);


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
            {
                EEPZBusinessLog.LogServiceWarning("Invalid allocation ID: {AllocationId}", request.AllocationId);
                throw new ArgumentException("Invalid allocation ID");
            }


            if (request.UtilizedAmount < 0)
            {
                EEPZBusinessLog.LogServiceWarning("Negative utilized amount for allocation: {UtilizedAmount}", request.UtilizedAmount);
                throw new ArgumentException("Utilized amount cannot be negative");
            }


            EEPZBusinessLog.LogServiceInformation("Updating utilization for allocation {AllocationId}", request.AllocationId);


            var allocation = await _budgetRepo.GetAllocationByIdAsync(request.AllocationId);
            
            if (allocation == null)
            {
                EEPZBusinessLog.LogServiceWarning("Allocation {AllocationId} not found", request.AllocationId);
                throw new ArgumentException($"Budget allocation with ID {request.AllocationId} not found");
            }


            if (request.UtilizedAmount > allocation.Amount)
            {
                EEPZBusinessLog.LogServiceWarning("Utilized amount {UtilizedAmount} exceeds allocated amount {AllocatedAmount} for allocation {AllocationId}", 
                    request.UtilizedAmount, allocation.Amount, request.AllocationId);
                throw new InvalidOperationException("Utilized amount cannot exceed allocated amount");
            }


            allocation.UtilizedAmount = request.UtilizedAmount;
            allocation.UtilizationPercentage = request.UtilizationPercentage;
            allocation.Notes = request.Notes;
            allocation.UpdatedAt = DateTime.UtcNow;


            var updatedAllocation = await _budgetRepo.UpdateAllocationAsync(allocation);


            await UpdateDepartmentBudgetTotalsAsync(allocation.DepartmentId);


            EEPZBusinessLog.LogServiceInformation("Utilization updated for allocation {AllocationId}: {UtilizedAmount}/{Amount}", 
                request.AllocationId, request.UtilizedAmount, allocation.Amount);


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
            EEPZBusinessLog.LogServiceInformation("Fetching allocations for budget {BudgetId}", budgetId);


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


            EEPZBusinessLog.LogServiceInformation("Retrieved {Count} allocations for budget {BudgetId}", response.Count, budgetId);


            return ApiResponseDto<List<object>>
                .SuccessResponse(response, $"Retrieved {response.Count} allocations");
        }


        private async Task<string> GetDepartmentNameAsync(int departmentId)
        {
            try
            {
                var dept = await _departmentRepo.GetByIdAsync(departmentId);
                return !string.IsNullOrEmpty(dept?.DepartmentName) ? dept.DepartmentName : "Unknown";
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceWarning("Error fetching department name for {DepartmentId}: {Message}", departmentId, ex.Message);
                return "Unknown";
            }
        }


        private async Task UpdateDepartmentBudgetTotalsAsync(int departmentId)
        {
            try
            {
                EEPZBusinessLog.LogServiceDebug("Updating budget totals for department {DepartmentId}", departmentId);


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


                    EEPZBusinessLog.LogServiceDebug("Budget totals updated for department {DepartmentId}: Utilized={UtilizedAmount}, Percentage={UtilizationPercentage}%", 
                        departmentId, totalUtilized, budget.UtilizationPercentage);
                }
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogServiceError("Error updating budget totals for department {DepartmentId}", ex, departmentId);
            }
        }
    }
}
