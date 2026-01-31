using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Core.IService;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Relevantz.EEPZ.Api.Controllers
{
    /// <summary>
    /// Provides endpoints for managing fund allocations and department budgets,
    /// including creation, updates, deletion, retrieval, and utilization tracking.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class FundAllocationController : ControllerBase
    {
        private readonly IFundAllocationService _fundAllocationService;
        private readonly IDepartmentBudgetService _departmentBudgetService;
        private readonly ILogger<FundAllocationController> _logger;

        /// <summary>
        /// Initializes a new instance of <see cref="FundAllocationController"/>.
        /// </summary>
        /// <param name="fundAllocationService">Service handling fund allocation operations.</param>
        /// <param name="departmentBudgetService">Service managing department budgets.</param>
        /// <param name="logger">Logger instance for capturing operational logs and errors.</param>
        public FundAllocationController(
            IFundAllocationService fundAllocationService,
            IDepartmentBudgetService departmentBudgetService,
            ILogger<FundAllocationController> logger)
        {
            _fundAllocationService = fundAllocationService;
            _departmentBudgetService = departmentBudgetService;
            _logger = logger;
        }

        #region Fund Allocation Endpoints

        /// <summary>
        /// Creates a new fund allocation.
        /// </summary>
        /// <param name="request">Payload containing fund allocation details.</param>
        /// <returns>
        /// 200 OK on success,  
        /// 400 Bad Request if creation fails,  
        /// 500 Internal Server Error for unexpected errors.
        /// </returns>
        [HttpPost("create")]
        public async Task<IActionResult> CreateFundAllocation([FromBody] CreateFundAllocationRequestDto request)
        {
            try
            {
                EEPZBusinessLog.LogBusinessInformation("Creating fund allocation for department {DepartmentId}, amount: {Amount}", 
                    request.DepartmentId, request.Amount);
                
                var result = await _fundAllocationService.CreateFundAllocationAsync(request);

                if (!result.Success)
                {
                    EEPZBusinessLog.LogBusinessWarning("Fund allocation creation failed: {Message}", result.Message);
                    return BadRequest(result);
                }

                EEPZBusinessLog.LogBusinessInformation("Fund allocation created successfully for department {DepartmentId}", request.DepartmentId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Error creating fund allocation for department {DepartmentId}", ex, request.DepartmentId);
                throw;
            }
        }

        /// <summary>
        /// Updates an existing fund allocation.
        /// </summary>
        /// <param name="request">Payload containing updated fund allocation data.</param>
        /// <returns>
        /// 200 OK on success,  
        /// 400 Bad Request if update fails,  
        /// 500 Internal Server Error for unexpected errors.
        /// </returns>
        [HttpPut("update")]
        public async Task<IActionResult> UpdateFundAllocation([FromBody] UpdateFundAllocationRequestDto request)
        {
            try
            {
                EEPZBusinessLog.LogBusinessInformation("Updating fund allocation {AllocationId}", request.AllocationId);
                
                var result = await _fundAllocationService.UpdateFundAllocationAsync(request);

                if (!result.Success)
                {
                    EEPZBusinessLog.LogBusinessWarning("Fund allocation update failed for {AllocationId}: {Message}", 
                        request.AllocationId, result.Message);
                    return BadRequest(result);
                }

                EEPZBusinessLog.LogBusinessInformation("Fund allocation {AllocationId} updated successfully", request.AllocationId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Error updating fund allocation {AllocationId}", ex, request.AllocationId);
                throw;
            }
        }

        /// <summary>
        /// Deletes a fund allocation by its identifier.
        /// </summary>
        /// <param name="allocationId">The fund allocation ID.</param>
        /// <returns>
        /// 200 OK on success,  
        /// 400 Bad Request if deletion fails,  
        /// 500 Internal Server Error for unexpected errors.
        /// </returns>
        [HttpDelete("{allocationId}")]
        public async Task<IActionResult> DeleteFundAllocation(int allocationId)
        {
            try
            {
                EEPZBusinessLog.LogBusinessInformation("Deleting fund allocation {AllocationId}", allocationId);
                
                var result = await _fundAllocationService.DeleteFundAllocationAsync(allocationId);

                if (!result.Success)
                {
                    EEPZBusinessLog.LogBusinessWarning("Fund allocation deletion failed for {AllocationId}: {Message}", 
                        allocationId, result.Message);
                    return BadRequest(result);
                }

                EEPZBusinessLog.LogBusinessInformation("Fund allocation {AllocationId} deleted successfully", allocationId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Error deleting fund allocation {AllocationId}", ex, allocationId);
                throw;
            }
        }

        /// <summary>
        /// Retrieves all fund allocations.
        /// </summary>
        /// <returns>
        /// 200 OK with list of fund allocations,  
        /// 500 Internal Server Error on failure.
        /// </returns>
        [HttpGet("all")]
        public async Task<IActionResult> GetAllFundAllocations()
        {
            try
            {
                EEPZBusinessLog.LogBusinessInformation("Retrieving all fund allocations");
                
                var result = await _fundAllocationService.GetAllFundAllocationsAsync();
                
                EEPZBusinessLog.LogBusinessInformation("Retrieved {Count} fund allocations", result.Data?.Count ?? 0);
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Error retrieving all fund allocations", ex);
                throw;
            }
        }

        /// <summary>
        /// Retrieves a fund allocation by its ID.
        /// </summary>
        /// <param name="allocationId">Fund allocation identifier.</param>
        /// <returns>
        /// 200 OK when found,  
        /// 404 Not Found if allocation does not exist,  
        /// 500 Internal Server Error for unexpected failure.
        /// </returns>
        [HttpGet("{allocationId}")]
        public async Task<IActionResult> GetFundAllocationById(int allocationId)
        {
            try
            {
                EEPZBusinessLog.LogBusinessInformation("Retrieving fund allocation {AllocationId}", allocationId);
                
                var result = await _fundAllocationService.GetFundAllocationByIdAsync(allocationId);

                if (!result.Success)
                {
                    EEPZBusinessLog.LogBusinessWarning("Fund allocation {AllocationId} not found", allocationId);
                    return NotFound(result);
                }

                EEPZBusinessLog.LogBusinessInformation("Fund allocation {AllocationId} retrieved successfully", allocationId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Error retrieving fund allocation {AllocationId}", ex, allocationId);
                throw;
            }
        }

        /// <summary>
        /// Retrieves all fund allocations for a specific department.
        /// </summary>
        /// <param name="departmentId">The department identifier.</param>
        /// <returns>
        /// 200 OK with allocations list,  
        /// 500 Internal Server Error on failure.
        /// </returns>
        [HttpGet("by-department/{departmentId}")]
        public async Task<IActionResult> GetFundAllocationsByDepartment(int departmentId)
        {
            try
            {
                EEPZBusinessLog.LogBusinessInformation("Retrieving fund allocations for department {DepartmentId}", departmentId);
                
                var result = await _fundAllocationService.GetFundAllocationsByDepartmentAsync(departmentId);
                
                EEPZBusinessLog.LogBusinessInformation("Retrieved {Count} fund allocations for department {DepartmentId}", 
                    result.Data?.Count ?? 0, departmentId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Error retrieving fund allocations for department {DepartmentId}", ex, departmentId);
                throw;
            }
        }

        /// <summary>
        /// Retrieves fund allocations by allocation type.
        /// </summary>
        /// <param name="allocationType">The type/category of fund allocation.</param>
        /// <returns>
        /// 200 OK with matching allocations,  
        /// 500 Internal Server Error on failure.
        /// </returns>
        [HttpGet("by-type/{allocationType}")]
        public async Task<IActionResult> GetFundAllocationsByType(string allocationType)
        {
            try
            {
                EEPZBusinessLog.LogBusinessInformation("Retrieving fund allocations by type: {AllocationType}", allocationType);
                
                var result = await _fundAllocationService.GetFundAllocationsByTypeAsync(allocationType);
                
                EEPZBusinessLog.LogBusinessInformation("Retrieved {Count} fund allocations for type {AllocationType}", 
                    result.Data?.Count ?? 0, allocationType);
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Error retrieving fund allocations by type {AllocationType}", ex, allocationType);
                throw;
            }
        }

        #endregion

        #region Department Budget Endpoints

        /// <summary>
        /// Retrieves all department budgets.
        /// </summary>
        /// <returns>
        /// 200 OK with budgets list,  
        /// 500 Internal Server Error if retrieval fails.
        /// </returns>
        [HttpGet("department-budgets/all")]
        public async Task<IActionResult> GetAllDepartmentBudgets()
        {
            try
            {
                EEPZBusinessLog.LogBusinessInformation("Retrieving all department budgets");
                
                var result = await _departmentBudgetService.GetAllDepartmentBudgetsAsync();
                
                EEPZBusinessLog.LogBusinessInformation("Retrieved {Count} department budgets", result.Data?.Count ?? 0);
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Error retrieving all department budgets", ex);
                throw;
            }
        }

        /// <summary>
        /// Retrieves the budget for a specific department.
        /// </summary>
        /// <param name="departmentId">Department identifier.</param>
        /// <returns>
        /// 200 OK when found,  
        /// 404 Not Found if department not found,  
        /// 400 Bad Request on invalid request,  
        /// 500 Internal Server Error on failure.
        /// </returns>
        [HttpGet("department-budgets/department/{departmentId}")]
        public async Task<IActionResult> GetDepartmentBudget(int departmentId)
        {
            try
            {
                EEPZBusinessLog.LogBusinessInformation("Retrieving budget for department {DepartmentId}", departmentId);
                
                var result = await _departmentBudgetService.GetDepartmentBudgetAsync(departmentId);

                if (!result.Success)
                {
                    if (result.Message.Contains("not found"))
                    {
                        EEPZBusinessLog.LogBusinessWarning("Budget for department {DepartmentId} not found", departmentId);
                        return NotFound(result);
                    }

                    EEPZBusinessLog.LogBusinessWarning("Failed to retrieve budget for department {DepartmentId}: {Message}", 
                        departmentId, result.Message);
                    return BadRequest(result);
                }

                EEPZBusinessLog.LogBusinessInformation("Budget for department {DepartmentId} retrieved successfully", departmentId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Error retrieving budget for department {DepartmentId}", ex, departmentId);
                throw;
            }
        }

        /// <summary>
        /// Retrieves department budgets by fiscal year.
        /// </summary>
        /// <param name="fiscalYear">The fiscal year (e.g., 2024).</param>
        /// <returns>
        /// 200 OK on success,  
        /// 400 Bad Request if criteria fail,  
        /// 500 Internal Server Error on unexpected errors.
        /// </returns>
        [HttpGet("department-budgets/year/{fiscalYear}")]
        public async Task<IActionResult> GetDepartmentBudgetsByYear(int fiscalYear)
        {
            try
            {
                EEPZBusinessLog.LogBusinessInformation("Retrieving department budgets for fiscal year {FiscalYear}", fiscalYear);
                
                var result = await _departmentBudgetService.GetDepartmentBudgetsByYearAsync(fiscalYear);

                if (!result.Success)
                {
                    EEPZBusinessLog.LogBusinessWarning("Failed to retrieve budgets for fiscal year {FiscalYear}: {Message}", 
                        fiscalYear, result.Message);
                    return BadRequest(result);
                }

                EEPZBusinessLog.LogBusinessInformation("Retrieved {Count} budgets for fiscal year {FiscalYear}", 
                    result.Data?.Count ?? 0, fiscalYear);
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Error retrieving budgets for fiscal year {FiscalYear}", ex, fiscalYear);
                throw;
            }
        }

        /// <summary>
        /// Creates a new department budget.
        /// </summary>
        /// <param name="request">Payload containing budget details.</param>
        /// <returns>
        /// 200 OK on success,  
        /// 404 Not Found if a linked entity is missing,  
        /// 400 Bad Request for invalid input,  
        /// 500 Internal Server Error on failure.
        /// </returns>
        [HttpPost("department-budgets/create")]
        public async Task<IActionResult> CreateDepartmentBudget([FromBody] CreateDepartmentBudgetDto request)
        {
            try
            {
                EEPZBusinessLog.LogBusinessInformation("Creating budget for department {DepartmentId}, fiscal year {FiscalYear}, amount: {TotalBudget}", 
                    request.DepartmentId, request.FiscalYear, request.TotalBudget);
                
                var result = await _departmentBudgetService.CreateDepartmentBudgetAsync(request);

                if (!result.Success)
                {
                    if (result.Message.Contains("not found"))
                    {
                        EEPZBusinessLog.LogBusinessWarning("Failed to create budget - entity not found: {Message}", result.Message);
                        return NotFound(result);
                    }

                    EEPZBusinessLog.LogBusinessWarning("Failed to create budget for department {DepartmentId}: {Message}", 
                        request.DepartmentId, result.Message);
                    return BadRequest(result);
                }

                EEPZBusinessLog.LogBusinessInformation("Budget created successfully for department {DepartmentId}", request.DepartmentId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Error creating budget for department {DepartmentId}", ex, request.DepartmentId);
                throw;
            }
        }

        /// <summary>
        /// Updates an existing department budget.
        /// </summary>
        /// <param name="request">Payload containing updated department budget details.</param>
        /// <returns>
        /// 200 OK on success,  
        /// 404 Not Found if associated entities are missing,  
        /// 400 Bad Request for invalid input,  
        /// 500 Internal Server Error on unexpected errors.
        /// </returns>
        [HttpPut("department-budgets/update")]
        public async Task<IActionResult> UpdateDepartmentBudget([FromBody] UpdateDepartmentBudgetDto request)
        {
            try
            {
                EEPZBusinessLog.LogBusinessInformation("Updating budget {BudgetId}", request.BudgetId);
                
                var result = await _departmentBudgetService.UpdateDepartmentBudgetAsync(request);

                if (!result.Success)
                {
                    if (result.Message.Contains("not found"))
                    {
                        EEPZBusinessLog.LogBusinessWarning("Budget {BudgetId} not found", request.BudgetId);
                        return NotFound(result);
                    }

                    EEPZBusinessLog.LogBusinessWarning("Failed to update budget {BudgetId}: {Message}", 
                        request.BudgetId, result.Message);
                    return BadRequest(result);
                }

                EEPZBusinessLog.LogBusinessInformation("Budget {BudgetId} updated successfully", request.BudgetId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Error updating budget {BudgetId}", ex, request.BudgetId);
                throw;
            }
        }

        /// <summary>
        /// Deletes a department budget by its identifier.
        /// </summary>
        /// <param name="budgetId">The department budget ID.</param>
        /// <returns>
        /// 200 OK on success,  
        /// 404 Not Found if the budget does not exist,  
        /// 400 Bad Request on invalid operation,  
        /// 500 Internal Server Error on unexpected errors.
        /// </returns>
        [HttpDelete("department-budgets/{budgetId}")]
        public async Task<IActionResult> DeleteDepartmentBudget(int budgetId)
        {
            try
            {
                EEPZBusinessLog.LogBusinessInformation("Deleting budget {BudgetId}", budgetId);
                
                var result = await _departmentBudgetService.DeleteDepartmentBudgetAsync(budgetId);

                if (!result.Success)
                {
                    if (result.Message.Contains("not found"))
                    {
                        EEPZBusinessLog.LogBusinessWarning("Budget {BudgetId} not found", budgetId);
                        return NotFound(result);
                    }

                    EEPZBusinessLog.LogBusinessWarning("Failed to delete budget {BudgetId}: {Message}", budgetId, result.Message);
                    return BadRequest(result);
                }

                EEPZBusinessLog.LogBusinessInformation("Budget {BudgetId} deleted successfully", budgetId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Error deleting budget {BudgetId}", ex, budgetId);
                throw;
            }
        }

        /// <summary>
        /// Updates the utilized amount for a specific budget allocation.
        /// </summary>
        /// <param name="request">Payload containing budget and utilized amount.</param>
        /// <returns>
        /// 200 OK on success,  
        /// 404 Not Found if budget not found,  
        /// 400 Bad Request for invalid data,  
        /// 500 Internal Server Error on failure.
        /// </returns>
        [HttpPut("department-budgets/update-utilized-amount")]
        public async Task<IActionResult> UpdateUtilizedAmount([FromBody] UpdateUtilizedAmountDto request)
        {
            try
            {
                EEPZBusinessLog.LogBusinessInformation("Updating utilized amount for budget {BudgetId} to {UtilizedAmount}", 
                    request.BudgetId, request.UtilizedAmount);
                
                var result = await _departmentBudgetService.UpdateUtilizedAmountAsync(request);

                if (!result.Success)
                {
                    if (result.Message.Contains("not found"))
                    {
                        EEPZBusinessLog.LogBusinessWarning("Budget {BudgetId} not found", request.BudgetId);
                        return NotFound(result);
                    }

                    EEPZBusinessLog.LogBusinessWarning("Failed to update utilized amount for budget {BudgetId}: {Message}", 
                        request.BudgetId, result.Message);
                    return BadRequest(result);
                }

                EEPZBusinessLog.LogBusinessInformation("Utilized amount updated successfully for budget {BudgetId}", request.BudgetId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Error updating utilized amount for budget {BudgetId}", ex, request.BudgetId);
                throw;
            }
        }

        /// <summary>
        /// Updates the utilization details for a specific allocation.
        /// </summary>
        /// <param name="request">Payload containing allocation and utilization data.</param>
        /// <returns>
        /// 200 OK on success,  
        /// 404 Not Found if allocation not found,  
        /// 400 Bad Request for invalid data,  
        /// 500 Internal Server Error on failure.
        /// </returns>
        [HttpPut("department-budgets/update-utilization")]
        public async Task<IActionResult> UpdateUtilization([FromBody] UpdateUtilizationDto request)
        {
            try
            {
                EEPZBusinessLog.LogBusinessInformation("Updating utilization for allocation {AllocationId}", request.AllocationId);
                
                var result = await _departmentBudgetService.UpdateUtilizationAsync(request);

                if (!result.Success)
                {
                    if (result.Message.Contains("not found"))
                    {
                        EEPZBusinessLog.LogBusinessWarning("Allocation {AllocationId} not found", request.AllocationId);
                        return NotFound(result);
                    }

                    EEPZBusinessLog.LogBusinessWarning("Failed to update utilization for allocation {AllocationId}: {Message}", 
                        request.AllocationId, result.Message);
                    return BadRequest(result);
                }

                EEPZBusinessLog.LogBusinessInformation("Utilization updated successfully for allocation {AllocationId}", request.AllocationId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                EEPZBusinessLog.LogBusinessError("Error updating utilization for allocation {AllocationId}", ex, request.AllocationId);
                throw;
            }
        }

        #endregion
    }
}
