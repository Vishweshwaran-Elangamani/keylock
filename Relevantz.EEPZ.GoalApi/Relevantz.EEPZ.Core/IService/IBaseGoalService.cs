using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface IBaseGoalService
    {
        bool CanCreate(string role, string goalType); 
        string? GetCreationApprovalType(string goalType);
        Task<int?> GetApproverForUserAsync(int employeeMasterId, string approvalType);
        Task<string> GetEmployeeNameAsync(int? employeeMasterId);
        Task<bool> CanMarkCompleteAsync(int goalId, int employeeMasterId);
        Task<int> GetGoalProgressPercentAsync(int goalId, int forEmployeeMasterId); 
        Task<bool> CanViewGoalAsync(int goalId, int employeeMasterId); 
        Task<bool> CanCommentOnGoalAsync(
            int goalId,
            int currentUserEmployeeMasterId,
            string currentUserRole 
        ); 
        Task<bool> CanUserCommentOnGoalAsync(int goalId, int employeeMasterId, string role);
        Task<bool> IsGoalCommentableAsync(int goalId);
        Task<GoalDetailModel> GetGoalAsync(
            int goalId,
            int currentUserEmployeeMasterId,
            string currentUserRole
        );
         Task<CanMarkCompleteModel> GetCanMarkCompleteDetailsAsync(int goalId, int employeeMasterId, string role);
    }
}
