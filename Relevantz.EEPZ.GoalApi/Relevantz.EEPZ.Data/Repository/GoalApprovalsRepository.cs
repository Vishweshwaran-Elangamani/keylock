using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Enums;
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
        }

        public async Task AddApprovalAsync(GoalApproval approval)
        {
            try
            {
                Log.Information(
                    "[AddApprovalAsync] Adding approval for goal {GoalId}, type {ApprovalType}",
                    approval.GoalId,
                    approval.ApprovalType
                );
                await _db.GoalApprovals.AddAsync(approval);
                Log.Information("[AddApprovalAsync] Approval added successfully");
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[AddApprovalAsync] Error adding approval");
                throw;
            }
        }

        public async Task<GoalApproval?> GetApprovalByIdAsync(int approvalId)
        {
            try
            {
                Log.Information(
                    "[GetApprovalByIdAsync] Fetching approval {ApprovalId}",
                    approvalId
                );
                var result = await _db
                    .GoalApprovals.Include(a => a.Goal)
                    .ThenInclude(g => g.GoalAttachments)
                    .FirstOrDefaultAsync(a => a.ApprovalId == approvalId);
                Log.Information("[GetApprovalByIdAsync] Approval found: {Found}", result != null);
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "[GetApprovalByIdAsync] Error fetching approval {ApprovalId}",
                    approvalId
                );
                throw;
            }
        }

        public async Task<GoalApproval?> GetPendingApprovalByGoalAndTypeAsync(
            int goalId,
            string approvalType
        )
        {
            try
            {
                Log.Information(
                    "[GetPendingApprovalByGoalAndTypeAsync] Fetching pending approval for goal {GoalId}, type {ApprovalType}",
                    goalId,
                    approvalType
                );
                var result = await _db
                    .GoalApprovals.Where(a =>
                        a.GoalId == goalId
                        && a.ApprovalType == approvalType
                        && a.ApprovalStatus == APPROVAL_STATUS.PENDING
                    )
                    .FirstOrDefaultAsync();
                Log.Information(
                    "[GetPendingApprovalByGoalAndTypeAsync] Pending approval found: {Found}",
                    result != null
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "[GetPendingApprovalByGoalAndTypeAsync] Error fetching pending approval"
                );
                throw;
            }
        }

        public async Task<List<GoalApproval>> GetPendingApprovalsForApproverAsync(
            int approverEmployeeMasterId
        )
        {
            try
            {
                Log.Information(
                    "[GetPendingApprovalsForApproverAsync] Fetching pending approvals for approver {ApproverID}",
                    approverEmployeeMasterId
                );
                var result = await _db
                    .GoalApprovals.Include(a => a.Goal)
                    .ThenInclude(g => g.GoalAttachments)
                    .Where(a =>
                        a.ApprovedBy == approverEmployeeMasterId && a.ApprovalStatus == "pending"
                    )
                    .OrderByDescending(a => a.RequestedOn)
                    .ToListAsync();
                Log.Information(
                    "[GetPendingApprovalsForApproverAsync] Found {Count} pending approvals",
                    result.Count
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "[GetPendingApprovalsForApproverAsync] Error fetching pending approvals"
                );
                throw;
            }
        }

        public Task UpdateApprovalAsync(GoalApproval approval)
        {
            try
            {
                Log.Information(
                    "[UpdateApprovalAsync] Updating approval {ApprovalId}, status: {Status}",
                    approval.ApprovalId,
                    approval.ApprovalStatus
                );
                _db.GoalApprovals.Update(approval);
                Log.Information("[UpdateApprovalAsync] Approval updated successfully");
                return Task.CompletedTask;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[UpdateApprovalAsync] Error updating approval");
                throw;
            }
        }

        public async Task<int> CountPendingApprovalsForUserAsync(int employeeMasterId)
        {
            try
            {
                Log.Information(
                    "[CountPendingApprovalsForUserAsync] Counting pending approvals for user {UserID}",
                    employeeMasterId
                );
                var result = await _db.GoalApprovals.CountAsync(a =>
                    a.ApprovedBy == employeeMasterId && a.ApprovalStatus == APPROVAL_STATUS.PENDING
                );
                Log.Information(
                    "[CountPendingApprovalsForUserAsync] Found {Count} pending approvals",
                    result
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "[CountPendingApprovalsForUserAsync] Error counting pending approvals"
                );
                throw;
            }
        }

        public async Task<List<GoalApproval>> GetAllApprovalsForUserAsync(
            int userId,
            string userRole
        )
        {
            try
            {
                Log.Information(
                    "[GetAllApprovalsForUserAsync] Fetching all approvals for user {UserID}, role {Role}",
                    userId,
                    userRole
                );
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
                Log.Information(
                    "[GetAllApprovalsForUserAsync] Found {Count} approvals",
                    result.Count
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetAllApprovalsForUserAsync] Error fetching approvals for user");
                throw;
            }
        }

        public IQueryable<GoalApproval> GetGoalApprovalsQueryable()
        {
            try
            {
                Log.Information("[GetGoalApprovalsQueryable] Creating queryable for approvals");
                return _db
                    .GoalApprovals.Include(ga => ga.Goal)
                    .ThenInclude(g => g.GoalAssignments)
                    .Include(ga => ga.Goal)
                    .ThenInclude(g => g.GoalAttachments)
                    .AsQueryable();
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetGoalApprovalsQueryable] Error creating queryable");
                throw;
            }
        }

        public async Task<int> CountAsync<T>(IQueryable<T> query)
        {
            try
            {
                Log.Information("[CountAsync] Counting query results");
                var result = await query.CountAsync();
                Log.Information("[CountAsync] Count: {Count}", result);
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[CountAsync] Error counting");
                throw;
            }
        }

        public async Task<List<T>> GetPagedAsync<T>(IQueryable<T> query, int page, int pageSize)
        {
            try
            {
                Log.Information(
                    "[GetPagedAsync] Fetching page {Page}, size {PageSize}",
                    page,
                    pageSize
                );
                var result = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
                Log.Information("[GetPagedAsync] Retrieved {Count} items", result.Count);
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetPagedAsync] Error fetching paged results");
                throw;
            }
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
