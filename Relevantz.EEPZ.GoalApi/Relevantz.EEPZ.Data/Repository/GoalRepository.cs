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

        public async Task<List<Goal>> QueryGoalsAsync(GoalQueryModel request)
        {
            var q = _db
                .Goals.Include(g => g.GoalAssignments)
                .Include(g => g.Goalprogresslogs)
                .AsQueryable();

            if (!string.IsNullOrEmpty(request.Type))
                q = q.Where(g => g.GoalType == request.Type);

            if (request.Type == GOAL_TYPE.TEAM)
            {
                if (request.CurrentUserRole == USER_ROLE.LEADERSHIP)
                {
                    q = q.Where(g => g.GoalType == GOAL_TYPE.TEAM);
                }
                else if (request.CurrentUserRole == USER_ROLE.DEPARTMENT_HEAD)
                {
                    var deptHead = await _db
                        .Employeedetailsmasters.AsNoTracking()
                        .FirstOrDefaultAsync(e =>
                            e.EmployeeMasterId == request.CurrentUserEmpMasterID
                        );

                    if (deptHead != null)
                    {
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
                    var subordinates = await _db
                        .Employees.Where(e =>
                            e.ReportingManagerEmployeeId
                            == _db.Employees.Where(emp =>
                                    emp.EmployeeId
                                    == _db.Employeedetailsmasters.Where(edm =>
                                            edm.EmployeeMasterId == request.CurrentUserEmpMasterID
                                        )
                                        .Select(edm => edm.EmployeeId)
                                        .FirstOrDefault()
                                )
                                .Select(emp => emp.EmployeeId)
                                .FirstOrDefault()
                        )
                        .Select(e =>
                            _db.Employeedetailsmasters.Where(edm => edm.EmployeeId == e.EmployeeId)
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
                            && g.GoalAssignments.Any(a => subordinates.Contains(a.AssignedTo.Value))
                        )
                    );
                }
                else
                {
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
                q = q.Where(g =>
                    g.CreatedBy == request.CurrentUserEmpMasterID
                    || g.GoalAssignments.Any(a => a.AssignedTo == request.CurrentUserEmpMasterID)
                    || g.GoalType == GOAL_TYPE.ORG
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

            return result;
        }

        public async Task AddGoalAsync(Goal goal)
        {
            await _db.Goals.AddAsync(goal);
        }

        public Task UpdateGoalAsync(Goal goal)
        {
            _db.Goals.Update(goal);
            return Task.CompletedTask;
        }

        public async Task<List<Project>> GetUserProjectsAsync(int employeeMasterId)
        {
            var employeeDetails = await _db.Employeedetailsmasters.FirstOrDefaultAsync(edm =>
                edm.EmployeeMasterId == employeeMasterId
            );

            if (employeeDetails == null)
            {
                return new List<Project>();
            }

            var employeeId = employeeDetails.EmployeeId;

            var projects = await _db
                .Projectemployees.Where(pe => pe.EmployeeId == employeeId)
                .Include(pe => pe.Project)
                .Select(pe => pe.Project)
                .Where(p => p != null && p.Status == PROJECT_STATUS.ACTIVE)
                .ToListAsync();

            return projects;
        }

        public async Task<List<Project>> GetAllProjectsAsync()
        {
            var result = await _db
                .Projects.Where(p => p.Status == PROJECT_STATUS.ACTIVE)
                .ToListAsync();

            return result;
        }

        public async Task<Project?> GetProjectAsync(int projectId)
        {
            var result = await _db.Projects.FirstOrDefaultAsync(p => p.ProjectId == projectId);

            return result;
        }

        public async Task<List<AssigneeModel>> GetAssigneesWithDetailsAsync(int goalId)
        {
            var assignments = await _db
                .GoalAssignments.Where(a => a.GoalId == goalId)
                .ToListAsync();

            var result = new List<AssigneeModel>();

            foreach (var assignment in assignments)
            {
                if (!assignment.AssignedTo.HasValue)
                    continue;

                var edm = await _baseRepo.GetEmployeeDetailsByMasterIdAsync(
                    assignment.AssignedTo.Value
                );
                if (edm?.Employee?.Userprofile == null)
                {
                    continue;
                }

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

            return result;
        }

        public async Task<List<GoalChecklist>> GetChecklistByGoalAsync(int goalId)
        {
            var result = await _db
                .GoalChecklists.Include(c => c.Goalchecklistprogresses)
                .Where(c => c.GoalId == goalId)
                .ToListAsync();

            return result;
        }

        public async Task AddChecklistRangeAsync(List<GoalChecklist> items)
        {
            await _db.GoalChecklists.AddRangeAsync(items);
        }

        public async Task<int> CountTotalForUserAsync(int goalId, int userEmployeeMasterId)
        {
            var result = await _db
                .GoalChecklists.Where(c => c.GoalId == goalId && c.AddedFor == userEmployeeMasterId)
                .CountAsync();

            return result;
        }

        public async Task AddAssignmentsAsync(List<GoalAssignment> assignments)
        {
            await _db.GoalAssignments.AddRangeAsync(assignments);
        }

        public async Task UpdateGoalAssignmentAsync(GoalAssignment assignment)
        {
            _db.GoalAssignments.Update(assignment);
        }

        public async Task<(
            byte[] fileBytes,
            string contentType,
            string fileName
        )?> GetAttachmentForPreviewAsync(int attachmentId, int currentUserEmployeeMasterId)
        {
            var attachment = await _db
                .GoalAttachments.Include(a => a.Goal)
                .FirstOrDefaultAsync(a => a.Goalattachmentsid == attachmentId);

            if (attachment == null)
            {
                return null;
            }

            var canView = await CanViewGoalAsync(attachment.GoalId, currentUserEmployeeMasterId);

            if (!canView)
            {
                return null;
            }

            string webRootPath = environment.WebRootPath;
            if (string.IsNullOrEmpty(webRootPath))
            {
                webRootPath = Path.Combine(environment.ContentRootPath, "wwwroot");
            }

            var relativePath = attachment.Attachments?.TrimStart('/') ?? "";
            var fullPath = Path.Combine(webRootPath, relativePath);

            if (!File.Exists(fullPath))
            {
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

            return (fileBytes, contentType, fileName);
        }

        private async Task<bool> CanViewGoalAsync(int goalId, int employeeMasterId)
        {
            var goal = await _db
                .Goals.Include(g => g.GoalAssignments)
                .FirstOrDefaultAsync(g => g.GoalId == goalId);

            if (goal == null)
                return false;

            if (goal.CreatedBy == employeeMasterId)
                return true;

            if (goal.GoalAssignments.Any(a => a.AssignedTo == employeeMasterId))
                return true;

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
            var employeeManagerId = await _baseRepo.GetReportingManagerEmployeeMasterIdAsync(
                employeeEmployeeMasterId
            );
            var result = employeeManagerId == managerEmployeeMasterId;

            return result;
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
            var employeeDetails = await _db.Employeedetailsmasters.FirstOrDefaultAsync(edm =>
                edm.EmployeeMasterId == employeeMasterId
            );

            if (employeeDetails == null)
            {
                return false;
            }

            var result = await _db.Projectemployees.AnyAsync(pe =>
                pe.EmployeeId == employeeDetails.EmployeeId && pe.ProjectId == projectId
            );

            return result;
        }

        public async Task<List<Project>> GetUserProjectsByEmployeeIdAsync(int employeeId)
        {
            var result = await _db
                .Projectemployees.Where(pe => pe.EmployeeId == employeeId)
                .Include(pe => pe.Project)
                .Select(pe => pe.Project)
                .ToListAsync();

            return result;
        }

        public async Task<bool> IsGoalCreatorAsync(int goalId, int employeeMasterId)
        {
            var goal = await _db.Goals.FirstOrDefaultAsync(g => g.GoalId == goalId);
            var result = goal?.CreatedBy == employeeMasterId;

            return result;
        }

        public async Task<List<int>> GetGoalParticipantIdsAsync(int goalId)
        {
            var goal = await _db
                .Goals.Include(g => g.GoalAssignments)
                .FirstOrDefaultAsync(g => g.GoalId == goalId);

            if (goal == null)
            {
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

            return distinctParticipants;
        }

        public async Task AddChecklistItemAsync(GoalChecklist item)
        {
            await _db.GoalChecklists.AddAsync(item);
            await _db.SaveChangesAsync();
        }

        public async Task DeleteChecklistItemAsync(int checklistId)
        {
            var progressRecords = await _db
                .Goalchecklistprogresses.Where(x => x.ChecklistId == checklistId)
                .ToListAsync();

            _db.Goalchecklistprogresses.RemoveRange(progressRecords);

            var item = await _db.GoalChecklists.FindAsync(checklistId);
            if (item != null)
            {
                _db.GoalChecklists.Remove(item);
            }

            await _db.SaveChangesAsync();
        }

        public async Task<bool> ChecklistHasProgressAsync(int checklistId, int userId)
        {
            var result = await _db.Goalchecklistprogresses.AnyAsync(x =>
                x.ChecklistId == checklistId && x.UserId == userId && x.IsCompleted == true
            );

            return result;
        }

        public async Task UpdateGoalProgressAsync(int goalId, decimal progress, int userId)
        {
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
        }
    }
}
