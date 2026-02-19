using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Common.Entities;
using Microsoft.EntityFrameworkCore;
using MySqlConnector;
using Relevantz.EEPZ.Data.DBContexts;
using Microsoft.Extensions.Logging;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class SlaRepository : ISlaRepository
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<SlaRepository> _logger;

        public SlaRepository(EEPZDbContext context, ILogger<SlaRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        #region Basic CRUD Operations

        public async Task<List<Sla>> GetAllSlasAsync()
        {
            try
            {
                return await _context.Slas
                    .AsNoTracking() // ✅ read-only optimization
                    .OrderByDescending(s => s.CreatedAt)
                    .Select(s => new Sla
                    {
                        Slaid = s.Slaid,
                        Slatype = s.Slatype,
                        Status = s.Status,
                        EmployeeId = s.EmployeeId,
                        DepartmentId = s.DepartmentId,
                        AssignedToEmployeeId = s.AssignedToEmployeeId,
                        Deadline = s.Deadline,
                        ClosedAt = s.ClosedAt,
                        ComplianceStatus = s.ComplianceStatus,
                        CreatedAt = s.CreatedAt,
                        UpdatedAt = s.UpdatedAt,
                        Employee = new Employee
                        {
                            EmployeeId = s.Employee.EmployeeId,
                            Userprofile = s.Employee.Userprofile
                        },
                        Department = s.Department,
                        AssignedToEmployee = new Employee
                        {
                            EmployeeId = s.AssignedToEmployee.EmployeeId,
                            Userprofile = s.AssignedToEmployee.Userprofile
                        }
                    })
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all SLAs");
                throw;
            }
        }


        public async Task<Employee?> GetEmployeeByIdAsync(int employeeId)
        {
            return await _context.Employees
                .Include(e => e.Userprofile)
                .Include(e => e.Userauthentication)
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.EmployeeId == employeeId);
        }


        public async Task<Sla?> GetSlaByIdAsync(int slaid)
        {
            try
            {
                return await _context.Slas
                    .Include(s => s.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(s => s.Department)
                    .Include(s => s.AssignedToEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(s => s.ReopenedByEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .FirstOrDefaultAsync(s => s.Slaid == slaid);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving SLA by ID: {slaid}");
                throw;
            }
        }

        public async Task<List<Sla>> GetSlasByEmployeeIdAsync(int employeeId)
        {
            try
            {
                return await _context.Slas
                    .Where(s => s.EmployeeId == employeeId)
                    .Include(s => s.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(s => s.Department)
                    .Include(s => s.AssignedToEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .OrderByDescending(s => s.Deadline)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving SLAs for employee: {employeeId}");
                throw;
            }
        }

        public async Task<List<Sla>> GetSlasByDepartmentIdAsync(int departmentId)
        {
            try
            {
                return await _context.Slas
                    .Where(s => s.DepartmentId == departmentId)
                    .Include(s => s.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(s => s.Department)
                    .OrderByDescending(s => s.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving SLAs for department: {departmentId}");
                throw;
            }
        }

        public async Task<Sla> CreateSlaAsync(Sla sla)
        {
            sla.CreatedAt = DateTime.Now;
            sla.UpdatedAt = DateTime.Now;

            _context.Slas.Add(sla);
            await _context.SaveChangesAsync();

            return sla;
        }

        public async Task<Sla> UpdateSlaAsync(Sla sla)
        {
            try
            {
                sla.UpdatedAt = DateTime.Now;
                _context.Slas.Update(sla);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"SLA updated successfully. SLA ID: {sla.Slaid}");
                return sla;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating SLA");
                throw;
            }
        }

 public async Task<bool> DeleteSlaAsync(int slaid)
{
    try
    {
        var sla = await _context.Slas.FindAsync(slaid);

        if (sla == null)
        {
            _logger.LogWarning("SLA not found for deletion. SLA ID: {SlaId}", slaid);
            return false;
        }

        _context.Slas.Remove(sla);
        await _context.SaveChangesAsync();

        _logger.LogInformation("SLA deleted successfully. SLA ID: {SlaId}", slaid);
        return true;
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error deleting SLA");
        throw;
    }
}


        #endregion

        #region Close SLA Operations

        /// <summary>
        /// Close an SLA (for managers and HR)
        /// </summary>
        public async Task<bool> CloseSlaAsync(int slaid, int? closedByEmployeeId = null, string? closureComments = null)
        {
            try
            {
                var sla = await _context.Slas.FindAsync(slaid);

                if (sla == null)
                {
                    _logger.LogWarning($"SLA not found. SLA ID: {slaid}");
                    return false;
                }

                if (sla.Status == "Closed")
                {
                    _logger.LogWarning($"SLA is already closed. SLA ID: {slaid}");
                    return false;
                }

                sla.Status = "Closed";
                sla.ClosedAt = DateTime.Now;
                sla.UpdatedAt = DateTime.Now;

                _context.Slas.Update(sla);

                var history = new Slahistory
                {
                    Slaid = slaid,
                    ChangeType = "StatusChanged",
                    ChangedFrom = "Open",
                    ChangedTo = "Closed",
                    ChangedByEmployeeId = closedByEmployeeId,
                    Reason = closureComments ?? "SLA closed by manager/HR",
                    CreatedAt = DateTime.Now
                };

                _context.Slahistories.Add(history);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"SLA closed successfully. SLA ID: {slaid}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error closing SLA. SLA ID: {slaid}");
                throw;
            }
        }

        #endregion

        #region Escalation Operations

        public async Task<Slaescalation?> GetEscalationByIdAsync(int escalationId)
        {
            try
            {
                return await _context.Slaescalations
                    .Include(e => e.Sla)
                    .Include(e => e.EscalatedToEmployee)
                        .ThenInclude(emp => emp.Userprofile)
                    .Include(e => e.SubmittedByEmployee)
                        .ThenInclude(emp => emp.Userprofile)
                    .Include(e => e.ResolvedByEmployee)
                        .ThenInclude(emp => emp.Userprofile)
                    .FirstOrDefaultAsync(e => e.EscalationId == escalationId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving escalation: {escalationId}");
                throw;
            }
        }
        public async Task<List<Slaescalation>> GetEscalationsBySlaIdAsync(int slaId)
        {
            return await _context.Slaescalations
                .Where(e => e.Slaid == slaId)

                .Include(e => e.SubmittedByEmployee)
                    .ThenInclude(e => e.Userprofile)

                .Include(e => e.EscalatedToEmployee)
                    .ThenInclude(e => e.Userprofile)

                .Include(e => e.Sla)
                    .ThenInclude(s => s.Employee)
                        .ThenInclude(e => e.Userprofile)

                .OrderByDescending(e => e.SubmittedAt)
                .ToListAsync();
        }

        public async Task<Slaescalation> CreateEscalationAsync(Slaescalation escalation)
        {
            try
            {
                escalation.SubmittedAt = DateTime.Now;
                _context.Slaescalations.Add(escalation);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Escalation created successfully. Escalation ID: {escalation.EscalationId}");
                return escalation;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating escalation");
                throw;
            }
        }

        public async Task<Slaescalation> UpdateEscalationAsync(Slaescalation escalation)
        {
            try
            {
                _context.Slaescalations.Update(escalation);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Escalation updated successfully. Escalation ID: {escalation.EscalationId}");
                return escalation;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating escalation");
                throw;
            }
        }

        #endregion

        #region History Operations
        public async Task<List<Slahistory>> GetSlaHistoryAsync(int slaid)
        {
            return await _context.Slahistories
                .Where(h => h.Slaid == slaid)

                .Include(h => h.ChangedByEmployee)
                    .ThenInclude(e => e.Userprofile)

                .Include(h => h.Sla)
                    .ThenInclude(s => s.Employee)
                        .ThenInclude(e => e.Userprofile)

                .OrderByDescending(h => h.CreatedAt)
                .ToListAsync();
        }


        public async Task<Slahistory> AddHistoryAsync(Slahistory history)
        {
            history.CreatedAt = DateTime.Now;

            if (history.ChangedByEmployeeId == 0)
                history.ChangedByEmployeeId = null;

            _context.Slahistories.Add(history);
            await _context.SaveChangesAsync();

            if (history.ChangedByEmployeeId.HasValue)
            {
                await _context.Entry(history)
                    .Reference(h => h.ChangedByEmployee)
                    .Query()
                    .Include(e => e.Userprofile)
                    .LoadAsync();
            }

            return history;
        }


        #endregion

        #region Review Tracking Operations

        public async Task<List<Slareviewtracking>> GetReviewTrackingByReviewerIdAsync(int reviewerId)
        {
            try
            {
                return await _context.Slareviewtrackings
                    .Where(rt => rt.ReviewerId == reviewerId)
                    .Include(rt => rt.Sla)
                    .Include(rt => rt.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(rt => rt.Reviewer)
                        .ThenInclude(e => e.Userprofile)
                    .OrderBy(rt => rt.Deadline)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving review tracking for reviewer: {reviewerId}");
                throw;
            }
        }

        public async Task<List<Slareviewtracking>> GetReviewTrackingByEmployeeIdAsync(int employeeId)
        {
            try
            {
                return await _context.Slareviewtrackings
                    .Where(rt => rt.EmployeeId == employeeId)
                    .Include(rt => rt.Sla)
                    .Include(rt => rt.Reviewer)
                        .ThenInclude(e => e.Userprofile)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving review tracking for employee: {employeeId}");
                throw;
            }
        }

        #endregion

        #region Compliance Operations

        public async Task<List<Slacompliance>> GetAllComplianceAsync(string? period = null)
        {
            try
            {
                var query = _context.Slacompliances
                    .Include(c => c.Department)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(period))
                {
                    query = query.Where(c => c.Period == period);
                }

                return await query
                    .OrderByDescending(c => c.CompliancePercentage)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving compliance data");
                throw;
            }
        }

        public async Task<Slacompliance?> GetComplianceByDepartmentAndPeriodAsync(int departmentId, string period)
        {
            try
            {
                return await _context.Slacompliances
                    .Include(c => c.Department)
                    .FirstOrDefaultAsync(c => c.DepartmentId == departmentId && c.Period == period);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving compliance for department: {departmentId}, period: {period}");
                throw;
            }
        }

        public async Task<bool> CalculateComplianceAsync(int departmentId, string period, DateOnly periodStartDate, DateOnly periodEndDate)
        {
            try
            {
                var slas = await _context.Slas
                    .Where(s => s.DepartmentId == departmentId &&
                                s.Deadline >= periodStartDate.ToDateTime(TimeOnly.MinValue) &&
                                s.Deadline <= periodEndDate.ToDateTime(TimeOnly.MaxValue))
                    .ToListAsync();

                int totalSlas = slas.Count;
                int onTimeSlas = slas.Count(s => s.ComplianceStatus == "OnTime" && s.Status == "Closed");
                int breachedSlas = slas.Count(s => s.ComplianceStatus == "Breached");
                int extendedSlas = slas.Count(s => s.ComplianceStatus == "Extended");
                int pendingSlas = slas.Count(s => s.Status == "Open" || s.Status == "InProgress");

                var compliance = await _context.Slacompliances
                    .FirstOrDefaultAsync(c => c.DepartmentId == departmentId && c.Period == period);

                if (compliance == null)
                {
                    compliance = new Slacompliance
                    {
                        DepartmentId = departmentId,
                        Period = period,
                        PeriodStartDate = periodStartDate,
                        PeriodEndDate = periodEndDate,
                        TotalSlas = totalSlas,
                        OnTimeSlas = onTimeSlas,
                        BreachedSlas = breachedSlas,
                        ExtendedSlas = extendedSlas,
                        PendingSlas = pendingSlas,
                        CalculatedAt = DateTime.Now,
                        CreatedAt = DateTime.Now
                    };
                    _context.Slacompliances.Add(compliance);
                }
                else
                {
                    compliance.PeriodStartDate = periodStartDate;
                    compliance.PeriodEndDate = periodEndDate;
                    compliance.TotalSlas = totalSlas;
                    compliance.OnTimeSlas = onTimeSlas;
                    compliance.BreachedSlas = breachedSlas;
                    compliance.ExtendedSlas = extendedSlas;
                    compliance.PendingSlas = pendingSlas;
                    compliance.CalculatedAt = DateTime.Now;
                    compliance.UpdatedAt = DateTime.Now;

                    _context.Slacompliances.Update(compliance);
                }
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Compliance calculated for Department ID: {departmentId}, Period: {period}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating compliance via EF Core");
                throw;
            }
        }

        public async Task CallCalculateComplianceProcedureAsync(int departmentId, string period,
            DateOnly periodStartDate, DateOnly periodEndDate)
        {
            try
            {
                var parameters = new[]
                {
                    new MySqlParameter("@p_DepartmentId", departmentId),
                    new MySqlParameter("@p_Period", period),
                    new MySqlParameter("@p_PeriodStartDate", periodStartDate),
                    new MySqlParameter("@p_PeriodEndDate", periodEndDate)
                };

                await _context.Database.ExecuteSqlRawAsync(
                    "CALL sp_CalculateSLACompliance(@p_DepartmentId, @p_Period, @p_PeriodStartDate, @p_PeriodEndDate)",
                    parameters);

                _logger.LogInformation($"Compliance calculation executed for Department ID: {departmentId}, Period: {period}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling compliance calculation procedure");
                throw;
            }
        }

        #endregion

        #region Reopen Operations
        public async Task<bool> ReopenSlaAsync(int slaid, int extensionDays, string reopenReason, int reopenedByEmployeeId)
        {
            try
            {
                var sla = await _context.Slas.FirstOrDefaultAsync(s => s.Slaid == slaid);
                if (sla == null)
                    return false;

                sla.ReopenCount += 1;
                sla.ReopenReason = reopenReason;
                sla.ReopenedByEmployeeId = reopenedByEmployeeId;
                sla.ReopenedAt = DateTime.Now;
                sla.ReopenExtensionDays = extensionDays;
                sla.Deadline = DateTime.Now.AddDays(extensionDays);
                sla.Status = "InProgress";

                _context.Slas.Update(sla);

                var history = new Slahistory
                {
                    Slaid = slaid,
                    ChangeType = "Reopened",
                    ChangedTo = sla.Deadline.ToString("yyyy-MM-dd"),
                    ChangedByEmployeeId = reopenedByEmployeeId,
                    Reason = reopenReason,
                    CreatedAt = DateTime.Now
                };
                _context.Slahistories.Add(history);

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reopening SLA");
                throw;
            }
        }

        #endregion

        #region Automation Methods

        public async Task<List<Sla>> GetOverdueSlas(DateTime? cutoffDate = null, int? departmentId = null)
        {
            try
            {
                var targetDate = cutoffDate ?? DateTime.Now;

                var query = _context.Slas
                    .Where(s => s.Status != "Closed" && s.Deadline < targetDate);

                if (departmentId.HasValue)
                {
                    query = query.Where(s => s.DepartmentId == departmentId.Value);
                }

                return await query
                    .Include(s => s.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(s => s.Employee)                // ✅ ADD THIS BLOCK
                        .ThenInclude(e => e.Userauthentication)
                    .Include(s => s.Department)
                    .OrderBy(s => s.Deadline)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving overdue SLAs");
                throw;
            }
        }


        public async Task<List<Sla>> GetSlasWithDeadline(DateTime targetDate, int? departmentId = null)
        {
            try
            {
                var startOfDay = targetDate.Date;
                var endOfDay = startOfDay.AddDays(1).AddSeconds(-1);

                var query = _context.Slas
                    .Where(s => s.Status != "Closed" &&
                               s.Deadline >= startOfDay &&
                               s.Deadline <= endOfDay);

                if (departmentId.HasValue)
                {
                    query = query.Where(s => s.DepartmentId == departmentId.Value);
                }

                return await query
                    .Include(s => s.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(s => s.AssignedToEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(s => s.Department)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving SLAs with deadline");
                throw;
            }
        }

        public async Task<List<Slanotification>> GetEmployeeNotifications(int employeeId, bool unreadOnly = false)
        {
            try
            {
                var query = _context.Slanotifications
                    .Where(n => n.EmployeeId == employeeId);

                if (unreadOnly)
                {
                    query = query.Where(n => n.ReadAt == null);
                }

                return await query
                    .Include(n => n.Sla)
                    .OrderByDescending(n => n.SentAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving notifications for employee: {employeeId}");
                throw;
            }
        }

        public async Task<List<Employee>> GetEmployeesByIdsAsync(List<int> employeeIds)
        {
            return await _context.Employees
                .Include(e => e.Userprofile)
                .Where(e => employeeIds.Contains(e.EmployeeId))
                .AsNoTracking()
                .ToListAsync();
        }

        public string GetConnectionString()
        {
            return _context.Database.GetDbConnection().ConnectionString;
        }


        public async Task<int> BulkInsertSlasAsync(List<Sla> slas)
        {
            if (slas == null || !slas.Any())
            {
                _logger.LogWarning("BulkInsertSlasAsync called with empty or null list");
                return 0;
            }

            try
            {
                _logger.LogInformation("Bulk insert started. Count: {Count}", slas.Count);

                _context.ChangeTracker.AutoDetectChangesEnabled = false;

                try
                {
                    await _context.Slas.AddRangeAsync(slas);
                    var result = await _context.SaveChangesAsync();

                    _logger.LogInformation("Bulk insert completed successfully. Inserted: {Inserted}", result);
                    return result;
                }
                finally
                {
                    _context.ChangeTracker.AutoDetectChangesEnabled = true;
                }
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error during bulk insert");
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during bulk insert");
                throw;
            }
        }

        public async Task<Slanotification> CreateNotificationAsync(Slanotification notification)
        {
            try
            {
                notification.SentAt = DateTime.Now;
                _context.Slanotifications.Add(notification);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Notification created. Notification ID: {notification.NotificationId}");
                return notification;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating notification");
                throw;
            }
        }

        public async Task MarkNotificationAsRead(int notificationId)
        {
            try
            {
                var notification = await _context.Slanotifications.FindAsync(notificationId);
                if (notification != null)
                {
                    notification.ReadAt = DateTime.Now;
                    await _context.SaveChangesAsync();

                    _logger.LogInformation($"Notification marked as read. Notification ID: {notificationId}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking notification as read");
                throw;
            }
        }

        public async Task<bool> CanReopenSla(int slaid)
        {
            try
            {
                var sla = await _context.Slas.FindAsync(slaid);
                return sla != null && sla.ReopenCount < 1;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking reopen eligibility");
                throw;
            }
        }

        public async Task IncrementReopenCount(int slaid)
        {
            try
            {
                var sla = await _context.Slas.FindAsync(slaid);
                if (sla != null)
                {
                    sla.ReopenCount++;
                    await _context.SaveChangesAsync();

                    _logger.LogInformation($"Reopen count incremented. SLA ID: {slaid}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error incrementing reopen count");
                throw;
            }
        }
      public async Task<List<Slaescalation>> GetEscalationsByEscalatedToAsync(int managerId)
{
    return await _context.Slaescalations
        .AsNoTracking()   // ✅ Added for read-only optimization
        .Include(e => e.Sla)
            .ThenInclude(s => s.Employee)
                .ThenInclude(emp => emp.Userprofile)
        .Include(e => e.SubmittedByEmployee)
            .ThenInclude(emp => emp.Userprofile)
        .Include(e => e.EscalatedToEmployee)
            .ThenInclude(emp => emp.Userprofile)
        .Where(e => e.EscalatedToEmployeeId == managerId)
        .OrderByDescending(e => e.SubmittedAt)
        .ToListAsync();
}


        /// <summary>
        /// Get SLAs due in specific number of days (for reminders)
        /// </summary>
        public async Task<List<Sla>> GetSlasDueInDaysAsync(int days)
        {
            var targetDate = DateTime.Now.Date.AddDays(days);

            return await _context.Slas
                .Include(s => s.Employee)
                    .ThenInclude(e => e.Userprofile)
                .Include(s => s.Employee)
                    .ThenInclude(e => e.Userauthentication)
                .Include(s => s.AssignedToEmployee)
                    .ThenInclude(a => a.Userprofile)
                .Include(s => s.AssignedToEmployee)
                    .ThenInclude(a => a.Userauthentication)
                .Include(s => s.Department)
                .Where(s => s.Deadline.Date == targetDate &&
                           s.Status != "Closed" &&
                           s.Status != "Completed")
                .ToListAsync();
        }

        /// <summary>
        /// Get overdue SLAs (for escalations)
        /// </summary>
        public async Task<List<Sla>> GetOverdueSlasByDaysAsync(int days)
        {
            var cutoffDate = DateTime.Now.Date.AddDays(-days);

            return await _context.Slas
                .Include(s => s.Employee)
                    .ThenInclude(e => e.Userprofile)
                .Include(s => s.Employee)
                    .ThenInclude(e => e.Userauthentication)
                .Include(s => s.AssignedToEmployee)
                    .ThenInclude(a => a.Userprofile)
                .Include(s => s.AssignedToEmployee)
                    .ThenInclude(a => a.Userauthentication)
                .Include(s => s.Department)
                .Where(s => s.Deadline.Date <= cutoffDate &&
                           s.Status != "Closed" &&
                           s.Status != "Completed")
                .ToListAsync();
        }

        /// <summary>
        /// Get completed SLAs (for auto-close)
        /// </summary>
        public async Task<List<Sla>> GetCompletedSlasAsync()
        {
            return await _context.Slas
                .Include(s => s.Employee)
                    .ThenInclude(e => e.Userprofile)
                .Include(s => s.Employee)
                    .ThenInclude(e => e.Userauthentication)
                .Include(s => s.Department)
                .Where(s => s.Status == "Completed" &&
                           s.ClosedAt == null)
                .ToListAsync();
        }


        public async Task<List<Slahistory>> GetAllSlaHistoryAsync()
        {
            try
            {
                return await _context.Slahistories
                    .Include(h => h.Sla)
                        .ThenInclude(s => s.Employee!)
                            .ThenInclude(e => e.Userprofile)
                    .Include(h => h.ChangedByEmployee!)
                        .ThenInclude(e => e.Userprofile)
                    .OrderByDescending(h => h.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all SLA history");
                throw;
            }
        }

        #endregion
    }
}
