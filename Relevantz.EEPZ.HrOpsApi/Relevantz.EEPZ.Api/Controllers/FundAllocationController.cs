using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.IService;
using Microsoft.AspNetCore.Mvc;

namespace Relevantz.EEPZ.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FundAllocationController : ControllerBase
    {
        private readonly IFundAllocationService _fundAllocationService;
        private readonly IDepartmentBudgetService _departmentBudgetService;
        private readonly ILogger<FundAllocationController> _logger;

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
