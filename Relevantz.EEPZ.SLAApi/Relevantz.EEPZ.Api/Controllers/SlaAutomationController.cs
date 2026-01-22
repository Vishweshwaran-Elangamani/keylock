using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Core.Services;

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
        public async Task<IActionResult> SendRemindersDayMinus2()
        {
            var result = await _slaAutomationService.SendReminders(2);
            return Ok(result);
        }

        [HttpPost("send-reminders/day-minus-1")]
        public async Task<IActionResult> SendRemindersDayMinus1()
        {
            var result = await _slaAutomationService.SendReminders(1);
            return Ok(result);
        }

        [HttpPost("send-reminders/day-zero")]
        public async Task<IActionResult> SendRemindersDayZero()
        {
            var result = await _slaAutomationService.SendReminders(0);
            return Ok(result);
        }

        [HttpPost("send-reminders/all")]
        public async Task<IActionResult> SendAllReminders()
        {
            var result2Days = await SendRemindersDayMinus2();
            var result1Day = await SendRemindersDayMinus1();
            var result0Days = await SendRemindersDayZero();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "All reminders processing completed",
                Data = new
                {
                    DayMinus2 = result2Days,
                    DayMinus1 = result1Day,
                    DayZero = result0Days
                }
            });
        }

        [HttpPost("auto-close")]
        public async Task<IActionResult> AutoCloseSlas()
        {
            var result = await _slaAutomationService.AutoCloseSlas();
            return Ok(result);
        }

        [HttpPost("run-full-cycle")]
        public async Task<IActionResult> RunFullAutomationCycle()
        {
            var result = await _slaAutomationService.RunFullAutomationCycle();
            return Ok(result);
        }

        private string GetEmployeeName(Employee emp)
        {
            if (emp?.Userprofile == null)
                return "Unknown";
            return $"{emp.Userprofile.FirstName} {emp.Userprofile.LastName}";
        }
    }
}
