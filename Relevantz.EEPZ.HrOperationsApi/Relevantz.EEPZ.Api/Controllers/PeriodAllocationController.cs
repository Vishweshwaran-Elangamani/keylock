using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.IService;

namespace Relevantz.EEPZ.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PeriodAllocationController : ControllerBase
    {
        private readonly IPeriodAllocationService _periodAllocationService;

        public PeriodAllocationController(IPeriodAllocationService periodAllocationService)
        {
            _periodAllocationService = periodAllocationService;
        }

        /// <summary>
        /// Leadership: Create period-based budget allocation (e.g., 10L for Q1, 20L for Q2)
        /// </summary>
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
                Console.WriteLine($"Controller Error: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while creating period allocation",
                    data = (object?)null
                });
            }
        }

        /// <summary>
        /// Leadership: Update period allocation amount
        /// </summary>
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
                Console.WriteLine($"Controller Error: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while updating period allocation",
                    data = (object?)null
                });
            }
        }

        /// <summary>
        /// Leadership: Delete period allocation (only if no sub-allocations exist)
        /// </summary>
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
                Console.WriteLine($"Controller Error: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while deleting period allocation",
                    data = (object?)null
                });
            }
        }

        /// <summary>
        /// Get period allocation by ID
        /// </summary>
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
                Console.WriteLine($"Controller Error: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while fetching period allocation",
                    data = (object?)null
                });
            }
        }

        /// <summary>
        /// Get all period allocations
        /// </summary>
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
                Console.WriteLine($"Controller Error: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while fetching period allocations",
                    data = (object?)null
                });
            }
        }

        /// <summary>
        /// Get all period allocations for a specific budget
        /// </summary>
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
                Console.WriteLine($"Controller Error: {ex.Message}");
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
