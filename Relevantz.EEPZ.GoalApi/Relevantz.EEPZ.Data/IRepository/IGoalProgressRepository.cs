using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Data.Repository.Interface
{
    public interface IGoalProgressRepository
    {
        Task<GoalChecklist?> GetChecklistItemAsync(int checklistId);
        Task SetChecklistProgressAsync(int checklistId, int userEmployeeMasterId, bool completed);
        Task<List<GoalApproval>> GetPendingApprovalsForGoalAndUserAsync(
            int goalId,
            int employeeMasterId,
            string[] approvalTypes
        );
        Task AddProgressLogAsync(Goalprogresslog log);
        Task<List<int>> GetSubordinatesAssignedToGoalAsync(int goalId, int managerEmployeeMasterId);
        Task<List<GoalChecklist>> GetUserOwnChecklistItemsAsync(int goalId, int userId);
        Task<int> CountUserOwnCompletedItemsAsync(int goalId, int userId);
    }
}
