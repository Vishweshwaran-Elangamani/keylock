using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace eepzbackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FormProgressTrackerController : ControllerBase
    {
        private readonly EEPZDbContext _context;

        public FormProgressTrackerController(EEPZDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var trackers = await _context.Formprogresstrackers
              .Include(t => t.Assignment)
              .ToListAsync();

                var assignmentIds = trackers
                    .Where(t => t.Assignment != null)
                    .Select(t => t.Assignment.AssignmentId)
                    .Distinct()
                    .ToList();

                var assignments = trackers
                    .Where(t => t.Assignment != null)
                    .Select(t => t.Assignment)
                    .Distinct()
                    .ToList();

                var userIds = assignments
                    .Select(a => a.EmployeeId)
                    .Where(id => id != 0)
                    .Distinct()
                    .ToList();

                var users = await _context.Userauthentications
                    .Where(u => userIds.Contains(u.UserId))
                    .Include(u => u.Employee)
                    .ToListAsync();

                var employeeMasterIds = users
                    .Where(u => u.Employee != null)
                    .Select(u => u.Employee.EmployeeId)
                    .Distinct()
                    .ToList();

                var userProfiles = await _context.Userprofiles
                    .Where(up => employeeMasterIds.Contains(up.EmployeeId))
                    .ToListAsync();

                var l1EmployeeIds = users
                    .Where(u => u.Employee != null && u.Employee.ReportingManagerEmployeeId != null)
                    .Select(u => u.Employee.ReportingManagerEmployeeId.Value)
                    .Distinct()
                    .ToList();

                var l1Employees = await _context.Employees
                    .Where(e => l1EmployeeIds.Contains(e.EmployeeId))
                    .ToListAsync();

                var l1Profiles = await _context.Userprofiles
                    .Where(up => l1EmployeeIds.Contains(up.EmployeeId))
                    .ToListAsync();

                var l2EmployeeIds = l1Employees
                    .Where(e => e.ReportingManagerEmployeeId != null)
                    .Select(e => e.ReportingManagerEmployeeId.Value)
                    .Distinct()
                    .ToList();

                var l2Profiles = await _context.Userprofiles
                    .Where(up => l2EmployeeIds.Contains(up.EmployeeId))
                    .ToListAsync();

                var relevantUserIds = assignments.Select(a => a.EmployeeId).Distinct().ToList();
                var relevantFormIds = assignments.Select(a => a.FormId).Distinct().ToList();

                var selfAssessments = await _context.Selfassessments
                    .Where(sa => relevantUserIds.Contains(sa.EmployeeId) && relevantFormIds.Contains(sa.FormId) && sa.Status == "Submitted")
                    .AsNoTracking()
                    .ToListAsync();

                var latestAssessmentLookup = selfAssessments
                    .GroupBy(sa => new { sa.EmployeeId, sa.FormId })
                    .Select(g => g.OrderByDescending(x => x.SubmittedAt).First())
                    .ToDictionary(sa => (sa.EmployeeId, sa.FormId), sa => sa);

                var assessmentIds = latestAssessmentLookup.Values.Select(sa => sa.AssessmentId).Distinct().ToList();

                var deptApprovals = await _context.Departmentheadapprovals
                    .Where(a => assessmentIds.Contains(a.AssessmentId))
                    .AsNoTracking()
                    .ToListAsync();

                var approvalsByAssessment = deptApprovals
                    .GroupBy(a => a.AssessmentId)
                    .ToDictionary(g => g.Key, g => g.ToList());

                var result = trackers.Select(t =>
                {
                    var assignment = t.Assignment;

                    bool deptHeadApproved = false;
                    bool empAcknowledged = false;

                    var user = assignment != null ? users.FirstOrDefault(u => u.UserId == assignment.EmployeeId) : null;
                    var employee = user?.Employee;
                    var userProfile = employee != null ? userProfiles.FirstOrDefault(up => up.EmployeeId == employee.EmployeeId) : null;

                    var l1EmployeeId = employee?.ReportingManagerEmployeeId;
                    var l1Profile = l1EmployeeId != null ? l1Profiles.FirstOrDefault(up => up.EmployeeId == l1EmployeeId) : null;

                    var l1Employee = l1EmployeeId != null ? l1Employees.FirstOrDefault(e => e.EmployeeId == l1EmployeeId) : null;
                    var l2EmployeeId = l1Employee?.ReportingManagerEmployeeId;
                    var l2Profile = l2EmployeeId != null ? l2Profiles.FirstOrDefault(up => up.EmployeeId == l2EmployeeId) : null;

                    if (assignment != null)
                    {
                        var key = (EmployeeId: assignment.EmployeeId, FormId: assignment.FormId);
                        if (latestAssessmentLookup.TryGetValue(key, out var latestAssessment))
                        {
                            if (approvalsByAssessment.TryGetValue(latestAssessment.AssessmentId, out var approvals))
                            {

                                var approved = approvals.FirstOrDefault(a => string.Equals(a.Status, "Approved", StringComparison.OrdinalIgnoreCase));
                                if (approved != null)
                                {
                                    deptHeadApproved = true;
                                    empAcknowledged = approved.AcknowledgedByEmployee;
                                }
                            }
                        }
                    }

                    return new
                    {
                        t.TrackerId,
                        t.AssignmentId,
                        t.Initiated,
                        t.SentToEmployee,
                        t.EmployeeCompleted,
                        t.SentToManager,
                        t.ManagerCompleted,

                        DeptHeadApproved = deptHeadApproved,

                        EmpAcknowledged = empAcknowledged,
                        t.SentToDeptHead,
                        t.SentToLeadership,
                        t.LastUpdated,

                        EmployeeId = user?.UserId,
                        EmployeeName = userProfile != null ? $"{userProfile.FirstName} {userProfile.LastName}".Trim() : "N/A",

                        L1Id = l1EmployeeId,
                        L1Name = l1Profile != null ? $"{l1Profile.FirstName} {l1Profile.LastName}".Trim() : "N/A",

                        L2Id = l2EmployeeId,
                        L2Name = l2Profile != null ? $"{l2Profile.FirstName} {l2Profile.LastName}".Trim() : "N/A"
                    };
                }).ToList();

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var tracker = await _context.Formprogresstrackers
                .Include(t => t.Assignment)
                .FirstOrDefaultAsync(t => t.TrackerId == id);

            if (tracker == null)
                return NotFound(new { success = false, message = "Form progress tracker not found." });

            return Ok(new { success = true, data = tracker });
        }

        [HttpGet("ByAssignment/{assignmentId}")]
        public async Task<IActionResult> GetByAssignment(int assignmentId)
        {
            var tracker = await _context.Formprogresstrackers
                .AsNoTracking()
                .Include(t => t.Assignment)
                .FirstOrDefaultAsync(t => t.AssignmentId == assignmentId);

            if (tracker == null)
                return NotFound(new { success = false, message = "Form progress tracker not found for assignment." });

            return Ok(new { success = true, data = tracker });
        }

        [HttpPost]
        public async Task<IActionResult> Upsert([FromBody] FormProgressTrackerUpdateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, message = "Invalid data.", errors = ModelState });

            try
            {
                var tracker = await _context.Formprogresstrackers
                    .FirstOrDefaultAsync(t => t.AssignmentId == dto.AssignmentId);

                if (tracker == null)
                {
                    tracker = new Relevantz.EEPZ.Common.Entities.Formprogresstracker
                    {
                        AssignmentId = dto.AssignmentId,
                        Initiated = dto.Initiated ?? false,
                        SentToEmployee = dto.SentToEmployee ?? false,
                        EmployeeCompleted = dto.EmployeeCompleted ?? false,
                        SentToManager = dto.SentToManager ?? false,
                        ManagerCompleted = dto.ManagerCompleted ?? false,
                        SentToDeptHead = dto.SentToDeptHead ?? false,
                        SentToLeadership = dto.SentToLeadership ?? false,
                        LastUpdated = DateTime.UtcNow
                    };

                    _context.Formprogresstrackers.Add(tracker);
                }
                else
                {
                    tracker.Initiated = dto.Initiated ?? tracker.Initiated;
                    tracker.SentToEmployee = dto.SentToEmployee ?? tracker.SentToEmployee;
                    tracker.EmployeeCompleted = dto.EmployeeCompleted ?? tracker.EmployeeCompleted;
                    tracker.SentToManager = dto.SentToManager ?? tracker.SentToManager;
                    tracker.ManagerCompleted = dto.ManagerCompleted ?? tracker.ManagerCompleted;
                    tracker.SentToDeptHead = dto.SentToDeptHead ?? tracker.SentToDeptHead;
                    tracker.SentToLeadership = dto.SentToLeadership ?? tracker.SentToLeadership;
                    tracker.LastUpdated = DateTime.UtcNow;

                    _context.Formprogresstrackers.Update(tracker);
                }

                await _context.SaveChangesAsync();
                await _context.Entry(tracker).ReloadAsync();

                return Ok(new { success = true, message = "Form progress tracker saved successfully.", data = tracker });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Save failed: {ex.Message}" });
            }
        }
    }

    public class FormProgressTrackerUpdateDto
    {
        public int AssignmentId { get; set; }
        public bool? Initiated { get; set; }
        public bool? SentToEmployee { get; set; }
        public bool? EmployeeCompleted { get; set; }
        public bool? SentToManager { get; set; }
        public bool? ManagerCompleted { get; set; }
        public bool? SentToDeptHead { get; set; }
        public bool? SentToLeadership { get; set; }
    }
}

