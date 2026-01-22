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
                int emailsSent = 0, emailsFailed = 0;

                foreach (var sla in slas)
                {
                    try
                    {
                        var employeeEmail = sla.Employee?.Userauthentication?.Email;
                        var employeeName = GetEmployeeName(sla.Employee);

                        if (!string.IsNullOrEmpty(employeeEmail))
                        {
                            var result = await _emailService.SendSlaReminderEmailAsync(employeeEmail, employeeName, sla.Slatype, sla.Deadline, dayOffset);

                            if (result)
                            {
                                emailsSent++;
                                _logger.LogInformation("Reminder sent to {Email} for SLA {SlaId}", employeeEmail, sla.Slaid);
                            }
                            else
                            {
                                emailsFailed++;
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        emailsFailed++;
                        _logger.LogError(ex, "Failed to send reminder for SLA {SlaId}", sla.Slaid);
                    }
                }

                return new ApiResponse<List<SlaResponse>> { Success = true, Message = $"{emailsSent} reminders sent, {emailsFailed} failed", Data = slas.Select(s => new SlaResponse { Slaid = s.Slaid }).ToList() };
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
                            if (!string.IsNullOrEmpty(employeeEmail))
                            {
                                await _emailService.SendSlaCompletionEmailAsync(employeeEmail, GetEmployeeName(sla.Employee), sla.Slatype, DateTime.Now);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error in AutoClosing SLA {SlaId}");
                    }
                }

                return new ApiResponse<int> { Success = true, Data = closedCount, Message = $"{closedCount} SLAs closed successfully." };
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
                var reminderResult = await SendReminders(2); // Example: Reminders for day -2
                var closeResult = await AutoCloseSlas();

                return new ApiResponse<int>
                {
                    Success = true,
                    Data = reminderResult.Data.Count + closeResult.Data,
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
            return "Unknown Employee";
        }
    }
}
