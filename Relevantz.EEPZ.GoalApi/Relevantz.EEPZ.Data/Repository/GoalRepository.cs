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

            Log.Debug("GoalRepository initialized.");
        }

        public async Task<List<Goal>> QueryGoals(GoalQueryModel request)
        {
            Log.Information(
                "QueryGoals START | UserId={UserId} | Role={Role} | Filters={@Request}",
                request.CurrentUserEmpMasterID,
                request.CurrentUserRole,
                request
            );

            var q = _db.Goals
                .Include(g => g.GoalAssignments)
                .Include(g => g.Goalprogresslogs)
                .AsQueryable();


            if (!string.IsNullOrEmpty(request.Type))
            {
                q = q.Where(g => g.GoalType == request.Type);
                Log.Debug("QueryGoals | Filter Type={Type}", request.Type);
            }

           
            if (request.Type == GOAL_TYPE.TEAM)
            {
                if (request.CurrentUserRole == USER_ROLE.LEADERSHIP)
                {
                    q = q.Where(g => g.GoalType == GOAL_TYPE.TEAM);
                    Log.Debug("QueryGoals | Leadership filtering applied");
                }
                else if (request.CurrentUserRole == USER_ROLE.DEPARTMENT_HEAD)
                {
                    Log.Debug("QueryGoals | Department Head filtering applied");

                    var deptHead = await _db.Employeedetailsmasters.AsNoTracking()
                        .FirstOrDefaultAsync(e =>
                            e.EmployeeMasterId == request.CurrentUserEmpMasterID);

                    if (deptHead != null)
                    {
                        q = q.Where(g =>
                            g.CreatedBy == request.CurrentUserEmpMasterID ||
                            g.GoalAssignments.Any(a => a.AssignedTo == request.CurrentUserEmpMasterID) ||
                            (
                                g.GoalType == GOAL_TYPE.TEAM &&
                                g.GoalAssignments.Any(a =>
                                    _db.Employeedetailsmasters
                                        .Where(e => e.DepartmentId == deptHead.DepartmentId)
                                        .Select(e => e.EmployeeMasterId)
                                        .Contains(a.AssignedTo.Value)
                                )
                            )
                        );
                    }
                    else
                    {
                        q = q.Where(g =>
                            g.CreatedBy == request.CurrentUserEmpMasterID ||
                            g.GoalAssignments.Any(a => a.AssignedTo == request.CurrentUserEmpMasterID)
                        );
                    }
                }
                else if (request.CurrentUserRole == USER_ROLE.MANAGER)
                {
                    Log.Debug("QueryGoals | Manager filtering applied");

                    var subordinates = await _db.Employees
                        .Where(e =>
                            e.ReportingManagerEmployeeId ==
                            _db.Employees
                                .Where(emp =>
                                    emp.EmployeeId ==
                                    _db.Employeedetailsmasters
                                        .Where(edm => edm.EmployeeMasterId == request.CurrentUserEmpMasterID)
                                        .Select(edm => edm.EmployeeId)
                                        .FirstOrDefault()
                                )
                                .Select(emp => emp.EmployeeId)
                                .FirstOrDefault()
                        )
                        .Select(e =>
                            _db.Employeedetailsmasters
                                .Where(edm => edm.EmployeeId == e.EmployeeId)
                                .Select(edm => edm.EmployeeMasterId)
                                .FirstOrDefault()
                        )
                        .ToListAsync();

                    q = q.Where(g =>
                        g.CreatedBy == request.CurrentUserEmpMasterID ||
                        g.GoalAssignments.Any(a => a.AssignedTo == request.CurrentUserEmpMasterID) ||
                        (
                            g.GoalType == GOAL_TYPE.TEAM &&
                            g.GoalAssignments.Any(a => subordinates.Contains(a.AssignedTo.Value))
                        )
                    );
                }
                else
                {
                    q = q.Where(g =>
                        g.CreatedBy == request.CurrentUserEmpMasterID ||
                        g.GoalAssignments.Any(a => a.AssignedTo == request.CurrentUserEmpMasterID)
                    );
                }
            }
            else
            {
                q = q.Where(g =>
                    g.CreatedBy == request.CurrentUserEmpMasterID ||
                    g.GoalAssignments.Any(a => a.AssignedTo == request.CurrentUserEmpMasterID) ||
                    g.GoalType == GOAL_TYPE.ORG
                );
            }

           
            if (!string.IsNullOrEmpty(request.Status))
                q = q.Where(g => g.Goalstatus == request.Status);

            if (request.ProjectId.HasValue)
                q = q.Where(g => g.ProjectId == request.ProjectId.Value);

            if (request.DueBefore.HasValue)
                q = q.Where(g => g.Goalendat != null && g.Goalendat <= request.DueBefore.Value);

            if (request.DueAfter.HasValue)
                q = q.Where(g => g.Goalendat != null && g.Goalendat >= request.DueAfter.Value);

            if (request.CreatedAfter.HasValue)
                q = q.Where(g => g.Goalcreatedat >= request.CreatedAfter.Value);

            if (request.CreatedBefore.HasValue)
                q = q.Where(g => g.Goalcreatedat <= request.CreatedBefore.Value);

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
                    (g.GoalTitle ?? "").Contains(request.Search) ||
                    (g.GoalDescription ?? "").Contains(request.Search)
                );

            var result = await q.OrderByDescending(g => g.Goalcreatedat)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .AsNoTracking()
                .ToListAsync();

            Log.Information(
                "QueryGoals END | UserId={UserId} | TotalReturned={Count}",
                request.CurrentUserEmpMasterID,
                result.Count
            );

            return result;
        }

        public async Task AddGoal(Goal goal)
        {
            Log.Information("AddGoal START | Title={Title} | CreatedBy={UserId}", goal?.GoalTitle, goal?.CreatedBy);

            await _db.Goals.AddAsync(goal);

            Log.Information("AddGoal END | Goal created (not saved yet)");
        }

        public Task UpdateGoal(Goal goal)
        {
            Log.Information("UpdateGoal | GoalId={GoalId}", goal?.GoalId);

            _db.Goals.Update(goal);
            return Task.CompletedTask;
        }

        public async Task<List<Project>> GetUserProjects(int employeeMasterId)
        {
            Log.Information("GetUserProjects START | EmployeeMasterId={Id}", employeeMasterId);

            var employeeDetails = await _db.Employeedetailsmasters
                .FirstOrDefaultAsync(edm => edm.EmployeeMasterId == employeeMasterId);

            if (employeeDetails == null)
            {
                Log.Warning("GetUserProjects | No employee details found for {Id}", employeeMasterId);
                return new List<Project>();
            }

            var employeeId = employeeDetails.EmployeeId;

            var projects = await _db.Projectemployees
                .Where(pe => pe.EmployeeId == employeeId)
                .Include(pe => pe.Project)
                .Select(pe => pe.Project)
                .Where(p => p != null && p.Status == PROJECT_STATUS.ACTIVE)
                .ToListAsync();

            Log.Information(
                "GetUserProjects END | EmployeeMasterId={Id} | Count={Count}",
                employeeMasterId,
                projects.Count
            );

            return projects;
        }

        public async Task<List<Project>> GetAllProjects()
        {
            Log.Information("GetAllProjects START");

            var result = await _db.Projects
                .Where(p => p.Status == PROJECT_STATUS.ACTIVE)
                .ToListAsync();

            Log.Information("GetAllProjects END | Count={Count}", result.Count);

            return result;
        }

        public async Task<Project?> GetProject(int projectId)
        {
            Log.Information("GetProject START | ProjectId={ProjectId}", projectId);

            var result = await _db.Projects
                .FirstOrDefaultAsync(p => p.ProjectId == projectId);

            Log.Information(
                "GetProject END | ProjectId={ProjectId} | Found={Found}",
                projectId,
                result != null
            );

            return result;
        }

        public async Task<List<AssigneeModel>> GetAssigneesWithDetails(int goalId)
        {
            Log.Information("GetAssigneesWithDetails START | GoalId={GoalId}", goalId);

            var assignments = await _db.GoalAssignments
                .Where(a => a.GoalId == goalId)
                .ToListAsync();

            var result = new List<AssigneeModel>();

            foreach (var assignment in assignments)
            {
                if (!assignment.AssignedTo.HasValue)
                    continue;

                var edm = await _baseRepo.GetEmployeeDetailsByMasterId(assignment.AssignedTo.Value);
                if (edm?.Employee?.Userprofile == null)
                    continue;

                var profile = edm.Employee.Userprofile;
                var role = edm.Role?.RoleName ?? USER_ROLE.EMPLOYEE;

                result.Add(
                    new AssigneeModel
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
                "GetAssigneesWithDetails END | GoalId={GoalId} | Count={Count}",
                goalId, result.Count);

            return result;
        }

        public async Task<List<GoalChecklist>> GetChecklistByGoal(int goalId)
        {
            Log.Information("GetChecklistByGoal START | GoalId={GoalId}", goalId);

            var result = await _db.GoalChecklists
                .Include(c => c.Goalchecklistprogresses)
                .Where(c => c.GoalId == goalId)
                .ToListAsync();

            Log.Information(
                "GetChecklistByGoal END | GoalId={GoalId} | Count={Count}",
                goalId, result.Count);

            return result;
        }

        public async Task AddChecklistRange(List<GoalChecklist> items)
        {
            Log.Information("AddChecklistRange START | Count={Count}", items?.Count ?? 0);

            await _db.GoalChecklists.AddRangeAsync(items);

            Log.Information("AddChecklistRange END");
        }

        public async Task<int> CountTotalForUser(int goalId, int userEmployeeMasterId)
        {
            Log.Information(
                "CountTotalForUser START | GoalId={GoalId} | UserId={UserId}",
                goalId,
                userEmployeeMasterId
            );

            var result = await _db.GoalChecklists
                .Where(c => c.GoalId == goalId && c.AddedFor == userEmployeeMasterId)
                .CountAsync();

            Log.Information(
                "CountTotalForUser END | GoalId={GoalId} | UserId={UserId} | Total={Total}",
                goalId,
                userEmployeeMasterId,
                result
            );

            return result;
        }

        public async Task AddAssignments(List<GoalAssignment> assignments)
        {
            Log.Information("AddAssignments START | Count={Count}", assignments?.Count ?? 0);

            await _db.GoalAssignments.AddRangeAsync(assignments);

            Log.Information("AddAssignments END");
        }

        public async Task UpdateGoalAssignment(GoalAssignment assignment)
        {
            Log.Information("UpdateGoalAssignment | GoalId={GoalId} | UserId={UserId}",
                assignment?.GoalId, assignment?.AssignedTo);

            _db.GoalAssignments.Update(assignment);
        }

        public async Task<(byte[] fileBytes, string contentType, string fileName)?>
            GetAttachmentForPreview(int attachmentId, int currentUserEmployeeMasterId)
        {
            Log.Information(
                "GetAttachmentForPreview START | AttachmentId={AttachmentId} | UserId={UserId}",
                attachmentId,
                currentUserEmployeeMasterId
            );

            var attachment = await _db
                .GoalAttachments.Include(a => a.Goal)
                .FirstOrDefaultAsync(a => a.Goalattachmentsid == attachmentId);

            if (attachment == null)
            {
                Log.Warning(
                    "GetAttachmentForPreview | Attachment not found | AttachmentId={AttachmentId}",
                    attachmentId
                );
                return null;
            }

            var canView = await CanViewGoal(
                attachment.GoalId,
                currentUserEmployeeMasterId
            );

            if (!canView)
            {
                Log.Warning(
                    "GetAttachmentForPreview | ACCESS DENIED | AttachmentId={AttachmentId} | UserId={UserId}",
                    attachmentId,
                    currentUserEmployeeMasterId
                );
                return null;
            }

            string webRootPath = environment.WebRootPath ??
                Path.Combine(environment.ContentRootPath, "wwwroot");

            var relativePath = attachment.Attachments?.TrimStart('/') ?? "";
            var fullPath = Path.Combine(webRootPath, relativePath);

            if (!File.Exists(fullPath))
            {
                Log.Warning(
                    "GetAttachmentForPreview | File not found | Path={Path}",
                    fullPath
                );
                return null;
            }

            var fileBytes = await File.ReadAllBytesAsync(fullPath);
            var contentType = GetContentType(attachment.Attachments ?? "");
            var fileName = !string.IsNullOrEmpty(attachment.AttachmentTitle)
                ? attachment.AttachmentTitle
                : Path.GetFileName(attachment.Attachments ?? "download");

            if (!Path.HasExtension(fileName) && !string.IsNullOrEmpty(attachment.Attachments))
            {
                var extension = Path.GetExtension(attachment.Attachments);
                fileName += extension;
            }

            Log.Information(
                "GetAttachmentForPreview END | AttachmentId={AttachmentId} | FileSize={Size}",
                attachmentId,
                fileBytes.Length
            );

            return (fileBytes, contentType, fileName);
        }

        private async Task<bool> CanViewGoal(int goalId, int employeeMasterId)
        {
            Log.Debug(
                "CanViewGoal START | GoalId={GoalId} | UserId={UserId}",
                goalId,
                employeeMasterId
            );

            var goal = await _db.Goals
                .Include(g => g.GoalAssignments)
                .FirstOrDefaultAsync(g => g.GoalId == goalId);

            if (goal == null)
            {
                Log.Debug("CanViewGoal | Goal not found | GoalId={GoalId}", goalId);
                return false;
            }

            if (goal.CreatedBy == employeeMasterId)
                return true;

            if (goal.GoalAssignments.Any(a => a.AssignedTo == employeeMasterId))
                return true;

            var userRole = await _baseRepo.GetUserRole(employeeMasterId);
            if (userRole == USER_ROLE.LEADERSHIP)
                return true;

            Log.Debug(
                "CanViewGoal END | GoalId={GoalId} | UserId={UserId} | Allowed=false",
                goalId,
                employeeMasterId
            );

            return false;
        }

        private string GetContentType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();

            Log.Debug("GetContentType | FileName={FileName} | Extension={Ext}", fileName, extension);

            return extension switch
            {
                ".pdf" => "application/pdf",
                ".doc" => "application/msword",
                ".docx" =>
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xls" => "application/vnd.ms-excel",
                ".xlsx" =>
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".txt" => "text/plain",
                ".zip" => "application/zip",
                _ => "application/octet-stream",
            };
        }

        public async Task<bool> IsManagerOf(int managerEmployeeMasterId, int employeeEmployeeMasterId)
        {
            Log.Information(
                "IsManagerOf START | ManagerId={ManagerId} | EmployeeId={EmployeeId}",
                managerEmployeeMasterId,
                employeeEmployeeMasterId
            );

            var employeeManagerId = await _baseRepo.GetReportingManagerEmployeeMasterId(
                employeeEmployeeMasterId
            );

            var result = employeeManagerId == managerEmployeeMasterId;

            Log.Information(
                "IsManagerOf END | ManagerId={ManagerId} | EmployeeId={EmployeeId} | Result={Result}",
                managerEmployeeMasterId,
                employeeEmployeeMasterId,
                result
            );

            return result;
        }

        public async Task<bool> IsManagerOfGoalAssignees(int goalId, int managerId)
        {
            Log.Information(
                "IsManagerOfGoalAssignees START | GoalId={GoalId} | ManagerId={ManagerId}",
                goalId,
                managerId
            );

            var assigneeIds = await _db.GoalAssignments
                .Where(a => a.GoalId == goalId && a.AssignedTo.HasValue)
                .Select(a => a.AssignedTo.Value)
                .ToListAsync();

            foreach (var assigneeId in assigneeIds)
            {
                var assigneeManagerId = await _baseRepo.GetReportingManagerEmployeeMasterId(assigneeId);

                if (assigneeManagerId == managerId)
                {
                    Log.Information(
                        "IsManagerOfGoalAssignees END | ManagerId={ManagerId} | True for AssigneeId={Assignee}",
                        managerId,
                        assigneeId
                    );

                    return true;
                }
            }

            Log.Information(
                "IsManagerOfGoalAssignees END | GoalId={GoalId} | ManagerId={ManagerId} | Result=false",
                goalId,
                managerId
            );

            return false;
        }

        public async Task<bool> IsEmployeeInProject(int employeeMasterId, int projectId)
        {
            Log.Information(
                "IsEmployeeInProject START | UserId={UserId} | ProjectId={ProjectId}",
                employeeMasterId,
                projectId
            );

            var employeeDetails = await _db.Employeedetailsmasters
                .FirstOrDefaultAsync(edm => edm.EmployeeMasterId == employeeMasterId);

            if (employeeDetails == null)
            {
                Log.Warning("IsEmployeeInProject | No employee found | UserId={UserId}", employeeMasterId);
                return false;
            }

            var result = await _db.Projectemployees
                .AnyAsync(pe =>
                    pe.EmployeeId == employeeDetails.EmployeeId &&
                    pe.ProjectId == projectId
                );

            Log.Information(
                "IsEmployeeInProject END | UserId={UserId} | ProjectId={ProjectId} | Result={Result}",
                employeeMasterId,
                projectId,
                result
            );

            return result;
        }

        public async Task<List<Project>> GetUserProjectsByEmployeeId(int employeeId)
        {
            Log.Information("GetUserProjectsByEmployeeId START | EmployeeId={EmployeeId}", employeeId);

            var result = await _db.Projectemployees
                .Where(pe => pe.EmployeeId == employeeId)
                .Include(pe => pe.Project)
                .Select(pe => pe.Project)
                .ToListAsync();

            Log.Information(
                "GetUserProjectsByEmployeeId END | EmployeeId={EmployeeId} | Count={Count}",
                employeeId,
                result.Count
            );

            return result;
        }

        public async Task<bool> IsGoalCreator(int goalId, int employeeMasterId)
        {
            Log.Information(
                "IsGoalCreator START | GoalId={GoalId} | UserId={UserId}",
                goalId,
                employeeMasterId
            );

            var goal = await _db.Goals.FirstOrDefaultAsync(g => g.GoalId == goalId);

            var result = goal?.CreatedBy == employeeMasterId;

            Log.Information(
                "IsGoalCreator END | GoalId={GoalId} | UserId={UserId} | Result={Result}",
                goalId,
                employeeMasterId,
                result
            );

            return result;
        }

        public async Task<List<int>> GetGoalParticipantIds(int goalId)
        {
            Log.Information("GetGoalParticipantIds START | GoalId={GoalId}", goalId);

            var goal = await _db.Goals
                .Include(g => g.GoalAssignments)
                .FirstOrDefaultAsync(g => g.GoalId == goalId);

            if (goal == null)
            {
                Log.Warning("GetGoalParticipantIds | Goal not found | GoalId={GoalId}", goalId);
                return new List<int>();
            }

            var participants = new List<int>();

            if (goal.CreatedBy.HasValue)
                participants.Add(goal.CreatedBy.Value);

            participants.AddRange(
                goal.GoalAssignments
                    .Where(a => a.AssignedTo.HasValue)
                    .Select(a => a.AssignedTo!.Value)
            );

            var distinct = participants.Distinct().ToList();

            Log.Information(
                "GetGoalParticipantIds END | GoalId={GoalId} | Count={Count}",
                goalId,
                distinct.Count
            );

            return distinct;
        }

        public async Task AddChecklistItem(GoalChecklist item)
        {
            Log.Information("AddChecklistItem START | GoalId={GoalId}", item?.GoalId);

            await _db.GoalChecklists.AddAsync(item);
            await _db.SaveChangesAsync();

            Log.Information("AddChecklistItem END | ChecklistId={ChecklistId}", item?.ChecklistId);
        }

        public async Task DeleteChecklistItem(int checklistId)
        {
            Log.Information("DeleteChecklistItem START | ChecklistId={ChecklistId}", checklistId);

            var progressRecords = await _db.Goalchecklistprogresses
                .Where(x => x.ChecklistId == checklistId)
                .ToListAsync();

            _db.Goalchecklistprogresses.RemoveRange(progressRecords);

            var item = await _db.GoalChecklists.FindAsync(checklistId);
            if (item != null)
            {
                _db.GoalChecklists.Remove(item);
            }

            await _db.SaveChangesAsync();

            Log.Information("DeleteChecklistItem END | ChecklistId={ChecklistId}", checklistId);
        }

        public async Task<bool> ChecklistHasProgress(int checklistId, int userId)
        {
            Log.Information(
                "ChecklistHasProgress START | ChecklistId={ChecklistId} | UserId={UserId}",
                checklistId,
                userId
            );

            var result = await _db.Goalchecklistprogresses
                .AnyAsync(x =>
                    x.ChecklistId == checklistId &&
                    x.UserId == userId &&
                    x.IsCompleted == true
                );

            Log.Information(
                "ChecklistHasProgress END | ChecklistId={ChecklistId} | UserId={UserId} | Result={Result}",
                checklistId,
                userId,
                result
            );

            return result;
        }

        public async Task UpdateGoalProgress(int goalId, decimal progress, int userId)
        {
            Log.Information(
                "UpdateGoalProgress START | GoalId={GoalId} | Progress={Progress} | UserId={UserId}",
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

            Log.Information(
                "UpdateGoalProgress END | GoalId={GoalId} | LoggedProgress={Progress}",
                goalId,
                progress
            );
        }
    }
}