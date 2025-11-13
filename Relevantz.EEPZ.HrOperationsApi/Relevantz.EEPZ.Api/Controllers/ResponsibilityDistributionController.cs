using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Core.IService;
using Microsoft.AspNetCore.Mvc;
 
namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ResponsibilityDistributionController : ControllerBase
    {
        private readonly IResponsibilityDistributionService _responsibilityDistributionService;
 
        public ResponsibilityDistributionController(IResponsibilityDistributionService responsibilityDistributionService)
        {
            _responsibilityDistributionService = responsibilityDistributionService;
        }
 
        [HttpPost("create")]
        public async Task<IActionResult> CreateResponsibilityDistribution([FromBody] CreateResponsibilityDistributionRequestDto request)
        {
            var result = await _responsibilityDistributionService.CreateResponsibilityDistributionAsync(request);
 
            if (!result.Success)
                return BadRequest(result);
 
            return Ok(result);
        }
 
        [HttpPut("update")]
        public async Task<IActionResult> UpdateResponsibilityDistribution([FromBody] UpdateResponsibilityDistributionRequestDto request)
        {
            var result = await _responsibilityDistributionService.UpdateResponsibilityDistributionAsync(request);
 
            if (!result.Success)
                return BadRequest(result);
 
            return Ok(result);
        }
 
        [HttpGet("{workloadId}")]
        public async Task<IActionResult> GetResponsibilityDistributionById(int workloadId)
        {
            var result = await _responsibilityDistributionService.GetResponsibilityDistributionByIdAsync(workloadId);
 
            if (!result.Success)
                return NotFound(result);
 
            return Ok(result);
        }
 
        [HttpGet("all")]
        public async Task<IActionResult> GetAllResponsibilityDistributions()
        {
            var result = await _responsibilityDistributionService.GetAllResponsibilityDistributionsAsync();
            return Ok(result);
        }
 
        [HttpGet("by-department/{departmentId}")]
        public async Task<IActionResult> GetResponsibilityDistributionsByDepartment(int departmentId)
        {
            var result = await _responsibilityDistributionService.GetResponsibilityDistributionsByDepartmentAsync(departmentId);
            return Ok(result);
        }
 
        [HttpDelete("{workloadId}")]
        public async Task<IActionResult> DeleteResponsibilityDistribution(int workloadId)
        {
            var result = await _responsibilityDistributionService.DeleteResponsibilityDistributionAsync(workloadId);
 
            if (!result.Success)
                return NotFound(result);
 
            return Ok(result);
        }
    }
 
}
 
 