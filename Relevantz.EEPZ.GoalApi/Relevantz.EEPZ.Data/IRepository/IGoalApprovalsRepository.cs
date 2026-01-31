using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Data.Repository.Interface
{
    public interface IGoalApprovalsRepository
    {
        Task AddApproval(GoalApproval approval);
        Task<GoalApproval?> GetApprovalById(int approvalId);
        Task<List<GoalApproval>> GetPendingApprovalsForApprover(int approverEmployeeMasterId);
        Task UpdateApproval(GoalApproval approval);
        Task<int> CountPendingApprovalsForUser(int employeeMasterId);
        Task<List<GoalApproval>> GetAllApprovalsForUser(int userId, string userRole);
        IQueryable<GoalApproval> GetGoalApprovalsQueryable();
        Task<int> Count<T>(IQueryable<T> query);
        Task<List<T>> GetPaged<T>(IQueryable<T> query, int page, int pageSize);
        Task<GoalApproval?> GetPendingApprovalByGoalAndType(int goalId, string approvalType);
    }
}
