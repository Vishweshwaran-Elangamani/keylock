using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Relevantz.EEPZ.Common;
using Microsoft.Extensions.Logging;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class SlaAutomationService : ISlaAutomationService
    {
        private readonly ISlaRepository _slaRepository;
        private readonly IEmailService _emailService;

        private readonly ILogger<SlaAutomationService> _logger;

        public SlaAutomationService(
    ISlaRepository slaRepository,
    IEmailService emailService,
    ILogger<SlaAutomationService> logger)

        {
            _slaRepository = slaRepository;
            _emailService = emailService;
            _logger = logger;
        }

        #region Send Reminders

        public async Task<ApiResponse<SlaReminderSummaryResponse>> SendReminders(int dayOffset)
        {
            _logger.LogInformation("Reminder process started for DayOffset {DayOffset}", dayOffset);

            var slas = await _slaRepository.GetSlasDueInDaysAsync(dayOffset);

            int emailsSent = 0, emailsFailed = 0;

            foreach (var sla in slas)
            {
                var email = sla.Employee?.Userauthentication?.Email;
                if (string.IsNullOrWhiteSpace(email))
                {
                    emailsFailed++;
                    continue;
                }

                await _emailService.SendSlaReminderEmailAsync(
                    email,
                    GetEmployeeName(sla.Employee),
                    sla.Slatype,
                    sla.Deadline,
                    dayOffset);

                emailsSent++;
            }

            return ApiResponse<SlaReminderSummaryResponse>.SuccessResponse(
                new SlaReminderSummaryResponse
                {
                    EmailsSent = emailsSent,
                    EmailsFailed = emailsFailed,
                    TotalSlas = slas.Count
                },
                ApiMessages.Success);
        }

        #endregion

        #region Run Reminder Cycle

        public async Task<ApiResponse<SlaReminderSummaryResponse>> RunReminderCycle()
        {
            var d2 = await SendReminders(2);
            var d1 = await SendReminders(1);
            var d0 = await SendReminders(0);

            return ApiResponse<SlaReminderSummaryResponse>.SuccessResponse(
                new SlaReminderSummaryResponse
                {
                    EmailsSent = d2.Data!.EmailsSent + d1.Data!.EmailsSent + d0.Data!.EmailsSent,
                    EmailsFailed = d2.Data!.EmailsFailed + d1.Data!.EmailsFailed + d0.Data!.EmailsFailed,
                    TotalSlas = d2.Data!.TotalSlas + d1.Data!.TotalSlas + d0.Data!.TotalSlas
                },
                ApiMessages.Success);
        }

        #endregion

        #region Auto Close SLAs

        public async Task<ApiResponse<SlaClosureSummaryResponse>> AutoCloseSlas()
        {
            var completedSlas = await _slaRepository.GetCompletedSlasAsync();

            int closedCount = 0, emailsSent = 0;

            foreach (var sla in completedSlas)
            {
                var closed = await _slaRepository.CloseSlaAsync(sla.Slaid, null);
                if (!closed) continue;

                closedCount++;

                var email = sla.Employee?.Userauthentication?.Email;
                if (!string.IsNullOrWhiteSpace(email))
                {
                    await _emailService.SendSlaCompletionEmailAsync(
                        email,
                        GetEmployeeName(sla.Employee),
                        sla.Slatype,
                        DateTime.Now);

                    emailsSent++;
                }
            }

            return ApiResponse<SlaClosureSummaryResponse>.SuccessResponse(
                new SlaClosureSummaryResponse
                {
                    SlasClosed = closedCount,
                    ConfirmationEmailsSent = emailsSent,
                    Failures = completedSlas.Count - closedCount
                },
                ApiMessages.Success);
        }

        #endregion

        #region Full Automation Cycle

        public async Task<ApiResponse<int>> RunFullAutomationCycle()
        {
            _logger.LogInformation("Full SLA automation cycle started");

            var reminders = await RunReminderCycle();
            var closures = await AutoCloseSlas();

            int totalActions =
                reminders.Data!.EmailsSent +
                reminders.Data!.EmailsFailed +
                closures.Data!.SlasClosed;

            return ApiResponse<int>.SuccessResponse(totalActions, ApiMessages.Success);
        }

        #endregion

        #region Automation Status
        public async Task<ApiResponse<AutomationStatusResponse>> GetAutomationStatus()
        {
            var allSlas = await _slaRepository.GetAllSlasAsync();
            var overdue = await _slaRepository.GetOverdueSlas();
            var completed = await _slaRepository.GetCompletedSlasAsync();

            int open = allSlas.Count(s => s.Status == "Open" || s.Status == "InProgress");
            int closed = allSlas.Count(s => s.Status == "Closed");

            double compliance = allSlas.Count == 0
                ? 0
                : (double)closed / allSlas.Count * 100;

            return ApiResponse<AutomationStatusResponse>.SuccessResponse(
                new AutomationStatusResponse
                {
                    TotalSlas = allSlas.Count,
                    OpenSlas = open,
                    OverdueSlas = overdue.Count(),
                    CompletedSlas = completed.Count(),
                    ClosedSlas = closed,
                    CompliancePercentage = compliance,
                    LastChecked = DateTime.Now
                },
                ApiMessages.Success);
        }


        #endregion

        #region Automation Logs

        public async Task<ApiResponse<AutomationLogResponse>> GetAutomationLogs(int days)
        {
            var history = await _slaRepository.GetAllSlaHistoryAsync();
            var cutoff = DateTime.Now.AddDays(-days);

            var recent = history.Where(h => h.CreatedAt >= cutoff).ToList();

            var logs = recent.Select(h => new SlaHistoryLogDto
            {
                SlahistoryId = h.SlahistoryId,
                Slaid = h.Slaid,
                ChangeType = h.ChangeType,
                ChangedFrom = h.ChangedFrom,
                ChangedTo = h.ChangedTo,
                ChangedByEmployeeId = h.ChangedByEmployeeId,
                Reason = h.Reason,
                CreatedAt = h.CreatedAt
            }).ToList();

            return ApiResponse<AutomationLogResponse>.SuccessResponse(
                new AutomationLogResponse
                {
                    LogCount = logs.Count,
                    Period = $"Last {days} days",
                    Logs = logs
                },
                ApiMessages.Success);
        }


        #endregion


        private string GetEmployeeName(Employee employee)
        {
            return employee?.Userprofile != null
                ? $"{employee.Userprofile.FirstName} {employee.Userprofile.LastName}"
                : "Employee";
        }
    }
}
