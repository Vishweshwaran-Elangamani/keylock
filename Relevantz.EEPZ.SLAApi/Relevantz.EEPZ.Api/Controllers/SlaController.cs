using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public partial class SlaController : ControllerBase
    {
        private readonly ISlaService _slaService;
        private readonly ILogger<SlaController> _logger;

        public SlaController(ISlaService slaService, ILogger<SlaController> logger)
        {
            _slaService = slaService;
            _logger = logger;
        }

        /// <summary>
        /// Get all SLAs
        /// </summary>
        [HttpGet("all")]
        public async Task<IActionResult> GetAllSlas()
        {
            try
            {
                _logger.LogInformation("Getting all SLAs");
                var result = await _slaService.GetAllSlas();
                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetAllSlas");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Create a single SLA (background processing)
        /// </summary>
        [HttpPost("create")]
        public IActionResult CreateSla([FromBody] CreateSlaRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                _logger.LogInformation("Queueing SLA creation process");

                _ = Task.Run(async () =>
                {
                    try
                    {
                        var result = await _slaService.CreateSla(request);
                        if (!result.Success)
                        {
                            _logger.LogWarning("SLA creation failed: {Message}", result.Message);
                        }
                        else
                        {
                            _logger.LogInformation("SLA created successfully");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error occurred while creating SLA in background");
                    }
                });

                return Accepted(new { success = true, message = "SLA creation started in background" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in CreateSla endpoint");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Bulk create multiple SLAs (10-20x faster than individual creates)
        /// Maximum 10,000 SLAs per request
        /// </summary>
        [HttpPost("bulk-create")]
        public async Task<IActionResult> BulkCreateSla([FromBody] List<CreateSlaRequest> requests)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                if (requests == null || !requests.Any())
                    return BadRequest(new { success = false, message = "No SLA records provided" });

                if (requests.Count > 10000)
                    return BadRequest(new { success = false, message = "Maximum 10,000 records allowed per bulk operation" });

                _logger.LogInformation("Starting bulk SLA creation for {Count} records", requests.Count);

                var result = await _slaService.BulkCreateSla(requests);

                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in BulkCreateSla endpoint");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get SLA by ID
        /// </summary>
        [HttpGet("{slaid}")]
        public async Task<IActionResult> GetSlaById(int slaid)
        {
            try
            {
                _logger.LogInformation("Getting SLA {Slaid}", slaid);
                var result = await _slaService.GetSlaById(slaid);
                return result.Success ? Ok(result) : NotFound(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetSlaById");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get all SLAs for a specific employee
        /// </summary>
        [HttpGet("employee/{employeeId}")]
        public async Task<IActionResult> GetEmployeeSlas(int employeeId)
        {
            try
            {
                _logger.LogInformation("Getting SLAs for employee {EmployeeId}", employeeId);
                var result = await _slaService.GetEmployeeSlas(employeeId);
                return result.Success ? Ok(result) : NotFound(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetEmployeeSlas");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get team review tracking for a manager
        /// </summary>
        [HttpGet("manager/{managerId}/team-reviews")]
        public async Task<IActionResult> GetTeamReviewTracking(int managerId)
        {
            try
            {
                _logger.LogInformation("Getting team review tracking for manager {ManagerId}", managerId);
                var result = await _slaService.GetTeamReviewTracking(managerId);
                return result.Success ? Ok(result) : NotFound(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetTeamReviewTracking");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get SLA history/audit trail
        /// </summary>
        [HttpGet("{slaid}/history")]
        public async Task<IActionResult> GetSlaHistory(int slaid)
        {
            try
            {
                _logger.LogInformation("Getting SLA history for {Slaid}", slaid);
                var result = await _slaService.GetSlaHistory(slaid);
                return result.Success ? Ok(result) : NotFound(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetSlaHistory");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Update an existing SLA
        /// </summary>
        [HttpPut("{slaid}")]
        public async Task<IActionResult> UpdateSla(int slaid, [FromBody] UpdateSlaRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                _logger.LogInformation("Updating SLA {Slaid}", slaid);
                var result = await _slaService.UpdateSla(slaid, request);
                return result.Success ? Ok(result) : NotFound(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in UpdateSla");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Close an SLA
        /// </summary>
        [HttpPut("close")]
        public async Task<IActionResult> CloseSla([FromBody] CloseSlaRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                _logger.LogInformation("Closing SLA {Slaid}", request.Slaid);
                var result = await _slaService.CloseSla(request);
                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in CloseSla");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Reopen a closed SLA
        /// </summary>
        [HttpPut("reopen")]
        public async Task<IActionResult> ReopenSla([FromBody] ReopenSlaRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                _logger.LogInformation("Reopening SLA {Slaid}", request.Slaid);
                var result = await _slaService.ReopenSla(request);
                return result.Success ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in ReopenSla");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
