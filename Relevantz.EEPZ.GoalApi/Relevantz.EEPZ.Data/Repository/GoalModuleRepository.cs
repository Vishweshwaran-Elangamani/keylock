using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Enums;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interface;
using Microsoft.AspNetCore.Hosting;
using Serilog;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class GoalModuleRepository : IGoalModuleRepository
    {
        private readonly EEPZDbContext _db;
            private readonly IWebHostEnvironment environment;

     

    public GoalModuleRepository(EEPZDbContext db, IWebHostEnvironment _environment)
    {
            _db = db;
           environment = _environment;
    }

        // ==================== GOALS ====================
        public async Task<Goal?> GetGoalByIdAsync(int goalId)
        {
            try
            {
                Log.Information("[GetGoalByIdAsync] Fetching goal {GoalId}", goalId);
                var result = await _db
                    .Goals.Include(g => g.GoalChecklists)
                    .ThenInclude(c => c.Goalchecklistprogresses)
                    .Include(g => g.GoalAssignments)
                    .Include(g => g.GoalApprovals)
                    .Include(g => g.GoalAttachments)
                    .Include(g => g.GoalComments)
                    .Include(g => g.Goalprogresslogs)
                    .FirstOrDefaultAsync(g => g.GoalId == goalId);
                Log.Information("[GetGoalByIdAsync] Successfully fetched goal {GoalId}", goalId);
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetGoalByIdAsync] Error fetching goal {GoalId}", goalId);
                throw;
            }
        }

        public async Task<List<Goal>> QueryGoalsAsync(GoalQueryDto request)
        {
            try
            {
                Log.Information(
                    "[QueryGoalsAsync] Starting query - Type: {Type}, Status: {Status}, RequesterID: {RequesterID}, Role: {Role}, Page: {Page}",
                    request.Type,
                    request.Status,
                    request.CurrentUserEmpMasterID,
                    request.CurrentUserRole,
                    request.Page
                );

                var q = _db
                    .Goals.Include(g => g.GoalAssignments)
                    .Include(g => g.Goalprogresslogs)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(request.Type))
                    q = q.Where(g => g.GoalType == request.Type);

                // ROLE-BASED VISIBILITY LOGIC
                if (request.Type == GOAL_TYPE.TEAM)
                {
                    if (request.CurrentUserRole == USER_ROLE.LEADERSHIP)
                    {
                        Log.Information(
                            "[QueryGoalsAsync] Applying Leadership visibility - ALL team goals company-wide"
                        );

                        // Leadership sees ALL team goals across all departments
                        q = q.Where(g => g.GoalType == GOAL_TYPE.TEAM);
                    }
                    else if (request.CurrentUserRole == USER_ROLE.DEPARTMENT_HEAD)
                    {
                        Log.Information(
                            "[QueryGoalsAsync] Applying DeptHead visibility for team goals"
                        );

                        // Get dept head's department from EmployeeDetailsMasters table
                        var deptHead = await _db
                            .Employeedetailsmasters.AsNoTracking()
                            .FirstOrDefaultAsync(e =>
                                e.EmployeeMasterId == request.CurrentUserEmpMasterID
                            );

                        if (deptHead != null)
                        {
                            // DeptHeads see ALL team goals with assignees in their department
                            q = q.Where(g =>
                                g.CreatedBy == request.CurrentUserEmpMasterID
                                || g.GoalAssignments.Any(a =>
                                    a.AssignedTo == request.CurrentUserEmpMasterID
                                )
                                || (
                                    g.GoalType == GOAL_TYPE.TEAM
                                    && g.GoalAssignments.Any(a =>
                                        _db.Employeedetailsmasters.Where(e =>
                                                e.DepartmentId == deptHead.DepartmentId
                                            )
                                            .Select(e => e.EmployeeMasterId)
                                            .Contains(a.AssignedTo.Value)
                                    )
                                )
                            );
                        }
                        else
                        {
                            Log.Warning(
                                "[QueryGoalsAsync] DeptHead {ID} has no department assigned",
                                request.CurrentUserEmpMasterID
                            );
                            q = q.Where(g =>
                                g.CreatedBy == request.CurrentUserEmpMasterID
                                || g.GoalAssignments.Any(a =>
                                    a.AssignedTo == request.CurrentUserEmpMasterID
                                )
                            );
                        }
                    }
                    else if (request.CurrentUserRole == USER_ROLE.MANAGER)
                    {
                        Log.Information(
                            "[QueryGoalsAsync] Applying Manager visibility for team goals"
                        );

                        // Managers see their own + assigned + their subordinates' goals
                        var subordinates = await _db
                            .Employees.Where(e =>
                                e.ReportingManagerEmployeeId
                                == _db.Employees.Where(emp =>
                                        emp.EmployeeId
                                        == _db.Employeedetailsmasters.Where(edm =>
                                                edm.EmployeeMasterId
                                                == request.CurrentUserEmpMasterID
                                            )
                                            .Select(edm => edm.EmployeeId)
                                            .FirstOrDefault()
                                    )
                                    .Select(emp => emp.EmployeeId)
                                    .FirstOrDefault()
                            )
                            .Select(e =>
                                _db.Employeedetailsmasters.Where(edm =>
                                        edm.EmployeeId == e.EmployeeId
                                    )
                                    .Select(edm => edm.EmployeeMasterId)
                                    .FirstOrDefault()
                            )
                            .ToListAsync();

                        q = q.Where(g =>
                            g.CreatedBy == request.CurrentUserEmpMasterID
                            || g.GoalAssignments.Any(a =>
                                a.AssignedTo == request.CurrentUserEmpMasterID
                            )
                            || (
                                g.GoalType == GOAL_TYPE.TEAM
                                && g.GoalAssignments.Any(a =>
                                    subordinates.Contains(a.AssignedTo.Value)
                                )
                            )
                        );
                    }
                    else
                    {
                        // Regular users: only their own goals
                        q = q.Where(g =>
                            g.CreatedBy == request.CurrentUserEmpMasterID
                            || g.GoalAssignments.Any(a =>
                                a.AssignedTo == request.CurrentUserEmpMasterID
                            )
                        );
                    }
                }
                else
                {
                    // For self/org goals - unchanged
                    q = q.Where(g =>
                        g.CreatedBy == request.CurrentUserEmpMasterID
                        || g.GoalAssignments.Any(a =>
                            a.AssignedTo == request.CurrentUserEmpMasterID
                        )
                        || g.GoalType == GOAL_TYPE.ORG
                    );
                }

                // Apply other filters
                if (!string.IsNullOrEmpty(request.Status))
                    q = q.Where(g => g.Goalstatus == request.Status);

                if (request.ProjectId.HasValue)
                    q = q.Where(g => g.ProjectId == request.ProjectId.Value);

                if (request.DueBefore.HasValue)
                    q = q.Where(g => g.Goalendat != null && g.Goalendat <= request.DueBefore.Value);

                if (request.DueAfter.HasValue)
                    q = q.Where(g => g.Goalendat != null && g.Goalendat >= request.DueAfter.Value);

                if (request.CreatedAfter.HasValue)
                    q = q.Where(g =>
                        g.Goalcreatedat != null && g.Goalcreatedat >= request.CreatedAfter.Value
                    );

                if (request.CreatedBefore.HasValue)
                    q = q.Where(g =>
                        g.Goalcreatedat != null && g.Goalcreatedat <= request.CreatedBefore.Value
                    );

                if (request.CreatedByEmployeeMasterId.HasValue)
                    q = q.Where(g => g.CreatedBy == request.CreatedByEmployeeMasterId.Value);

                if (request.AssignedToEmployeeMasterId.HasValue)
                    q = q.Where(g =>
                        g.GoalAssignments.Any(a =>
                            a.AssignedTo == request.AssignedToEmployeeMasterId.Value
                        )
                    );

                if (!string.IsNullOrWhiteSpace(request.Search))
                    q = q.Where(g =>
                        (g.GoalTitle ?? "").Contains(request.Search)
                        || (g.GoalDescription ?? "").Contains(request.Search)
                    );

                var result = await q.OrderByDescending(g => g.Goalcreatedat)
                    .Skip((request.Page - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .AsNoTracking()
                    .ToListAsync();

                Log.Information("[QueryGoalsAsync] Retrieved {Count} goals", result.Count);

                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[QueryGoalsAsync] Error querying goals");
                throw;
            }
        }

        public async Task AddGoalAsync(Goal goal)
        {
            try
            {
                Log.Information("[AddGoalAsync] Adding new goal");
                await _db.Goals.AddAsync(goal);
                Log.Information("[AddGoalAsync] Goal added successfully");
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[AddGoalAsync] Error adding goal");
                throw;
            }
        }

        public Task UpdateGoalAsync(Goal goal)
        {
            try
            {
                Log.Information("[UpdateGoalAsync] Updating goal {GoalId}", goal.GoalId);
                _db.Goals.Update(goal);
                Log.Information(
                    "[UpdateGoalAsync] Goal {GoalId} updated successfully",
                    goal.GoalId
                );
                return Task.CompletedTask;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[UpdateGoalAsync] Error updating goal {GoalId}", goal.GoalId);
                throw;
            }
        }

        // ==================== PROJECTS ====================
        public async Task<List<Project>> GetUserProjectsAsync(int employeeMasterId)
        {
            try
            {
                Log.Information(
                    "[GetUserProjectsAsync] Fetching projects for employee {EmployeeMasterId}",
                    employeeMasterId
                );

                var employeeDetails = await _db.Employeedetailsmasters.FirstOrDefaultAsync(edm =>
                    edm.EmployeeMasterId == employeeMasterId
                );

                if (employeeDetails == null)
                {
                    Log.Warning(
                        "[GetUserProjectsAsync] No employee found with EmployeeMasterId {EmployeeMasterId}",
                        employeeMasterId
                    );
                    return new List<Project>();
                }

                var employeeId = employeeDetails.EmployeeId;
                Log.Information(
                    "[GetUserProjectsAsync] Converted to EmployeeId {EmployeeId}",
                    employeeId
                );

                var projects = await _db
                    .Projectemployees.Where(pe => pe.EmployeeId == employeeId)
                    .Include(pe => pe.Project)
                    .Select(pe => pe.Project)
                    .Where(p => p != null && p.Status == PROJECT_STATUS.ACTIVE)
                    .ToListAsync();

                Log.Information(
                    "[GetUserProjectsAsync] Found {Count} active projects",
                    projects.Count
                );
                return projects;
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "[GetUserProjectsAsync] Error fetching user projects for employee {EmployeeMasterId}",
                    employeeMasterId
                );
                throw;
            }
        }

        public async Task<List<Project>> GetAllProjectsAsync()
        {
            try
            {
                Log.Information("[GetAllProjectsAsync] Fetching all active projects");
                var result = await _db
                    .Projects.Where(p => p.Status == PROJECT_STATUS.ACTIVE)
                    .ToListAsync();
                Log.Information(
                    "[GetAllProjectsAsync] Found {Count} active projects",
                    result.Count
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetAllProjectsAsync] Error fetching all projects");
                throw;
            }
        }

        public async Task<Project?> GetProjectAsync(int projectId)
        {
            try
            {
                Log.Information("[GetProjectAsync] Fetching project {ProjectId}", projectId);
                var result = await _db.Projects.FirstOrDefaultAsync(p => p.ProjectId == projectId);
                if (result != null)
                    Log.Information("[GetProjectAsync] Project {ProjectId} found", projectId);
                else
                    Log.Warning("[GetProjectAsync] Project {ProjectId} not found", projectId);
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetProjectAsync] Error fetching project {ProjectId}", projectId);
                throw;
            }
        }

        public async Task<List<ProjectEmployeeDto>> GetProjectSubordinatesAsync(
            int projectId,
            int managerEmployeeMasterId
        )
        {
            try
            {
                Log.Information(
                    "[GetProjectSubordinatesAsync] Fetching subordinates for manager {ManagerID} in project {ProjectId}",
                    managerEmployeeMasterId,
                    projectId
                );

                var subordinateMasterIds = await GetSubordinateEmployeeMasterIdsAsync(
                    managerEmployeeMasterId
                );

                if (!subordinateMasterIds.Any())
                {
                    Log.Warning(
                        "[GetProjectSubordinatesAsync] No subordinates found for manager {ManagerID}",
                        managerEmployeeMasterId
                    );
                    return new List<ProjectEmployeeDto>();
                }

                var projectEmployees = await GetProjectEmployeesAsync(projectId);
                var projectSubordinates = projectEmployees
                    .Where(emp => subordinateMasterIds.Contains(emp.EmpMasterId))
                    .ToList();

                Log.Information(
                    "[GetProjectSubordinatesAsync] Found {Count} subordinates in project",
                    projectSubordinates.Count
                );
                return projectSubordinates;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetProjectSubordinatesAsync] Error fetching project subordinates");
                throw;
            }
        }

        // Add to GoalModuleRepository.cs
        public async Task<List<AssigneeDto>> GetAssigneesWithDetailsAsync(int goalId)
        {
            try
            {
                Log.Information(
                    "[GetAssigneesWithDetailsAsync] Fetching assignees with details for goal {GoalId}",
                    goalId
                );

                var assignments = await _db
                    .GoalAssignments.Where(a => a.GoalId == goalId)
                    .ToListAsync();

                var result = new List<AssigneeDto>();

                foreach (var assignment in assignments)
                {
                    if (!assignment.AssignedTo.HasValue)
                        continue;

                    // GET EMPLOYEE DETAILS
                    var edm = await GetEmployeeDetailsByMasterIdAsync(assignment.AssignedTo.Value);
                    if (edm?.Employee?.Userprofile == null)
                    {
                        Log.Warning(
                            "[GetAssigneesWithDetailsAsync] No userprofile found for employee {ID}",
                            assignment.AssignedTo
                        );
                        continue;
                    }

                    var profile = edm.Employee.Userprofile;
                    var role = edm.Role?.RoleName ?? USER_ROLE.EMPLOYEE;

                    Log.Information(
                        "[GetAssigneesWithDetailsAsync] Adding assignee - Name: {FirstName} {LastName}, Role: {Role}",
                        profile.FirstName,
                        profile.LastName,
                        role
                    );

                    result.Add(
                        new AssigneeDto
                        {
                            EmployeeMasterId = assignment.AssignedTo.Value,
                            Name = $"{profile.FirstName} {profile.LastName}".Trim(),
                            Role = role,
                            IsAcknowledged = assignment.IsAcknowledged ?? false,
                            AcknowledgedOn = assignment.AcknowledgedOn,
                        }
                    );
                }

                Log.Information(
                    "[GetAssigneesWithDetailsAsync] Returning {Count} assignees",
                    result.Count
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "[GetAssigneesWithDetailsAsync] Error fetching assignees with details"
                );
                throw;
            }
        }

        // ==================== CHECKLIST ====================
        public async Task<List<GoalChecklist>> GetChecklistByGoalAsync(int goalId)
        {
            try
            {
                Log.Information(
                    "[GetChecklistByGoalAsync] Fetching checklist for goal {GoalId}",
                    goalId
                );
                var result = await _db
                    .GoalChecklists.Include(c => c.Goalchecklistprogresses)
                    .Where(c => c.GoalId == goalId)
                    .ToListAsync();
                Log.Information(
                    "[GetChecklistByGoalAsync] Found {Count} checklist items for goal {GoalId}",
                    result.Count,
                    goalId
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "[GetChecklistByGoalAsync] Error fetching checklist for goal {GoalId}",
                    goalId
                );
                throw;
            }
        }

        public async Task AddChecklistRangeAsync(List<GoalChecklist> items)
        {
            try
            {
                Log.Information(
                    "[AddChecklistRangeAsync] Adding {Count} checklist items",
                    items.Count
                );
                await _db.GoalChecklists.AddRangeAsync(items);
                Log.Information(
                    "[AddChecklistRangeAsync] {Count} checklist items added successfully",
                    items.Count
                );
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[AddChecklistRangeAsync] Error adding checklist items");
                throw;
            }
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

        // ==================== CHECKLIST PROGRESS ====================
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

        public async Task<int> CountCompletedForUserAsync(int goalId, int userEmployeeMasterId)
        {
            try
            {
                Log.Information(
                    "[CountCompletedForUserAsync] Counting completed items for goal {GoalId}, user {UserID}",
                    goalId,
                    userEmployeeMasterId
                );
                var result = await _db
                    .Goalchecklistprogresses.Where(p =>
                        p.IsCompleted == true
                        && p.UserId == userEmployeeMasterId
                        && _db.GoalChecklists.Any(c =>
                            c.ChecklistId == p.ChecklistId && c.GoalId == goalId
                        )
                    )
                    .CountAsync();
                Log.Information(
                    "[CountCompletedForUserAsync] Found {Count} completed items",
                    result
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[CountCompletedForUserAsync] Error counting completed items");
                throw;
            }
        }

        public async Task<int> CountTotalForUserAsync(int goalId, int userEmployeeMasterId)
        {
            try
            {
                Log.Information(
                    "[CountTotalForUserAsync] Counting total items for goal {GoalId}, user {UserID}",
                    goalId,
                    userEmployeeMasterId
                );
                var result = await _db
                    .GoalChecklists.Where(c =>
                        c.GoalId == goalId && c.AddedFor == userEmployeeMasterId
                    )
                    .CountAsync();
                Log.Information("[CountTotalForUserAsync] Found {Count} total items", result);
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[CountTotalForUserAsync] Error counting total items");
                throw;
            }
        }

        // ==================== ASSIGNMENTS ====================
        public async Task<List<GoalAssignment>> GetAssigneesAsync(int goalId)
        {
            try
            {
                Log.Information("[GetAssigneesAsync] Fetching assignees for goal {GoalId}", goalId);
                var result = await _db.GoalAssignments.Where(a => a.GoalId == goalId).ToListAsync();
                Log.Information("[GetAssigneesAsync] Found {Count} assignees", result.Count);
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "[GetAssigneesAsync] Error fetching assignees for goal {GoalId}",
                    goalId
                );
                throw;
            }
        }

        public async Task AddAssignmentsAsync(List<GoalAssignment> assignments)
        {
            try
            {
                Log.Information(
                    "[AddAssignmentsAsync] Adding {Count} assignments",
                    assignments.Count
                );
                await _db.GoalAssignments.AddRangeAsync(assignments);
                Log.Information(
                    "[AddAssignmentsAsync] {Count} assignments added successfully",
                    assignments.Count
                );
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[AddAssignmentsAsync] Error adding assignments");
                throw;
            }
        }

        public async Task<bool> IsUserAssignedToGoalAsync(int goalId, int employeeMasterId)
        {
            try
            {
                Log.Information(
                    "[IsUserAssignedToGoalAsync] Checking if user {UserID} is assigned to goal {GoalId}",
                    employeeMasterId,
                    goalId
                );
                var result = await _db.GoalAssignments.AnyAsync(a =>
                    a.GoalId == goalId && a.AssignedTo == employeeMasterId
                );
                Log.Information("[IsUserAssignedToGoalAsync] User assigned: {IsAssigned}", result);
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[IsUserAssignedToGoalAsync] Error checking user assignment");
                throw;
            }
        }

        public async Task<GoalAssignment> GetGoalAssignmentAsync(int goalId, int assignedTo)
        {
            try
            {
                Log.Information(
                    "[GetGoalAssignmentAsync] Fetching assignment for goal {GoalId}, assignee {AssigneeID}",
                    goalId,
                    assignedTo
                );
                var result = await _db.GoalAssignments.FirstOrDefaultAsync(ga =>
                    ga.GoalId == goalId && ga.AssignedTo == assignedTo
                );
                Log.Information(
                    "[GetGoalAssignmentAsync] Assignment found: {Found}",
                    result != null
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetGoalAssignmentAsync] Error fetching goal assignment");
                throw;
            }
        }

        public async Task UpdateGoalAssignmentAsync(GoalAssignment assignment)
        {
            try
            {
                Log.Information(
                    "[UpdateGoalAssignmentAsync] Updating assignment {AssignmentID}",
                    assignment.AssignmentId
                );
                _db.GoalAssignments.Update(assignment);
                Log.Information("[UpdateGoalAssignmentAsync] Assignment updated successfully");
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[UpdateGoalAssignmentAsync] Error updating assignment");
                throw;
            }
        }

        // ==================== APPROVALS ====================
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

        public async Task<bool> HasPendingApprovalAsync(int goalId, int userId)
        {
            try
            {
                Log.Information(
                    "[HasPendingApprovalAsync] Checking for pending approvals on goal {GoalId}, user {UserID}",
                    goalId,
                    userId
                );
                var result = await _db.GoalApprovals.AnyAsync(a =>
                    a.GoalId == goalId
                    && a.RequestedBy == userId
                    && a.ApprovalStatus == APPROVAL_STATUS.PENDING
                    && (
                        a.ApprovalType == APPROVAL_TYPE.COMPLETION
                        || a.ApprovalType == APPROVAL_TYPE.TASK_ACKNOWLEDGMENT
                    )
                );
                Log.Information(
                    "[HasPendingApprovalAsync] Has pending approval: {HasPending}",
                    result
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[HasPendingApprovalAsync] Error checking pending approvals");
                throw;
            }
        }

        // ==================== ATTACHMENTS ====================
    public async Task<(byte[] fileBytes, string contentType, string fileName)?> 
    GetAttachmentForPreviewAsync(int attachmentId, int currentUserEmployeeMasterId)
{
    try
    {
        Log.Information("=== PREVIEW DEBUG START ===");
        Log.Information("GetAttachmentForPreviewAsync: Fetching attachment {AttachmentId} for user {UserId}", 
            attachmentId, currentUserEmployeeMasterId);
        
        var attachment = await _db.GoalAttachments
            .Include(a => a.Goal)
            .FirstOrDefaultAsync(a => a.Goalattachmentsid == attachmentId);
        
        if (attachment == null)
        {
            Log.Warning("GetAttachmentForPreviewAsync: Attachment NOT FOUND in database - ID: {AttachmentId}", 
                attachmentId);
            return null;
        }
        
        Log.Information("GetAttachmentForPreviewAsync: Attachment found - GoalId: {GoalId}, Path: {Path}", 
            attachment.GoalId, attachment.Attachments);
        
        // Check access permission
        var canView = await CanViewGoalAsync(attachment.GoalId, currentUserEmployeeMasterId);
        Log.Information("GetAttachmentForPreviewAsync: Access check result - CanView: {CanView}", canView);
        
        if (!canView)
        {
            Log.Warning("GetAttachmentForPreviewAsync: ACCESS DENIED for user {UserId} on goal {GoalId}", 
                currentUserEmployeeMasterId, attachment.GoalId);
            return null;
        }
        
        // Build file path
        string webRootPath = environment.WebRootPath;
        if (string.IsNullOrEmpty(webRootPath))
        {
            webRootPath = Path.Combine(environment.ContentRootPath, "wwwroot");
            Log.Information("GetAttachmentForPreviewAsync: Using ContentRootPath - {Path}", webRootPath);
        }
        else
        {
            Log.Information("GetAttachmentForPreviewAsync: Using WebRootPath - {Path}", webRootPath);
        }
        
        var relativePath = attachment.Attachments?.TrimStart('/') ?? "";
        var fullPath = Path.Combine(webRootPath, relativePath);
        
        Log.Information("GetAttachmentForPreviewAsync: Full file path - {Path}", fullPath);
        Log.Information("GetAttachmentForPreviewAsync: File exists? {Exists}", File.Exists(fullPath));
        
        if (!File.Exists(fullPath))
        {
            Log.Warning("GetAttachmentForPreviewAsync: FILE NOT FOUND at path: {Path}", fullPath);
            
            // List what files ARE in that directory
            var directory = Path.GetDirectoryName(fullPath);
            if (Directory.Exists(directory))
            {
                var filesInDir = Directory.GetFiles(directory);
                Log.Information("GetAttachmentForPreviewAsync: Files in directory: {Files}", 
                    string.Join(", ", filesInDir.Select(Path.GetFileName)));
            }
            else
            {
                Log.Warning("GetAttachmentForPreviewAsync: Directory doesn't exist: {Dir}", directory);
            }
            
            return null;
        }
        
        var fileBytes = await File.ReadAllBytesAsync(fullPath);
        var contentType = GetContentType(attachment.Attachments ?? "");
        var fileName = !string.IsNullOrEmpty(attachment.AttachmentTitle) 
            ? attachment.AttachmentTitle 
            : Path.GetFileName(attachment.Attachments ?? "download");
        
        // Ensure filename has extension
        if (!Path.HasExtension(fileName) && !string.IsNullOrEmpty(attachment.Attachments))
        {
            var extension = Path.GetExtension(attachment.Attachments);
            fileName += extension;
        }
        
        Log.Information("GetAttachmentForPreviewAsync: SUCCESS - FileName: {FileName}, ContentType: {ContentType}, Size: {Size} bytes", 
            fileName, contentType, fileBytes.Length);
        Log.Information("=== PREVIEW DEBUG END ===");
        
        return (fileBytes, contentType, fileName);
    }
    catch (Exception ex)
    {
        Log.Error(ex, "GetAttachmentForPreviewAsync: EXCEPTION occurred");
        throw;
    }
}

private async Task<bool> CanViewGoalAsync(int goalId, int employeeMasterId)
{
    var goal = await _db.Goals
        .Include(g => g.GoalAssignments)
        .FirstOrDefaultAsync(g => g.GoalId == goalId);
    
    if (goal == null) return false;
    
    // Creator can view
    if (goal.CreatedBy == employeeMasterId) return true;
    
    // Assignee can view
    if (goal.GoalAssignments.Any(a => a.AssignedTo == employeeMasterId)) return true;
    
    // Check if user role allows viewing
    var userRole = await GetUserRoleAsync(employeeMasterId);
    if (userRole == USER_ROLE.LEADERSHIP) return true;
    
    return false;
}

private string GetContentType(string fileName)
{
    var extension = Path.GetExtension(fileName).ToLowerInvariant();
    return extension switch
    {
        ".pdf" => "application/pdf",
        ".doc" => "application/msword",
        ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".xls" => "application/vnd.ms-excel",
        ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".png" => "image/png",
        ".jpg" or ".jpeg" => "image/jpeg",
        ".txt" => "text/plain",
        ".zip" => "application/zip",
        _ => "application/octet-stream",
    };
}


        public async Task AddAttachmentAsync(GoalAttachment attachment)
        {
            try
            {
                Log.Information(
                    "[AddAttachmentAsync] Adding attachment for goal {GoalId}",
                    attachment.GoalId
                );
                await _db.GoalAttachments.AddAsync(attachment);
                Log.Information("[AddAttachmentAsync] Attachment added successfully");
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[AddAttachmentAsync] Error adding attachment");
                throw;
            }
        } 



        public async Task<List<GoalAttachment>> GetAttachmentsByGoalAsync(int goalId)
        {
            try
            {
                Log.Information(
                    "[GetAttachmentsByGoalAsync] Fetching attachments for goal {GoalId}",
                    goalId
                );
                var result = await _db
                    .GoalAttachments.Where(a => a.GoalId == goalId)
                    .OrderByDescending(a => a.AttachedOn)
                    .ToListAsync();
                Log.Information(
                    "[GetAttachmentsByGoalAsync] Found {Count} attachments",
                    result.Count
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetAttachmentsByGoalAsync] Error fetching attachments");
                throw;
            }
        }

        public async Task<GoalAttachment?> GetAttachmentByIdAsync(int attachmentId)
        {
            try
            {
                Log.Information(
                    "[GetAttachmentByIdAsync] Fetching attachment {AttachmentId}",
                    attachmentId
                );
                var result = await _db.GoalAttachments.FirstOrDefaultAsync(a =>
                    a.Goalattachmentsid == attachmentId
                );
                Log.Information(
                    "[GetAttachmentByIdAsync] Attachment found: {Found}",
                    result != null
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetAttachmentByIdAsync] Error fetching attachment");
                throw;
            }
        }

        public async Task MarkAttachmentsAsProofAsync(List<int> attachmentIds, int approvalId)
        {
            try
            {
                Log.Information(
                    "[MarkAttachmentsAsProofAsync] Marking {Count} attachments as proof for approval {ApprovalId}",
                    attachmentIds.Count,
                    approvalId
                );
                var attachments = await _db
                    .GoalAttachments.Where(a => attachmentIds.Contains(a.Goalattachmentsid))
                    .ToListAsync();

                foreach (var attachment in attachments)
                {
                    attachment.IsProofOfCompletion = true;
                    attachment.LinkedApprovalId = approvalId;
                    _db.GoalAttachments.Update(attachment);
                }
                Log.Information(
                    "[MarkAttachmentsAsProofAsync] Marked {Count} attachments",
                    attachments.Count
                );
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[MarkAttachmentsAsProofAsync] Error marking attachments as proof");
                throw;
            }
        }

        public async Task DeleteAttachmentAsync(int attachmentId)
        {
            try
            {
                Log.Information(
                    "[DeleteAttachmentAsync] Deleting attachment {AttachmentId}",
                    attachmentId
                );
                var attachment = await _db.GoalAttachments.FirstOrDefaultAsync(a =>
                    a.Goalattachmentsid == attachmentId
                );
                if (attachment != null)
                {
                    _db.GoalAttachments.Remove(attachment);
                    Log.Information("[DeleteAttachmentAsync] Attachment deleted successfully");
                }
                else
                {
                    Log.Warning(
                        "[DeleteAttachmentAsync] Attachment {AttachmentId} not found",
                        attachmentId
                    );
                }
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[DeleteAttachmentAsync] Error deleting attachment");
                throw;
            }
        }

        public async Task<List<GoalAttachment>> GetProofAttachmentsForApprovalAsync(int approvalId)
        {
            try
            {
                Log.Information(
                    "[GetProofAttachmentsForApprovalAsync] Fetching proof attachments for approval {ApprovalId}",
                    approvalId
                );
                var result = await _db
                    .GoalAttachments.Where(a =>
                        a.LinkedApprovalId == approvalId && a.IsProofOfCompletion == true
                    )
                    .OrderByDescending(a => a.AttachedOn)
                    .ToListAsync();
                Log.Information(
                    "[GetProofAttachmentsForApprovalAsync] Found {Count} proof attachments",
                    result.Count
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "[GetProofAttachmentsForApprovalAsync] Error fetching proof attachments"
                );
                throw;
            }
        }

        public async Task UnmarkProofAttachmentsAsync(int approvalId)
        {
            try
            {
                Log.Information(
                    "[UnmarkProofAttachmentsAsync] Unmarking proof attachments for approval {ApprovalId}",
                    approvalId
                );
                var attachments = await _db
                    .GoalAttachments.Where(a => a.LinkedApprovalId == approvalId)
                    .ToListAsync();

                foreach (var attachment in attachments)
                {
                    attachment.IsProofOfCompletion = false;
                    attachment.LinkedApprovalId = null;
                    _db.GoalAttachments.Update(attachment);
                }
                Log.Information(
                    "[UnmarkProofAttachmentsAsync] Unmarked {Count} attachments', attachments.Count"
                );
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[UnmarkProofAttachmentsAsync] Error unmarking proof attachments");
                throw;
            }
        }

        // ==================== COMMENTS ====================
        public async Task AddCommentAsync(GoalComment comment)
        {
            try
            {
                Log.Information(
                    "[AddCommentAsync] Adding comment for goal {GoalId}",
                    comment.GoalId
                );
                await _db.GoalComments.AddAsync(comment);
                Log.Information("[AddCommentAsync] Comment added successfully");
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[AddCommentAsync] Error adding comment");
                throw;
            }
        }

        public async Task<List<GoalComment>> GetCommentsByGoalAsync(int goalId)
        {
            try
            {
                Log.Information(
                    "[GetCommentsByGoalAsync] Fetching comments for goal {GoalId}",
                    goalId
                );
                var result = await _db
                    .GoalComments.Where(c => c.GoalId == goalId)
                    .OrderByDescending(c => c.CommentedOn)
                    .ToListAsync();
                Log.Information("[GetCommentsByGoalAsync] Found {Count} comments", result.Count);
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetCommentsByGoalAsync] Error fetching comments");
                throw;
            }
        }

        // ==================== COMMENT PERMISSIONS ====================
        public async Task<bool> CanUserCommentOnGoalAsync(
            int goalId,
            int employeeMasterId,
            string role
        )
        {
            try
            {
                Log.Information(
                    "[CanUserCommentOnGoalAsync] Checking permission - Goal {GoalId}, User {ID} ({Role})",
                    goalId,
                    employeeMasterId,
                    role
                );

                // Get the goal
                var goal = await _db
                    .Goals.AsNoTracking()
                    .FirstOrDefaultAsync(g => g.GoalId == goalId);

                if (goal == null)
                    return false;

                // Creator can always comment
                if (goal.CreatedBy == employeeMasterId)
                    return true;

                // Assignee can always comment
                var isAssignee = await _db
                    .GoalAssignments.AsNoTracking()
                    .AnyAsync(a => a.GoalId == goalId && a.AssignedTo == employeeMasterId);

                if (isAssignee)
                    return true;

                // DeptHead/Manager can comment on TEAM goals
                var isDeptHeadOrManager =
                    role == USER_ROLE.DEPARTMENT_HEAD || role == USER_ROLE.MANAGER;
                var isTeamGoal = goal.GoalType == GOAL_TYPE.TEAM;

                if (isDeptHeadOrManager && isTeamGoal)
                {
                    Log.Information(
                        "[CanUserCommentOnGoalAsync] {Role} {ID} can comment on team goal {GoalId}",
                        role,
                        employeeMasterId,
                        goalId
                    );
                    return true;
                }

                Log.Warning(
                    "[CanUserCommentOnGoalAsync] Access denied - User {ID} ({Role}) on goal {GoalId}",
                    employeeMasterId,
                    role,
                    goalId
                );
                return false;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[CanUserCommentOnGoalAsync] Error checking permission");
                throw;
            }
        }

        public async Task<bool> IsGoalCommentableAsync(int goalId)
        {
            try
            {
                var goal = await _db
                    .Goals.AsNoTracking()
                    .FirstOrDefaultAsync(g => g.GoalId == goalId);

                if (goal == null)
                    return false;

                // Cannot comment on completed/closed/cancelled goals
                var nonCommentableStatuses = new[] { "completed", "closed", "cancelled" };
                var isCommentable = !nonCommentableStatuses.Contains(
                    goal.Goalstatus?.ToLower() ?? ""
                );

                Log.Information(
                    "[IsGoalCommentableAsync] Goal {GoalId} - Status: {Status}, Commentable: {Commentable}",
                    goalId,
                    goal.Goalstatus,
                    isCommentable
                );

                return isCommentable;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[IsGoalCommentableAsync] Error checking if goal is commentable");
                throw;
            }
        }

        // ==================== PROGRESS LOGS ====================
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

        public async Task<List<Goalprogresslog>> GetProgressLogsByGoalAsync(int goalId)
        {
            try
            {
                Log.Information(
                    "[GetProgressLogsByGoalAsync] Fetching progress logs for goal {GoalId}",
                    goalId
                );
                var result = await _db
                    .Goalprogresslogs.Where(p => p.GoalId == goalId)
                    .OrderByDescending(p => p.UpdatedOn)
                    .ToListAsync();
                Log.Information(
                    "[GetProgressLogsByGoalAsync] Found {Count} progress logs",
                    result.Count
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetProgressLogsByGoalAsync] Error fetching progress logs");
                throw;
            }
        }

        public async Task<Goalprogresslog?> GetLatestProgressLogAsync(int goalId)
        {
            try
            {
                Log.Information(
                    "[GetLatestProgressLogAsync] Fetching latest progress log for goal {GoalId}",
                    goalId
                );
                var result = await _db
                    .Goalprogresslogs.Where(p => p.GoalId == goalId)
                    .OrderByDescending(p => p.UpdatedOn)
                    .FirstOrDefaultAsync();
                Log.Information(
                    "[GetLatestProgressLogAsync] Latest progress log found: {Found}",
                    result != null
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetLatestProgressLogAsync] Error fetching latest progress log");
                throw;
            }
        }

        // ==================== EMPLOYEE HIERARCHY & ACCESS CONTROL ====================
        public async Task<int?> GetReportingManagerEmployeeMasterIdAsync(int employeeMasterId)
        {
            try
            {
                Log.Information(
                    "[GetReportingManagerEmployeeMasterIdAsync] Fetching reporting manager for employee {EmployeeMasterId}",
                    employeeMasterId
                );
                var employee = await _db
                    .Employeedetailsmasters.Include(edm => edm.Employee)
                    .FirstOrDefaultAsync(edm => edm.EmployeeMasterId == employeeMasterId);

                if (employee?.Employee?.ReportingManagerEmployeeId == null)
                {
                    Log.Warning(
                        "[GetReportingManagerEmployeeMasterIdAsync] No manager found for employee {EmployeeMasterId}",
                        employeeMasterId
                    );
                    return null;
                }

                var managerEdm = await _db.Employeedetailsmasters.FirstOrDefaultAsync(edm =>
                    edm.EmployeeId == employee.Employee.ReportingManagerEmployeeId
                );

                if (managerEdm != null)
                    Log.Information(
                        "[GetReportingManagerEmployeeMasterIdAsync] Manager found: {ManagerID}",
                        managerEdm.EmployeeMasterId
                    );

                return managerEdm?.EmployeeMasterId;
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "[GetReportingManagerEmployeeMasterIdAsync] Error fetching reporting manager"
                );
                throw;
            }
        }

        public async Task<List<int>> GetSubordinateEmployeeMasterIdsAsync(
            int managerEmployeeMasterId
        )
        {
            try
            {
                Log.Information(
                    "[GetSubordinateEmployeeMasterIdsAsync] Fetching subordinates for manager {ManagerID}",
                    managerEmployeeMasterId
                );
                var managerEdm = await _db
                    .Employeedetailsmasters.Include(edm => edm.Employee)
                    .FirstOrDefaultAsync(edm => edm.EmployeeMasterId == managerEmployeeMasterId);

                if (managerEdm == null)
                {
                    Log.Warning(
                        "[GetSubordinateEmployeeMasterIdsAsync] Manager not found: {ManagerID}",
                        managerEmployeeMasterId
                    );
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

                Log.Information(
                    "[GetSubordinateEmployeeMasterIdsAsync] Found {Count} subordinates",
                    subordinateMasterIds.Count
                );
                return subordinateMasterIds;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetSubordinateEmployeeMasterIdsAsync] Error fetching subordinates");
                throw;
            }
        }

        public async Task<bool> IsManagerOfAsync(
            int managerEmployeeMasterId,
            int employeeEmployeeMasterId
        )
        {
            try
            {
                Log.Information(
                    "[IsManagerOfAsync] Checking if {ManagerID} is manager of {EmployeeID}",
                    managerEmployeeMasterId,
                    employeeEmployeeMasterId
                );
                var employeeManagerId = await GetReportingManagerEmployeeMasterIdAsync(
                    employeeEmployeeMasterId
                );
                var result = employeeManagerId == managerEmployeeMasterId;
                Log.Information("[IsManagerOfAsync] Is manager: {IsManager}", result);
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[IsManagerOfAsync] Error checking manager relationship");
                throw;
            }
        }

        public async Task<string?> GetUserRoleAsync(int employeeMasterId)
        {
            try
            {
                Log.Information(
                    "[GetUserRoleAsync] Fetching role for employee {EmployeeMasterId}",
                    employeeMasterId
                );
                var edm = await _db
                    .Employeedetailsmasters.Include(edm => edm.Role)
                    .FirstOrDefaultAsync(edm => edm.EmployeeMasterId == employeeMasterId);

                var roleName = edm?.Role?.RoleName;
                Log.Information("[GetUserRoleAsync] Role: {Role}", roleName ?? "NOT FOUND");
                return roleName;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetUserRoleAsync] Error fetching user role");
                throw;
            }
        }

        public async Task<Employeedetailsmaster?> GetEmployeeDetailsByMasterIdAsync(
            int employeeMasterId
        )
        {
            try
            {
                Log.Information(
                    "[GetEmployeeDetailsByMasterIdAsync] Fetching EDM for {ID}",
                    employeeMasterId
                );

                var result = await _db
                    .Employeedetailsmasters.Include(e => e.Employee)
                    .ThenInclude(e => e.Userprofile)
                    .Include(e => e.Role)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(e => e.EmployeeMasterId == employeeMasterId);

                if (result == null)
                {
                    Log.Warning(
                        "[GetEmployeeDetailsByMasterIdAsync] EDM not found for {ID}",
                        employeeMasterId
                    );
                    return null;
                }

                Log.Information(
                    "[GetEmployeeDetailsByMasterIdAsync] Found - Employee: {First} {Last}, Profile: {ProfileExists}",
                    result.Employee?.Userprofile?.FirstName,
                    result.Employee?.Userprofile?.LastName,
                    result.Employee?.Userprofile != null
                );

                return result;
            }
            catch (Exception ex)
            {
                Log.Error(
                    ex,
                    "[GetEmployeeDetailsByMasterIdAsync] Error for {ID}",
                    employeeMasterId
                );
                throw;
            }
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

        public async Task<bool> IsManagerOfGoalAssigneesAsync(int goalId, int managerId)
        {
            var assigneeIds = await _db
                .GoalAssignments.Where(a => a.GoalId == goalId && a.AssignedTo.HasValue)
                .Select(a => a.AssignedTo.Value)
                .ToListAsync();

            foreach (var assigneeId in assigneeIds)
            {
                var assigneeManagerId = await GetReportingManagerEmployeeMasterIdAsync(assigneeId);
                if (assigneeManagerId == managerId)
                    return true;
            }

            return false;
        }

        // ==================== PROJECT INFO ====================
        public async Task<Project?> GetProjectByIdAsync(int projectId)
        {
            try
            {
                Log.Information("[GetProjectByIdAsync] Fetching project {ProjectId}", projectId);
                var result = await _db.Projects.FirstOrDefaultAsync(p => p.ProjectId == projectId);
                Log.Information("[GetProjectByIdAsync] Project found: {Found}", result != null);
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetProjectByIdAsync] Error fetching project");
                throw;
            }
        }

        public async Task<bool> IsEmployeeInProjectAsync(int employeeMasterId, int projectId)
        {
            try
            {
                Log.Information(
                    "[IsEmployeeInProjectAsync] Checking if employee {EmployeeMasterId} is in project {ProjectId}",
                    employeeMasterId,
                    projectId
                );
                var employeeDetails = await _db.Employeedetailsmasters.FirstOrDefaultAsync(edm =>
                    edm.EmployeeMasterId == employeeMasterId
                );

                if (employeeDetails == null)
                {
                    Log.Warning(
                        "[IsEmployeeInProjectAsync] Employee not found: {EmployeeMasterId}",
                        employeeMasterId
                    );
                    return false;
                }

                var result = await _db.Projectemployees.AnyAsync(pe =>
                    pe.EmployeeId == employeeDetails.EmployeeId && pe.ProjectId == projectId
                );
                Log.Information("[IsEmployeeInProjectAsync] Is in project: {IsInProject}", result);
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[IsEmployeeInProjectAsync] Error checking employee in project");
                throw;
            }
        }

        public async Task<List<Project>> GetUserProjectsByEmployeeIdAsync(int employeeId)
        {
            try
            {
                Log.Information(
                    "[GetUserProjectsByEmployeeIdAsync] Fetching projects for employee ID {EmployeeId}",
                    employeeId
                );
                var result = await _db
                    .Projectemployees.Where(pe => pe.EmployeeId == employeeId)
                    .Include(pe => pe.Project)
                    .Select(pe => pe.Project)
                    .ToListAsync();
                Log.Information(
                    "[GetUserProjectsByEmployeeIdAsync] Found {Count} projects",
                    result.Count
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetUserProjectsByEmployeeIdAsync] Error fetching user projects");
                throw;
            }
        }

        public async Task<List<ProjectEmployeeDto>> GetProjectEmployeesAsync(int projectId)
        {
            try
            {
                Log.Information(
                    "[GetProjectEmployeesAsync] Fetching employees for project {ProjectId}",
                    projectId
                );

                // Include full navigation chain BEFORE querying
                var employees = await _db
                    .Employeedetailsmasters.Where(edm =>
                        _db.Projectemployees.Where(pe => pe.ProjectId == projectId)
                            .Select(pe => pe.EmployeeId)
                            .Contains(edm.EmployeeId)
                    )
                    .Include(edm => edm.Employee)
                    .ThenInclude(emp => emp.Userprofile)
                    .AsNoTracking()
                    .ToListAsync();

                Log.Information(
                    "[GetProjectEmployeesAsync] Found {Count} employees for project",
                    employees.Count
                );

                // Convert to DTO with proper null coalescing
                var result = employees
                    .Select(edm => new ProjectEmployeeDto
                    {
                        EmpMasterId = edm.EmployeeMasterId,
                        FirstName = edm.Employee?.Userprofile?.FirstName ?? "Unknown",
                        LastName = edm.Employee?.Userprofile?.LastName ?? "Unknown",
                    })
                    .ToList();

                Log.Information(
                    "[GetProjectEmployeesAsync] Converted {Count} employees to DTOs",
                    result.Count
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetProjectEmployeesAsync] Error fetching project employees");
                throw;
            }
        }

        // ==================== GOAL ACCESS QUERIES ====================
        public async Task<bool> IsGoalCreatorAsync(int goalId, int employeeMasterId)
        {
            try
            {
                Log.Information(
                    "[IsGoalCreatorAsync] Checking if user {UserID} created goal {GoalId}",
                    employeeMasterId,
                    goalId
                );
                var goal = await _db.Goals.FirstOrDefaultAsync(g => g.GoalId == goalId);
                var result = goal?.CreatedBy == employeeMasterId;
                Log.Information("[IsGoalCreatorAsync] Is creator: {IsCreator}", result);
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[IsGoalCreatorAsync] Error checking goal creator");
                throw;
            }
        }

        public async Task<bool> IsGoalParticipantAsync(int goalId, int employeeMasterId)
        {
            try
            {
                Log.Information(
                    "[IsGoalParticipantAsync] Checking if user {UserID} participates in goal {GoalId}",
                    employeeMasterId,
                    goalId
                );
                var goal = await _db
                    .Goals.Include(g => g.GoalAssignments)
                    .FirstOrDefaultAsync(g => g.GoalId == goalId);

                if (goal == null)
                {
                    Log.Warning("[IsGoalParticipantAsync] Goal not found: {GoalId}", goalId);
                    return false;
                }

                var result =
                    goal.CreatedBy == employeeMasterId
                    || goal.GoalAssignments.Any(a => a.AssignedTo == employeeMasterId);
                Log.Information("[IsGoalParticipantAsync] Is participant: {IsParticipant}", result);
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[IsGoalParticipantAsync] Error checking goal participant");
                throw;
            }
        }

        public async Task<List<int>> GetGoalParticipantIdsAsync(int goalId)
        {
            try
            {
                Log.Information(
                    "[GetGoalParticipantIdsAsync] Fetching participant IDs for goal {GoalId}",
                    goalId
                );
                var goal = await _db
                    .Goals.Include(g => g.GoalAssignments)
                    .FirstOrDefaultAsync(g => g.GoalId == goalId);

                if (goal == null)
                {
                    Log.Warning("[GetGoalParticipantIdsAsync] Goal not found: {GoalId}", goalId);
                    return new List<int>();
                }

                var participants = new List<int>();

                if (goal.CreatedBy.HasValue)
                    participants.Add(goal.CreatedBy.Value);

                participants.AddRange(
                    goal.GoalAssignments.Where(a => a.AssignedTo.HasValue)
                        .Select(a => a.AssignedTo!.Value)
                );

                var distinctParticipants = participants.Distinct().ToList();
                Log.Information(
                    "[GetGoalParticipantIdsAsync] Found {Count} participants",
                    distinctParticipants.Count
                );
                return distinctParticipants;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetGoalParticipantIdsAsync] Error fetching goal participants");
                throw;
            }
        }

        // ==================== CASCADING PROGRESS ====================
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
                var subordinateMasterIds = await GetSubordinateEmployeeMasterIdsAsync(
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

        public async Task<List<GoalChecklist>> GetChecklistItemsByGoalIdAsync(int goalId)
        {
            try
            {
                Log.Information(
                    "[GetChecklistItemsByGoalIdAsync] Fetching checklist items for goal {GoalId}",
                    goalId
                );
                var result = await _db
                    .GoalChecklists.Where(x => x.GoalId == goalId)
                    .Include(x => x.Goalchecklistprogresses)
                    .ToListAsync();
                Log.Information(
                    "[GetChecklistItemsByGoalIdAsync] Found {Count} items",
                    result.Count
                );
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[GetChecklistItemsByGoalIdAsync] Error fetching checklist items");
                throw;
            }
        }

        public async Task AddChecklistItemAsync(GoalChecklist item)
        {
            try
            {
                Log.Information(
                    "[AddChecklistItemAsync] Adding checklist item for goal {GoalId}",
                    item.GoalId
                );
                await _db.GoalChecklists.AddAsync(item);
                await _db.SaveChangesAsync();
                Log.Information("[AddChecklistItemAsync] Checklist item added successfully");
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[AddChecklistItemAsync] Error adding checklist item");
                throw;
            }
        }

        public async Task DeleteChecklistItemAsync(int checklistId)
        {
            try
            {
                Log.Information(
                    "[DeleteChecklistItemAsync] Deleting checklist item {ChecklistId}",
                    checklistId
                );
                var progressRecords = await _db
                    .Goalchecklistprogresses.Where(x => x.ChecklistId == checklistId)
                    .ToListAsync();

                _db.Goalchecklistprogresses.RemoveRange(progressRecords);
                Log.Information(
                    "[DeleteChecklistItemAsync] Deleted {Count} progress records",
                    progressRecords.Count
                );

                var item = await _db.GoalChecklists.FindAsync(checklistId);
                if (item != null)
                {
                    _db.GoalChecklists.Remove(item);
                    Log.Information("[DeleteChecklistItemAsync] Checklist item deleted");
                }

                await _db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[DeleteChecklistItemAsync] Error deleting checklist item");
                throw;
            }
        }

        public async Task<bool> ChecklistHasProgressAsync(int checklistId, int userId)
        {
            try
            {
                Log.Information(
                    "[ChecklistHasProgressAsync] Checking progress for checklist {ChecklistId}, user {UserID}",
                    checklistId,
                    userId
                );
                var result = await _db.Goalchecklistprogresses.AnyAsync(x =>
                    x.ChecklistId == checklistId && x.UserId == userId && x.IsCompleted == true
                );
                Log.Information("[ChecklistHasProgressAsync] Has progress: {HasProgress}", result);
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[ChecklistHasProgressAsync] Error checking progress");
                throw;
            }
        }

        public async Task UpdateGoalProgressAsync(int goalId, decimal progress, int userId)
        {
            try
            {
                Log.Information(
                    "[UpdateGoalProgressAsync] Updating progress for goal {GoalId}, progress: {Progress}%, user: {UserID}",
                    goalId,
                    progress,
                    userId
                );
                var newLog = new Goalprogresslog
                {
                    GoalId = goalId,
                    ProgressPercent = (int)Math.Round(progress),
                    UpdatedOn = DateTime.UtcNow,
                    UpdatedBy = userId,
                    Source = PROGRESS_SOURCE.AUTO,
                };

                await _db.Goalprogresslogs.AddAsync(newLog);
                await _db.SaveChangesAsync();
                Log.Information("[UpdateGoalProgressAsync] Goal progress updated successfully");
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[UpdateGoalProgressAsync] Error updating goal progress");
                throw;
            }
        }

        // ==================== SAVE ====================
        public async Task SaveChangesAsync()
        {
            try
            {
                Log.Information("[SaveChangesAsync] Saving changes to database");
                await _db.SaveChangesAsync();
                Log.Information("[SaveChangesAsync] Changes saved successfully");
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[SaveChangesAsync] Error saving changes");
                throw;
            }
        }
    }
}
