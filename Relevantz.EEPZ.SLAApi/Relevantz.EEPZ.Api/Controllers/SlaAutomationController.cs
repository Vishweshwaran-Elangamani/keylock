using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SlaAutomationController : ControllerBase
    {
        private readonly ISlaAutomationService _slaAutomationService;
        private readonly ILogger<SlaAutomationController> _logger;

        public SlaAutomationController(ISlaAutomationService slaAutomationService, ILogger<SlaAutomationController> logger)
        {
            _slaAutomationService = slaAutomationService;
            _logger = logger;
        }

        [HttpPost("send-reminders/day-minus-2")]
        public async Task<ApiResponse<List<SlaResponse>>> SendRemindersDayMinus2()
        {
            return await _slaAutomationService.SendReminders(2);
        }

        [HttpPost("send-reminders/day-minus-1")]
        public async Task<ApiResponse<List<SlaResponse>>> SendRemindersDayMinus1()
        {
            return await _slaAutomationService.SendReminders(1);
        }

        [HttpPost("send-reminders/day-zero")]
        public async Task<ApiResponse<List<SlaResponse>>> SendRemindersDayZero()
        {
            return await _slaAutomationService.SendReminders(0);
        }

        [HttpPost("send-reminders/all")]
        public async Task<ApiResponse<object>> SendAllReminders()
        {
            var result2Days = await _slaAutomationService.SendReminders(2);
            var result1Day = await _slaAutomationService.SendReminders(1);
            var result0Days = await _slaAutomationService.SendReminders(0);

            return new ApiResponse<object>
            {
                Success = true,
                Message = "All reminders processing completed",
                Data = new
                {
                    DayMinus2 = result2Days,
                    DayMinus1 = result1Day,
                    DayZero = result0Days
                }
            };
        }

        [HttpPost("auto-close")]
        public async Task<ApiResponse<int>> AutoCloseSlas()
        {
            return await _slaAutomationService.AutoCloseSlas();
        }

        [HttpPost("run-full-cycle")]
        public async Task<ApiResponse<int>> RunFullAutomationCycle()
        {
            return await _slaAutomationService.RunFullAutomationCycle();
        }
    }
}
