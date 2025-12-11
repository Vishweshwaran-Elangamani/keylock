using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;

namespace PerformanceManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AssignmentsController : ControllerBase
    {
        private readonly IAppraisalProcessService _appraisalService;
        private readonly EEPZDbContext _context;
        private readonly ILogger<AssignmentsController> _logger;

        public AssignmentsController(IAppraisalProcessService appraisalService, EEPZDbContext context, ILogger<AssignmentsController> logger)
        {
            _appraisalService = appraisalService;
            _context = context;
            _logger = logger;
        }

        private int GetUserIdFromToken()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim))
                {
                    userIdClaim = User.FindFirst("userId")?.Value
                               ?? User.FindFirst("sub")?.Value
                               ?? User.FindFirst("id")?.Value;
                }

                if (int.TryParse(userIdClaim, out int userId))
                {
                    return userId;
                }

                return 0;
            }
            catch
            {
                return 0;
            }
        }

        private int GetEmployeeIdFromToken()
        {
            try
            {
                var employeeIdClaim = User.FindFirst("employeeId")?.Value
                                   ?? User.FindFirst("empId")?.Value;

                if (int.TryParse(employeeIdClaim, out int employeeId))
                {
                    return employeeId;
                }

                return 0;
            }
            catch
            {
                return 0;
            }
        }

        [HttpPost("initiate")]
        public async Task<IActionResult> InitiateAppraisal([FromBody] InitiateAppraisalRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                _logger.LogInformation($"[INITIATE] Received {request.UserIds?.Count ?? 0} employee IDs");

                var form = await _context.Assessmentforms.FindAsync(request.FormId);
                if (form == null)
                    return BadRequest("Form not found.");

                var assigner = await _context.Userauthentications
                    .Include(u => u.Employee)
                    .FirstOrDefaultAsync(u => u.UserId == request.AssignedBy);

                if (assigner == null)
                    return BadRequest("Assigning user not found.");

                var assignerDetails = await _context.Employeedetailsmasters
                    .Include(d => d.Role)
                    .FirstOrDefaultAsync(d => d.EmployeeId == assigner.EmployeeId);

                if (assignerDetails == null || assignerDetails.Role == null ||
                    !string.Equals(assignerDetails.Role.RoleCode, "HR", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest("Only HR users can initiate appraisals.");
                }

                var employeeIdsReceived = request.UserIds.ToList();
                _logger.LogInformation($"[INITIATE] Converting employee IDs: {string.Join(", ", employeeIdsReceived)}");

                var userIdMapping = await _context.Userauthentications
                    .Where(ua => employeeIdsReceived.Contains(ua.EmployeeId))
                    .Select(ua => new { ua.UserId, ua.EmployeeId })
                    .ToListAsync();

                if (userIdMapping.Count != employeeIdsReceived.Count)
                {
                    var missing = employeeIdsReceived.Except(userIdMapping.Select(m => m.EmployeeId)).ToList();
                    return BadRequest($"Some employee IDs not found: {string.Join(", ", missing)}");
                }

                var userIds = userIdMapping.Select(m => m.UserId).ToList();
                _logger.LogInformation($"[INITIATE] Mapped to user IDs: {string.Join(", ", userIds)}");

                HashSet<int> eligibleUserIds = new HashSet<int>();

                if (form.Type == "Self")
                {
                    var today = DateTime.UtcNow.Date;
                    var reminderDays = 30;
                    var reminderDate = today.AddDays(reminderDays);
                    var targetMonth = reminderDate.Month;

                    var allEmployees = await (
                        from ua in _context.Userauthentications
                        join emp in _context.Employees on ua.EmployeeId equals emp.EmployeeId
                        join ed in _context.Employeedetailsmasters on emp.EmployeeId equals ed.EmployeeId
                        join r in _context.Roles on ed.RoleId equals r.RoleId
                        where ua.Status == "Active"
                            && emp.EmploymentStatus == "Active"
                            && emp.IsActive == true
                            && r.RoleCode != "HR"
                            && r.RoleCode != "ADMIN"
                        select new
                        {
                            ua.UserId,
                            JoiningDate = emp.JoiningDate.ToDateTime(TimeOnly.MinValue),
                            RoleCode = r.RoleCode
                        }
                    ).ToListAsync();

                    eligibleUserIds = allEmployees
                        .Where(e =>
                        {
                            var joiningMonth = e.JoiningDate.Month;
                            var firstAppraisalMonth = joiningMonth <= 4 ? 4 : joiningMonth;
                            var eligibleMonth = (e.JoiningDate.AddYears(1) < today) ? 4 : firstAppraisalMonth;
                            return eligibleMonth == targetMonth;
                        })
                        .Select(e => e.UserId)
                        .ToHashSet();
                }

                var allUserAuths = await _context.Userauthentications
                    .Where(ua => userIds.Contains(ua.UserId))
                    .ToDictionaryAsync(ua => ua.UserId);

                var allEmployeeIds = allUserAuths.Values.Select(ua => ua.EmployeeId).ToList();
                var allUserDetails = await _context.Employeedetailsmasters
                    .Where(ed => allEmployeeIds.Contains(ed.EmployeeId))
                    .Include(d => d.Role)
                    .ToDictionaryAsync(ed => ed.EmployeeId);

                var responses = new List<object>();
                var skippedUsers = new List<object>();
                var deadlineDays = request.DeadlineInDays > 0 ? request.DeadlineInDays : 7;

                foreach (var userId in userIds)
                {
                    if (!allUserAuths.ContainsKey(userId))
                    {
                        skippedUsers.Add(new { UserId = userId, Reason = "User not found" });
                        continue;
                    }

                    var userAuth = allUserAuths[userId];
                    var userDetails = allUserDetails.ContainsKey(userAuth.EmployeeId)
                        ? allUserDetails[userAuth.EmployeeId]
                        : null;

                    var userRoleCode = userDetails?.Role?.RoleCode ?? string.Empty;

                    if (string.Equals(userRoleCode, "HR", StringComparison.OrdinalIgnoreCase))
                    {
                        skippedUsers.Add(new { EmployeeId = userAuth.EmployeeId, Reason = "HR cannot receive forms" });
                        continue;
                    }

                    if (form.Type == "Self")
                    {
                        if (string.Equals(userRoleCode, "ADMIN", StringComparison.OrdinalIgnoreCase))
                        {
                            skippedUsers.Add(new { EmployeeId = userAuth.EmployeeId, Reason = "Admin cannot receive Self forms" });
                            continue;
                        }

                        if (!eligibleUserIds.Contains(userId))
                        {
                            skippedUsers.Add(new { EmployeeId = userAuth.EmployeeId, Reason = "Not Eligible" });
                            continue;
                        }
                    }
                    else if (form.Type == "Manager")
                    {
                        if (!string.Equals(userRoleCode, "MGR", StringComparison.OrdinalIgnoreCase) &&
                            !string.Equals(userRoleCode, "MANAGER", StringComparison.OrdinalIgnoreCase))
                        {
                            skippedUsers.Add(new { EmployeeId = userAuth.EmployeeId, Reason = "Only managers can receive Manager forms" });
                            continue;
                        }
                    }

                    if (userId == request.AssignedBy)
                    {
                        skippedUsers.Add(new { EmployeeId = userAuth.EmployeeId, Reason = "Cannot assign to self" });
                        continue;
                    }

                    var alreadyAssigned = await _context.Assignments
                        .AnyAsync(a => a.FormId == request.FormId && a.EmployeeId == userId && a.Action == "Send");

                    if (alreadyAssigned)
                    {
                        skippedUsers.Add(new { EmployeeId = userAuth.EmployeeId, Reason = "Form already assigned" });
                        continue;
                    }

                    var assignment = new Assignment
                    {
                        FormId = request.FormId,
                        EmployeeId = userId,
                        AssignedBy = request.AssignedBy,
                        AssignedAt = DateTime.UtcNow,
                        Deadline = DateTime.UtcNow.AddDays(deadlineDays),
                        Action = request.Action
                    };

                    _context.Assignments.Add(assignment);
                    await _context.SaveChangesAsync();

                    var progressTracker = new Formprogresstracker
                    {
                        AssignmentId = assignment.AssignmentId,
                        Initiated = true,
                        SentToEmployee = request.Action == "Send",
                        EmployeeCompleted = false,
                        SentToManager = false,
                        ManagerCompleted = false,
                        SentToDeptHead = false,
                        SentToLeadership = false,
                        LastUpdated = DateTime.UtcNow
                    };

                    _context.Formprogresstrackers.Add(progressTracker);
                    await _context.SaveChangesAsync();

                    responses.Add(new
                    {
                        AssignmentId = assignment.AssignmentId,
                        EmployeeId = userAuth.EmployeeId,
                        Deadline = assignment.Deadline.HasValue
                            ? assignment.Deadline.Value.ToString("yyyy-MM-dd")
                            : string.Empty
                    });
                }

                var message = responses.Count > 0
                    ? $"Assignments created successfully for {responses.Count} employee(s)."
                    : "No assignments created. All selected employees were skipped.";

                return Ok(new
                {
                    success = true,
                    data = responses,
                    skipped = skippedUsers,
                    message = message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[ERROR] InitiateAppraisal: {ex.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("upcoming-eligible")]
        public async Task<IActionResult> GetUpcomingEligibleEmployees([FromQuery] int? formId = null)
        {
            try
            {
                var today = DateTime.UtcNow.Date;
                var reminderDays = 30;
                var reminderDate = today.AddDays(reminderDays);
                var targetMonth = reminderDate.Month;
                var currentYear = today.Year;

                var employeesWithRoles = await (
                    from ua in _context.Userauthentications
                    join emp in _context.Employees on ua.EmployeeId equals emp.EmployeeId
                    join up in _context.Userprofiles on ua.EmployeeId equals up.EmployeeId into upj
                    from up in upj.DefaultIfEmpty()
                    join ed in _context.Employeedetailsmasters on ua.EmployeeId equals ed.EmployeeId into edj
                    from ed in edj.DefaultIfEmpty()
                    join r in _context.Roles on ed.RoleId equals r.RoleId into rj
                    from r in rj.DefaultIfEmpty()
                    where ua.Status == "Active"
                        && emp.EmploymentStatus == "Active"
                        && emp.IsActive == true
                        && (r == null || (r.RoleCode != "HR" && r.RoleCode != "ADMIN" && r.RoleCode != "DEPT_HEAD" && r.RoleCode != "LEADERSHIP"))
                    select new
                    {
                        UserId = ua.UserId,
                        EmployeeId = emp.EmployeeId,
                        JoiningDate = emp.JoiningDate,
                        FirstName = up != null ? up.FirstName : null,
                        LastName = up != null ? up.LastName : null,
                        RoleCode = r != null ? r.RoleCode : null
                    }
                ).ToListAsync();

                var eligibleEmployees = employeesWithRoles
                    .Select(e =>
                    {
                        var joiningDateTime = e.JoiningDate.ToDateTime(TimeOnly.MinValue);
                        var joiningMonth = joiningDateTime.Month;
                        var firstAppraisalMonth = joiningMonth <= 4 ? 4 : joiningMonth;
                        var eligibleMonth = (joiningDateTime.AddYears(1) < today) ? 4 : firstAppraisalMonth;

                        return new
                        {
                            e.UserId,
                            e.EmployeeId,
                            JoiningDate = joiningDateTime.ToString("yyyy-MM-dd"),
                            e.FirstName,
                            e.LastName,
                            Role = e.RoleCode,
                            EligibleMonth = new DateTime(currentYear, eligibleMonth, 1).ToString("MMMM"),
                            EligibleMonthNumber = eligibleMonth,
                            IsAprilAppraisalGroup = eligibleMonth == 4
                        };
                    })
                    .Where(x => x.EligibleMonthNumber == targetMonth)
                    .ToList();

                if (formId.HasValue)
                {
                    _logger.LogInformation($"[ELIGIBLE] Filtering for formId: {formId.Value}");

                    var assignedUserIds = await _context.Assignments
                        .Where(a => a.FormId == formId.Value && a.Action == "Send")
                        .Select(a => a.EmployeeId)
                        .ToListAsync();

                    _logger.LogInformation($"[ELIGIBLE] {assignedUserIds.Count} users already have form {formId.Value}");

                    eligibleEmployees = eligibleEmployees
                        .Where(e => !assignedUserIds.Contains(e.UserId))
                        .ToList();

                    _logger.LogInformation($"[ELIGIBLE] After filtering: {eligibleEmployees.Count} employees available");
                }

                var sortedEmployees = eligibleEmployees
                    .OrderBy(x => x.FirstName)
                    .ToList();

                return Ok(new
                {
                    success = true,
                    data = sortedEmployees,
                    metadata = new
                    {
                        currentDate = today.ToString("yyyy-MM-dd"),
                        reminderDate = reminderDate.ToString("yyyy-MM-dd"),
                        targetMonth = new DateTime(currentYear, targetMonth, 1).ToString("MMMM yyyy"),
                        totalEligible = sortedEmployees.Count,
                        formId = formId,
                        filteredByForm = formId.HasValue
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[ERROR] GetUpcomingEligibleEmployees: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("available-for-form/{formId}")]
        public async Task<IActionResult> GetAvailableEmployeesForForm(int formId)
        {
            try
            {
                _logger.LogInformation($"[AVAILABLE] Getting available employees for formId: {formId}");

                var form = await _context.Assessmentforms.FindAsync(formId);
                if (form == null)
                {
                    return BadRequest(new { success = false, message = "Form not found" });
                }

                var allActiveEmployees = await (
                    from ua in _context.Userauthentications
                    join emp in _context.Employees on ua.EmployeeId equals emp.EmployeeId
                    join up in _context.Userprofiles on ua.EmployeeId equals up.EmployeeId
                    join ed in _context.Employeedetailsmasters on ua.EmployeeId equals ed.EmployeeId
                    join r in _context.Roles on ed.RoleId equals r.RoleId
                    where ua.Status == "Active"
                        && emp.EmploymentStatus == "Active"
                        && emp.IsActive == true
                        && r.RoleCode != "HR"
                        && r.RoleCode != "ADMIN"
                    select new
                    {
                        UserId = ua.UserId,
                        EmployeeId = emp.EmployeeId,
                        FirstName = up.FirstName,
                        LastName = up.LastName,
                        RoleCode = r.RoleCode,
                        JoiningDate = emp.JoiningDate.ToDateTime(TimeOnly.MinValue)
                    }
                ).ToListAsync();

                _logger.LogInformation($"[AVAILABLE] Found {allActiveEmployees.Count} total active employees");

                var assignedUserIds = await _context.Assignments
                    .Where(a => a.FormId == formId && a.Action == "Send")
                    .Select(a => a.EmployeeId)
                    .ToListAsync();

                _logger.LogInformation($"[AVAILABLE] {assignedUserIds.Count} employees already have form {formId}");

                var availableEmployees = allActiveEmployees
                    .Where(e => !assignedUserIds.Contains(e.UserId))
                    .Select(e => new
                    {
                        e.EmployeeId,
                        e.UserId,
                        EmployeeName = $"{e.FirstName} {e.LastName}".Trim(),
                        e.FirstName,
                        e.LastName,
                        e.RoleCode,
                        JoiningDate = e.JoiningDate.ToString("yyyy-MM-dd")
                    })
                    .OrderBy(e => e.FirstName)
                    .ToList();

                _logger.LogInformation($"[AVAILABLE] {availableEmployees.Count} employees available for form {formId}");

                return Ok(new
                {
                    success = true,
                    data = availableEmployees,
                    metadata = new
                    {
                        formId = formId,
                        formName = form.Name,
                        totalAvailable = availableEmployees.Count,
                        totalAlreadyAssigned = assignedUserIds.Count
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[ERROR] GetAvailableEmployeesForForm: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("employee/{employeeId}")]
        public async Task<IActionResult> GetAssignmentsByEmployeeId(int employeeId)
        {
            try
            {
                _logger.LogInformation($"[DEBUG] Fetching assignments for employeeId: {employeeId}");

                var userAuth = await _context.Userauthentications
                    .FirstOrDefaultAsync(ua => ua.EmployeeId == employeeId);

                if (userAuth == null)
                {
                    return Ok(new
                    {
                        success = true,
                        data = new List<object>(),
                        message = $"No user found for employee ID {employeeId}"
                    });
                }

                var userId = userAuth.UserId;
                _logger.LogInformation($"[DEBUG] Mapped employeeId {employeeId} to userId {userId}");

                var assignments = await _context.Assignments
                    .Where(a => a.EmployeeId == userId && a.Action == "Send")
                    .ToListAsync();

                _logger.LogInformation($"[DEBUG] Found {assignments.Count} assignments");

                if (!assignments.Any())
                {
                    return Ok(new
                    {
                        success = true,
                        data = new List<object>(),
                        message = "0 assignment(s) found."
                    });
                }

                var formIds = assignments.Select(a => a.FormId).Distinct().ToList();
                var forms = await _context.Assessmentforms
                    .Where(f => formIds.Contains(f.FormId))
                    .Include(f => f.Competencies)
                    .ToDictionaryAsync(f => f.FormId);

                var profile = await _context.Userprofiles
                    .FirstOrDefaultAsync(up => up.EmployeeId == employeeId);

                string employeeName = profile != null
                    ? $"{profile.FirstName} {profile.LastName}".Trim()
                    : $"Employee {employeeId}";

                var result = new List<object>();
                foreach (var assignment in assignments)
                {
                    var form = forms.ContainsKey(assignment.FormId) ? forms[assignment.FormId] : null;

                    var isCompleted = await _context.Selfassessments
                        .AnyAsync(sa =>
                            sa.FormId == assignment.FormId &&
                            sa.EmployeeId == userId &&
                            sa.Status == "Submitted");

                    var competenciesList = form?.Competencies?.Select(c => new
                    {
                        c.CompetencyId,
                        c.Name,
                        c.Description
                    }).ToList();

                    result.Add(new
                    {
                        assignment.AssignmentId,
                        assignment.FormId,
                        FormName = form?.Name ?? "Unknown Form",
                        FormType = form?.Type ?? "Unknown",
                        EmployeeId = employeeId,
                        EmployeeName = employeeName,
                        assignment.AssignedAt,
                        Deadline = assignment.Deadline?.ToString("yyyy-MM-dd"),
                        Competencies = competenciesList,
                        isCompleted = isCompleted
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = result,
                    message = $"{result.Count} assignment(s) found."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[ERROR] GetAssignmentsByEmployeeId: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllAssignments()
        {
            try
            {
                var assignments = await (
                    from a in _context.Assignments
                    join f in _context.Assessmentforms on a.FormId equals f.FormId
                    join ua in _context.Userauthentications on a.EmployeeId equals ua.UserId
                    join emp in _context.Employees on ua.EmployeeId equals emp.EmployeeId
                    join up in _context.Userprofiles on emp.EmployeeId equals up.EmployeeId
                    where a.Action == "Send"
                    orderby a.AssignedAt descending
                    select new
                    {
                        a.AssignmentId,
                        a.FormId,
                        FormName = f.Name,
                        FormType = f.Type,
                        a.EmployeeId,
                        EmployeeName = up.FirstName + " " + up.LastName,
                        a.Action,
                        a.AssignedAt
                    }
                ).ToListAsync();

                var result = new List<object>();

                foreach (var assignment in assignments)
                {
                    var isSubmitted = await _context.Selfassessments
                        .AnyAsync(sa =>
                            sa.FormId == assignment.FormId &&
                            sa.EmployeeId == assignment.EmployeeId &&
                            sa.Status == "Submitted");

                    result.Add(new
                    {
                        assignment.AssignmentId,
                        assignment.FormId,
                        assignment.FormName,
                        assignment.FormType,
                        assignment.EmployeeId,
                        assignment.EmployeeName,
                        assignment.Action,
                        assignment.AssignedAt,
                        IsSubmitted = isSubmitted
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = $"Error: {ex.Message}"
                });
            }
        }

        [HttpGet("drafts")]
        public async Task<IActionResult> GetDraftAssignments()
        {
            var draftAssignments = await (
                from a in _context.Assignments
                join f in _context.Assessmentforms on a.FormId equals f.FormId
                join ua in _context.Userauthentications on a.EmployeeId equals ua.UserId
                join up in _context.Userprofiles on ua.EmployeeId equals up.EmployeeId
                where a.Action == "Save as Draft"
                select new
                {
                    a.AssignmentId,
                    a.FormId,
                    FormName = f.Name,
                    a.EmployeeId,
                    EmployeeName = up.FirstName + " " + up.LastName
                })
                .ToListAsync();

            return Ok(new { success = true, data = draftAssignments });
        }

        [HttpPut("{assignmentId}")]
        public async Task<IActionResult> UpdateDraft(int assignmentId, [FromBody] UpdateDraftRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var assignment = await _context.Assignments
                    .FirstOrDefaultAsync(a => a.AssignmentId == assignmentId);

                if (assignment == null)
                    return BadRequest(new { success = false, message = "Assignment not found", data = false });

                assignment.Action = request.Action;
                assignment.AssignedAt = DateTime.UtcNow;

                _context.Assignments.Update(assignment);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Assignment updated successfully", data = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error updating assignment: {ex.Message}", data = false });
            }
        }

        [HttpGet("form/{formId}")]
        public async Task<IActionResult> GetAssignmentsByFormId(int formId)
        {
            try
            {
                var assignments = await _context.Assignments
                    .Where(a => a.FormId == formId && a.Action == "Send")
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    data = assignments
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpDelete("{assignmentId}")]
        public async Task<IActionResult> DeleteAssignment(int assignmentId)
        {
            try
            {
                var assignment = await _context.Assignments.FindAsync(assignmentId);
                if (assignment == null)
                    return NotFound(new { success = false, message = "Assignment not found" });

                _context.Assignments.Remove(assignment);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Assignment deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("{assignmentId}")]
        public async Task<IActionResult> GetAssignmentDetails(int assignmentId)
        {
            try
            {
                var assignment = await _context.Assignments
                    .Include(a => a.Form)
                    .FirstOrDefaultAsync(a => a.AssignmentId == assignmentId);

                if (assignment == null)
                    return NotFound(new { success = false, message = "Assignment not found" });

                return Ok(new { success = true, data = assignment });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
            }
        }
    }
}
