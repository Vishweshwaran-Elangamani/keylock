using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;
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

            Log.Debug("GoalProgressRepository initialized.");
        }

        public async Task<GoalChecklist?> GetChecklistItem(int checklistId)
        {
            Log.Information("GetChecklistItem START | ChecklistId={ChecklistId}", checklistId);

            var result = await _db.GoalChecklists
                .Include(c => c.Goalchecklistprogresses)
                .FirstOrDefaultAsync(c => c.ChecklistId == checklistId);

            Log.Information(
                "GetChecklistItem END | ChecklistId={ChecklistId} | Found={Found}",
                checklistId,
                result != null
            );

            return result;
        }

        public async Task<List<GoalApproval>> GetPendingApprovalsForGoalAndUser(
            int goalId,
            int employeeMasterId,
            string[] approvalTypes
        )
        {
            Log.Information(
                "GetPendingApprovalsForGoalAndUser START | GoalId={GoalId} | UserId={UserId} | Types={Types}",
                goalId,
                employeeMasterId,
                string.Join(",", approvalTypes ?? Array.Empty<string>())
            );

            var result = await _db.GoalApprovals
                .Where(a =>
                    a.GoalId == goalId &&
                    a.RequestedBy == employeeMasterId &&
                    a.ApprovalStatus == APPROVAL_STATUS.PENDING &&
                    approvalTypes.Contains(a.ApprovalType)
                )
                .ToListAsync();

            Log.Information(
                "GetPendingApprovalsForGoalAndUser END | GoalId={GoalId} | UserId={UserId} | Count={Count}",
                goalId,
                employeeMasterId,
                result.Count
            );

            return result;
        }

        public async Task SetChecklistProgress(int checklistId, int userEmployeeMasterId, bool completed)
        {
            Log.Information(
                "SetChecklistProgress START | ChecklistId={ChecklistId} | UserId={UserId} | Completed={Completed}",
                checklistId,
                userEmployeeMasterId,
                completed
            );

            var existing = await GetChecklistProgress(checklistId, userEmployeeMasterId);

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

                Log.Debug(
                    "SetChecklistProgress | Created new progress entry | ChecklistId={ChecklistId} | UserId={UserId}",
                    checklistId,
                    userEmployeeMasterId
                );
            }
            else
            {
                existing.IsCompleted = completed;
                existing.CompletedOn = completed ? DateTime.UtcNow : null;

                _db.Goalchecklistprogresses.Update(existing);

                Log.Debug(
                    "SetChecklistProgress | Updated existing progress entry | ChecklistId={ChecklistId} | UserId={UserId}",
                    checklistId,
                    userEmployeeMasterId
                );
            }

            Log.Information("SetChecklistProgress END | ChecklistId={ChecklistId}", checklistId);
        }

        public async Task<Goalchecklistprogress?> GetChecklistProgress(int checklistId, int userEmployeeMasterId)
        {
            Log.Information(
                "GetChecklistProgress START | ChecklistId={ChecklistId} | UserId={UserId}",
                checklistId,
                userEmployeeMasterId
            );

            var result = await _db.Goalchecklistprogresses
                .FirstOrDefaultAsync(p =>
                    p.ChecklistId == checklistId &&
                    p.UserId == userEmployeeMasterId
                );

            Log.Information(
                "GetChecklistProgress END | ChecklistId={ChecklistId} | UserId={UserId} | Found={Found}",
                checklistId,
                userEmployeeMasterId,
                result != null
            );

            return result;
        }

        public async Task AddProgressLog(Goalprogresslog log)
        {
            Log.Information(
                "AddProgressLog START | GoalId={GoalId} | UpdatedBy={UserId} | Percent={Percent} | Source={Source}",
                log?.GoalId,
                log?.UpdatedBy,
                log?.ProgressPercent,
                log?.Source
            );

            await _db.Goalprogresslogs.AddAsync(log);

            Log.Information("AddProgressLog END | Log added (not saved yet)");
        }

        public async Task<List<int>> GetSubordinatesAssignedToGoal(int goalId, int managerEmployeeMasterId)
        {
            Log.Information(
                "GetSubordinatesAssignedToGoal START | GoalId={GoalId} | ManagerId={ManagerId}",
                goalId,
                managerEmployeeMasterId
            );

            var subordinateMasterIds = await _baseRepo.GetSubordinateEmployeeMasterIds(managerEmployeeMasterId);

            if (!subordinateMasterIds.Any())
            {
                Log.Information(
                    "GetSubordinatesAssignedToGoal | No subordinates | ManagerId={ManagerId}",
                    managerEmployeeMasterId
                );
                return new List<int>();
            }

            var assignedSubordinates = await _db.GoalAssignments
                .Where(ga =>
                    ga.GoalId == goalId &&
                    subordinateMasterIds.Contains(ga.AssignedTo ?? 0)
                )
                .Select(ga => ga.AssignedTo ?? 0)
                .Where(id => id != 0)
                .Distinct()
                .ToListAsync();

            Log.Information(
                "GetSubordinatesAssignedToGoal END | GoalId={GoalId} | ManagerId={ManagerId} | Count={Count}",
                goalId,
                managerEmployeeMasterId,
                assignedSubordinates.Count
            );

            return assignedSubordinates;
        }

        public async Task<List<GoalChecklist>> GetUserOwnChecklistItems(int goalId, int userId)
        {
            Log.Information(
                "GetUserOwnChecklistItems START | GoalId={GoalId} | UserId={UserId}",
                goalId,
                userId
            );

            var result = await _db.GoalChecklists
                .Include(c => c.Goalchecklistprogresses)
                .Where(c =>
                    c.GoalId == goalId &&
                    c.AddedFor == userId
                )
                .ToListAsync();

            Log.Information(
                "GetUserOwnChecklistItems END | GoalId={GoalId} | UserId={UserId} | Count={Count}",
                goalId,
                userId,
                result.Count
            );

            return result;
        }

        public async Task<int> CountUserOwnCompletedItems(int goalId, int userId)
        {
            Log.Information(
                "CountUserOwnCompletedItems START | GoalId={GoalId} | UserId={UserId}",
                goalId,
                userId
            );

            var userItems = await GetUserOwnChecklistItems(goalId, userId);

            if (!userItems.Any())
            {
                Log.Information(
                    "CountUserOwnCompletedItems END | No user items found | GoalId={GoalId} | UserId={UserId}",
                    goalId,
                    userId
                );
                return 0;
            }

            var checklistIds = userItems.Select(c => c.ChecklistId).ToList();

            var result = await _db.Goalchecklistprogresses
                .Where(p =>
                    checklistIds.Contains(p.ChecklistId) &&
                    p.UserId == userId &&
                    p.IsCompleted == true
                )
                .CountAsync();

            Log.Information(
                "CountUserOwnCompletedItems END | GoalId={GoalId} | UserId={UserId} | Completed={Count}",
                goalId,
                userId,
                result
            );

            return result;
        }
    }
}