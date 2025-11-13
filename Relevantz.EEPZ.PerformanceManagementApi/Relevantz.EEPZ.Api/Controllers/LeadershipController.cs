
using Microsoft.AspNetCore.Mvc;

using Microsoft.EntityFrameworkCore;


using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LeadershipController : ControllerBase
    {
        private readonly ILeadershipService _service;
        private readonly ILogger<LeadershipController> _logger;
        private readonly EEPZDbContext _context;

        public LeadershipController(
            ILeadershipService service,
            ILogger<LeadershipController> logger,
            EEPZDbContext context)
        {
            _service = service;
            _logger = logger;
            _context = context;
        }

        // Example: GET /api/Leadership/performance-ratings?employeeId=3
        [HttpGet("performance-ratings")]
        public async Task<IActionResult> GetPerformanceRatings([FromQuery] int employeeId)
        {
            try
            {
                // Look up "Leadership" RoleId
                var leadershipRoleId = await _context.Roles
                    .Where(r => r.RoleCode == "LEAD")
                    .Select(r => r.RoleId)
                    .FirstOrDefaultAsync();

                // Check if input employeeId is a Leadership member
                var isLeadership = await _context.Employeedetailsmasters
                    .AnyAsync(edm => edm.EmployeeId == employeeId && edm.RoleId == leadershipRoleId);

                if (!isLeadership)
                {
                    return Forbid("Only Leadership employees can access this endpoint.");
                }

                var ratings = await _service.GetLeadershipPerformanceRatingsAsync();
                return Ok(ratings);
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Error fetching leadership performance ratings");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
