
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.IService;

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
            try
            {
                var result = await _periodAllocationService.CreatePeriodAllocationAsync(request);
                if (!result.Success)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating period allocation: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while creating period allocation",
                    data = (object?)null
                });
            }
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
            try
            {
                var result = await _periodAllocationService.UpdatePeriodAllocationAsync(request);
                if (!result.Success)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating period allocation: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while updating period allocation",
                    data = (object?)null
                });
            }
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
            try
            {
                var result = await _periodAllocationService.DeletePeriodAllocationAsync(periodAllocationId);
                if (!result.Success)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting period allocation {periodAllocationId}: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while deleting period allocation",
                    data = (object?)null
                });
            }
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
            try
            {
                var result = await _periodAllocationService.GetPeriodAllocationByIdAsync(periodAllocationId);
                if (!result.Success)
                    return NotFound(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching period allocation {periodAllocationId}: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while fetching period allocation",
                    data = (object?)null
                });
            }
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
            try
            {
                var result = await _periodAllocationService.GetAllPeriodAllocationsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching all period allocations: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while fetching period allocations",
                    data = (object?)null
                });
            }
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
            try
            {
                var result = await _periodAllocationService.GetPeriodAllocationsByBudgetAsync(budgetId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching period allocations by budget {budgetId}: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while fetching period allocations by budget",
                    data = (object?)null
                });
            }
        }
    }
}
