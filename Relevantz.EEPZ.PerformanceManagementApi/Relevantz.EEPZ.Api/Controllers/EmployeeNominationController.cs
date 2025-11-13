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
 
        /// <summary>

        /// Get approved notifications for specific employee ID

        /// NO authentication required (authentication is pending)

        ///

        /// Query Database:

        /// - Check Nomination table

        /// - Where NomineeEmployeeId = employeeId

        /// - Where Status = "Approved"

        ///

        /// GET: api/EmployeeNomination/search?employeeId=1

        /// </summary>

        [HttpGet("search")]

        public async Task<IActionResult> SearchEmployeeNotifications([FromQuery] int employeeId)

        {

            try

            {

                _logger.LogInformation($"[SEARCH] Searching notifications for employee ID: {employeeId}");
 
                // Validation: Employee ID must be greater than 0

                if (employeeId <= 0)

                {

                    return BadRequest(new

                    {

                        success = false,

                        message = "Please enter a valid employee ID"

                    });

                }
 
                // ✅ FIXED: Query Recognitionstatuses table for this employee

                var approvedNominations = await _context.Recognitionstatuses

                    .Where(n => n.NomineeEmployeeId == employeeId)  // Match employee ID

                    .Where(n => n.Status == "Approved")             // Only approved

                    .ToListAsync();
 
                // If no approved nominations found

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
 
                // ✅ Transform data for display - fetch opportunity separately for each nomination

                var result = new List<object>();

                foreach (var nomination in approvedNominations)

                {

                    // ✅ Fetch opportunity with RewardType separately

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

 