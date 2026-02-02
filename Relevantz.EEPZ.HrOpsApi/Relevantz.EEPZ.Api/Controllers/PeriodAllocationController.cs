using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.Utils;
using Relevantz.EEPZ.Core.IService;
using Microsoft.Extensions.Logging;


namespace Relevantz.EEPZ.Api.Controllers
{
    /// <summary>
    /// Provides endpoints for creating, updating, deleting, and retrieving
    /// period-based budget allocations used in forecasting and financial planning.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class PeriodAllocationController : ControllerBase
    {
        private readonly IPeriodAllocationService _periodAllocationService;
        private readonly ILogger<PeriodAllocationController> _logger;


        /// <summary>
        /// Initializes a new instance of <see cref="PeriodAllocationController"/>.
        /// </summary>
        /// <param name="periodAllocationService">Service handling period allocation operations.</param>
        /// <param name="logger">Logger instance for capturing operational logs and errors.</param>
        public PeriodAllocationController(
            IPeriodAllocationService periodAllocationService,
            ILogger<PeriodAllocationController> logger)
        {
            _periodAllocationService = periodAllocationService;
            _logger = logger;
        }


        /// <summary>
        /// Creates a new period-based budget allocation.
        /// </summary>
        /// <param name="request">Payload containing allocation period, amount, and budget references.</param>
        /// <returns>
        /// 200 OK on success,  
        /// 400 Bad Request if creation fails,  
        /// 500 Internal Server Error on unexpected errors.
        /// </returns>
        [HttpPost("create")]
        public async Task<IActionResult> CreatePeriodAllocation([FromBody] CreatePeriodAllocationDto request)
        {
            EEPZBusinessLog.LogBusinessInformation("Creating period allocation for budget {BudgetId}, period {Period}, year {PeriodYear}, amount: {AllocatedAmount}",
                request.BudgetId, request.Period, request.PeriodYear, request.AllocatedAmount);


            var result = await _periodAllocationService.CreatePeriodAllocationAsync(request);


            if (!result.Success)
            {
                EEPZBusinessLog.LogBusinessWarning("Period allocation creation failed for budget {BudgetId}: {Message}",
                    request.BudgetId, result.Message);
                return BadRequest(result);
            }


            EEPZBusinessLog.LogBusinessInformation("Period allocation created successfully for budget {BudgetId}, period {Period}",
                request.BudgetId, request.Period);
            return Ok(result);
        }


        /// <summary>
        /// Updates an existing period allocation amount or configuration.
        /// </summary>
        /// <param name="request">Payload containing updated allocation information.</param>
        /// <returns>
        /// 200 OK on success,  
        /// 400 Bad Request if update fails,  
        /// 500 Internal Server Error on unexpected errors.
        /// </returns>
        [HttpPut("update")]
        public async Task<IActionResult> UpdatePeriodAllocation([FromBody] UpdatePeriodAllocationDto request)
        {
            EEPZBusinessLog.LogBusinessInformation("Updating period allocation {PeriodAllocationId}",
                request.PeriodAllocationId);


            var result = await _periodAllocationService.UpdatePeriodAllocationAsync(request);


            if (!result.Success)
            {
                EEPZBusinessLog.LogBusinessWarning("Period allocation update failed for {PeriodAllocationId}: {Message}",
                    request.PeriodAllocationId, result.Message);
                return BadRequest(result);
            }


            EEPZBusinessLog.LogBusinessInformation("Period allocation {PeriodAllocationId} updated successfully",
                request.PeriodAllocationId);
            return Ok(result);
        }


        /// <summary>
        /// Deletes a period allocation based on its identifier.
        /// Only possible if the allocation has no dependent sub-allocations.
        /// </summary>
        /// <param name="periodAllocationId">The period allocation ID.</param>
        /// <returns>
        /// 200 OK on success,  
        /// 400 Bad Request if deletion is restricted or fails,  
        /// 500 Internal Server Error on unexpected errors.
        /// </returns>
        [HttpDelete("{periodAllocationId}")]
        public async Task<IActionResult> DeletePeriodAllocation(int periodAllocationId)
        {
            EEPZBusinessLog.LogBusinessInformation("Deleting period allocation {PeriodAllocationId}", periodAllocationId);


            var result = await _periodAllocationService.DeletePeriodAllocationAsync(periodAllocationId);


            if (!result.Success)
            {
                EEPZBusinessLog.LogBusinessWarning("Period allocation deletion failed for {PeriodAllocationId}: {Message}",
                    periodAllocationId, result.Message);
                return BadRequest(result);
            }


            EEPZBusinessLog.LogBusinessInformation("Period allocation {PeriodAllocationId} deleted successfully", periodAllocationId);
            return Ok(result);
        }


        /// <summary>
        /// Retrieves a specific period allocation by its ID.
        /// </summary>
        /// <param name="periodAllocationId">The allocation identifier.</param>
        /// <returns>
        /// 200 OK when found,  
        /// 404 Not Found if no allocation exists for the given ID,  
        /// 500 Internal Server Error on failure.
        /// </returns>
        [HttpGet("{periodAllocationId}")]
        public async Task<IActionResult> GetPeriodAllocationById(int periodAllocationId)
        {
            EEPZBusinessLog.LogBusinessInformation("Retrieving period allocation {PeriodAllocationId}", periodAllocationId);


            var result = await _periodAllocationService.GetPeriodAllocationByIdAsync(periodAllocationId);


            if (!result.Success)
            {
                EEPZBusinessLog.LogBusinessWarning("Period allocation {PeriodAllocationId} not found", periodAllocationId);
                return NotFound(result);
            }


            EEPZBusinessLog.LogBusinessInformation("Period allocation {PeriodAllocationId} retrieved successfully", periodAllocationId);
            return Ok(result);
        }


        /// <summary>
        /// Retrieves all period allocations in the system.
        /// </summary>
        /// <returns>
        /// 200 OK with the list of period allocations,  
        /// 500 Internal Server Error on failure.
        /// </returns>
        [HttpGet("all")]
        public async Task<IActionResult> GetAllPeriodAllocations()
        {
            EEPZBusinessLog.LogBusinessInformation("Retrieving all period allocations");


            var result = await _periodAllocationService.GetAllPeriodAllocationsAsync();


            EEPZBusinessLog.LogBusinessInformation("Retrieved {Count} period allocations", result.Data?.Count ?? 0);
            return Ok(result);
        }


        /// <summary>
        /// Retrieves all period allocations associated with a specific department budget.
        /// </summary>
        /// <param name="budgetId">The budget identifier.</param>
        /// <returns>
        /// 200 OK with allocation list,  
        /// 500 Internal Server Error on unexpected errors.
        /// </returns>
        [HttpGet("by-budget/{budgetId}")]
        public async Task<IActionResult> GetPeriodAllocationsByBudget(int budgetId)
        {
            EEPZBusinessLog.LogBusinessInformation("Retrieving period allocations for budget {BudgetId}", budgetId);


            var result = await _periodAllocationService.GetPeriodAllocationsByBudgetAsync(budgetId);


            EEPZBusinessLog.LogBusinessInformation("Retrieved {Count} period allocations for budget {BudgetId}",
                result.Data?.Count ?? 0, budgetId);
            return Ok(result);
        }
    }
}
