using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/slaautomation")]
    [Produces("application/json")]
    public class SlaAutomationController : ControllerBase
    {
        private readonly ISlaAutomationService _slaAutomationService;
        private readonly ILogger<SlaAutomationController> _logger;

        public SlaAutomationController(
            ISlaAutomationService slaAutomationService,
            ILogger<SlaAutomationController> logger)
        {
            _slaAutomationService = slaAutomationService;
            _logger = logger;
        }

        #region Reminder Endpoints

        /// <summary>
        /// Send SLA reminders for a specific day offset.
        /// Example: api/slaautomation/reminders?dayOffset=2
        /// </summary>
        [HttpPost("reminders")]
        public async Task<ApiResponse<SlaReminderSummaryResponse>> SendReminders([FromQuery] int dayOffset)
        {
            _logger.LogInformation("SendReminders endpoint triggered. DayOffset: {DayOffset}", dayOffset);

            var result = await _slaAutomationService.SendReminders(dayOffset);

            _logger.LogInformation("SendReminders completed. EmailsSent: {Sent}, EmailsFailed: {Failed}",
                result.Data?.EmailsSent, result.Data?.EmailsFailed);

            return result;
        }

        /// <summary>
        /// Runs reminders for Day-2, Day-1, Day-0.
        /// </summary>
        [HttpPost("reminders/run")]
        public async Task<ApiResponse<SlaReminderSummaryResponse>> SendAllReminders()
        {
            _logger.LogInformation("RunReminderCycle endpoint triggered");

            var result = await _slaAutomationService.RunReminderCycle();

            _logger.LogInformation("RunReminderCycle completed. TotalSlas: {Total}",
                result.Data?.TotalSlas);

            return result;
        }

        #endregion

        #region Auto Close Endpoint

        /// <summary>
        /// Automatically closes completed SLAs.
        /// </summary>
        [HttpPost("closures/auto")]
        public async Task<ApiResponse<SlaClosureSummaryResponse>> AutoCloseSlas()
        {
            _logger.LogInformation("AutoCloseSlas endpoint triggered");

            var result = await _slaAutomationService.AutoCloseSlas();

            _logger.LogInformation("AutoCloseSlas completed. SlasClosed: {Closed}",
                result.Data?.SlasClosed);

            return result;
        }

        #endregion

        #region Full Automation Cycle

        /// <summary>
        /// Runs full SLA automation workflow.
        /// </summary>
        [HttpPost("run")]
        public async Task<ApiResponse<int>> RunFullAutomationCycle()
        {
            _logger.LogInformation("RunFullAutomationCycle endpoint triggered");

            var result = await _slaAutomationService.RunFullAutomationCycle();

            _logger.LogInformation("RunFullAutomationCycle completed. TotalActions: {Count}",
                result.Data);

            return result;
        }

        [HttpGet("status")]
public async Task<ApiResponse<AutomationStatusResponse>> GetAutomationStatus()
{
    _logger.LogInformation("GetAutomationStatus endpoint triggered");
    return await _slaAutomationService.GetAutomationStatus();
}

[HttpGet("logs")]
public async Task<ApiResponse<AutomationLogResponse>> GetAutomationLogs([FromQuery] int days = 7)
{
    _logger.LogInformation("GetAutomationLogs endpoint triggered. Days: {Days}", days);
    return await _slaAutomationService.GetAutomationLogs(days);
}


        #endregion

        
    }
}
