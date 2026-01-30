using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Core.IService;
using Relevantz.EEPZ.Api.Constants;

namespace Relevantz.EEPZ.Api.Controllers
{
    /// <summary>
    /// Provides analytics and statistical insights for internal opportunities.
    /// Includes endpoints for aggregated statistics and graph-ready data.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Employee,Manager,HR")]
    public class OpportunityAnalyticController : ControllerBase
    {
        private readonly IInternalOpportunityService _opportunityService;

        public OpportunityAnalyticController(IInternalOpportunityService opportunityService)
        {
            _opportunityService = opportunityService;
        }

        /// <summary>
        /// Retrieves system-wide statistics related to internal opportunities.
        /// Accessible by Employees, Managers, and HR.
        /// </summary>
        [HttpGet("statistic")]
        public async Task<IActionResult> GetOpportunityStatistics()
        {
            var result = await _opportunityService.GetStatisticsAsync();
            return Ok(result);
        }

        /// <summary>
        /// Returns aggregated graph-friendly data based on opportunity statistics.
        /// Commonly used for dashboards and analytics visualizations.
        /// </summary>
        [HttpGet("graph-data")]
        public async Task<IActionResult> GetGraphData()
        {
            var statistics = await _opportunityService.GetStatisticsAsync();
            return Ok(new
            {
                message = MessageConstants.OpportunityGraphData,
                data = statistics
            });
        }
    }
}
