using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interface;

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
            var result = await _db
                .GoalChecklists.Include(c => c.Goalchecklistprogresses)
                .FirstOrDefaultAsync(c => c.ChecklistId == checklistId);

            return result;
        }

        public async Task<List<GoalApproval>> GetPendingApprovalsForGoalAndUserAsync(
            int goalId,
            int employeeMasterId,
            string[] approvalTypes
        )
        {
            var result = await _db
                .GoalApprovals.Where(a =>
                    a.GoalId == goalId
                    && a.RequestedBy == employeeMasterId
                    && a.ApprovalStatus == APPROVAL_STATUS.PENDING
                    && approvalTypes.Contains(a.ApprovalType)
                )
                .ToListAsync();

            return result;
        }

        public async Task SetChecklistProgressAsync(
            int checklistId,
            int userEmployeeMasterId,
            bool completed
        )
        {
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
            }
            else
            {
                existing.IsCompleted = completed;
                existing.CompletedOn = completed ? DateTime.UtcNow : null;
                _db.Goalchecklistprogresses.Update(existing);
            }
        }

        public async Task<Goalchecklistprogress?> GetChecklistProgressAsync(
            int checklistId,
            int userEmployeeMasterId
        )
        {
            var result = await _db.Goalchecklistprogresses.FirstOrDefaultAsync(p =>
                p.ChecklistId == checklistId && p.UserId == userEmployeeMasterId
            );

            return result;
        }

        public async Task AddProgressLogAsync(Goalprogresslog log)
        {
            await _db.Goalprogresslogs.AddAsync(log);
        }

        public async Task<List<int>> GetSubordinatesAssignedToGoalAsync(
            int goalId,
            int managerEmployeeMasterId
        )
        {
            var subordinateMasterIds = await _baseRepo.GetSubordinateEmployeeMasterIdsAsync(
                managerEmployeeMasterId
            );

            if (!subordinateMasterIds.Any())
            {
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

            return assignedSubordinates;
        }

        public async Task<List<GoalChecklist>> GetUserOwnChecklistItemsAsync(int goalId, int userId)
        {
            var result = await _db
                .GoalChecklists.Include(c => c.Goalchecklistprogresses)
                .Where(c => c.GoalId == goalId && c.AddedFor == userId)
                .ToListAsync();

            return result;
        }

        public async Task<int> CountUserOwnCompletedItemsAsync(int goalId, int userId)
        {
            var userItems = await GetUserOwnChecklistItemsAsync(goalId, userId);

            if (!userItems.Any())
            {
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

            return result;
        }
    }
}
