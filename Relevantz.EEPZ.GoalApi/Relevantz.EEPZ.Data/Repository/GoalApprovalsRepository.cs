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
    public class GoalApprovalsRepository : IGoalApprovalsRepository
    {
        private readonly EEPZDbContext _db;
        private readonly IWebHostEnvironment environment;

        public GoalApprovalsRepository(EEPZDbContext db, IWebHostEnvironment _environment)
        {
            _db = db;
            environment = _environment;
        }

        public async Task AddApprovalAsync(GoalApproval approval)
        {
            await _db.GoalApprovals.AddAsync(approval);
        }

        public async Task<GoalApproval?> GetApprovalByIdAsync(int approvalId)
        {
            var result = await _db
                .GoalApprovals.Include(a => a.Goal)
                .ThenInclude(g => g.GoalAttachments)
                .FirstOrDefaultAsync(a => a.ApprovalId == approvalId);

            return result;
        }

        public async Task<GoalApproval?> GetPendingApprovalByGoalAndTypeAsync(
            int goalId,
            string approvalType
        )
        {
            var result = await _db
                .GoalApprovals.Where(a =>
                    a.GoalId == goalId
                    && a.ApprovalType == approvalType
                    && a.ApprovalStatus == APPROVAL_STATUS.PENDING
                )
                .FirstOrDefaultAsync();

            return result;
        }

        public async Task<List<GoalApproval>> GetPendingApprovalsForApproverAsync(
            int approverEmployeeMasterId
        )
        {
            var result = await _db
                .GoalApprovals.Include(a => a.Goal)
                .ThenInclude(g => g.GoalAttachments)
                .Where(a =>
                    a.ApprovedBy == approverEmployeeMasterId && a.ApprovalStatus == "pending"
                )
                .OrderByDescending(a => a.RequestedOn)
                .ToListAsync();

            return result;
        }

        public Task UpdateApprovalAsync(GoalApproval approval)
        {
            _db.GoalApprovals.Update(approval);
            return Task.CompletedTask;
        }

        public async Task<int> CountPendingApprovalsForUserAsync(int employeeMasterId)
        {
            var result = await _db.GoalApprovals.CountAsync(a =>
                a.ApprovedBy == employeeMasterId && a.ApprovalStatus == APPROVAL_STATUS.PENDING
            );

            return result;
        }

        public async Task<List<GoalApproval>> GetAllApprovalsForUserAsync(
            int userId,
            string userRole
        )
        {
            var query = _db
                .GoalApprovals.Include(ga => ga.Goal)
                .ThenInclude(g => g.GoalAssignments)
                .Include(ga => ga.Goal)
                .ThenInclude(g => g.GoalAttachments)
                .AsQueryable();

            query = query.Where(ga =>
                ga.RequestedBy == userId
                || ga.ApprovedBy == userId
                || ga.Goal.CreatedBy == userId
                || ga.Goal.GoalAssignments.Any(assignment => assignment.AssignedTo == userId)
                || (
                    ga.ApprovalStatus == APPROVAL_STATUS.PENDING
                    && CanUserApproveType(ga.ApprovalType, userRole)
                )
            );

            var result = await query.OrderByDescending(ga => ga.RequestedOn).ToListAsync();

            return result;
        }

        public IQueryable<GoalApproval> GetGoalApprovalsQueryable()
        {
            return _db
                .GoalApprovals.Include(ga => ga.Goal)
                .ThenInclude(g => g.GoalAssignments)
                .Include(ga => ga.Goal)
                .ThenInclude(g => g.GoalAttachments)
                .AsQueryable();
        }

        public async Task<int> CountAsync<T>(IQueryable<T> query)
        {
            var result = await query.CountAsync();

            return result;
        }

        public async Task<List<T>> GetPagedAsync<T>(IQueryable<T> query, int page, int pageSize)
        {
            var result = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

            return result;
        }

        private bool CanUserApproveType(string approvalType, string userRole)
        {
            return approvalType switch
            {
                APPROVAL_TYPE.CREATION or APPROVAL_TYPE.SELF_GOAL_ACTIVATION =>
                    USER_ROLE.APPROVAL_AUTHORITIES.Contains(userRole),

                APPROVAL_TYPE.COMPLETION
                or APPROVAL_TYPE.TASK_ACKNOWLEDGMENT
                or APPROVAL_TYPE.CLOSURE
                or APPROVAL_TYPE.REACTIVATION => USER_ROLE.APPROVAL_AUTHORITIES.Contains(userRole),

                APPROVAL_TYPE.REOPENING => USER_ROLE.APPROVAL_AUTHORITIES.Contains(userRole),

                APPROVAL_TYPE.DELEGATION => new[]
                {
                    USER_ROLE.DEPARTMENT_HEAD,
                    USER_ROLE.LEADERSHIP,
                }.Contains(userRole),

                _ => false,
            };
        }
    }
}
