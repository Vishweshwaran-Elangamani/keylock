using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.IService;
using Microsoft.AspNetCore.Mvc;
 
namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CostMappingController : ControllerBase
    {
        private readonly ICostMappingService _costMappingService;
 
        public CostMappingController(ICostMappingService costMappingService)
        {
            _costMappingService = costMappingService;
        }
 
        [HttpGet("headcount/{departmentId}")]
        public async Task<IActionResult> GetDepartmentHeadcount(int departmentId)
        {
            var result = await _costMappingService.GetDepartmentHeadcountAsync(departmentId);
            if (!result.Success)
                return NotFound(result);
            return Ok(result);
        }
 
        [HttpPost("create")]
        public async Task<IActionResult> CreateCostMapping([FromBody] CreateCostMappingRequestDto request)
        {
            var result = await _costMappingService.CreateCostMappingAsync(request);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
 
        [HttpPut("update")]
        public async Task<IActionResult> UpdateCostMapping([FromBody] UpdateCostMappingRequestDto request)
        {
            var result = await _costMappingService.UpdateCostMappingAsync(request);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
 
        [HttpGet("{budgetId}")]
        public async Task<IActionResult> GetCostMappingById(int budgetId)
        {
            var result = await _costMappingService.GetCostMappingByIdAsync(budgetId);
            if (!result.Success)
                return NotFound(result);
            return Ok(result);
        }
 
        [HttpGet("all")]
        public async Task<IActionResult> GetAllCostMappings()
        {
            var result = await _costMappingService.GetAllCostMappingsAsync();
            return Ok(result);
        }
 
        [HttpGet("by-department/{departmentId}")]
        public async Task<IActionResult> GetCostMappingsByDepartment(int departmentId)
        {
            var result = await _costMappingService.GetCostMappingsByDepartmentAsync(departmentId);
            return Ok(result);
        }
 
        [HttpGet("by-fiscal-year/{fiscalYear}")]
        public async Task<IActionResult> GetCostMappingsByFiscalYear(int fiscalYear)
        {
            var result = await _costMappingService.GetCostMappingsByFiscalYearAsync(fiscalYear);
            return Ok(result);
        }
 
        [HttpDelete("{budgetId}")]
        public async Task<IActionResult> DeleteCostMapping(int budgetId)
        {
            var result = await _costMappingService.DeleteCostMappingAsync(budgetId);
            if (!result.Success)
                return NotFound(result);
            return Ok(result);
        }
    }
 
 
 
}
 
 