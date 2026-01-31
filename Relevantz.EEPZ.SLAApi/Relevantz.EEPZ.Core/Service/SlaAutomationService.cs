using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Microsoft.Extensions.Logging;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class SlaAutomationService : ISlaAutomationService
    {
        private readonly ISlaRepository _slaRepository;
        private readonly EmailService _emailService;
        private readonly ILogger<SlaAutomationService> _logger;

        public SlaAutomationService(
            ISlaRepository slaRepository,
            EmailService emailService,
            ILogger<SlaAutomationService> logger)
        {
            _slaRepository = slaRepository;
            _emailService = emailService;
            _logger = logger;
        }

        #region Send Reminders
        public async Task<ApiResponse<List<SlaResponse>>> SendReminders(int dayOffset)
        {
            var slas = await _slaRepository.GetSlasDueInDaysAsync(dayOffset);
            _logger.LogInformation("Found {Count} SLAs due in {DayOffset} days", slas.Count, dayOffset);

            int emailsSent = 0, emailsFailed = 0;

            foreach (var sla in slas)
            {
                try
                {
                    var employeeEmail = sla.Employee?.Userauthentication?.Email;
                    var employeeName = GetEmployeeName(sla.Employee);

                    if (string.IsNullOrEmpty(employeeEmail))
                    {
                        emailsFailed++;
                        _logger.LogWarning("No email found for SLA {SlaId}", sla.Slaid);
                        continue;
                    }

                    await _emailService.SendSlaReminderEmailAsync(
                        employeeEmail,
                        employeeName,
                        sla.Slatype,
                        sla.Deadline,
                        dayOffset);

                    emailsSent++;
                    _logger.LogInformation("Reminder sent to {Email} for SLA {SlaId}", employeeEmail, sla.Slaid);
                }
                catch (Exception ex)
                {
                    emailsFailed++;
                    _logger.LogError(ex, "Failed sending reminder for SLA {SlaId}", sla.Slaid);
                }
            }

            return new ApiResponse<List<SlaResponse>>
            {
                Success = true,
                Message = $"{emailsSent} reminders sent, {emailsFailed} failed",
                Data = slas.Select(s => new SlaResponse { Slaid = s.Slaid }).ToList()
            };
        }
        #endregion

        #region Auto Close
        public async Task<ApiResponse<int>> AutoCloseSlas()
        {
            var completedSlas = await _slaRepository.GetCompletedSlasAsync();
            int closedCount = 0;

            foreach (var sla in completedSlas)
            {
                try
                {
                    var closed = await _slaRepository.CloseSlaAsync(sla.Slaid, null);
                    if (!closed) continue;

                    closedCount++;

                    var employeeEmail = sla.Employee?.Userauthentication?.Email;
                    var employeeName = GetEmployeeName(sla.Employee);

                    if (!string.IsNullOrEmpty(employeeEmail))
                    {
                        await _emailService.SendSlaCompletionEmailAsync(
                            employeeEmail,
                            employeeName,
                            sla.Slatype,
                            DateTime.Now);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error auto-closing SLA {SlaId}", sla.Slaid);
                }
            }

            return new ApiResponse<int>
            {
                Success = true,
                Data = closedCount,
                Message = $"{closedCount} SLAs closed"
            };
        }
        #endregion

        #region Automation Cycle
        public async Task<ApiResponse<int>> RunFullAutomationCycle()
        {
            var d2 = await SendReminders(2);
            var d1 = await SendReminders(1);
            var d0 = await SendReminders(0);
            var close = await AutoCloseSlas();

            return new ApiResponse<int>
            {
                Success = true,
                Data = d2.Data.Count + d1.Data.Count + d0.Data.Count + close.Data,
                Message = "Automation cycle completed"
            };
        }
        #endregion

        private string GetEmployeeName(Employee employee)
        {
            if (employee?.Userprofile != null)
                return $"{employee.Userprofile.FirstName} {employee.Userprofile.LastName}";

            return "Unknown Employee";
        }
    }
}
