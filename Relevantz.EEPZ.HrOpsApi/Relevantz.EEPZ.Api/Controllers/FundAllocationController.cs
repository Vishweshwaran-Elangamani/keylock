
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.IService;
using Microsoft.AspNetCore.Mvc;

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
                var result = await _fundAllocationService.CreateFundAllocationAsync(request);

                if (!result.Success)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating fund allocation: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while creating fund allocation",
                    data = (object)null
                });
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
                var result = await _fundAllocationService.UpdateFundAllocationAsync(request);

                if (!result.Success)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating fund allocation: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while updating fund allocation",
                    data = (object)null
                });
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
                var result = await _fundAllocationService.DeleteFundAllocationAsync(allocationId);

                if (!result.Success)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting fund allocation: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while deleting fund allocation",
                    data = (object)null
                });
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
                var result = await _fundAllocationService.GetAllFundAllocationsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching fund allocations: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while fetching fund allocations",
                    data = (object)null
                });
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
                var result = await _fundAllocationService.GetFundAllocationByIdAsync(allocationId);

                if (!result.Success)
                    return NotFound(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching fund allocation: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while fetching fund allocation",
                    data = (object)null
                });
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
                var result = await _fundAllocationService.GetFundAllocationsByDepartmentAsync(departmentId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching fund allocations by department: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while fetching fund allocations by department",
                    data = (object)null
                });
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
                var result = await _fundAllocationService.GetFundAllocationsByTypeAsync(allocationType);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching fund allocations by type: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while fetching fund allocations by type",
                    data = (object)null
                });
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
                var result = await _departmentBudgetService.GetAllDepartmentBudgetsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching department budgets: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while fetching department budgets",
                    data = (object)null
                });
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
                var result = await _departmentBudgetService.GetDepartmentBudgetAsync(departmentId);

                if (!result.Success)
                {
                    if (result.Message.Contains("not found"))
                        return NotFound(result);

                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching department budget: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while fetching department budget",
                    data = (object)null
                });
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
                var result = await _departmentBudgetService.GetDepartmentBudgetsByYearAsync(fiscalYear);

                if (!result.Success)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching department budgets by year: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while fetching department budgets by year",
                    data = (object)null
                });
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
                var result = await _departmentBudgetService.CreateDepartmentBudgetAsync(request);

                if (!result.Success)
                {
                    if (result.Message.Contains("not found"))
                        return NotFound(result);

                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating department budget: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while creating department budget",
                    data = (object)null
                });
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
                var result = await _departmentBudgetService.UpdateDepartmentBudgetAsync(request);

                if (!result.Success)
                {
                    if (result.Message.Contains("not found"))
                        return NotFound(result);

                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating department budget: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while updating department budget",
                    data = (object)null
                });
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
                var result = await _departmentBudgetService.DeleteDepartmentBudgetAsync(budgetId);

                if (!result.Success)
                {
                    if (result.Message.Contains("not found"))
                        return NotFound(result);

                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting department budget: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while deleting department budget",
                    data = (object)null
                });
            }
        }

        /// <summary>
        /// Updates the utilized budget amount for a department.
        /// </summary>
        /// <param name="request">Payload containing update details.</param>
        /// <returns>
        /// 200 OK on success,  
        /// 404 Not Found if the budget does not exist,  
        /// 400 Bad Request on invalid update,  
        /// 500 Internal Server Error on unexpected failures.
        /// </returns>
        [HttpPut("department-budgets/update-utilized")]
        public async Task<IActionResult> UpdateUtilizedAmount([FromBody] UpdateUtilizedAmountDto request)
        {
            try
            {
                var result = await _departmentBudgetService.UpdateUtilizedAmountAsync(request);

                if (!result.Success)
                {
                    if (result.Message.Contains("not found"))
                        return NotFound(result);

                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating utilized amount: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while updating utilized amount",
                    data = (object)null
                });
            }
        }

        /// <summary>
        /// Updates the utilization percentage or value for a department budget.
        /// </summary>
        /// <param name="request">Payload containing utilization update details.</param>
        /// <returns>
        /// 200 OK on success,  
        /// 404 Not Found if budget not found,  
        /// 400 Bad Request on invalid operation,  
        /// 500 Internal Server Error on unexpected errors.
        /// </returns>
        [HttpPut("update-utilization")]
        public async Task<IActionResult> UpdateUtilization([FromBody] UpdateUtilizationDto request)
        {
            try
            {
                var result = await _departmentBudgetService.UpdateUtilizationAsync(request);

                if (!result.Success)
                {
                    if (result.Message.Contains("not found"))
                        return NotFound(result);

                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating utilization: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while updating utilization",
                    data = (object)null
                });
            }
        }

        /// <summary>
        /// Retrieves all fund allocations associated with a specific budget.
        /// </summary>
        /// <param name="budgetId">The budget identifier.</param>
        /// <returns>
        /// 200 OK with allocation list,  
        /// 500 Internal Server Error on unexpected errors.
        /// </returns>
        [HttpGet("by-budget/{budgetId}")]
        public async Task<IActionResult> GetAllocationsByBudget(int budgetId)
        {
            try
            {
                var result = await _departmentBudgetService.GetAllocationsByBudgetAsync(budgetId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting allocations: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while fetching allocations",
                    data = (object)null
                });
            }
        }

        #endregion
    }
}
