using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Core.IService;

namespace Relevantz.EEPZ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OpportunityAnalyticsController : ControllerBase
    {
        private readonly IInternalOpportunityService _opportunityService;

        public OpportunityAnalyticsController(IInternalOpportunityService opportunityService)
        {
            _opportunityService = opportunityService;
        }

        [HttpGet("statistics")]
        [Authorize(Roles = "Employee,Manager,HR")]
        public async Task<IActionResult> GetOpportunityStatistics()
        {
            try
            {
                var result = await _opportunityService.GetStatisticsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("graph-data")]
        [Authorize(Roles = "Employee,Manager,HR")]
        public async Task<IActionResult> GetGraphData()
        {
            try
            {
                var statistics = await _opportunityService.GetStatisticsAsync();
                return Ok(new
                {
                    message = "Opportunity graph data",
                    data = statistics
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
