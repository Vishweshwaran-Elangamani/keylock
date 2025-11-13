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
    public class AppraisalProcessController : ControllerBase
    {
        private readonly IAppraisalProcessService _appraisalService;
        private readonly EEPZDbContext _context;
        private readonly ILogger<AppraisalProcessController> _logger;

        public AppraisalProcessController(IAppraisalProcessService appraisalService, EEPZDbContext context, ILogger<AppraisalProcessController> logger)
        {
            _appraisalService = appraisalService;
            _context = context;
            _logger = logger;
        }

        // ============================================================
        // HELPER METHODS
        // ============================================================

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

        // ============================================================
        // FORM INITIATION & ASSIGNMENT
        // ============================================================

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

                // ✅ Convert Employee.EmployeeId → Userauthentication.UserId
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

                // Calculate eligible users
                HashSet<int> eligibleUserIds = new HashSet<int>();

                if (form.Type == "Self")
                {
                    var today = DateTime.UtcNow.Date;
                    var reminderDays = 45;
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

        // ============================================================
        // EMPLOYEE & FORM QUERIES
        // ============================================================

        [HttpGet("upcoming-eligible")]
        public async Task<IActionResult> GetUpcomingEligibleEmployees([FromQuery] int? formId = null)
        {
            try
            {
                var today = DateTime.UtcNow.Date;
                var reminderDays = 45;
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
                        && (r == null || (r.RoleCode != "HR" && r.RoleCode != "ADMIN"))
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

        [HttpGet("all-managers")]
        public async Task<IActionResult> GetAllManagers()
        {
            try
            {
                var managers = await (
                    from ua in _context.Userauthentications.Include(u => u.Employee)
                    where ua.Status == "Active" && ua.Employee.EmploymentStatus == "Active" && ua.Employee.IsActive == true
                    join up in _context.Userprofiles on ua.EmployeeId equals up.EmployeeId into upj
                    from up in upj.DefaultIfEmpty()
                    join ed in _context.Employeedetailsmasters on ua.EmployeeId equals ed.EmployeeId into edj
                    from ed in edj.DefaultIfEmpty()
                    join r in _context.Roles on ed.RoleId equals r.RoleId into rj
                    from r in rj.DefaultIfEmpty()
                    where r != null && (r.RoleCode == "MGR" || r.RoleCode == "MANAGER") && r.RoleCode != "HR"
                    select new
                    {
                        UserId = ua.UserId,
                        EmployeeId = ua.Employee.EmployeeId,
                        JoiningDate = ua.Employee.JoiningDate.ToDateTime(TimeOnly.MinValue).ToString("yyyy-MM-dd"),
                        FirstName = up != null ? up.FirstName : null,
                        LastName = up != null ? up.LastName : null,
                        Role = r.RoleCode
                    }
                ).ToListAsync();

                return Ok(new { success = true, data = managers });
            }
            catch (Exception ex)
            {
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

        [HttpGet("user/{userId}/role")]
        public async Task<IActionResult> GetUserRole(int userId)
        {
            try
            {
                var userAuth = await _context.Userauthentications
                    .FirstOrDefaultAsync(u => u.UserId == userId);

                if (userAuth == null)
                    return NotFound(new { success = false, message = "User not found" });

                var userDetails = await _context.Employeedetailsmasters
                    .Include(d => d.Role)
                    .FirstOrDefaultAsync(d => d.EmployeeId == userAuth.EmployeeId);

                var roleCode = userDetails?.Role?.RoleCode ?? "UNKNOWN";

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        userId = userId,
                        roleCode = roleCode,
                        isManager = roleCode == "MGR" || roleCode == "MANAGER"
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        // ============================================================
        // DEPARTMENT HEAD APPROVAL & RATINGS
        // ============================================================

        [HttpPost("depthead/approve-employee")]
        public async Task<IActionResult> ApproveDeptHeadEmployee([FromBody] ApprovalRequestDto request)
        {
            try
            {
                var deptHeadUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(deptHeadUserIdClaim) || !int.TryParse(deptHeadUserIdClaim, out int deptHeadUserId))
                {
                    return Unauthorized(new { success = false, message = "Invalid token" });
                }

                var assessment = await _context.Selfassessments
                    .FirstOrDefaultAsync(sa => sa.AssessmentId == request.AssessmentId);

                if (assessment == null)
                {
                    return NotFound(new { success = false, message = "Assessment not found" });
                }

                var existingApproval = await _context.Departmentheadapprovals
                    .AsNoTracking()
                    .FirstOrDefaultAsync(a => a.AssessmentId == request.AssessmentId
                                           && a.EmployeeId == request.EmployeeId);

                if (existingApproval != null)
                {
                    return BadRequest(new { success = false, message = "Employee already approved" });
                }

                var approval = new Departmentheadapproval
                {
                    EmployeeId = request.EmployeeId,
                    ProjectId = request.ProjectId,
                    AssessmentId = request.AssessmentId,
                    ApprovedBy = deptHeadUserId,
                    ApprovedAt = DateTime.UtcNow,
                    Status = "Approved",
                    AcknowledgedByEmployee = false,
                    AcknowledgedAt = null,
                    EmployeeComments = null
                };

                _context.Departmentheadapprovals.Add(approval);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Employee approved successfully",
                    approvalId = approval.ApprovalId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in ApproveDeptHeadEmployee: {ex.Message}");
                _logger.LogError($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("depthead/submitted-ratings")]
        public async Task<IActionResult> GetDeptHeadSubmittedRatings()
        {
            try
            {
                _logger.LogInformation("GetDeptHeadSubmittedRatings called");

                var allApprovals = await _context.Departmentheadapprovals.AsNoTracking().ToListAsync();

                var profiles = await _context.Userprofiles.AsNoTracking().ToListAsync();
                var userAuths = await _context.Userauthentications.AsNoTracking().ToListAsync();
                var projects = await _context.Projects.AsNoTracking().ToListAsync();
                var projectEmployees = await _context.Projectemployees.AsNoTracking().ToListAsync();

                var selfAssessments = await _context.Selfassessments
                    .Include(sa => sa.Assessmentdetails)
                    .ThenInclude(ad => ad.Competency)
                    .Where(sa => sa.Status == "Submitted")
                    .AsNoTracking()
                    .ToListAsync();

                var reviews = await _context.Assessmentreviews.AsNoTracking().ToListAsync();

                var allEmployeeIds = projectEmployees.Select(pe => pe.EmployeeId).Distinct().ToList();
                var allGoalAssignments = await _context.GoalAssignments
                    .Where(ga => ga.AssignedTo.HasValue && allEmployeeIds.Contains(ga.AssignedTo.Value))
                    .ToListAsync();

                var allGoalIds = allGoalAssignments.Select(ga => ga.GoalId).Distinct().ToList();
                var allGoals = await _context.Goals
                    .Where(g => allGoalIds.Contains(g.GoalId))
                    .Include(g => g.GoalComments)
                    .Include(g => g.Goalprogresslogs)
                    .Include(g => g.GoalAssignments)
                    .Include(g => g.GoalChecklists)
                        .ThenInclude(cl => cl.Goalchecklistprogresses)
                    .Include(g => g.GoalAttachments)
                    .ToListAsync();

                var results = new List<object>();

                foreach (var pe in projectEmployees)
                {
                    try
                    {
                        var profile = profiles.FirstOrDefault(up => up.EmployeeId == pe.EmployeeId);
                        if (profile == null) continue;

                        var userAuth = userAuths.FirstOrDefault(ua => ua.EmployeeId == pe.EmployeeId);
                        if (userAuth == null) continue;

                        var project = projects.FirstOrDefault(p => p.ProjectId == pe.ProjectId);
                        if (project == null) continue;

                        var selfAssessment = selfAssessments
                            .Where(sa => sa.EmployeeId == userAuth.UserId)
                            .OrderByDescending(sa => sa.SubmittedAt)
                            .FirstOrDefault();

                        if (selfAssessment == null || !selfAssessment.Assessmentdetails.Any())
                            continue;

                        if (allApprovals.Any(a =>
                            a.EmployeeId == pe.EmployeeId &&
                            a.ProjectId == pe.ProjectId &&
                            a.AssessmentId == selfAssessment.AssessmentId &&
                            a.Status == "Approved"
                        ))
                        {
                            continue;
                        }

                        var l1Auth = project.L1approverEmployeeId.HasValue
                            ? userAuths.FirstOrDefault(ua => ua.EmployeeId == project.L1approverEmployeeId)
                            : null;

                        var l2Auth = project.L2approverEmployeeId.HasValue
                            ? userAuths.FirstOrDefault(ua => ua.EmployeeId == project.L2approverEmployeeId)
                            : null;

                        bool hasL1 = l1Auth != null;
                        bool hasL2 = l2Auth != null;

                        bool allL1Approved = hasL1 && selfAssessment.Assessmentdetails.All(d =>
                            reviews.Any(r => r.DetailId == d.DetailId && r.ReviewerId == l1Auth.UserId && r.ReviewStatus == "Approved"));

                        bool allL2Approved = hasL2 && selfAssessment.Assessmentdetails.All(d =>
                            reviews.Any(r => r.DetailId == d.DetailId && r.ReviewerId == l2Auth.UserId && r.ReviewStatus == "Approved"));

                        bool showRecord =
                            (hasL1 && hasL2 && (allL1Approved || allL2Approved)) ||
                            (hasL1 && !hasL2 && allL1Approved) ||
                            (!hasL1 && hasL2 && allL2Approved) ||
                            (!hasL1 && !hasL2);

                        if (!showRecord)
                            continue;

                        var competencies = selfAssessment.Assessmentdetails.Select(detail =>
                        {
                            var l1Review = hasL1 ? reviews.FirstOrDefault(r => r.DetailId == detail.DetailId && r.ReviewerId == l1Auth.UserId) : null;
                            var l2Review = hasL2 ? reviews.FirstOrDefault(r => r.DetailId == detail.DetailId && r.ReviewerId == l2Auth.UserId) : null;

                            string status;
                            if (detail.EmployeeRating == null || string.IsNullOrEmpty(detail.EmployeeComments))
                                status = "Pending";
                            else if (!hasL1 && !hasL2)
                                status = "Pending Review";
                            else if ((hasL1 && l1Review == null) || (hasL2 && l2Review == null))
                                status = "Pending Assessment";
                            else
                                status = "Completed";

                            string l1ReviewerName = "No L1";
                            if (hasL1 && project.L1approverEmployeeId.HasValue)
                            {
                                var l1Profile = profiles.FirstOrDefault(p => p.EmployeeId == project.L1approverEmployeeId);
                                if (l1Profile != null)
                                {
                                    l1ReviewerName = $"{l1Profile.FirstName ?? ""} {l1Profile.LastName ?? ""}".Trim();
                                    if (string.IsNullOrEmpty(l1ReviewerName))
                                        l1ReviewerName = "L1 Reviewer";
                                }
                            }

                            string l2ReviewerName = "No L2";
                            if (hasL2 && project.L2approverEmployeeId.HasValue)
                            {
                                var l2Profile = profiles.FirstOrDefault(p => p.EmployeeId == project.L2approverEmployeeId);
                                if (l2Profile != null)
                                {
                                    l2ReviewerName = $"{l2Profile.FirstName ?? ""} {l2Profile.LastName ?? ""}".Trim();
                                    if (string.IsNullOrEmpty(l2ReviewerName))
                                        l2ReviewerName = "L2 Reviewer";
                                }
                            }

                            return new
                            {
                                CompetencyName = detail.Competency?.Name ?? "Unknown",
                                EmployeeRating = detail.EmployeeRating,
                                EmployeeComments = detail.EmployeeComments,
                                L1ReviewerName = l1ReviewerName,
                                L1Rating = l1Review?.Rating,
                                L1Comments = l1Review?.Comments,
                                L1ReviewStatus = l1Review?.ReviewStatus,
                                L2ReviewerName = l2ReviewerName,
                                L2Rating = l2Review?.Rating,
                                L2Comments = l2Review?.Comments,
                                L2ReviewStatus = l2Review?.ReviewStatus,
                                Status = status
                            };
                        }).ToList();

                        var employeeGoalIds = allGoalAssignments
                            .Where(ga => ga.AssignedTo.HasValue && ga.AssignedTo.Value == pe.EmployeeId)
                            .Select(ga => ga.GoalId)
                            .Distinct()
                            .ToList();

                        var employeeGoals = allGoals
                            .Where(g => employeeGoalIds.Contains(g.GoalId))
                            .ToList();

                        var formattedGoals = employeeGoals.Select(g => new
                        {
                            g.GoalId,
                            g.GoalTitle,
                            g.GoalDescription,
                            g.Goalstatus,
                            GoalComments = g.GoalComments.Select(c => new
                            {
                                c.Goalcommentid,
                                Comment = c.GoalComment1,
                                c.CommentedOn
                            }),
                            GoalProgressLogs = g.Goalprogresslogs.Select(p => new
                            {
                                p.ProgressId,
                                p.ProgressPercent,
                                p.UpdatedOn
                            }),
                            GoalAssignments = g.GoalAssignments.Select(a => new
                            {
                                a.AssignmentId,
                                a.AssignedBy,
                                a.AssignedOn
                            }),
                            GoalChecklists = g.GoalChecklists.Select(cl => new
                            {
                                cl.ChecklistId,
                                cl.ItemTitle,
                                cl.ItemDescription,
                                Progresses = cl.Goalchecklistprogresses.Select(p => new
                                {
                                    p.ChecklistProgressId,
                                    p.IsCompleted,
                                    p.CompletedOn
                                })
                            }),
                            GoalAttachments = g.GoalAttachments.Select(att => new
                            {
                                att.Goalattachmentsid,
                                att.AttachmentTitle,
                                att.Attachments,
                                att.AttachedOn
                            })
                        }).ToList();

                        string employeeName = $"{profile.FirstName ?? ""} {profile.LastName ?? ""}".Trim();
                        if (string.IsNullOrEmpty(employeeName))
                            employeeName = $"Employee {pe.EmployeeId}";

                        results.Add(new
                        {
                            EmployeeId = pe.EmployeeId,
                            EmployeeName = employeeName,
                            ProjectId = project.ProjectId,
                            ProjectName = project.ProjectName ?? "Unknown",
                            AssessmentId = selfAssessment.AssessmentId,
                            Competencies = competencies,
                            Goals = formattedGoals
                        });
                    }
                    catch (Exception innerEx)
                    {
                        _logger.LogError($"Error processing employee {pe.EmployeeId}: {innerEx.Message}");
                        continue;
                    }
                }

                _logger.LogInformation($"Returning {results.Count} employees for department head review");
                return Ok(new { success = true, data = results });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in GetDeptHeadSubmittedRatings: {ex.Message}");
                _logger.LogError($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to fetch submitted ratings",
                    error = ex.Message
                });
            }
        }

        [HttpGet("manager/approved-employees")]
        public async Task<IActionResult> GetManagerApprovedEmployees(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 5)
        {
            try
            {
                var totalRecords = await _context.Departmentheadapprovals
                    .Where(a => a.Status == "Approved" || a.Status == null)
                    .CountAsync();

                var approvals = await _context.Departmentheadapprovals
                    .Where(a => a.Status == "Approved" || a.Status == null)
                    .OrderByDescending(a => a.ApprovedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .AsNoTracking()
                    .ToListAsync();

                var results = new List<object>();

                foreach (var approval in approvals)
                {
                    try
                    {
                        _logger.LogInformation($"Processing ApprovalId: {approval.ApprovalId}, EmployeeId: {approval.EmployeeId}");

                        var pe = await _context.Projectemployees
                            .AsNoTracking()
                            .FirstOrDefaultAsync(x => x.EmployeeId == approval.EmployeeId);

                        if (pe == null)
                        {
                            _logger.LogWarning($"ProjectEmployee not found for EmployeeId: {approval.EmployeeId}");

                            var empMaster = await _context.Employeedetailsmasters
                                .AsNoTracking()
                                .FirstOrDefaultAsync(x => x.EmployeeMasterId == approval.EmployeeId);

                            if (empMaster == null)
                            {
                                _logger.LogWarning($"EmployeeDetailsMaster not found");
                                continue;
                            }

                            pe = await _context.Projectemployees
                                .AsNoTracking()
                                .FirstOrDefaultAsync(x => x.EmployeeId == empMaster.EmployeeId);

                            if (pe == null)
                            {
                                _logger.LogWarning($"Still no ProjectEmployee found");
                                continue;
                            }
                        }

                        var profile = await _context.Userprofiles
                            .AsNoTracking()
                            .FirstOrDefaultAsync(x => x.EmployeeId == pe.EmployeeId);

                        if (profile == null)
                        {
                            _logger.LogWarning($"Profile not found for EmployeeId: {pe.EmployeeId}");
                            continue;
                        }

                        var project = await _context.Projects
                            .AsNoTracking()
                            .FirstOrDefaultAsync(x => x.ProjectId == approval.ProjectId);

                        if (project == null)
                        {
                            _logger.LogWarning($"Project not found for ProjectId: {approval.ProjectId}");
                            continue;
                        }

                        string employeeName = $"{profile.FirstName ?? ""} {profile.LastName ?? ""}".Trim();
                        if (string.IsNullOrEmpty(employeeName))
                            employeeName = $"Employee {approval.EmployeeId}";

                        results.Add(new
                        {
                            ApprovalId = approval.ApprovalId,
                            EmployeeId = approval.EmployeeId,
                            EmployeeName = employeeName,
                            ProjectName = project.ProjectName ?? "Unknown",
                            ApprovedAt = approval.ApprovedAt
                        });

                        _logger.LogInformation($"Successfully processed ApprovalId: {approval.ApprovalId}");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError($"Error processing approval {approval.ApprovalId}: {ex.Message}");
                        continue;
                    }
                }

                _logger.LogInformation($"Returning {results.Count} approved employees out of {totalRecords} total");

                return Ok(new
                {
                    success = true,
                    data = results,
                    totalRecords = totalRecords,
                    currentPage = page,
                    totalPages = totalRecords > 0 ? (int)Math.Ceiling((double)totalRecords / pageSize) : 0
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Fatal error in GetManagerApprovedEmployees: {ex.Message}");
                _logger.LogError($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ============================================================
        // EMPLOYEE ACKNOWLEDGMENTS
        // ============================================================

        [HttpGet("employee/pending-acknowledgments")]
        public async Task<IActionResult> GetPendingAcknowledgments()
        {
            try
            {
                var claimDump = string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}"));
                _logger.LogWarning($"EMPLOYEE PENDING ACK: Claims available: {claimDump}");

                var employeeIdClaim = User.FindFirst("empMasterId")?.Value
                                   ?? User.FindFirst("EmployeeId")?.Value
                                   ?? User.FindFirst("employeeId")?.Value;
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                               ?? User.FindFirst("userId")?.Value
                               ?? User.FindFirst("sub")?.Value;

                int.TryParse(employeeIdClaim, out int employeeId);
                int.TryParse(userIdClaim, out int userId);

                if (employeeId == 0 && userId == 0)
                    return Unauthorized(new { success = false, message = "Could not identify employee in token" });

                _logger.LogWarning($"EMPLOYEE PENDING ACK: Matching EmployeeId={employeeId} or UserId={userId}");

                var pendingApprovals = await _context.Departmentheadapprovals
                    .Where(a =>
                        (a.EmployeeId == employeeId || a.EmployeeId == userId)
                        && (a.Status == "Approved" || a.Status == null)
                        && a.AcknowledgedByEmployee == false)
                    .OrderByDescending(a => a.ApprovedAt)
                    .ToListAsync();

                _logger.LogWarning($"EMPLOYEE PENDING ACK: Found {pendingApprovals.Count} records");

                var results = new List<object>();

                foreach (var approval in pendingApprovals)
                {
                    try
                    {
                        var project = await _context.Projects.FirstOrDefaultAsync(p => p.ProjectId == approval.ProjectId);
                        if (project == null) continue;

                        var assessment = await _context.Selfassessments
                            .Include(sa => sa.Assessmentdetails)
                            .ThenInclude(ad => ad.Competency)
                            .FirstOrDefaultAsync(sa => sa.AssessmentId == approval.AssessmentId);

                        if (assessment == null) continue;

                        var detailIds = assessment.Assessmentdetails.Select(d => d.DetailId).ToList();
                        var reviews = await _context.Assessmentreviews
                            .Where(r => detailIds.Contains(r.DetailId)).ToListAsync();

                        var l1Name = "No L1";
                        var l2Name = "No L2";
                        int? l1UserId = null, l2UserId = null;

                        if (project.L1approverEmployeeId.HasValue)
                        {
                            var l1Profile = await _context.Userprofiles.FirstOrDefaultAsync(up => up.EmployeeId == project.L1approverEmployeeId);
                            if (l1Profile != null)
                                l1Name = $"{l1Profile.FirstName ?? ""} {l1Profile.LastName ?? ""}".Trim();
                            var l1Auth = await _context.Userauthentications.FirstOrDefaultAsync(ua => ua.EmployeeId == project.L1approverEmployeeId);
                            l1UserId = l1Auth?.UserId;
                        }
                        if (project.L2approverEmployeeId.HasValue)
                        {
                            var l2Profile = await _context.Userprofiles.FirstOrDefaultAsync(up => up.EmployeeId == project.L2approverEmployeeId);
                            if (l2Profile != null)
                                l2Name = $"{l2Profile.FirstName ?? ""} {l2Profile.LastName ?? ""}".Trim();
                            var l2Auth = await _context.Userauthentications.FirstOrDefaultAsync(ua => ua.EmployeeId == project.L2approverEmployeeId);
                            l2UserId = l2Auth?.UserId;
                        }

                        var competencies = assessment.Assessmentdetails.Select(detail =>
                        {
                            var l1Review = l1UserId.HasValue ? reviews.FirstOrDefault(r => r.DetailId == detail.DetailId && r.ReviewerId == l1UserId) : null;
                            var l2Review = l2UserId.HasValue ? reviews.FirstOrDefault(r => r.DetailId == detail.DetailId && r.ReviewerId == l2UserId) : null;

                            return new
                            {
                                CompetencyName = detail.Competency?.Name ?? "Unknown",
                                EmployeeRating = detail.EmployeeRating,
                                EmployeeComments = detail.EmployeeComments,
                                L1ReviewerName = l1Name,
                                L1Rating = l1Review?.Rating,
                                L1Comments = l1Review?.Comments,
                                L2ReviewerName = l2Name,
                                L2Rating = l2Review?.Rating,
                                L2Comments = l2Review?.Comments
                            };
                        }).ToList();

                        results.Add(new
                        {
                            ApprovalId = approval.ApprovalId,
                            ProjectName = project.ProjectName ?? "Unknown",
                            ApprovedAt = approval.ApprovedAt,
                            Competencies = competencies
                        });
                    }
                    catch (Exception innerEx)
                    {
                        _logger.LogWarning($"Error processing approval {approval.ApprovalId}: {innerEx.Message}");
                        continue;
                    }
                }

                return Ok(new { success = true, data = results });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in GetPendingAcknowledgments: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("employee/acknowledge")]
        public async Task<IActionResult> AcknowledgeRating([FromBody] AcknowledgeRequestDto request)
        {
            try
            {
                var employeeIdClaim = User.FindFirst("empMasterId")?.Value
                                   ?? User.FindFirst("EmployeeId")?.Value
                                   ?? User.FindFirst("employeeId")?.Value;
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                               ?? User.FindFirst("userId")?.Value
                               ?? User.FindFirst("sub")?.Value;

                int.TryParse(employeeIdClaim, out int employeeId);
                int.TryParse(userIdClaim, out int userId);

                _logger.LogInformation($"ACK (POST): ApprovalId={request.ApprovalId}, EmpId={employeeId}, UserId={userId}");

                var myApprovals = await _context.Departmentheadapprovals
                    .Where(a => (a.EmployeeId == employeeId || a.EmployeeId == userId))
                    .Select(a => new { a.ApprovalId, a.EmployeeId })
                    .ToListAsync();
                _logger.LogInformation($"ACK (POST) Approvals for this user: [{string.Join(", ", myApprovals.Select(a => $"id:{a.ApprovalId},emp:{a.EmployeeId}"))}]");

                var approval = await _context.Departmentheadapprovals
                    .FirstOrDefaultAsync(a =>
                        a.ApprovalId == request.ApprovalId &&
                        (a.EmployeeId == employeeId || a.EmployeeId == userId)
                    );

                if (approval == null)
                {
                    _logger.LogWarning($"ACK (POST) NOT FOUND: approvalId={request.ApprovalId}, empId={employeeId}, userId={userId}");
                    return NotFound(new
                    {
                        success = false,
                        message = $"Approval record not found for ApprovalId={request.ApprovalId}, EmployeeId={employeeId}, UserId={userId}"
                    });
                }

                if (approval.AcknowledgedByEmployee)
                    return BadRequest(new { success = false, message = "Already acknowledged" });

                approval.AcknowledgedByEmployee = true;
                approval.AcknowledgedAt = DateTime.UtcNow;
                approval.EmployeeComments = request.Comments;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"ACK (POST) SUCCESS: Employee {employeeId} or User {userId} acknowledged {request.ApprovalId}");

                return Ok(new
                {
                    success = true,
                    message = "Rating acknowledged successfully",
                    acknowledgedAt = approval.AcknowledgedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in AcknowledgeRating: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("manager/employee-acknowledged-comments")]
        public async Task<IActionResult> GetEmployeeAcknowledgedComments()
        {
            var managerIdClaim = User.FindFirst("empMasterId")?.Value
                              ?? User.FindFirst("EmployeeId")?.Value
                              ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int.TryParse(managerIdClaim, out int managerId);

            var acknowledgments = await _context.Departmentheadapprovals
                .Where(a => a.AcknowledgedByEmployee == true)
                .Join(_context.Userprofiles,
                      appr => appr.EmployeeId,
                      prof => prof.EmployeeId,
                      (appr, prof) => new
                      {
                          EmployeeName = (prof.FirstName ?? "") + " " + (prof.LastName ?? ""),
                          EmployeeComments = appr.EmployeeComments,
                          AcknowledgedAt = appr.AcknowledgedAt
                      })
                .OrderByDescending(x => x.AcknowledgedAt)
                .ToListAsync();

            return Ok(new { success = true, data = acknowledgments });
        }

        // ============================================================
        // ALL DETAILS (L1/L2 REVIEWS)
        // ============================================================

        [HttpGet("all-details")]
        public async Task<IActionResult> GetAllDetails()
        {
            try
            {
                var profiles = await _context.Userprofiles.AsNoTracking().ToListAsync();
                var userAuths = await _context.Userauthentications.AsNoTracking().ToListAsync();
                var projects = await _context.Projects.AsNoTracking().ToListAsync();
                var projectEmployees = await _context.Projectemployees.AsNoTracking().ToListAsync();

                var selfAssessments = await _context.Selfassessments
                    .Include(sa => sa.Assessmentdetails)
                    .ThenInclude(ad => ad.Competency)
                    .AsNoTracking()
                    .ToListAsync();

                var reviews = await _context.Assessmentreviews.AsNoTracking().ToListAsync();

                var assignments = await _context.Assignments
                    .Where(a => a.Action == "Send")
                    .Include(a => a.Form)
                        .ThenInclude(f => f.Competencies)
                    .AsNoTracking()
                    .ToListAsync();

                var results = new List<object>();

                foreach (var assignment in assignments)
                {
                    var userAuth = userAuths.FirstOrDefault(ua => ua.UserId == assignment.EmployeeId);
                    if (userAuth == null) continue;

                    var profile = profiles.FirstOrDefault(p => p.EmployeeId == userAuth.EmployeeId);
                    if (profile == null) continue;

                    var pe = projectEmployees.FirstOrDefault(x => x.EmployeeId == profile.EmployeeId);
                    var project = pe != null ? projects.FirstOrDefault(p => p.ProjectId == pe.ProjectId) : null;

                    var selfAssessment = selfAssessments
                        .Where(sa => sa.EmployeeId == assignment.EmployeeId && sa.FormId == assignment.FormId)
                        .OrderByDescending(sa => sa.SubmittedAt)
                        .FirstOrDefault();

                    var l1Auth = project?.L1approverEmployeeId.HasValue == true
                        ? userAuths.FirstOrDefault(ua => ua.EmployeeId == project.L1approverEmployeeId)
                        : null;

                    var l2Auth = project?.L2approverEmployeeId.HasValue == true
                        ? userAuths.FirstOrDefault(ua => ua.EmployeeId == project.L2approverEmployeeId)
                        : null;

                    bool hasL1 = l1Auth != null;
                    bool hasL2 = l2Auth != null;

                    var competencies = new List<object>();

                    if (selfAssessment != null && selfAssessment.Assessmentdetails != null && selfAssessment.Assessmentdetails.Any())
                    {
                        foreach (var detail in selfAssessment.Assessmentdetails)
                        {
                            var l1Review = hasL1 ? reviews.FirstOrDefault(r => r.DetailId == detail.DetailId && r.ReviewerId == l1Auth.UserId) : null;
                            var l2Review = hasL2 ? reviews.FirstOrDefault(r => r.DetailId == detail.DetailId && r.ReviewerId == l2Auth.UserId) : null;

                            string status;
                            if (detail.EmployeeRating == null || string.IsNullOrEmpty(detail.EmployeeComments))
                                status = "Pending";
                            else if (!hasL1 && !hasL2)
                                status = "Pending Review";
                            else if ((hasL1 && l1Review == null) || (hasL2 && l2Review == null))
                                status = "Pending Assessment";
                            else
                                status = "Completed";

                            string l1ReviewerName = "No L1";
                            if (hasL1 && project.L1approverEmployeeId.HasValue)
                            {
                                var l1Profile = profiles.FirstOrDefault(p => p.EmployeeId == project.L1approverEmployeeId);
                                if (l1Profile != null)
                                {
                                    l1ReviewerName = $"{l1Profile.FirstName ?? ""} {l1Profile.LastName ?? ""}".Trim();
                                    if (string.IsNullOrEmpty(l1ReviewerName))
                                        l1ReviewerName = "L1 Reviewer";
                                }
                            }

                            string l2ReviewerName = "No L2";
                            if (hasL2 && project.L2approverEmployeeId.HasValue)
                            {
                                var l2Profile = profiles.FirstOrDefault(p => p.EmployeeId == project.L2approverEmployeeId);
                                if (l2Profile != null)
                                {
                                    l2ReviewerName = $"{l2Profile.FirstName ?? ""} {l2Profile.LastName ?? ""}".Trim();
                                    if (string.IsNullOrEmpty(l2ReviewerName))
                                        l2ReviewerName = "L2 Reviewer";
                                }
                            }

                            competencies.Add(new
                            {
                                CompetencyName = detail.Competency?.Name ?? "Unknown",
                                EmployeeRating = detail.EmployeeRating,
                                EmployeeComments = detail.EmployeeComments,
                                L1ReviewerName = l1ReviewerName,
                                L1Rating = l1Review?.Rating,
                                L1Comments = l1Review?.Comments,
                                L1ReviewStatus = l1Review?.ReviewStatus,
                                L2ReviewerName = l2ReviewerName,
                                L2Rating = l2Review?.Rating,
                                L2Comments = l2Review?.Comments,
                                L2ReviewStatus = l2Review?.ReviewStatus,
                                Status = status
                            });
                        }
                    }
                    else
                    {
                        var formComps = assignment.Form?.Competencies ?? new List<Competency>();
                        foreach (var fc in formComps)
                        {
                            string l1ReviewerName = hasL1 && project?.L1approverEmployeeId.HasValue == true
                                ? $"{(profiles.FirstOrDefault(p => p.EmployeeId == project.L1approverEmployeeId)?.FirstName ?? "")} {(profiles.FirstOrDefault(p => p.EmployeeId == project.L1approverEmployeeId)?.LastName ?? "")}".Trim()
                                : "No L1";

                            string l2ReviewerName = hasL2 && project?.L2approverEmployeeId.HasValue == true
                                ? $"{(profiles.FirstOrDefault(p => p.EmployeeId == project.L2approverEmployeeId)?.FirstName ?? "")} {(profiles.FirstOrDefault(p => p.EmployeeId == project.L2approverEmployeeId)?.LastName ?? "")}".Trim()
                                : "No L2";

                            competencies.Add(new
                            {
                                CompetencyName = fc.Name ?? "Unknown",
                                EmployeeRating = (int?)null,
                                EmployeeComments = string.Empty,
                                L1ReviewerName = l1ReviewerName,
                                L1Rating = (int?)null,
                                L1Comments = string.Empty,
                                L1ReviewStatus = string.Empty,
                                L2ReviewerName = l2ReviewerName,
                                L2Rating = (int?)null,
                                L2Comments = string.Empty,
                                L2ReviewStatus = string.Empty,
                                Status = "Pending"
                            });
                        }
                    }

                    results.Add(new
                    {
                        EmployeeId = profile.EmployeeId,
                        EmployeeName = $"{profile.FirstName} {profile.LastName}",
                        ProjectName = project?.ProjectName ?? string.Empty,
                        Competencies = competencies,
                        Goals = new List<object>()
                    });
                }

                return Ok(new { success = true, data = results });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
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
