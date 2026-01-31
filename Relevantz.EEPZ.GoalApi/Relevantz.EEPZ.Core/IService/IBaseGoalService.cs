using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface IBaseGoalService
    {
        bool CanCreate(string role, string goalType);
        string? GetCreationApprovalType(string goalType);
        Task<int?> GetApproverForUser(int employeeMasterId, string approvalType);
        Task<string> GetEmployeeName(int? employeeMasterId);
        Task<bool> CanMarkComplete(int goalId, int employeeMasterId);
        Task<int> GetGoalProgressPercent(int goalId, int forEmployeeMasterId);
        Task<bool> CanViewGoal(int goalId, int employeeMasterId);
        Task<bool> CanCommentOnGoal(
            int goalId,
            int currentUserEmployeeMasterId,
            string currentUserRole
        );
        Task<bool> CanUserCommentOnGoal(int goalId, int employeeMasterId, string role);
        Task<bool> IsGoalCommentable(int goalId);
        Task<GoalDetailModel> GetGoal(
            int goalId,
            int currentUserEmployeeMasterId,
            string currentUserRole
        );
        Task<CanMarkCompleteModel> GetMarkCompleteEligibility(
            int goalId,
            int employeeMasterId,
            string role
        );
    }
}
