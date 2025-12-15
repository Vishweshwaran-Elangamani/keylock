using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Org.BouncyCastle.Asn1.X509;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Enums;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interface;
using Serilog;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class GoalProgressRepository : IGoalProgressRepository
    {
        private readonly EEPZDbContext _db;
        private readonly IBaseGoalRepository _baseRepo;
        private readonly IWebHostEnvironment environment;

        public GoalProgressRepository(
            EEPZDbContext db,
            IBaseGoalRepository baseRepository,
            IWebHostEnvironment _environment
        )
        {
            _db = db;
            _baseRepo = baseRepository;
            environment = _environment;
        }

        public async Task<GoalChecklist?> GetChecklistItemAsync(int checklistId)
        {
            try
            {
                Log.Information(
                    "[GetChecklistItemAsync] Fetching checklist item {ChecklistId}",
                    checklistId
                );
                var result = await _db
                    .GoalChecklists.Include(c => c.Goalchecklistprogresses)
                    .FirstOrDefaultAsync(c => c.ChecklistId == checklistId);
                if (result != null)
                    Log.Information(
                        "[GetChecklistItemAsync] Checklist item {ChecklistId} found",
                        checklistId
                    );
                else
                    Log.Warning(
                        "[GetChecklistItemAsync] Checklist item {ChecklistId} not found",
                        checklistId
                    );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "[GetChecklistItemAsync] Error fetching checklist item {ChecklistId}",
                    checklistId
                );
                throw;
            }
        }

        public async Task<List<GoalApproval>> GetPendingApprovalsForGoalAndUserAsync(
            int goalId,
            int employeeMasterId,
            string[] approvalTypes
        )
        {
            try
            {
                Log.Information(
                    "[GetPendingApprovalsForGoalAndUserAsync] Fetching pending approvals for goal {GoalId}, user {UserID}",
                    goalId,
                    employeeMasterId
                );
                var result = await _db
                    .GoalApprovals.Where(a =>
                        a.GoalId == goalId
                        && a.RequestedBy == employeeMasterId
                        && a.ApprovalStatus == APPROVAL_STATUS.PENDING
                        && approvalTypes.Contains(a.ApprovalType)
                    )
                    .ToListAsync();
                Log.Information(
                    "[GetPendingApprovalsForGoalAndUserAsync] Found {Count} pending approvals",
                    result.Count
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "[GetPendingApprovalsForGoalAndUserAsync] Error fetching pending approvals"
                );
                throw;
            }
        }

        public async Task SetChecklistProgressAsync(
            int checklistId,
            int userEmployeeMasterId,
            bool completed
        )
        {
            try
            {
                Log.Information(
                    "[SetChecklistProgressAsync] Setting progress for checklist {ChecklistId}, user {UserID}, completed: {Completed}",
                    checklistId,
                    userEmployeeMasterId,
                    completed
                );

                var existing = await GetChecklistProgressAsync(checklistId, userEmployeeMasterId);
                if (existing == null)
                {
                    existing = new Goalchecklistprogress
                    {
                        ChecklistId = checklistId,
                        UserId = userEmployeeMasterId,
                        IsCompleted = completed,
                        CompletedOn = completed ? DateTime.UtcNow : null,
                    };
                    await _db.Goalchecklistprogresses.AddAsync(existing);
                    Log.Information("[SetChecklistProgressAsync] New progress record created");
                }
                else
                {
                    existing.IsCompleted = completed;
                    existing.CompletedOn = completed ? DateTime.UtcNow : null;
                    _db.Goalchecklistprogresses.Update(existing);
                    Log.Information("[SetChecklistProgressAsync] Existing progress record updated");
                }
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[SetChecklistProgressAsync] Error setting checklist progress");
                throw;
            }
        }

        public async Task<Goalchecklistprogress?> GetChecklistProgressAsync(
            int checklistId,
            int userEmployeeMasterId
        )
        {
            try
            {
                Log.Information(
                    "[GetChecklistProgressAsync] Fetching progress for checklist {ChecklistId}, user {UserID}",
                    checklistId,
                    userEmployeeMasterId
                );
                var result = await _db.Goalchecklistprogresses.FirstOrDefaultAsync(p =>
                    p.ChecklistId == checklistId && p.UserId == userEmployeeMasterId
                );
                Log.Information(
                    "[GetChecklistProgressAsync] Progress record found: {Found}",
                    result != null
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetChecklistProgressAsync] Error fetching checklist progress");
                throw;
            }
        }

        public async Task AddProgressLogAsync(Goalprogresslog log)
        {
            try
            {
                Log.Information(
                    "[AddProgressLogAsync] Adding progress log for goal {GoalId}, progress: {Progress}%",
                    log.GoalId,
                    log.ProgressPercent
                );
                await _db.Goalprogresslogs.AddAsync(log);
                Log.Information("[AddProgressLogAsync] Progress log added successfully");
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[AddProgressLogAsync] Error adding progress log");
                throw;
            }
        }

        public async Task<List<int>> GetSubordinatesAssignedToGoalAsync(
            int goalId,
            int managerEmployeeMasterId
        )
        {
            try
            {
                Log.Information(
                    "[GetSubordinatesAssignedToGoalAsync] Fetching subordinates assigned to goal {GoalId} for manager {ManagerID}",
                    goalId,
                    managerEmployeeMasterId
                );
                var subordinateMasterIds = await _baseRepo.GetSubordinateEmployeeMasterIdsAsync(
                    managerEmployeeMasterId
                );

                if (!subordinateMasterIds.Any())
                {
                    Log.Warning(
                        "[GetSubordinatesAssignedToGoalAsync] No subordinates found for manager"
                    );
                    return new List<int>();
                }

                var assignedSubordinates = await _db
                    .GoalAssignments.Where(ga =>
                        ga.GoalId == goalId && subordinateMasterIds.Contains(ga.AssignedTo ?? 0)
                    )
                    .Select(ga => ga.AssignedTo ?? 0)
                    .Where(id => id != 0)
                    .Distinct()
                    .ToListAsync();

                Log.Information(
                    "[GetSubordinatesAssignedToGoalAsync] Found {Count} assigned subordinates",
                    assignedSubordinates.Count
                );
                return assignedSubordinates;
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "[GetSubordinatesAssignedToGoalAsync] Error fetching subordinates assigned to goal"
                );
                throw;
            }
        }

        public async Task<List<GoalChecklist>> GetUserOwnChecklistItemsAsync(int goalId, int userId)
        {
            try
            {
                Log.Information(
                    "[GetUserOwnChecklistItemsAsync] Fetching checklist items for goal {GoalId}, user {UserID}",
                    goalId,
                    userId
                );
                var result = await _db
                    .GoalChecklists.Include(c => c.Goalchecklistprogresses)
                    .Where(c => c.GoalId == goalId && c.AddedFor == userId)
                    .ToListAsync();
                Log.Information(
                    "[GetUserOwnChecklistItemsAsync] Found {Count} checklist items",
                    result.Count
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "[GetUserOwnChecklistItemsAsync] Error fetching user checklist items"
                );
                throw;
            }
        }

        public async Task<int> CountUserOwnCompletedItemsAsync(int goalId, int userId)
        {
            try
            {
                Log.Information(
                    "[CountUserOwnCompletedItemsAsync] Counting completed items for goal {GoalId}, user {UserID}",
                    goalId,
                    userId
                );
                var userItems = await GetUserOwnChecklistItemsAsync(goalId, userId);

                if (!userItems.Any())
                {
                    Log.Information("[CountUserOwnCompletedItemsAsync] No items found for user");
                    return 0;
                }

                var checklistIds = userItems.Select(c => c.ChecklistId).ToList();
                var result = await _db
                    .Goalchecklistprogresses.Where(p =>
                        checklistIds.Contains(p.ChecklistId)
                        && p.UserId == userId
                        && p.IsCompleted == true
                    )
                    .CountAsync();

                Log.Information(
                    "[CountUserOwnCompletedItemsAsync] Found {Count} completed items",
                    result
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[CountUserOwnCompletedItemsAsync] Error counting completed items");
                throw;
            }
        }
    }
}
