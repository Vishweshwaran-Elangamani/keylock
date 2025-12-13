using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;

namespace PerformanceManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DeptHeadApprovalsController : ControllerBase
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<DeptHeadApprovalsController> _logger;

        public DeptHeadApprovalsController(EEPZDbContext context, ILogger<DeptHeadApprovalsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost("approve-employee")]
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

        [HttpGet("submitted-ratings")]
        public async Task<IActionResult> GetDeptHeadSubmittedRatings([FromQuery] int? departmentHeadId)
        {
            try
            {
                _logger.LogInformation($"GetDeptHeadSubmittedRatings called with departmentHeadId: {departmentHeadId}");

                int? deptHeadEmployeeId = departmentHeadId;

                if (!deptHeadEmployeeId.HasValue)
                {
                    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int userId))
                    {
                        var userAuth = await _context.Userauthentications
                            .FirstOrDefaultAsync(u => u.UserId == userId);

                        if (userAuth != null)
                        {
                            deptHeadEmployeeId = userAuth.EmployeeId;
                        }
                    }
                }

                _logger.LogInformation($"Department Head Employee ID being used: {deptHeadEmployeeId}");

                var profiles = await _context.Userprofiles.AsNoTracking().ToListAsync();
                var userAuths = await _context.Userauthentications.AsNoTracking().ToListAsync();
                var projects = await _context.Projects.AsNoTracking().ToListAsync();
                var projectEmployees = await _context.Projectemployees.AsNoTracking().ToListAsync();

                if (deptHeadEmployeeId.HasValue)
                {
                    var deptHeadDeptId = await _context.Employeedetailsmasters
                        .Where(edm => edm.EmployeeId == deptHeadEmployeeId.Value)
                        .Select(edm => edm.DepartmentId)
                        .FirstOrDefaultAsync();

                    if (deptHeadDeptId > 0)
                    {
                        _logger.LogInformation($"Filtering by Department ID: {deptHeadDeptId}");

                        var departmentEmployeeIds = await _context.Employeedetailsmasters
                            .Where(edm => edm.DepartmentId == deptHeadDeptId)
                            .Select(edm => edm.EmployeeId)
                            .ToListAsync();

                        projectEmployees = projectEmployees
                            .Where(pe => departmentEmployeeIds.Contains(pe.EmployeeId))
                            .ToList();
                    }
                }

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

                var allGoals = allGoalIds.Any()
                    ? await _context.Goals
                        .Where(g => allGoalIds.Contains(g.GoalId))
                        .Include(g => g.GoalComments)
                        .Include(g => g.Goalprogresslogs)
                        .Include(g => g.GoalAssignments)
                        .Include(g => g.GoalChecklists)
                            .ThenInclude(cl => cl.Goalchecklistprogresses)
                        .Include(g => g.GoalAttachments)
                        .ToListAsync()
                    : new List<Goal>();

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

                        var employeeAssessments = selfAssessments
                            .Where(sa => sa.EmployeeId == userAuth.UserId &&
                                         sa.Assessmentdetails != null &&
                                         sa.Assessmentdetails.Any())
                            .OrderByDescending(sa => sa.SubmittedAt)
                            .ToList();

                        if (!employeeAssessments.Any()) continue;

                        foreach (var selfAssessment in employeeAssessments)
                        {
                            var approval = await _context.Departmentheadapprovals
                                .AsNoTracking()
                                .FirstOrDefaultAsync(a =>
                                    a.EmployeeId == pe.EmployeeId &&
                                    a.ProjectId == pe.ProjectId &&
                                    a.AssessmentId == selfAssessment.AssessmentId &&
                                    a.Status == "Approved");

                            if (approval != null)
                            {
                                _logger.LogDebug($"Skipping AssessmentId {selfAssessment.AssessmentId} - Already department head approved");
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
                            bool allL2Approved = false;

                            if (hasL2)
                            {
                                allL2Approved = selfAssessment.Assessmentdetails.All(detail =>
                                    reviews.Any(r =>
                                        r.DetailId == detail.DetailId &&
                                        r.ReviewerId == l2Auth.UserId &&
                                        r.ReviewerRole == "Reviewer" &&
                                        r.ReviewStatus == "Approved"));
                            }

                            if (!hasL2)
                            {
                                _logger.LogDebug($"Skipping AssessmentId {selfAssessment.AssessmentId} - No L2 reviewer configured");
                                continue;
                            }

                            if (!allL2Approved)
                            {
                                _logger.LogDebug($"Skipping AssessmentId {selfAssessment.AssessmentId} - L2 has not approved all details");
                                continue;
                            }

                            _logger.LogInformation($" Including AssessmentId {selfAssessment.AssessmentId} - L2 approved");

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

                            var competencies = selfAssessment.Assessmentdetails.Select(detail =>
                            {
                                var l1Review = hasL1 ? reviews.FirstOrDefault(r =>
                                    r.DetailId == detail.DetailId &&
                                    r.ReviewerId == l1Auth.UserId &&
                                    r.ReviewerRole == "Approver") : null;

                                var l2Review = hasL2 ? reviews.FirstOrDefault(r =>
                                    r.DetailId == detail.DetailId &&
                                    r.ReviewerId == l2Auth.UserId &&
                                    r.ReviewerRole == "Reviewer") : null;

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
                                    Status = "Completed"
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

                            var employeeDetails = await _context.Employeedetailsmasters
                                .Where(edm => edm.EmployeeId == pe.EmployeeId)
                                .FirstOrDefaultAsync();

                            results.Add(new
                            {
                                EmployeeId = pe.EmployeeId,
                                EmployeeName = employeeName,
                                EmployeeCompanyId = employeeDetails?.EmployeeMasterId.ToString() ?? "",
                                ProjectId = project.ProjectId,
                                ProjectName = project.ProjectName ?? "Unknown",
                                AssessmentId = selfAssessment.AssessmentId,
                                Competencies = competencies,
                                Goals = formattedGoals
                            });
                        }
                    }
                    catch (Exception innerEx)
                    {
                        _logger.LogError($"Error processing employee {pe.EmployeeId}: {innerEx.Message}");
                        continue;
                    }
                }

                _logger.LogInformation($"Returning {results.Count} assessments for department head review");
                return Ok(new { success = true, data = results });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in GetDeptHeadSubmittedRatings: {ex.Message}");
                _logger.LogError($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { success = false, message = "Failed to fetch submitted ratings", error = ex.Message });
            }
        }

        [HttpGet("approved-employees")]
        public async Task<IActionResult> GetManagerApprovedEmployees(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 5,
            [FromQuery] int? departmentHeadId = null)
        {
            try
            {
                int? deptHeadEmployeeId = departmentHeadId;

                if (!deptHeadEmployeeId.HasValue)
                {
                    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int userId))
                    {
                        var userAuth = await _context.Userauthentications
                            .FirstOrDefaultAsync(u => u.UserId == userId);

                        if (userAuth != null)
                        {
                            deptHeadEmployeeId = userAuth.EmployeeId;
                        }
                    }
                }

                _logger.LogInformation($"GetManagerApprovedEmployees - Department Head ID: {deptHeadEmployeeId}, Page: {page}");

                IQueryable<Departmentheadapproval> approvalQuery = _context.Departmentheadapprovals
                    .Where(a => a.Status == "Approved" || a.Status == null);

                if (deptHeadEmployeeId.HasValue)
                {
                    var deptHeadDeptId = await _context.Employeedetailsmasters
                        .Where(edm => edm.EmployeeId == deptHeadEmployeeId.Value)
                        .Select(edm => edm.DepartmentId)
                        .FirstOrDefaultAsync();

                    if (deptHeadDeptId > 0)
                    {
                        _logger.LogInformation($"Filtering approved employees by Department ID: {deptHeadDeptId}");

                        var departmentEmployeeIds = await _context.Employeedetailsmasters
                            .Where(edm => edm.DepartmentId == deptHeadDeptId)
                            .Select(edm => edm.EmployeeId)
                            .ToListAsync();

                        approvalQuery = approvalQuery.Where(a => departmentEmployeeIds.Contains(a.EmployeeId));
                    }
                }

                var totalRecords = await approvalQuery.CountAsync();

                var approvals = await approvalQuery
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

        [HttpGet("employee/pending-acknowledgments")]
        public async Task<IActionResult> GetPendingAcknowledgments()
        {
            try
            {
                var claimDump = string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}"));
                _logger.LogWarning($"[EMPLOYEE PENDING ACK] Claims available: {claimDump}");

                var employeeIdClaim = User.FindFirst("empMasterId")?.Value
                                   ?? User.FindFirst("EmployeeId")?.Value
                                   ?? User.FindFirst("employeeId")?.Value;

                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                               ?? User.FindFirst("userId")?.Value
                               ?? User.FindFirst("sub")?.Value;

                int.TryParse(employeeIdClaim, out int employeeId);
                int.TryParse(userIdClaim, out int userId);

                if (employeeId == 0 && userId == 0)
                {
                    return Unauthorized(new { success = false, message = "Could not identify employee in token" });
                }

                _logger.LogWarning($"[EMPLOYEE PENDING ACK] Matching EmployeeId={employeeId} or UserId={userId}");

                var pendingApprovals = await _context.Departmentheadapprovals
                    .Where(a => (a.EmployeeId == employeeId || a.EmployeeId == userId) &&
                               (a.Status == "Approved" || a.Status == null) &&
                               a.AcknowledgedByEmployee == false)
                    .OrderByDescending(a => a.ApprovedAt)
                    .ToListAsync();

                _logger.LogWarning($"[EMPLOYEE PENDING ACK] Found {pendingApprovals.Count} records");

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

                _logger.LogInformation($"[ACK POST] ApprovalId={request.ApprovalId}, EmpId={employeeId}, UserId={userId}");

                var myApprovals = await _context.Departmentheadapprovals
                    .Where(a => a.EmployeeId == employeeId || a.EmployeeId == userId)
                    .Select(a => new { a.ApprovalId, a.EmployeeId })
                    .ToListAsync();

                _logger.LogInformation($"[ACK POST] Approvals for this user: {string.Join(", ", myApprovals.Select(a => $"id={a.ApprovalId},emp={a.EmployeeId}"))}");

                var approval = await _context.Departmentheadapprovals
                    .FirstOrDefaultAsync(a => a.ApprovalId == request.ApprovalId &&
                                            (a.EmployeeId == employeeId || a.EmployeeId == userId));

                if (approval == null)
                {
                    _logger.LogWarning($"[ACK POST] NOT FOUND: approvalId={request.ApprovalId}, empId={employeeId}, userId={userId}");
                    return NotFound(new
                    {
                        success = false,
                        message = $"Approval record not found for ApprovalId={request.ApprovalId}, EmployeeId={employeeId}, UserId={userId}"
                    });
                }

                if (approval.AcknowledgedByEmployee)
                {
                    return BadRequest(new { success = false, message = "Already acknowledged" });
                }

                approval.AcknowledgedByEmployee = true;
                approval.AcknowledgedAt = DateTime.UtcNow;
                approval.EmployeeComments = request.Comments;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"[ACK POST] SUCCESS: Employee {employeeId} or User {userId} acknowledged {request.ApprovalId}");

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
            int managerId = 0;

            if (Request.Query.ContainsKey("managerId"))
            {
                int.TryParse(Request.Query["managerId"], out managerId);
            }

            if (managerId == 0)
            {
                var managerIdClaim = User.FindFirst("empMasterId")?.Value
                                  ?? User.FindFirst("EmployeeId")?.Value
                                  ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                int.TryParse(managerIdClaim, out managerId);
            }

            var employeeIds = await _context.Projects
                .Where(p => p.L1approverEmployeeId == managerId)
                .SelectMany(p => _context.Projectemployees.Where(pe => pe.ProjectId == p.ProjectId).Select(pe => pe.EmployeeId))
                .Distinct()
                .ToListAsync();

            var acknowledgments = await _context.Departmentheadapprovals
                .Where(a => a.AcknowledgedByEmployee == true && employeeIds.Contains(a.EmployeeId))
                .Join(_context.Userprofiles,
                    appr => appr.EmployeeId,
                    prof => prof.EmployeeId,
                    (appr, prof) => new
                    {
                        EmployeeName = $"{prof.FirstName ?? ""} {prof.LastName ?? ""}",
                        EmployeeComments = appr.EmployeeComments,
                        AcknowledgedAt = appr.AcknowledgedAt
                    })
                .OrderByDescending(x => x.AcknowledgedAt)
                .ToListAsync();

            return Ok(new { success = true, data = acknowledgments });
        }

        [HttpGet("{deptHeadEmployeeId}/assessment/{assessmentId}/attachments")]
        public async Task<IActionResult> GetDeptHeadAssessmentAttachments(int deptHeadEmployeeId, int assessmentId)
        {
            try
            {
                var attachments = await _context.Selfassessmentattachments
                    .Where(a => a.AssessmentId == assessmentId)
                    .Select(a => new
                    {
                        a.AttachmentId,
                        a.FileName,
                        a.FilePath,
                        a.UploadedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = attachments });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching attachments: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{deptHeadEmployeeId}/attachments/{attachmentId}/download")]
        public async Task<IActionResult> DownloadDeptHeadAttachment(int deptHeadEmployeeId, int attachmentId)
        {
            try
            {
                var attachment = await _context.Selfassessmentattachments
                    .FirstOrDefaultAsync(a => a.AttachmentId == attachmentId);

                if (attachment == null)
                    return NotFound(new { success = false, message = "Attachment not found" });

                var filePath = Path.Combine(Directory.GetCurrentDirectory(), attachment.FilePath.TrimStart('/'));

                if (!System.IO.File.Exists(filePath))
                    return NotFound(new { success = false, message = "File not found on server" });

                var memory = new MemoryStream();
                using (var stream = new FileStream(filePath, FileMode.Open))
                {
                    await stream.CopyToAsync(memory);
                }
                memory.Position = 0;

                var contentType = "application/octet-stream";
                return File(memory, contentType, attachment.FileName);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error downloading attachment: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
