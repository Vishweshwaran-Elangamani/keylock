// Repository/Interfaces/ISlaRepository.cs
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    /// <summary>
    /// Repository interface for SLA data access
    /// </summary>
    public interface ISlaRepository
    {
        // ========================================================================
        // BASIC CRUD OPERATIONS
        // ========================================================================
        
        /// <summary>
        /// Get all SLAs with includes (for HR dashboard - US100)
        /// </summary>
        Task<List<Sla>> GetAllSlasAsync();
        
        Task<Sla?> GetSlaByIdAsync(int slaid);
        Task<List<Sla>> GetSlasByEmployeeIdAsync(int employeeId);
        Task<List<Sla>> GetSlasByDepartmentIdAsync(int departmentId);
        Task<Employee> GetEmployeeByIdAsync(int employeeId);
        
        /// <summary>
        /// Create new SLA (for HR - US100)
        /// </summary>
        Task<Sla> CreateSlaAsync(Sla sla);
        
        Task<Sla> UpdateSlaAsync(Sla sla);
        Task DeleteSlaAsync(int slaid);

        // ========================================================================
        // CLOSE SLA OPERATIONS
        // ========================================================================
        
        /// <summary>
        /// Close an SLA (Manager/HR) - ✅ FIXED: Made closedByEmployeeId nullable
        /// </summary>
        Task<bool> CloseSlaAsync(int slaid, int? closedByEmployeeId = null, string? closureComments = null);

        // ========================================================================
        // ESCALATION OPERATIONS
        // ========================================================================
        Task<Slaescalation?> GetEscalationByIdAsync(int escalationId);
        Task<List<Slaescalation>> GetEscalationsBySlaIdAsync(int slaid);
        
        /// <summary>
        /// Get all escalations assigned to a specific employee (for Manager/DeptHead dashboard)
        /// Used for US064 - Manager views escalations sent to them
        /// </summary>
        Task<List<Slaescalation>> GetEscalationsByEscalatedToAsync(int employeeId);
        
        Task<Slaescalation> CreateEscalationAsync(Slaescalation escalation);
        Task<Slaescalation> UpdateEscalationAsync(Slaescalation escalation);
        Task CallSubmitEscalationProcedureAsync(int slaid, string reason, string description, 
            string escalationLevel, int escalatedToEmployeeId, int submittedByEmployeeId);

        // ========================================================================
        // HISTORY OPERATIONS
        // ========================================================================
        Task<List<Slahistory>> GetSlaHistoryAsync(int slaid);
        Task<Slahistory> AddHistoryAsync(Slahistory history);

        // ========================================================================
        // REVIEW TRACKING OPERATIONS
        // ========================================================================
        Task<List<Slareviewtracking>> GetReviewTrackingByReviewerIdAsync(int reviewerId);
        Task<List<Slareviewtracking>> GetReviewTrackingByEmployeeIdAsync(int employeeId);

        // ========================================================================
        // COMPLIANCE OPERATIONS
        // ========================================================================
        Task<List<Slacompliance>> GetAllComplianceAsync(string? period = null);
        Task<Slacompliance?> GetComplianceByDepartmentAndPeriodAsync(int departmentId, string period);
        Task CallCalculateComplianceProcedureAsync(int departmentId, string period, 
            DateOnly periodStartDate, DateOnly periodEndDate);

        // ========================================================================
        // REOPEN OPERATIONS
        // ========================================================================
        Task CallReopenSlaProcedureAsync(int slaid, int extensionDays, string reopenReason, 
            int reopenedByEmployeeId);

        // ========================================================================
        // AUTOMATION METHODS
        // ========================================================================
        Task<List<Sla>> GetOverdueSlas(DateTime? cutoffDate = null, int? departmentId = null);
        Task<List<Sla>> GetSlasWithDeadline(DateTime targetDate, int? departmentId = null);
        Task<List<Slanotification>> GetEmployeeNotifications(int employeeId, bool unreadOnly = false);
        Task<Slanotification> CreateNotificationAsync(Slanotification notification);
        Task MarkNotificationAsRead(int notificationId);
        Task<bool> CanReopenSla(int slaid);
        Task IncrementReopenCount(int slaid);

        // ✅ NEW AUTOMATION METHODS (for SlaAutomationController)
        Task<List<Sla>> GetSlasDueInDaysAsync(int days);
        Task<List<Sla>> GetOverdueSlasByDaysAsync(int days);
        Task<List<Sla>> GetCompletedSlasAsync();

        
    }
}
