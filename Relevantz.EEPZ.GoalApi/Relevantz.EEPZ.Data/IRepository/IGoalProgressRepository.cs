using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Data.Repository.Interface
{
    public interface IGoalProgressRepository
    {
        Task<GoalChecklist?> GetChecklistItem(int checklistId);
        Task SetChecklistProgress(int checklistId, int userEmployeeMasterId, bool completed);
        Task<List<GoalApproval>> GetPendingApprovalsForGoalAndUser(
            int goalId,
            int employeeMasterId,
            string[] approvalTypes
        );
        Task AddProgressLog(Goalprogresslog log);
        Task<List<int>> GetSubordinatesAssignedToGoal(int goalId, int managerEmployeeMasterId);
        Task<List<GoalChecklist>> GetUserOwnChecklistItems(int goalId, int userId);
        Task<int> CountUserOwnCompletedItems(int goalId, int userId);
    }
}
