using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Core.Services.Interfaces;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Core.Services.Implementations
{
    public class SlaAutomationService : ISlaAutomationService
    {
        private readonly ISlaRepository _slaRepository;
        private readonly EmailService _emailService;
        private readonly ILogger<SlaAutomationService> _logger;

        public SlaAutomationService(ISlaRepository slaRepository, EmailService emailService, ILogger<SlaAutomationService> logger)
        {
            _slaRepository = slaRepository;
            _emailService = emailService;
            _logger = logger;
        }

        #region Send Reminders
        public async Task<ApiResponse<List<SlaResponse>>> SendReminders(int dayOffset)
        {
            try
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

                        _logger.LogInformation("Preparing reminder for SLA {SlaId}: Name={Name}, Email={Email}, Deadline={Deadline}, Offset={Offset}",
                            sla.Slaid, employeeName, employeeEmail, sla.Deadline, dayOffset);

                        if (!string.IsNullOrEmpty(employeeEmail))
                        {
                            var result = await _emailService.SendSlaReminderEmailAsync(
                                employeeEmail,
                                employeeName,
                                sla.Slatype,
                                sla.Deadline,
                                dayOffset
                            );

                            if (result)
                            {
                                emailsSent++;
                                _logger.LogInformation("Reminder successfully sent to {Email} for SLA {SlaId}", employeeEmail, sla.Slaid);
                            }
                            else
                            {
                                emailsFailed++;
                                _logger.LogWarning("Reminder send failed for SLA {SlaId} to {Email}", sla.Slaid, employeeEmail);
                            }
                        }
                        else
                        {
                            emailsFailed++;
                            _logger.LogWarning("No email found for SLA {SlaId} (Employee={Name})", sla.Slaid, employeeName);
                        }
                    }
                    catch (Exception ex)
                    {
                        emailsFailed++;
                        _logger.LogError(ex, "Exception while sending reminder for SLA {SlaId}", sla.Slaid);
                    }
                }

                return new ApiResponse<List<SlaResponse>>
                {
                    Success = true,
                    Message = $"{emailsSent} reminders sent, {emailsFailed} failed",
                    Data = slas.Select(s => new SlaResponse { Slaid = s.Slaid }).ToList()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SendReminders");
                return new ApiResponse<List<SlaResponse>> { Success = false, Message = ex.Message };
            }
        }
        #endregion

        #region Auto-close SLAs
        public async Task<ApiResponse<int>> AutoCloseSlas()
        {
            try
            {
                var completedSlas = await _slaRepository.GetCompletedSlasAsync();
                _logger.LogInformation("Found {Count} completed SLAs", completedSlas.Count);

                int closedCount = 0;

                foreach (var sla in completedSlas)
                {
                    try
                    {
                        var result = await _slaRepository.CloseSlaAsync(sla.Slaid, null);
                        if (result)
                        {
                            closedCount++;
                            var employeeEmail = sla.Employee?.Userauthentication?.Email;
                            var employeeName = GetEmployeeName(sla.Employee);

                            _logger.LogInformation("Closing SLA {SlaId}: Name={Name}, Email={Email}", sla.Slaid, employeeName, employeeEmail);

                            if (!string.IsNullOrEmpty(employeeEmail))
                            {
                                await _emailService.SendSlaCompletionEmailAsync(
                                    employeeEmail,
                                    employeeName,
                                    sla.Slatype,
                                    DateTime.Now
                                );
                                _logger.LogInformation("Completion email sent to {Email} for SLA {SlaId}", employeeEmail, sla.Slaid);
                            }
                            else
                            {
                                _logger.LogWarning("No email found for SLA {SlaId} (Employee={Name})", sla.Slaid, employeeName);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Exception while auto-closing SLA {SlaId}", sla.Slaid);
                    }
                }

                return new ApiResponse<int>
                {
                    Success = true,
                    Data = closedCount,
                    Message = $"{closedCount} SLAs closed successfully."
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in AutoCloseSlas");
                return new ApiResponse<int> { Success = false, Message = ex.Message };
            }
        }
        #endregion

        #region Run Full Automation Cycle
        public async Task<ApiResponse<int>> RunFullAutomationCycle()
        {
            try
            {
                var reminderResultDay2 = await SendReminders(2);
                var reminderResultDay1 = await SendReminders(1);
                var reminderResultDay0 = await SendReminders(0);
                var closeResult = await AutoCloseSlas();

                _logger.LogInformation("Automation cycle summary: Day2={Day2}, Day1={Day1}, Day0={Day0}, Closed={ClosedCount}",
                    reminderResultDay2.Data.Count, reminderResultDay1.Data.Count, reminderResultDay0.Data.Count, closeResult.Data);

                return new ApiResponse<int>
                {
                    Success = true,
                    Data = reminderResultDay2.Data.Count + reminderResultDay1.Data.Count + reminderResultDay0.Data.Count + closeResult.Data,
                    Message = "Full automation cycle completed successfully."
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in RunFullAutomationCycle");
                return new ApiResponse<int> { Success = false, Message = ex.Message };
            }
        }
        #endregion

        private string GetEmployeeName(Employee employee)
        {
            if (employee?.Userprofile != null)
            {
                return $"{employee.Userprofile.FirstName} {employee.Userprofile.LastName}";
            }
            _logger.LogWarning("Employee {EmployeeId} has no Userprofile loaded", employee?.EmployeeId);
            return "Unknown Employee";
        }

    }
}
