using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Enums;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interface;
using Serilog;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class GoalRepository : IGoalRepository
    {
        private readonly EEPZDbContext _db;
        private readonly IBaseGoalRepository _baseRepo;

        private readonly IWebHostEnvironment environment;

        public GoalRepository(
            EEPZDbContext db,
            IBaseGoalRepository baseRepo,
            IWebHostEnvironment _environment
        )
        {
            _db = db;
            _baseRepo = baseRepo;
            environment = _environment;
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
                    var edm = await _baseRepo.GetEmployeeDetailsByMasterIdAsync(
                        assignment.AssignedTo.Value
                    );
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

        public async Task<(
            byte[] fileBytes,
            string contentType,
            string fileName
        )?> GetAttachmentForPreviewAsync(int attachmentId, int currentUserEmployeeMasterId)
        {
            try
            {
                Log.Information("=== PREVIEW DEBUG START ===");
                Log.Information(
                    "GetAttachmentForPreviewAsync: Fetching attachment {AttachmentId} for user {UserId}",
                    attachmentId,
                    currentUserEmployeeMasterId
                );

                var attachment = await _db
                    .GoalAttachments.Include(a => a.Goal)
                    .FirstOrDefaultAsync(a => a.Goalattachmentsid == attachmentId);

                if (attachment == null)
                {
                    Log.Warning(
                        "GetAttachmentForPreviewAsync: Attachment NOT FOUND in database - ID: {AttachmentId}",
                        attachmentId
                    );
                    return null;
                }

                Log.Information(
                    "GetAttachmentForPreviewAsync: Attachment found - GoalId: {GoalId}, Path: {Path}",
                    attachment.GoalId,
                    attachment.Attachments
                );

                // Check access permission
                var canView = await CanViewGoalAsync(
                    attachment.GoalId,
                    currentUserEmployeeMasterId
                );
                Log.Information(
                    "GetAttachmentForPreviewAsync: Access check result - CanView: {CanView}",
                    canView
                );

                if (!canView)
                {
                    Log.Warning(
                        "GetAttachmentForPreviewAsync: ACCESS DENIED for user {UserId} on goal {GoalId}",
                        currentUserEmployeeMasterId,
                        attachment.GoalId
                    );
                    return null;
                }

                // Build file path
                string webRootPath = environment.WebRootPath;
                if (string.IsNullOrEmpty(webRootPath))
                {
                    webRootPath = Path.Combine(environment.ContentRootPath, "wwwroot");
                    Log.Information(
                        "GetAttachmentForPreviewAsync: Using ContentRootPath - {Path}",
                        webRootPath
                    );
                }
                else
                {
                    Log.Information(
                        "GetAttachmentForPreviewAsync: Using WebRootPath - {Path}",
                        webRootPath
                    );
                }

                var relativePath = attachment.Attachments?.TrimStart('/') ?? "";
                var fullPath = Path.Combine(webRootPath, relativePath);

                Log.Information("GetAttachmentForPreviewAsync: Full file path - {Path}", fullPath);
                Log.Information(
                    "GetAttachmentForPreviewAsync: File exists? {Exists}",
                    File.Exists(fullPath)
                );

                if (!File.Exists(fullPath))
                {
                    Log.Warning(
                        "GetAttachmentForPreviewAsync: FILE NOT FOUND at path: {Path}",
                        fullPath
                    );

                    // List what files ARE in that directory
                    var directory = Path.GetDirectoryName(fullPath);
                    if (Directory.Exists(directory))
                    {
                        var filesInDir = Directory.GetFiles(directory);
                        Log.Information(
                            "GetAttachmentForPreviewAsync: Files in directory: {Files}",
                            string.Join(", ", filesInDir.Select(Path.GetFileName))
                        );
                    }
                    else
                    {
                        Log.Warning(
                            "GetAttachmentForPreviewAsync: Directory doesn't exist: {Dir}",
                            directory
                        );
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

                Log.Information(
                    "GetAttachmentForPreviewAsync: SUCCESS - FileName: {FileName}, ContentType: {ContentType}, Size: {Size} bytes",
                    fileName,
                    contentType,
                    fileBytes.Length
                );
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
            var goal = await _db
                .Goals.Include(g => g.GoalAssignments)
                .FirstOrDefaultAsync(g => g.GoalId == goalId);

            if (goal == null)
                return false;

            // Creator can view
            if (goal.CreatedBy == employeeMasterId)
                return true;

            // Assignee can view
            if (goal.GoalAssignments.Any(a => a.AssignedTo == employeeMasterId))
                return true;

            // Check if user role allows viewing
            var userRole = await _baseRepo.GetUserRoleAsync(employeeMasterId);
            if (userRole == USER_ROLE.LEADERSHIP)
                return true;

            return false;
        }

        private string GetContentType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            return extension switch
            {
                ".pdf" => "application/pdf",
                ".doc" => "application/msword",
                ".docx" =>
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xls" => "application/vnd.ms-excel",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".txt" => "text/plain",
                ".zip" => "application/zip",
                _ => "application/octet-stream",
            };
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
                var employeeManagerId = await _baseRepo.GetReportingManagerEmployeeMasterIdAsync(
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

        public async Task<bool> IsManagerOfGoalAssigneesAsync(int goalId, int managerId)
        {
            var assigneeIds = await _db
                .GoalAssignments.Where(a => a.GoalId == goalId && a.AssignedTo.HasValue)
                .Select(a => a.AssignedTo.Value)
                .ToListAsync();

            foreach (var assigneeId in assigneeIds)
            {
                var assigneeManagerId = await _baseRepo.GetReportingManagerEmployeeMasterIdAsync(
                    assigneeId
                );
                if (assigneeManagerId == managerId)
                    return true;
            }

            return false;
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
    }
}
