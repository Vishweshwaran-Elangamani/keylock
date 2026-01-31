using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    public interface ISlaRepository
    {
        Task<List<Sla>> GetAllSlasAsync();

        Task<Sla?> GetSlaByIdAsync(int slaid);
        Task<List<Sla>> GetSlasByEmployeeIdAsync(int employeeId);
        Task<List<Sla>> GetSlasByDepartmentIdAsync(int departmentId);
        Task<Employee?> GetEmployeeByIdAsync(int employeeId);
 
        Task<Sla> CreateSlaAsync(Sla sla);

        Task<Sla> UpdateSlaAsync(Sla sla);
        Task DeleteSlaAsync(int slaid);

        Task<bool> CloseSlaAsync(int slaid, int? closedByEmployeeId = null, string? closureComments = null);

        Task<Slaescalation?> GetEscalationByIdAsync(int escalationId);
        Task<List<Slaescalation>> GetEscalationsBySlaIdAsync(int slaid);

        Task<List<Slaescalation>> GetEscalationsByEscalatedToAsync(int employeeId);

        Task<Slaescalation> CreateEscalationAsync(Slaescalation escalation);
        Task<Slaescalation> UpdateEscalationAsync(Slaescalation escalation);

        Task<List<Slahistory>> GetSlaHistoryAsync(int slaid);
        Task<Slahistory> AddHistoryAsync(Slahistory history);

        Task<List<Slareviewtracking>> GetReviewTrackingByReviewerIdAsync(int reviewerId);
        Task<List<Slareviewtracking>> GetReviewTrackingByEmployeeIdAsync(int employeeId);
        Task<List<Slacompliance>> GetAllComplianceAsync(string? period = null);
        Task<Slacompliance?> GetComplianceByDepartmentAndPeriodAsync(int departmentId, string period);
        Task<bool> CalculateComplianceAsync(int departmentId, string period, DateOnly periodStartDate, DateOnly periodEndDate);
        Task<bool> ReopenSlaAsync(int slaid, int extensionDays, string reopenReason, int reopenedByEmployeeId);

        Task<List<Sla>> GetOverdueSlas(DateTime? cutoffDate = null, int? departmentId = null);
        Task<List<Sla>> GetSlasWithDeadline(DateTime targetDate, int? departmentId = null);
        Task<List<Slanotification>> GetEmployeeNotifications(int employeeId, bool unreadOnly = false);
        Task<Slanotification> CreateNotificationAsync(Slanotification notification);
        Task MarkNotificationAsRead(int notificationId);
        Task<bool> CanReopenSla(int slaid);
        Task IncrementReopenCount(int slaid);

        Task<List<Sla>> GetSlasDueInDaysAsync(int days);
        Task<List<Sla>> GetOverdueSlasByDaysAsync(int days);
        Task<List<Sla>> GetCompletedSlasAsync();

        Task<List<Employee>> GetEmployeesByIdsAsync(List<int> employeeIds);


        string GetConnectionString();

        Task<int> BulkInsertSlasAsync(List<Sla> slas);
    }
}
