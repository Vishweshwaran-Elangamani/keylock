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
    public class BaseGoalRepository : IBaseGoalRepository
    {
        private readonly EEPZDbContext _db;
        private readonly IWebHostEnvironment environment;

        public BaseGoalRepository(EEPZDbContext db, IWebHostEnvironment _environment)
        {
            _db = db;
            environment = _environment;
        }

        public async Task<Employeedetailsmaster?> GetEmployeeDetailsByMasterIdAsync(
            int employeeMasterId
        )
        {
            var result = await _db
                .Employeedetailsmasters.Include(e => e.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(e => e.Role)
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.EmployeeMasterId == employeeMasterId);

            return result;
        }

        public async Task<Goal?> GetGoalByIdAsync(int goalId)
        {
            var result = await _db
                .Goals.Include(g => g.GoalChecklists)
                .ThenInclude(c => c.Goalchecklistprogresses)
                .Include(g => g.GoalAssignments)
                .Include(g => g.GoalApprovals)
                .Include(g => g.GoalAttachments)
                .Include(g => g.GoalComments)
                .Include(g => g.Goalprogresslogs)
                .FirstOrDefaultAsync(g => g.GoalId == goalId);

            return result;
        }

        public async Task<int?> GetReportingManagerEmployeeMasterIdAsync(int employeeMasterId)
        {
            var employee = await _db
                .Employeedetailsmasters.Include(edm => edm.Employee)
                .FirstOrDefaultAsync(edm => edm.EmployeeMasterId == employeeMasterId);

            if (employee?.Employee?.ReportingManagerEmployeeId == null)
            {
                return null;
            }

            var managerEdm = await _db.Employeedetailsmasters.FirstOrDefaultAsync(edm =>
                edm.EmployeeId == employee.Employee.ReportingManagerEmployeeId
            );

            return managerEdm?.EmployeeMasterId;
        }

        public async Task<bool> IsGoalParticipantAsync(int goalId, int employeeMasterId)
        {
            var goal = await _db
                .Goals.Include(g => g.GoalAssignments)
                .FirstOrDefaultAsync(g => g.GoalId == goalId);

            if (goal == null)
            {
                return false;
            }

            var result =
                goal.CreatedBy == employeeMasterId
                || goal.GoalAssignments.Any(a => a.AssignedTo == employeeMasterId);

            return result;
        }

        public async Task<Goalprogresslog?> GetLatestProgressLogAsync(int goalId)
        {
            var result = await _db
                .Goalprogresslogs.Where(p => p.GoalId == goalId)
                .OrderByDescending(p => p.UpdatedOn)
                .FirstOrDefaultAsync();

            return result;
        }

        public async Task<int> CountCompletedForUserAsync(int goalId, int userEmployeeMasterId)
        {
            var result = await _db
                .Goalchecklistprogresses.Where(p =>
                    p.IsCompleted == true
                    && p.UserId == userEmployeeMasterId
                    && _db.GoalChecklists.Any(c =>
                        c.ChecklistId == p.ChecklistId && c.GoalId == goalId
                    )
                )
                .CountAsync();

            return result;
        }

        public async Task<int> CountTotalForUserAsync(int goalId, int userEmployeeMasterId)
        {
            var result = await _db
                .GoalChecklists.Where(c => c.GoalId == goalId && c.AddedFor == userEmployeeMasterId)
                .CountAsync();

            return result;
        }

        public async Task<string?> GetUserRoleAsync(int employeeMasterId)
        {
            var edm = await _db
                .Employeedetailsmasters.Include(edm => edm.Role)
                .FirstOrDefaultAsync(edm => edm.EmployeeMasterId == employeeMasterId);

            var roleName = edm?.Role?.RoleName;

            return roleName;
        }

        public async Task<bool> IsUserAssignedToGoalAsync(int goalId, int employeeMasterId)
        {
            var result = await _db.GoalAssignments.AnyAsync(a =>
                a.GoalId == goalId && a.AssignedTo == employeeMasterId
            );

            return result;
        }

        public async Task<bool> IsEmployeeInDepartmentAsync(int goalId, int departmentId)
        {
            var goal = await _db
                .Goals.Include(g => g.GoalAssignments)
                .FirstOrDefaultAsync(g => g.GoalId == goalId);

            if (goal == null)
                return false;

            var assigneeIds = goal
                .GoalAssignments.Where(a => a.AssignedTo.HasValue)
                .Select(a => a.AssignedTo.Value)
                .ToList();

            var isInDept = await _db.Employeedetailsmasters.AnyAsync(e =>
                e.DepartmentId == departmentId && assigneeIds.Contains(e.EmployeeMasterId)
            );

            return isInDept;
        }

        public async Task<List<GoalAssignment>> GetAssigneesAsync(int goalId)
        {
            var result = await _db.GoalAssignments.Where(a => a.GoalId == goalId).ToListAsync();

            return result;
        }

        public async Task<bool> CanUserCommentOnGoalAsync(
            int goalId,
            int employeeMasterId,
            string role
        )
        {
            var goal = await _db.Goals.AsNoTracking().FirstOrDefaultAsync(g => g.GoalId == goalId);

            if (goal == null)
                return false;

            if (goal.CreatedBy == employeeMasterId)
                return true;

            var isAssignee = await _db
                .GoalAssignments.AsNoTracking()
                .AnyAsync(a => a.GoalId == goalId && a.AssignedTo == employeeMasterId);

            if (isAssignee)
                return true;

            var isDeptHeadOrManager =
                role == USER_ROLE.DEPARTMENT_HEAD || role == USER_ROLE.MANAGER;
            var isTeamGoal = goal.GoalType == GOAL_TYPE.TEAM;

            if (isDeptHeadOrManager && isTeamGoal)
            {
                return true;
            }

            return false;
        }

        public async Task<bool> IsGoalCommentableAsync(int goalId)
        {
            var goal = await _db.Goals.AsNoTracking().FirstOrDefaultAsync(g => g.GoalId == goalId);

            if (goal == null)
                return false;

            var nonCommentableStatuses = new[] { "completed", "closed", "cancelled" };
            var isCommentable = !nonCommentableStatuses.Contains(goal.Goalstatus?.ToLower() ?? "");

            return isCommentable;
        }

        public async Task<List<GoalChecklist>> GetChecklistItemsByGoalIdAsync(int goalId)
        {
            var result = await _db
                .GoalChecklists.Where(x => x.GoalId == goalId)
                .Include(x => x.Goalchecklistprogresses)
                .ToListAsync();

            return result;
        }

        public async Task<bool> ChecklistHasProgressAsync(int checklistId, int userId)
        {
            var result = await _db.Goalchecklistprogresses.AnyAsync(x =>
                x.ChecklistId == checklistId && x.UserId == userId && x.IsCompleted == true
            );

            return result;
        }

        public async Task<Project?> GetProjectByIdAsync(int projectId)
        {
            var result = await _db.Projects.FirstOrDefaultAsync(p => p.ProjectId == projectId);

            return result;
        }

        public async Task<bool> HasPendingApprovalAsync(int goalId, int userId)
        {
            var result = await _db.GoalApprovals.AnyAsync(a =>
                a.GoalId == goalId
                && a.RequestedBy == userId
                && a.ApprovalStatus == APPROVAL_STATUS.PENDING
                && (
                    a.ApprovalType == APPROVAL_TYPE.COMPLETION
                    || a.ApprovalType == APPROVAL_TYPE.TASK_ACKNOWLEDGMENT
                )
            );

            return result;
        }

        public async Task<GoalAssignment> GetGoalAssignmentAsync(int goalId, int assignedTo)
        {
            var result = await _db.GoalAssignments.FirstOrDefaultAsync(ga =>
                ga.GoalId == goalId && ga.AssignedTo == assignedTo
            );

            return result;
        }

        public async Task<List<int>> GetSubordinateEmployeeMasterIdsAsync(
            int managerEmployeeMasterId
        )
        {
            var managerEdm = await _db
                .Employeedetailsmasters.Include(edm => edm.Employee)
                .FirstOrDefaultAsync(edm => edm.EmployeeMasterId == managerEmployeeMasterId);

            if (managerEdm == null)
            {
                return new List<int>();
            }

            var subordinates = await _db
                .Employees.Where(e => e.ReportingManagerEmployeeId == managerEdm.EmployeeId)
                .Select(e => e.EmployeeId)
                .ToListAsync();

            var subordinateMasterIds = await _db
                .Employeedetailsmasters.Where(edm => subordinates.Contains(edm.EmployeeId))
                .Select(edm => edm.EmployeeMasterId)
                .ToListAsync();

            return subordinateMasterIds;
        }

        public async Task SaveChangesAsync()
        {
            await _db.SaveChangesAsync();
        }
    }
}
