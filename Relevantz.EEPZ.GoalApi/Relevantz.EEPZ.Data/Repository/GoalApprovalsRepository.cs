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
    public class GoalApprovalsRepository : IGoalApprovalsRepository
    {
        private readonly EEPZDbContext _db;
        private readonly IWebHostEnvironment environment;

        public GoalApprovalsRepository(EEPZDbContext db, IWebHostEnvironment _environment)
        {
            _db = db;
            environment = _environment;

            Log.Debug("GoalApprovalsRepository initialized.");
        }

        public async Task AddApproval(GoalApproval approval)
        {
            Log.Information("AddApproval START | GoalId={GoalId} | Type={Type} | RequestedBy={RequestedBy}",
                approval?.GoalId, approval?.ApprovalType, approval?.RequestedBy);

            await _db.GoalApprovals.AddAsync(approval);

            Log.Information("AddApproval END | Approval added (not saved yet)");
        }

        public async Task<GoalApproval?> GetApprovalById(int approvalId)
        {
            Log.Information("GetApprovalById START | ApprovalId={ApprovalId}", approvalId);

            var result = await _db.GoalApprovals
                .Include(a => a.Goal)
                .ThenInclude(g => g.GoalAttachments)
                .FirstOrDefaultAsync(a => a.ApprovalId == approvalId);

            Log.Information("GetApprovalById END | ApprovalId={ApprovalId} | Found={Found}",
                approvalId, result != null);

            return result;
        }

        public async Task<GoalApproval?> GetPendingApprovalByGoalAndType(int goalId, string approvalType)
        {
            Log.Information("GetPendingApprovalByGoalAndType START | GoalId={GoalId} | Type={Type}",
                goalId, approvalType);

            var result = await _db.GoalApprovals
                .Where(a =>
                    a.GoalId == goalId &&
                    a.ApprovalType == approvalType &&
                    a.ApprovalStatus == APPROVAL_STATUS.PENDING
                )
                .FirstOrDefaultAsync();

            Log.Information(
                "GetPendingApprovalByGoalAndType END | GoalId={GoalId} | Type={Type} | Found={Found}",
                goalId, approvalType, result != null);

            return result;
        }

        public async Task<List<GoalApproval>> GetPendingApprovalsForApprover(int approverEmployeeMasterId)
        {
            Log.Information(
                "GetPendingApprovalsForApprover START | ApproverId={ApproverId}",
                approverEmployeeMasterId);

            var result = await _db.GoalApprovals
                .Include(a => a.Goal)
                .ThenInclude(g => g.GoalAttachments)
                .Where(a =>
                    a.ApprovedBy == approverEmployeeMasterId &&
                    a.ApprovalStatus == "pending"
                )
                .OrderByDescending(a => a.RequestedOn)
                .ToListAsync();

            Log.Information(
                "GetPendingApprovalsForApprover END | ApproverId={ApproverId} | Count={Count}",
                approverEmployeeMasterId, result.Count);

            return result;
        }

        public Task UpdateApproval(GoalApproval approval)
        {
            Log.Information(
                "UpdateApproval | ApprovalId={ApprovalId} | NewStatus={Status}",
                approval?.ApprovalId, approval?.ApprovalStatus);

            _db.GoalApprovals.Update(approval);
            return Task.CompletedTask;
        }

        public async Task<int> CountPendingApprovalsForUser(int employeeMasterId)
        {
            Log.Information("CountPendingApprovalsForUser START | UserId={UserId}", employeeMasterId);

            var result = await _db.GoalApprovals
                .CountAsync(a =>
                    a.ApprovedBy == employeeMasterId &&
                    a.ApprovalStatus == APPROVAL_STATUS.PENDING);

            Log.Information(
                "CountPendingApprovalsForUser END | UserId={UserId} | Pending={Count}",
                employeeMasterId, result);

            return result;
        }

        public async Task<List<GoalApproval>> GetAllApprovalsForUser(int userId, string userRole)
        {
            Log.Information(
                "GetAllApprovalsForUser START | UserId={UserId} | Role={Role}",
                userId, userRole);

            var query = _db.GoalApprovals
                .Include(ga => ga.Goal)
                .ThenInclude(g => g.GoalAssignments)
                .Include(ga => ga.Goal)
                .ThenInclude(g => g.GoalAttachments)
                .AsQueryable();

            query = query.Where(ga =>
                ga.RequestedBy == userId ||
                ga.ApprovedBy == userId ||
                ga.Goal.CreatedBy == userId ||
                ga.Goal.GoalAssignments.Any(a => a.AssignedTo == userId) ||
                (ga.ApprovalStatus == APPROVAL_STATUS.PENDING &&
                 CanUserApproveType(ga.ApprovalType, userRole))
            );

            var result = await query.OrderByDescending(ga => ga.RequestedOn).ToListAsync();

            Log.Information(
                "GetAllApprovalsForUser END | UserId={UserId} | Returned={Count}",
                userId, result.Count);

            return result;
        }

        public IQueryable<GoalApproval> GetGoalApprovalsQueryable()
        {
            Log.Debug("GetGoalApprovalsQueryable CALLED");

            return _db.GoalApprovals
                .Include(ga => ga.Goal)
                .ThenInclude(g => g.GoalAssignments)
                .Include(ga => ga.Goal)
                .ThenInclude(g => g.GoalAttachments)
                .AsQueryable();
        }

        public async Task<int> Count<T>(IQueryable<T> query)
        {
            Log.Debug("Count<T> START");

            var result = await query.CountAsync();

            Log.Debug("Count<T> END | Result={Count}", result);

            return result;
        }

        public async Task<List<T>> GetPaged<T>(IQueryable<T> query, int page, int pageSize)
        {
            Log.Debug(
                "GetPaged START | Page={Page} | PageSize={PageSize}",
                page, pageSize);

            var result = await query.Skip((page - 1) * pageSize)
                                    .Take(pageSize)
                                    .ToListAsync();

            Log.Debug(
                "GetPaged END | Page={Page} | Retrieved={Count}",
                page, result.Count);

            return result;
        }

        private bool CanUserApproveType(string approvalType, string userRole)
        {
            
            return approvalType switch
            {
                APPROVAL_TYPE.CREATION or APPROVAL_TYPE.SELF_GOAL_ACTIVATION
                    => USER_ROLE.APPROVAL_AUTHORITIES.Contains(userRole),

                APPROVAL_TYPE.COMPLETION
                or APPROVAL_TYPE.TASK_ACKNOWLEDGMENT
                or APPROVAL_TYPE.CLOSURE
                or APPROVAL_TYPE.REACTIVATION
                    => USER_ROLE.APPROVAL_AUTHORITIES.Contains(userRole),

                APPROVAL_TYPE.REOPENING
                    => USER_ROLE.APPROVAL_AUTHORITIES.Contains(userRole),

                APPROVAL_TYPE.DELEGATION
                    => new[] { USER_ROLE.DEPARTMENT_HEAD, USER_ROLE.LEADERSHIP }
                        .Contains(userRole),

                _ => false,
            };
        }
    }
}