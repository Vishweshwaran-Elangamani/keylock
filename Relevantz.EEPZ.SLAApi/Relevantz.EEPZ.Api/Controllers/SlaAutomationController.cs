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
        private readonly ISlaRepository _slaRepository;
        private readonly ISlaService _slaService;
        private readonly EmailService _emailService;
        private readonly ILogger<SlaAutomationController> _logger;

        public SlaAutomationController(
            ISlaRepository slaRepository,
            ISlaService slaService,
            EmailService emailService,
            ILogger<SlaAutomationController> logger)
        {
            _slaRepository = slaRepository;
            _slaService = slaService;
            _emailService = emailService;
            _logger = logger;
        }
        /// <summary>
        /// Send SLA reminders for Day -2 (2 days before deadline)
        /// </summary>
       
      /// <summary>
/// Send SLA reminders for Day -2 (2 days before deadline)
/// </summary>
[HttpPost("send-reminders/day-minus-2")]
public async Task<IActionResult> SendRemindersDayMinus2()
{
    try
    {
        _logger.LogInformation("🔔 Starting Day -2 SLA reminders...");

        var slas = await _slaRepository.GetSlasDueInDaysAsync(2);
        int emailsSent = 0;
        int emailsFailed = 0;

        foreach (var sla in slas)
        {
            try
            {
                var employeeEmail = sla.Employee?.Userprofile?.PersonalEmail;
                var employeeName = GetEmployeeName(sla.Employee);

                if (!string.IsNullOrEmpty(employeeEmail))
                {
                    var result = await _emailService.SendSlaReminderEmailAsync(
                        employeeEmail,
                        employeeName,
                        sla.Slatype,
                        sla.Deadline,
                        2  
                    );

                    if (result)
                    {
                        emailsSent++;
                        _logger.LogInformation("Day -2 reminder sent to {Email} for SLA {SlaId}", 
                            employeeEmail, sla.Slaid);
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
                _logger.LogError(ex, " Failed to send Day -2 reminder for SLA {SlaId}", sla.Slaid);
            }
        }
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = $"Day -2 reminders sent: {emailsSent} successful, {emailsFailed} failed",
            Data = new 
            { 
                EmailsSent = emailsSent, 
                EmailsFailed = emailsFailed, 
                TotalSlas = slas.Count 
            }
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error in SendRemindersDayMinus2");
        return BadRequest(new ApiResponse<object> 
        { 
            Success = false, 
            Message = ex.Message 
        });
    }
}


        /// <summary>
        /// Send SLA reminders for Day -1 (1 day before deadline)
        /// </summary>
        [HttpPost("send-reminders/day-minus-1")]
        public async Task<IActionResult> SendRemindersDayMinus1()
        {
            try
            {
                _logger.LogInformation("🔔 Starting Day -1 SLA reminders...");

                var slas = await _slaRepository.GetSlasDueInDaysAsync(1);
                int emailsSent = 0;
                int emailsFailed = 0;

                foreach (var sla in slas)
                {
                    try
                    {
                        var employeeEmail = sla.Employee?.Userprofile?.PersonalEmail;
                        var employeeName = GetEmployeeName(sla.Employee);

                        if (!string.IsNullOrEmpty(employeeEmail))
                        {
                            var result = await _emailService.SendSlaReminderEmailAsync(
                                employeeEmail,
                                employeeName,
                                sla.Slatype,
                                sla.Deadline,
                                1  
                            );

                            if (result)
                            {
                                emailsSent++;
                                _logger.LogInformation("Day -1 reminder sent to {Email} for SLA {SlaId}",
                                    employeeEmail, sla.Slaid);
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
                        _logger.LogError(ex, "❌ Failed to send Day -1 reminder for SLA {SlaId}", sla.Slaid);
                    }
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = $"Day -1 reminders sent: {emailsSent} successful, {emailsFailed} failed",
                    Data = new { EmailsSent = emailsSent, EmailsFailed = emailsFailed, TotalSlas = slas.Count }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SendRemindersDayMinus1");
                return BadRequest(new ApiResponse<object> 
                { 
                    Success = false, 
                    Message = ex.Message 
                });
            }
        }

        /// <summary>
        /// Send SLA reminders for Day 0 (deadline is today)
        /// </summary>
        [HttpPost("send-reminders/day-zero")]
        public async Task<IActionResult> SendRemindersDayZero()
        {
            try
            {
                _logger.LogInformation("🔔 Starting Day 0 SLA reminders...");

                var slas = await _slaRepository.GetSlasDueInDaysAsync(0);
                int emailsSent = 0;
                int emailsFailed = 0;

                foreach (var sla in slas)
                {
                    try
                    {
                        var employeeEmail = sla.Employee?.Userprofile?.PersonalEmail;
                        var employeeName = GetEmployeeName(sla.Employee);

                        if (!string.IsNullOrEmpty(employeeEmail))
                        {
                            var result = await _emailService.SendSlaReminderEmailAsync(
                                employeeEmail,
                                employeeName,
                                sla.Slatype,
                                sla.Deadline,
                                0 
                            );

                            if (result)
                            {
                                emailsSent++;
                                _logger.LogInformation(" Day 0 reminder sent to {Email} for SLA {SlaId}",
                                    employeeEmail, sla.Slaid);
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
                        _logger.LogError(ex, "❌ Failed to send Day 0 reminder for SLA {SlaId}", sla.Slaid);
                    }
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = $"Day 0 reminders sent: {emailsSent} successful, {emailsFailed} failed",
                    Data = new { EmailsSent = emailsSent, EmailsFailed = emailsFailed, TotalSlas = slas.Count }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SendRemindersDayZero");
                return BadRequest(new ApiResponse<object> 
                { 
                    Success = false, 
                    Message = ex.Message 
                });
            }
        }

        /// <summary>
        /// Send all reminders (Day -2, -1, and 0) in one call
        /// </summary>
        [HttpPost("send-reminders/all")]
        public async Task<IActionResult> SendAllReminders()
        {
            try
            {
                _logger.LogInformation("🔔 Starting all SLA reminders...");

                var result2Days = await SendRemindersDayMinus2();
                var result1Day = await SendRemindersDayMinus1();
                var result0Days = await SendRemindersDayZero();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "All reminders processing completed",
                    Data = new { 
                        DayMinus2 = result2Days, 
                        DayMinus1 = result1Day, 
                        DayZero = result0Days 
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SendAllReminders");
                return BadRequest(new ApiResponse<object> 
                { 
                    Success = false, 
                    Message = ex.Message 
                });
            }
        }

        /// <summary>
        /// Send overdue notifications and escalate to Manager (Level 1)
        /// </summary>
        [HttpPost("escalate/manager")]
        public async Task<IActionResult> EscalateToManager()
        {
            try
            {
                _logger.LogInformation("⚡ Starting Manager-level escalations...");

                var overdueSlas = await _slaRepository.GetOverdueSlasByDaysAsync(1);
                int escalationsCreated = 0;
                int emailsSent = 0;
                int failures = 0;

                foreach (var sla in overdueSlas)
                {
                    try
                    {
                        var employeeEmail = sla.Employee?.Userprofile?.PersonalEmail;
                        var employeeName = GetEmployeeName(sla.Employee);

                        if (!string.IsNullOrEmpty(employeeEmail))
                        {
                            int daysOverdue = (int)(DateTime.Now - sla.Deadline).TotalDays;
                            var result = await _emailService.SendSlaOverdueEmailAsync(
                                employeeEmail,
                                employeeName,
                                sla.Slatype,
                                sla.Deadline,
                                daysOverdue
                            );

                            if (result)
                            {
                                emailsSent++;
                            }
                        }

                        var manager = sla.AssignedToEmployee;
                        var managerEmail = manager?.Userprofile?.PersonalEmail;

                        if (!string.IsNullOrEmpty(managerEmail))
                        {
                            int daysOverdue = (int)(DateTime.Now - sla.Deadline).TotalDays;
                            var result = await _emailService.SendManagerEscalationEmailAsync(
                                managerEmail,
                                GetEmployeeName(manager),
                                employeeName,
                                sla.Slatype,
                                sla.Deadline,
                                daysOverdue
                            );

                            if (result)
                            {
                                escalationsCreated++;
                                sla.Status = "Escalated - Level 1";
                                await _slaRepository.UpdateSlaAsync(sla);
                                _logger.LogInformation("✅ SLA {SlaId} escalated to manager", sla.Slaid);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        failures++;
                        _logger.LogError(ex, "❌ Failed to escalate SLA {SlaId} to manager", sla.Slaid);
                    }
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = $"Manager escalations completed: {escalationsCreated} escalated, {emailsSent} notifications sent",
                    Data = new { 
                        EscalationsCreated = escalationsCreated, 
                        NotificationsSent = emailsSent, 
                        Failures = failures,
                        TotalSlas = overdueSlas.Count 
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in EscalateToManager");
                return BadRequest(new ApiResponse<object> 
                { 
                    Success = false, 
                    Message = ex.Message 
                });
            }
        }

        /// <summary>
        /// Auto-close completed SLAs
        /// </summary>
        [HttpPost("auto-close")]
        public async Task<IActionResult> AutoCloseSlas()
        {
            try
            {
                _logger.LogInformation("🔐 Starting auto-closure of completed SLAs...");

                var completedSlas = await _slaRepository.GetCompletedSlasAsync();
                int closedCount = 0;
                int emailsSent = 0;
                int failures = 0;

                foreach (var sla in completedSlas)
                {
                    try
                    {
                        var result = await _slaRepository.CloseSlaAsync(sla.Slaid, null);

                        if (result)
                        {
                            closedCount++;

                            var employeeEmail = sla.Employee?.Userprofile?.PersonalEmail;
                            var employeeName = GetEmployeeName(sla.Employee);

                            if (!string.IsNullOrEmpty(employeeEmail))
                            {
                                var emailResult = await _emailService.SendSlaCompletionEmailAsync(
                                    employeeEmail,
                                    employeeName,
                                    sla.Slatype,
                                    DateTime.Now
                                );

                                if (emailResult)
                                {
                                    emailsSent++;
                                }
                            }

                            _logger.LogInformation("✅ SLA {SlaId} auto-closed", sla.Slaid);
                        }
                    }
                    catch (Exception ex)
                    {
                        failures++;
                        _logger.LogError(ex, "❌ Failed to auto-close SLA {SlaId}", sla.Slaid);
                    }
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = $"Auto-closure completed: {closedCount} SLAs closed",
                    Data = new { 
                        SlasClosed = closedCount, 
                        ConfirmationEmailsSent = emailsSent, 
                        Failures = failures 
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in AutoCloseSlas");
                return BadRequest(new ApiResponse<object> 
                { 
                    Success = false, 
                    Message = ex.Message 
                });
            }
        }

        /// <summary>
        /// Run complete SLA automation cycle (reminders + escalations + closures)
        /// </summary>
        [HttpPost("run-full-cycle")]
        public async Task<IActionResult> RunFullAutomationCycle()
        {
            try
            {
                _logger.LogInformation("🔄 Starting full SLA automation cycle...");

                await SendAllReminders();

                await EscalateToManager();

                await AutoCloseSlas();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Full SLA automation cycle completed successfully",
                    Data = new { 
                        Timestamp = DateTime.Now,
                        CycleStatus = "Completed"
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in RunFullAutomationCycle");
                return BadRequest(new ApiResponse<object> 
                { 
                    Success = false, 
                    Message = ex.Message 
                });
            }
        }

        /// <summary>
        /// Get automation statistics and health status
        /// </summary>
        [HttpGet("status")]
        public async Task<IActionResult> GetAutomationStatus()
        {
            try
            {
                _logger.LogInformation("📊 Fetching automation status...");

                var totalSlas = await _slaRepository.GetAllSlasAsync();
                var openSlas = totalSlas.Where(s => s.Status == "Open").ToList();
                var overdueSlas = totalSlas.Where(s => s.Deadline < DateTime.Now && s.Status != "Closed").ToList();
                var completedSlas = totalSlas.Where(s => s.Status == "Completed").ToList();
                var closedSlas = totalSlas.Where(s => s.Status == "Closed").ToList();

                var compliancePercentage = totalSlas.Count > 0
                    ? (closedSlas.Count * 100) / totalSlas.Count
                    : 0;

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Automation status retrieved",
                    Data = new
                    {
                        TotalSlas = totalSlas.Count,
                        OpenSlas = openSlas.Count,
                        OverdueSlas = overdueSlas.Count,
                        CompletedSlas = completedSlas.Count,
                        ClosedSlas = closedSlas.Count,
                        CompliancePercentage = compliancePercentage,
                        LastChecked = DateTime.Now
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetAutomationStatus");
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
        }
        /// <summary>
/// Get detailed SLA automation logs (Alternative approach)
/// </summary>
[HttpGet("logs")]
public async Task<IActionResult> GetAutomationLogs([FromQuery] int days = 7)
{
    try
    {
        _logger.LogInformation("📋 Fetching automation logs for last {Days} days", days);

        var cutoffDate = DateTime.Now.AddDays(-days);

        var allSlas = await _slaRepository.GetAllSlasAsync();
        var recentHistory = new List<Slahistory>();

        foreach (var sla in allSlas)
        {
            var history = await _slaRepository.GetSlaHistoryAsync(sla.Slaid);
            var recentForSla = history
                .Where(h => h.CreatedAt != null && h.CreatedAt > cutoffDate)
                .ToList();
            
            recentHistory.AddRange(recentForSla);
        }

        recentHistory = recentHistory
            .OrderByDescending(h => h.CreatedAt)
            .Take(100)
            .ToList();

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = $"Retrieved {recentHistory.Count} logs",
            Data = new
            {
                LogCount = recentHistory.Count,
                Period = $"Last {days} days",
                Logs = recentHistory.Select(h => new
                {
                    h.SlahistoryId,
                    h.Slaid,
                    h.ChangeType,
                    h.ChangedFrom,
                    h.ChangedTo,
                    h.ChangedByEmployeeId,
                    h.Reason,
                    h.CreatedAt
                })
            }
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error in GetAutomationLogs");
        return BadRequest(new ApiResponse<object> 
        { 
            Success = false, 
            Message = ex.Message 
        });
    }
}

       [HttpPost("performance-form/create")]
public async Task<IActionResult> CreatePerformanceFormSlas()
{
    try
    {
        _logger.LogInformation("📋 Creating Performance Form SLAs...");

        var startTime = DateTime.Now;
        var allSlas = await _slaRepository.GetAllSlasAsync();
        
        var existingPerformanceSlas = allSlas
            .Where(s => s.Slatype == "Performance Form")
            .ToList();

        int slasCreated = 0;
        int slasSkipped = 0;
        var createdSlasList = new List<object>();
        var skippedList = new List<object>();

        var employeeIds = allSlas
            .Where(s => s.EmployeeId > 0) 
            .Select(s => s.EmployeeId)
            .Distinct()
            .ToList();

        _logger.LogInformation("Processing {Count} employees from SLAs", employeeIds.Count);

        var allEmployees = allSlas
            .Where(s => s.Employee != null && employeeIds.Contains(s.Employee.EmployeeId))
            .Select(s => s.Employee)
            .DistinctBy(e => e.EmployeeId)
            .ToList();

        _logger.LogInformation("Loaded {Count} employees with data", allEmployees.Count);

        foreach (var employee in allEmployees)
        {
            try
            {
                var employeeId = employee.EmployeeId;
                var joiningDate = employee.JoiningDate;

                _logger.LogInformation("Processing Employee {EmployeeId}", employeeId);

                if (joiningDate == null)
                {
                    skippedList.Add(new
                    {
                        employeeId = employeeId,
                        employeeName = GetEmployeeName(employee),
                        reason = "No JoiningDate"
                    });
                    slasSkipped++;
                    continue;
                }

                DateTime joiningDateTime = joiningDate.ToDateTime(TimeOnly.MinValue);
                DateTime appraisalCompletionDate = joiningDateTime.AddYears(1);
                DateTime performanceFormDeadline = appraisalCompletionDate.AddDays(-45);

                double daysUntilDeadline = (performanceFormDeadline - DateTime.Now).TotalDays;
                double daysUntilAppraisal = (appraisalCompletionDate - DateTime.Now).TotalDays;

                _logger.LogInformation("Employee {EmployeeId}: Days until appraisal = {Days}", 
                    employeeId, daysUntilAppraisal);

                if (daysUntilAppraisal >= -30 && daysUntilAppraisal <= 730)
                {
                    var existingSlaForEmployee = existingPerformanceSlas
                        .FirstOrDefault(s => s.EmployeeId == employeeId &&
                                            s.Deadline.Year == appraisalCompletionDate.Year);

                    if (existingSlaForEmployee == null)
                    {
                        var newSla = new Sla
                        {
                            Slatype = "Performance Form",
                            Status = "Open",
                            EmployeeId = employeeId,
                            DepartmentId = 1,
                            Deadline = performanceFormDeadline,
                            ComplianceStatus = "OnTime",
                            CreatedByEmployeeId = 1,
                            CreatedAt = DateTime.Now,
                            UpdatedAt = DateTime.Now,
                            AssignedToEmployeeId = employee.ReportingManagerEmployeeId,
                            ReopenCount = 0,
                            IsAutoClosed = false

                        };

                        await _slaRepository.CreateSlaAsync(newSla);
                        slasCreated++;

                        _logger.LogInformation("Created SLA for {EmployeeId}", employeeId);

                        createdSlasList.Add(new
                        {
                            employeeId = employeeId,
                            employeeName = GetEmployeeName(employee),
                            performanceFormDeadline = performanceFormDeadline.ToShortDateString(),
                            daysUntilDeadline = Math.Round(daysUntilDeadline, 1),
                            status = "Created"
                        });
                    }
                    else
                    {
                        slasSkipped++;
                        _logger.LogInformation("SLA already exists for {EmployeeId}", employeeId);
                    }
                }
                else
                {
                    slasSkipped++;
                    _logger.LogInformation("Appraisal out of range for {EmployeeId}", employeeId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing employee");
                slasSkipped++;
            }
        }

        var endTime = DateTime.Now;

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = $"✅ Created: {slasCreated}, Skipped: {slasSkipped}",
            Data = new
            {
                ExecutionSummary = new
                {
                    TotalEmployeesProcessed = allEmployees.Count,
                    SlasCreated = slasCreated,
                    SlasSkipped = slasSkipped,
                    SuccessRate = allEmployees.Count > 0 ? Math.Round((slasCreated * 100.0) / allEmployees.Count, 2) : 0
                },
                CreatedSLAs = createdSlasList,
                SkippedEmployees = skippedList
            }
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error in CreatePerformanceFormSlas");
        return StatusCode(500, new ApiResponse<object>
        {
            Success = false,
            Message = ex.Message
        });
    }
}

        private string GetEmployeeName(Employee emp)
        {
            if (emp?.Userprofile == null)
                return "Unknown";
            return $"{emp.Userprofile.FirstName} {emp.Userprofile.LastName}";
        }
    }
}
