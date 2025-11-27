// Repository/Implementations/SlaRepository.cs
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
                    .Include(s => s.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(s => s.Department)
                    .Include(s => s.AssignedToEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .OrderByDescending(s => s.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all SLAs");
                throw;
            }
        }

public async Task<Employee> GetEmployeeByIdAsync(int employeeId)
{
    try
    {
        return await _context.Employees
            .Include(e => e.Userprofile)
            .FirstOrDefaultAsync(e => e.EmployeeId == employeeId);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, $"Error retrieving employee: {employeeId}");
        throw;
    }
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
            try
            {
                // Validate required fields before saving to DB 
                if (string.IsNullOrWhiteSpace(sla.Slatype))
                    throw new ArgumentException("Slatype is required");

                if (sla.EmployeeId <= 0)
                    throw new ArgumentException("EmployeeId must be a positive integer");

                if (sla.AssignedToEmployeeId <= 0)
                    throw new ArgumentException("AssignedToEmployeeId must be a positive integer");

                if (sla.Deadline == default(DateTime))
                    throw new ArgumentException("Valid Deadline is required");

                // Set timestamps
                sla.CreatedAt = DateTime.Now;
                sla.UpdatedAt = DateTime.Now;

                // Set default statuses if not already set
                sla.Status = sla.Status ?? "Open";
                sla.ComplianceStatus = sla.ComplianceStatus ?? "OnTime";

                // Clear navigation references to avoid EF Core tracking issues
                sla.Employee = null;
                sla.AssignedToEmployee = null;

                // Sanitize optional related entity data
                if (string.IsNullOrWhiteSpace(sla.RelatedEntityType))
                    sla.RelatedEntityType = null;

                if (sla.RelatedEntityId.HasValue && sla.RelatedEntityId.Value <= 0)
                    sla.RelatedEntityId = null;

                _context.Slas.Add(sla);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"SLA created successfully. SLA ID: {sla.Slaid}");

                return sla;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating SLA");
                throw;
            }
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

        public async Task DeleteSlaAsync(int slaid)
        {
            try
            {
                var sla = await _context.Slas.FindAsync(slaid);
                if (sla != null)
                {
                    _context.Slas.Remove(sla);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"SLA deleted successfully. SLA ID: {slaid}");
                }
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

                // Update SLA
                sla.Status = "Closed";
                sla.ClosedAt = DateTime.Now;
                sla.UpdatedAt = DateTime.Now;

                _context.Slas.Update(sla);

                // Add history entry
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

        public async Task<List<Slaescalation>> GetEscalationsBySlaIdAsync(int slaid)
        {
            try
            {
                return await _context.Slaescalations
                    .Where(e => e.Slaid == slaid)
                    .Include(e => e.EscalatedToEmployee)
                        .ThenInclude(emp => emp.Userprofile)
                    .Include(e => e.SubmittedByEmployee)
                        .ThenInclude(emp => emp.Userprofile)
                    .Include(e => e.ResolvedByEmployee)
                        .ThenInclude(emp => emp.Userprofile)
                    .OrderByDescending(e => e.SubmittedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving escalations for SLA: {slaid}");
                throw;
            }
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

        public async Task CallSubmitEscalationProcedureAsync(int slaid, string reason, string description,
            string escalationLevel, int escalatedToEmployeeId, int submittedByEmployeeId)
        {
            try
            {
                var parameters = new[]
                {
                    new MySqlParameter("@p_SLAId", slaid),
                    new MySqlParameter("@p_Reason", reason),
                    new MySqlParameter("@p_Description", description ?? string.Empty),
                    new MySqlParameter("@p_EscalationLevel", escalationLevel),
                    new MySqlParameter("@p_EscalatedToEmployeeId", escalatedToEmployeeId),
                    new MySqlParameter("@p_SubmittedByEmployeeId", submittedByEmployeeId)
                };

                await _context.Database.ExecuteSqlRawAsync(
                    "CALL sp_SubmitSLAEscalation(@p_SLAId, @p_Reason, @p_Description, @p_EscalationLevel, @p_EscalatedToEmployeeId, @p_SubmittedByEmployeeId)",
                    parameters);
                
                _logger.LogInformation($"Escalation procedure executed. SLA ID: {slaid}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling escalation procedure");
                throw;
            }
        }

        #endregion

        #region History Operations

        public async Task<List<Slahistory>> GetSlaHistoryAsync(int slaid)
        {
            try
            {
                return await _context.Slahistories
                    .Where(h => h.Slaid == slaid)
                    .Include(h => h.Sla)
                        .ThenInclude(s => s.Employee)
                            .ThenInclude(e => e.Userprofile)
                    .Include(h => h.ChangedByEmployee)
                        .ThenInclude(e => e.Userprofile)
                    .OrderByDescending(h => h.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving SLA history for SLA: {slaid}");
                throw;
            }
        }


        public async Task<Slahistory> AddHistoryAsync(Slahistory history)
        {
            try
            {
                history.CreatedAt = DateTime.Now;
                _context.Slahistories.Add(history);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"History entry added. SLA ID: {history.Slaid}");
                return history;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding history");
                throw;
            }
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

        public async Task CallReopenSlaProcedureAsync(int slaid, int extensionDays, string reopenReason,
            int reopenedByEmployeeId)
        {
            try
            {
                var parameters = new[]
                {
                    new MySqlParameter("@p_SLAId", slaid),
                    new MySqlParameter("@p_ExtensionDays", extensionDays),
                    new MySqlParameter("@p_ReopenReason", reopenReason),
                    new MySqlParameter("@p_ReopenedByEmployeeId", reopenedByEmployeeId)
                };

                await _context.Database.ExecuteSqlRawAsync(
                    "CALL sp_ReopenSLA(@p_SLAId, @p_ExtensionDays, @p_ReopenReason, @p_ReopenedByEmployeeId)",
                    parameters);
                
                _logger.LogInformation($"SLA reopen procedure executed. SLA ID: {slaid}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling reopen procedure");
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
    try
    {
        if (slas == null || !slas.Any())
        {
            _logger.LogWarning("BulkInsertSlasAsync called with empty or null list");
            return 0;
        }

        _logger.LogInformation($"Starting bulk insert of {slas.Count} SLAs");

        
        _context.ChangeTracker.AutoDetectChangesEnabled = false;

        try
        {
            
            _context.Slas.AddRange(slas);
            var result = await _context.SaveChangesAsync();
            
            _logger.LogInformation($"Bulk insert completed: {result} SLAs inserted");
            return result;
        }
        finally
        {
            
            _context.ChangeTracker.AutoDetectChangesEnabled = true;
        }
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error in BulkInsertSlasAsync");
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
                return sla != null && sla.ReopenCount < 1; // Allow only 1 reopen
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

        

public async Task<List<Slaescalation>> GetEscalationsByEscalatedToAsync(int employeeId)
{
    try
    {
        return await _context.Slaescalations
            .AsNoTracking()
            .Where(e => e.EscalatedToEmployeeId == employeeId)
            .Include(e => e.Sla)
                .ThenInclude(s => s.Employee!)  
                .ThenInclude(emp => emp.Userprofile)
            .Include(e => e.EscalatedToEmployee!)  
                .ThenInclude(emp => emp.Userprofile)
            .Include(e => e.SubmittedByEmployee!)  
                .ThenInclude(emp => emp.Userprofile)
            .Include(e => e.ResolvedByEmployee!)  
                .ThenInclude(emp => emp.Userprofile)
            .OrderByDescending(e => e.SubmittedAt)
            .ToListAsync();
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, $"Error retrieving escalations for employee: {employeeId}");
        throw;
    }
}


        // ===== NEW AUTOMATION METHODS - MOVED INSIDE CLASS =====

        /// <summary>
        /// Get SLAs due in specific number of days (for reminders)
        /// </summary>
        public async Task<List<Sla>> GetSlasDueInDaysAsync(int days)
        {
            try
            {
                var targetDate = DateTime.Now.AddDays(days).Date;
                var nextDate = targetDate.AddDays(1);

                return await _context.Slas
                    .Include(s => s.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(s => s.AssignedToEmployee)
                        .ThenInclude(a => a.Userprofile)
                    .Include(s => s.Department)
                    .Where(s => s.Deadline >= targetDate && 
                               s.Deadline < nextDate && 
                               s.Status != "Closed" &&
                               s.Status != "Completed")
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving SLAs due in {days} days");
                throw;
            }
        }

        /// <summary>
        /// Get overdue SLAs (for escalations)
        /// </summary>
        public async Task<List<Sla>> GetOverdueSlasByDaysAsync(int days)
        {
            try
            {
                var cutoffDate = DateTime.Now.AddDays(-days);

                return await _context.Slas
                    .Include(s => s.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(s => s.AssignedToEmployee)
                        .ThenInclude(a => a.Userprofile)
                    .Include(s => s.Department)
                    .Where(s => s.Deadline < cutoffDate && 
                               s.Status != "Closed" &&
                               s.Status != "Completed")
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving overdue SLAs");
                throw;
            }
        }

        public async Task<List<Sla>> GetCompletedSlasAsync()
        {
            try
            {
                return await _context.Slas
                    .Include(s => s.Employee)
                        .ThenInclude(e => e.Userprofile)
                    .Include(s => s.Department)
                    .Where(s => s.Status == "Completed" &&
                               s.ClosedAt == null)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving completed SLAs");
                throw;
            }
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

    } // CLASS CLOSING BRACE

} //NAMESPACE CLOSING BRACE
