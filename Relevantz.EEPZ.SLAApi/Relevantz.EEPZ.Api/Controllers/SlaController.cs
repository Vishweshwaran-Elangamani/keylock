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

        [HttpGet("all")]
        public async Task<IActionResult> GetAllSlas()
        {
            _logger.LogInformation("Getting all SLAs");
            var result = await _slaService.GetAllSlas();
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("create")]
        public IActionResult CreateSla([FromBody] CreateSlaRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _logger.LogInformation("Queueing SLA creation process");

            _ = Task.Run(async () =>
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
            });

            return Accepted(new { success = true, message = "SLA creation started in background" });
        }

        [HttpPost("bulk-create")]
        public async Task<IActionResult> BulkCreateSla([FromBody] List<CreateSlaRequest> requests)
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

        [HttpGet("{slaid}")]
        public async Task<IActionResult> GetSlaById(int slaid)
        {
            _logger.LogInformation("Getting SLA {Slaid}", slaid);
            var result = await _slaService.GetSlaById(slaid);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpGet("employee/{employeeId}")]
        public async Task<IActionResult> GetEmployeeSlas(int employeeId)
        {
            _logger.LogInformation("Getting SLAs for employee {EmployeeId}", employeeId);
            var result = await _slaService.GetEmployeeSlas(employeeId);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpGet("manager/{managerId}/team-reviews")]
        public async Task<IActionResult> GetTeamReviewTracking(int managerId)
        {
            _logger.LogInformation("Getting team review tracking for manager {ManagerId}", managerId);
            var result = await _slaService.GetTeamReviewTracking(managerId);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpGet("{slaid}/history")]
        public async Task<IActionResult> GetSlaHistory(int slaid)
        {
            _logger.LogInformation("Getting SLA history for {Slaid}", slaid);
            var result = await _slaService.GetSlaHistory(slaid);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpPut("{slaid}")]
        public async Task<IActionResult> UpdateSla(int slaid, [FromBody] UpdateSlaRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _logger.LogInformation("Updating SLA {Slaid}", slaid);
            var result = await _slaService.UpdateSla(slaid, request);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpPut("close")]
        public async Task<IActionResult> CloseSla([FromBody] CloseSlaRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _logger.LogInformation("Closing SLA {Slaid}", request.Slaid);
            var result = await _slaService.CloseSla(request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut("reopen")]
        public async Task<IActionResult> ReopenSla([FromBody] ReopenSlaRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _logger.LogInformation("Reopening SLA {Slaid}", request.Slaid);
            var result = await _slaService.ReopenSla(request);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
