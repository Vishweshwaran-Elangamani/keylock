using System;

using System.Collections.Generic;

using System.Linq;

using System.Threading.Tasks;

using Microsoft.AspNetCore.Mvc;

using Microsoft.EntityFrameworkCore;

using Microsoft.Extensions.Logging;

using Relevantz.EEPZ.Common.Entities;

using Relevantz.EEPZ.Data;

using Relevantz.EEPZ.Data.DBContexts;

namespace Relevantz.EEPZ.API.Controllers

{

    [ApiController]

    [Route("api/[controller]")]

    public class EmployeeNominationController : ControllerBase

    {

        private readonly EEPZDbContext _context;

        private readonly ILogger<EmployeeNominationController> _logger;

        public EmployeeNominationController(EEPZDbContext context, ILogger<EmployeeNominationController> logger)

        {

            _context = context;

            _logger = logger;

        }

        [HttpGet("search")]

        public async Task<IActionResult> SearchEmployeeNotifications([FromQuery] int employeeId)

        {

            try

            {

                _logger.LogInformation($"[SEARCH] Searching notifications for employee ID: {employeeId}");

                if (employeeId <= 0)

                {

                    return BadRequest(new

                    {

                        success = false,

                        message = "Please enter a valid employee ID"

                    });

                }

                var approvedNominations = await _context.Recognitionstatuses

                    .Where(n => n.NomineeEmployeeId == employeeId)  

                    .Where(n => n.Status == "Approved")             

                    .ToListAsync();

                if (approvedNominations.Count == 0)

                {

                    _logger.LogInformation($"[SEARCH] No approved notifications for employee {employeeId}");

                    return Ok(new

                    {

                        success = true,

                        data = new List<object>(),

                        message = "No approved notifications found"

                    });

                }

                var result = new List<object>();

                foreach (var nomination in approvedNominations)

                {

                    var opportunity = await _context.Recognitiondetails

                        .Where(o => o.OpportunityId == nomination.OpportunityId)

                        .Include(o => o.RewardType)

                        .FirstOrDefaultAsync();

                    result.Add(new

                    {

                        nominationId = nomination.NominationId,

                        roleType = opportunity?.RewardType?.RewardName ?? "Opportunity"

                    });

                }

                _logger.LogInformation($"[SEARCH] Found {result.Count} approved notifications for employee {employeeId}");

                return Ok(new

                {

                    success = true,

                    data = result,

                    count = result.Count

                });

            }

            catch (Exception ex)

            {

                _logger.LogError($"[SEARCH] Error: {ex.Message}");

                return StatusCode(500, new { success = false, message = ex.Message });

            }

        }

    }

}
