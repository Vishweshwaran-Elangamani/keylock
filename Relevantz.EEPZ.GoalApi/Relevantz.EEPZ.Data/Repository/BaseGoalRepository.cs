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
    public class BaseGoalRepository : IBaseGoalRepository
    {
        private readonly EEPZDbContext _db;
        private readonly IWebHostEnvironment environment;

        public BaseGoalRepository(EEPZDbContext db, IWebHostEnvironment _environment)
        {
            _db = db;
            environment = _environment;

            Log.Debug("BaseGoalRepository initialized.");
        }

        public async Task<Employeedetailsmaster?> GetEmployeeDetailsByMasterId(int employeeMasterId)
        {
            Log.Debug("GetEmployeeDetailsByMasterId START | EmployeeMasterId={Id}", employeeMasterId);

            var result = await _db.Employeedetailsmasters
                .Include(e => e.Employee)
                .ThenInclude(e => e.Userprofile)
                .Include(e => e.Role)
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.EmployeeMasterId == employeeMasterId);

            Log.Debug("GetEmployeeDetailsByMasterId END | EmployeeMasterId={Id} | Found={Found}",
                employeeMasterId,
                result != null);

            return result;
        }

        public async Task<Goal?> GetGoalById(int goalId)
        {
            Log.Debug("GetGoalById START | GoalId={GoalId}", goalId);

            var result = await _db.Goals
                .Include(g => g.GoalChecklists)
                    .ThenInclude(c => c.Goalchecklistprogresses)
                .Include(g => g.GoalAssignments)
                .Include(g => g.GoalApprovals)
                .Include(g => g.GoalAttachments)
                .Include(g => g.GoalComments)
                .Include(g => g.Goalprogresslogs)
                .FirstOrDefaultAsync(g => g.GoalId == goalId);

            Log.Debug("GetGoalById END | GoalId={GoalId} | Found={Found}", goalId, result != null);

            return result;
        }

        public async Task<int?> GetReportingManagerEmployeeMasterId(int employeeMasterId)
        {
            Log.Debug("GetReportingManagerEmployeeMasterId START | EmployeeMasterId={Id}", employeeMasterId);

            var employee = await _db.Employeedetailsmasters
                .Include(edm => edm.Employee)
                .FirstOrDefaultAsync(edm => edm.EmployeeMasterId == employeeMasterId);

            if (employee?.Employee?.ReportingManagerEmployeeId == null)
            {
                Log.Debug("GetReportingManagerEmployeeMasterId | No manager assigned | EmpMasterId={Id}",
                    employeeMasterId);
                return null;
            }

            var managerEdm = await _db.Employeedetailsmasters
                .FirstOrDefaultAsync(edm => edm.EmployeeId == employee.Employee.ReportingManagerEmployeeId);

            Log.Debug("GetReportingManagerEmployeeMasterId END | EmployeeMasterId={Emp} | ManagerMasterId={Mgr}",
                employeeMasterId,
                managerEdm?.EmployeeMasterId);

            return managerEdm?.EmployeeMasterId;
        }

        public async Task<bool> IsGoalParticipant(int goalId, int employeeMasterId)
        {
            Log.Debug("IsGoalParticipant START | GoalId={GoalId} | UserId={UserId}", goalId, employeeMasterId);

            var goal = await _db.Goals
                .Include(g => g.GoalAssignments)
                .FirstOrDefaultAsync(g => g.GoalId == goalId);

            if (goal == null)
            {
                Log.Debug("IsGoalParticipant | Goal not found | GoalId={GoalId}", goalId);
                return false;
            }

            var result = goal.CreatedBy == employeeMasterId ||
                         goal.GoalAssignments.Any(a => a.AssignedTo == employeeMasterId);

            Log.Debug("IsGoalParticipant END | GoalId={GoalId} | UserId={UserId} | Result={Result}",
                goalId, employeeMasterId, result);

            return result;
        }

        public async Task<Goalprogresslog?> GetLatestProgressLog(int goalId)
        {
            Log.Debug("GetLatestProgressLog START | GoalId={GoalId}", goalId);

            var result = await _db.Goalprogresslogs
                .Where(p => p.GoalId == goalId)
                .OrderByDescending(p => p.UpdatedOn)
                .FirstOrDefaultAsync();

            Log.Debug("GetLatestProgressLog END | GoalId={GoalId} | LogFound={Found}",
                goalId, result != null);

            return result;
        }

        public async Task<int> CountCompletedForUser(int goalId, int userEmployeeMasterId)
        {
            Log.Debug("CountCompletedForUser START | GoalId={GoalId} | UserId={UserId}",
                goalId, userEmployeeMasterId);

            var result = await _db.Goalchecklistprogresses
                .Where(p =>
                    p.IsCompleted == true &&
                    p.UserId == userEmployeeMasterId &&
                    _db.GoalChecklists.Any(c =>
                        c.ChecklistId == p.ChecklistId && c.GoalId == goalId))
                .CountAsync();

            Log.Debug("CountCompletedForUser END | GoalId={GoalId} | UserId={UserId} | Completed={Count}",
                goalId, userEmployeeMasterId, result);

            return result;
        }

        public async Task<int> CountTotalForUser(int goalId, int userEmployeeMasterId)
        {
            Log.Debug("CountTotalForUser START | GoalId={GoalId} | UserId={UserId}",
                goalId, userEmployeeMasterId);

            var result = await _db.GoalChecklists
                .Where(c => c.GoalId == goalId && c.AddedFor == userEmployeeMasterId)
                .CountAsync();

            Log.Debug("CountTotalForUser END | GoalId={GoalId} | UserId={UserId} | Total={Count}",
                goalId, userEmployeeMasterId, result);

            return result;
        }

        public async Task<string?> GetUserRole(int employeeMasterId)
        {
            Log.Debug("GetUserRole START | EmployeeMasterId={Id}", employeeMasterId);

            var edm = await _db.Employeedetailsmasters
                .Include(edm => edm.Role)
                .FirstOrDefaultAsync(edm => edm.EmployeeMasterId == employeeMasterId);

            Log.Debug("GetUserRole END | EmployeeMasterId={Id} | Role={Role}",
                employeeMasterId,
                edm?.Role?.RoleName);

            return edm?.Role?.RoleName;
        }

        public async Task<bool> IsUserAssignedToGoal(int goalId, int employeeMasterId)
        {
            Log.Debug("IsUserAssignedToGoal START | GoalId={GoalId} | UserId={UserId}",
                goalId, employeeMasterId);

            var result = await _db.GoalAssignments
                .AnyAsync(a => a.GoalId == goalId && a.AssignedTo == employeeMasterId);

            Log.Debug("IsUserAssignedToGoal END | GoalId={GoalId} | UserId={UserId} | Result={Result}",
                goalId, employeeMasterId, result);

            return result;
        }

        public async Task<bool> IsEmployeeInDepartment(int goalId, int departmentId)
        {
            Log.Debug("IsEmployeeInDepartment START | GoalId={GoalId} | DeptId={DeptId}",
                goalId, departmentId);

            var goal = await _db.Goals
                .Include(g => g.GoalAssignments)
                .FirstOrDefaultAsync(g => g.GoalId == goalId);

            if (goal == null)
            {
                Log.Debug("IsEmployeeInDepartment | Goal not found | GoalId={GoalId}", goalId);
                return false;
            }

            var assigneeIds = goal.GoalAssignments
                .Where(a => a.AssignedTo.HasValue)
                .Select(a => a.AssignedTo.Value)
                .ToList();

            var isInDept = await _db.Employeedetailsmasters
                .AnyAsync(e => e.DepartmentId == departmentId &&
                               assigneeIds.Contains(e.EmployeeMasterId));

            Log.Debug("IsEmployeeInDepartment END | GoalId={GoalId} | DeptId={DeptId} | Result={Result}",
                goalId, departmentId, isInDept);

            return isInDept;
        }

        public async Task<List<GoalAssignment>> GetAssignees(int goalId)
        {
            Log.Debug("GetAssignees START | GoalId={GoalId}", goalId);

            var result = await _db.GoalAssignments
                .Where(a => a.GoalId == goalId)
                .ToListAsync();

            Log.Debug("GetAssignees END | GoalId={GoalId} | Count={Count}",
                goalId, result.Count);

            return result;
        }

        public async Task<bool> CanUserCommentOnGoal(
            int goalId,
            int employeeMasterId,
            string role
        )
        {
            Log.Debug(
                "CanUserCommentOnGoal START | GoalId={GoalId} | UserId={UserId} | Role={Role}",
                goalId, employeeMasterId, role);

            var goal = await _db.Goals.AsNoTracking()
                .FirstOrDefaultAsync(g => g.GoalId == goalId);

            if (goal == null)
            {
                Log.Debug("CanUserCommentOnGoal | Goal not found | GoalId={GoalId}", goalId);
                return false;
            }

            if (goal.CreatedBy == employeeMasterId)
                return true;

            var isAssignee = await _db
                .GoalAssignments.AsNoTracking()
                .AnyAsync(a => a.GoalId == goalId && a.AssignedTo == employeeMasterId);

            if (isAssignee)
                return true;

            var allowed =
                (role == USER_ROLE.DEPARTMENT_HEAD || role == USER_ROLE.MANAGER) &&
                goal.GoalType == GOAL_TYPE.TEAM;

            Log.Debug(
                "CanUserCommentOnGoal END | GoalId={GoalId} | UserId={UserId} | Allowed={Allowed}",
                goalId, employeeMasterId, allowed);

            return allowed;
        }

        public async Task<bool> IsGoalCommentable(int goalId)
        {
            Log.Debug("IsGoalCommentable START | GoalId={GoalId}", goalId);

            var goal = await _db.Goals.AsNoTracking()
                .FirstOrDefaultAsync(g => g.GoalId == goalId);

            var nonCommentableStatuses = new[] { "completed", "closed", "cancelled" };
            var isCommentable = goal != null &&
                                !nonCommentableStatuses.Contains(goal.Goalstatus?.ToLower() ?? "");

            Log.Debug(
                "IsGoalCommentable END | GoalId={GoalId} | IsCommentable={Commentable}",
                goalId, isCommentable);

            return isCommentable;
        }

        public async Task<List<GoalChecklist>> GetChecklistItemsByGoalId(int goalId)
        {
            Log.Debug("GetChecklistItemsByGoalId START | GoalId={GoalId}", goalId);

            var result = await _db.GoalChecklists
                .Where(x => x.GoalId == goalId)
                .Include(x => x.Goalchecklistprogresses)
                .ToListAsync();

            Log.Debug("GetChecklistItemsByGoalId END | GoalId={GoalId} | Count={Count}", goalId, result.Count);

            return result;
        }

        public async Task<bool> ChecklistHasProgress(int checklistId, int userId)
        {
            Log.Debug(
                "ChecklistHasProgress START | ChecklistId={ChecklistId} | UserId={UserId}",
                checklistId, userId);

            var result = await _db.Goalchecklistprogresses
                .AnyAsync(x =>
                    x.ChecklistId == checklistId &&
                    x.UserId == userId &&
                    x.IsCompleted == true);

            Log.Debug(
                "ChecklistHasProgress END | ChecklistId={ChecklistId} | UserId={UserId} | Result={Result}",
                checklistId, userId, result);

            return result;
        }

        public async Task<Project?> GetProjectById(int projectId)
        {
            Log.Debug("GetProjectById START | ProjectId={ProjectId}", projectId);

            var result = await _db.Projects
                .FirstOrDefaultAsync(p => p.ProjectId == projectId);

            Log.Debug("GetProjectById END | ProjectId={ProjectId} | Found={Found}", projectId, result != null);

            return result;
        }

        public async Task<bool> HasPendingApproval(int goalId, int userId)
        {
            Log.Debug(
                "HasPendingApproval START | GoalId={GoalId} | UserId={UserId}",
                goalId, userId);

            var result = await _db.GoalApprovals
                .AnyAsync(a =>
                    a.GoalId == goalId &&
                    a.RequestedBy == userId &&
                    a.ApprovalStatus == APPROVAL_STATUS.PENDING &&
                    (a.ApprovalType == APPROVAL_TYPE.COMPLETION ||
                     a.ApprovalType == APPROVAL_TYPE.TASK_ACKNOWLEDGMENT));

            Log.Debug("HasPendingApproval END | GoalId={GoalId} | UserId={UserId} | Result={Result}",
                goalId, userId, result);

            return result;
        }

        public async Task<GoalAssignment?> GetGoalAssignment(int goalId, int assignedTo)
        {
            Log.Debug(
                "GetGoalAssignment START | GoalId={GoalId} | AssignedTo={AssignedTo}",
                goalId, assignedTo);

            var result = await _db.GoalAssignments
                .FirstOrDefaultAsync(ga =>
                    ga.GoalId == goalId &&
                    ga.AssignedTo == assignedTo);

            Log.Debug(
                "GetGoalAssignment END | GoalId={GoalId} | AssignedTo={AssignedTo} | Found={Found}",
                goalId, assignedTo, result != null);

            return result;
        }

        public async Task<List<int>> GetSubordinateEmployeeMasterIds(int managerEmployeeMasterId)
        {
            Log.Debug(
                "GetSubordinateEmployeeMasterIds START | ManagerId={ManagerId}",
                managerEmployeeMasterId);

            var managerEdm = await _db.Employeedetailsmasters
                .Include(edm => edm.Employee)
                .FirstOrDefaultAsync(edm => edm.EmployeeMasterId == managerEmployeeMasterId);

            if (managerEdm == null)
            {
                Log.Debug("GetSubordinateEmployeeMasterIds | Manager not found | ManagerId={Id}",
                    managerEmployeeMasterId);
                return new List<int>();
            }

            var subordinates = await _db.Employees
                .Where(e => e.ReportingManagerEmployeeId == managerEdm.EmployeeId)
                .Select(e => e.EmployeeId)
                .ToListAsync();

            var subordinateMasterIds = await _db.Employeedetailsmasters
                .Where(edm => subordinates.Contains(edm.EmployeeId))
                .Select(edm => edm.EmployeeMasterId)
                .ToListAsync();

            Log.Debug(
                "GetSubordinateEmployeeMasterIds END | ManagerId={ManagerId} | Count={Count}",
                managerEmployeeMasterId, subordinateMasterIds.Count);

            return subordinateMasterIds;
        }

        public async Task SaveChanges()
        {
            Log.Debug("SaveChanges START");
            await _db.SaveChangesAsync();
            Log.Debug("SaveChanges END");
        }
    }
}