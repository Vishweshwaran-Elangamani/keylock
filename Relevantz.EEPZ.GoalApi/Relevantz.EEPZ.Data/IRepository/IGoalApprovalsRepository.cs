using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interface
{
    public interface IGoalApprovalsRepository
    {
        Task AddApprovalAsync(GoalApproval approval);
        Task<GoalApproval?> GetApprovalByIdAsync(int approvalId);
        Task<List<GoalApproval>> GetPendingApprovalsForApproverAsync(int approverEmployeeMasterId);
        Task UpdateApprovalAsync(GoalApproval approval);
        Task<int> CountPendingApprovalsForUserAsync(int employeeMasterId);
        Task<List<GoalApproval>> GetAllApprovalsForUserAsync(int userId, string userRole);
        IQueryable<GoalApproval> GetGoalApprovalsQueryable();
        Task<int> CountAsync<T>(IQueryable<T> query);
        Task<List<T>> GetPagedAsync<T>(IQueryable<T> query, int page, int pageSize);
        Task<GoalApproval?> GetPendingApprovalByGoalAndTypeAsync(int goalId, string approvalType);
    }
}
