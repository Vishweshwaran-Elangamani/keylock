using Microsoft.AspNetCore.Mvc;

using Microsoft.EntityFrameworkCore;


using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Core.Services.Interfaces;
using System.Security.Claims;

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
       [HttpPost("depthead/approve-employee")]
public async Task<IActionResult> ApproveDeptHeadEmployee([FromBody] ApprovalRequestDto request)
{
    try
    {
        // Extract UserId from JWT
        var deptHeadUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(deptHeadUserIdClaim) || !int.TryParse(deptHeadUserIdClaim, out int deptHeadUserId))
        {
            return Unauthorized(new { success = false, message = "Invalid token" });
        }

        // Validate assessment exists
        var assessment = await _context.Selfassessments
            .FirstOrDefaultAsync(sa => sa.AssessmentId == request.AssessmentId);

        if (assessment == null)
        {
            return NotFound(new { success = false, message = "Assessment not found" });
        }

        // Check if already approved
        var existingApproval = await _context.Departmentheadapprovals
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.AssessmentId == request.AssessmentId 
                                   && a.EmployeeId == request.EmployeeId);

        if (existingApproval != null)
        {
            return BadRequest(new { success = false, message = "Employee already approved" });
        }

        // Create approval record
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
  private int GetUserIdFromToken()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
               
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    // Try alternative claim types if NameIdentifier is not found
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
 
        /// <summary>
        /// Extract EmployeeId from JWT token claims (alternative method)
        /// Use this if your JWT contains EmployeeId instead of UserId
        /// </summary>
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
      [HttpGet("depthead/submitted-ratings")]
public async Task<IActionResult> GetDeptHeadSubmittedRatings()
{
    try
    {
        _logger.LogInformation("GetDeptHeadSubmittedRatings called");

        // Fetch all approvals so we know what's already approved
        var allApprovals = await _context.Departmentheadapprovals.AsNoTracking().ToListAsync();

        // Fetch all required data
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

                // *** DISAPPEARING LOGIC: ***
                // If already approved, SKIP this entry from pending
                if (allApprovals.Any(a =>
                    a.EmployeeId == pe.EmployeeId &&
                    a.ProjectId == pe.ProjectId &&
                    a.AssessmentId == selfAssessment.AssessmentId &&
                    a.Status == "Approved"
                ))
                {
                    continue; // Skip, already approved!
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

                // Find employee in ProjectEmployees
                var pe = await _context.Projectemployees
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.EmployeeId == approval.EmployeeId);

                if (pe == null)
                {
                    _logger.LogWarning($"ProjectEmployee not found for EmployeeId: {approval.EmployeeId}");
                    
                    // Try alternate approach
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

                // Get profile
                var profile = await _context.Userprofiles
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.EmployeeId == pe.EmployeeId);

                if (profile == null)
                {
                    _logger.LogWarning($"Profile not found for EmployeeId: {pe.EmployeeId}");
                    continue;
                }

                // Get project
                var project = await _context.Projects
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.ProjectId == approval.ProjectId);

                if (project == null)
                {
                    _logger.LogWarning($"Project not found for ProjectId: {approval.ProjectId}");
                    continue;
                }

                // Build employee name
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


 
/// <summary>
/// Get pending acknowledgments for logged-in employee
/// Returns approved ratings that employee hasn't acknowledged yet
/// <summary>
/// Get all pending acknowledgments for the logged-in employee
/// Handles both EmployeeId (empMasterId) and UserId as fallback to match Departmentheadapprovals
/// </summary>
[HttpGet("employee/pending-acknowledgments")]
public async Task<IActionResult> GetPendingAcknowledgments()
{
    try
    {
        // DEBUG: Log all claims for troubleshooting
        var claimDump = string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}"));
        _logger.LogWarning($"EMPLOYEE PENDING ACK: Claims available: {claimDump}");
 
        // Get possible EmployeeId and UserId from JWT
        var employeeIdClaim = User.FindFirst("empMasterId")?.Value
                           ?? User.FindFirst("EmployeeId")?.Value
                           ?? User.FindFirst("employeeId")?.Value;
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? User.FindFirst("userId")?.Value
                       ?? User.FindFirst("sub")?.Value;
 
        // Parse both as int for compatibility (whichever matches your DB)
        int.TryParse(employeeIdClaim, out int employeeId);
        int.TryParse(userIdClaim, out int userId);
 
        if (employeeId == 0 && userId == 0)
            return Unauthorized(new { success = false, message = "Could not identify employee in token" });
 
        _logger.LogWarning($"EMPLOYEE PENDING ACK: Matching EmployeeId={employeeId} or UserId={userId}");
 
        // Get all pending approvals matching either EmployeeId or UserId (handle both)
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
                // Get project details
                var project = await _context.Projects.FirstOrDefaultAsync(p => p.ProjectId == approval.ProjectId);
                if (project == null) continue;
 
                // Get assessment details with competencies
                var assessment = await _context.Selfassessments
                    .Include(sa => sa.Assessmentdetails)
                    .ThenInclude(ad => ad.Competency)
                    .FirstOrDefaultAsync(sa => sa.AssessmentId == approval.AssessmentId);
 
                if (assessment == null) continue;
 
                // Get reviews for this assessment
                var detailIds = assessment.Assessmentdetails.Select(d => d.DetailId).ToList();
                var reviews = await _context.Assessmentreviews
                    .Where(r => detailIds.Contains(r.DetailId)).ToListAsync();
 
                // Get L1/L2 names and user IDs
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
 
/// <summary>
/// Employee acknowledges their approved rating with comments
/// Matches using both possible EmployeeId and UserId for compatibility
/// </summary>
/// <summary>
/// Employee acknowledges their approved rating with comments
/// Matches using both possible EmployeeId and UserId for compatibility
/// </summary>
[HttpPost("employee/acknowledge")]
public async Task<IActionResult> AcknowledgeRating([FromBody] AcknowledgeRequestDto request)
{
    try
    {
        // Get both employeeId and userId from JWT token for maximum robustness
        var employeeIdClaim = User.FindFirst("empMasterId")?.Value
                           ?? User.FindFirst("EmployeeId")?.Value
                           ?? User.FindFirst("employeeId")?.Value;
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? User.FindFirst("userId")?.Value
                       ?? User.FindFirst("sub")?.Value;
 
        int.TryParse(employeeIdClaim, out int employeeId);
        int.TryParse(userIdClaim, out int userId);
 
        _logger.LogInformation($"ACK (POST): ApprovalId={request.ApprovalId}, EmpId={employeeId}, UserId={userId}");
 
        // Show ALL possible approval records visible to this identity, for debugging
        var myApprovals = await _context.Departmentheadapprovals
            .Where(a => (a.EmployeeId == employeeId || a.EmployeeId == userId))
            .Select(a => new { a.ApprovalId, a.EmployeeId })
            .ToListAsync();
        _logger.LogInformation($"ACK (POST) Approvals for this user: [{string.Join(", ", myApprovals.Select(a => $"id:{a.ApprovalId},emp:{a.EmployeeId}"))}]");
 
        // Try to match both EmployeeId and UserId to ensure no mismatch
        var approval = await _context.Departmentheadapprovals
            .FirstOrDefaultAsync(a =>
                a.ApprovalId == request.ApprovalId &&
                (a.EmployeeId == employeeId || a.EmployeeId == userId)
            );
 
        // If not found, return what was attempted for easy debugging
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
 
    // TODO: Filter acknowledgments for employees under this manager as per your organizational logic.
    // Currently returns all employee acknowledgments as an example
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
 
 
   
 
 
 
 
 

        /// <summary>
        /// US0115: HR initiates the performance appraisal process
        /// </summary>
        [HttpPost("initiate")]
        public async Task<IActionResult> InitiateAppraisal([FromBody] InitiateAppraisalRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                // ✅ Verify form exists
                var form = await _context.Assessmentforms.FindAsync(request.FormId);
                if (form == null)
                    return BadRequest("Form not found.");

                // ✅ Verify assignedBy user exists and is HR
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

                // ✅ Verify all user IDs exist
                var users = await _context.Userauthentications
                    .Where(u => request.UserIds.Contains(u.UserId))
                    .Select(u => u.UserId)
                    .ToListAsync();

                if (users.Count != request.UserIds.Count)
                    return BadRequest("Some user IDs are invalid.");

                // ✅ Calculate eligible users based on form type
                HashSet<int> eligibleUserIds = new HashSet<int>();

                if (form.Type == "Self")
                {
                    var today = DateTime.UtcNow.Date;
                    var reminderDays = 45;
                    var reminderDate = today.AddDays(reminderDays);
                    var targetMonth = reminderDate.Month;

                    // Get all active employees and managers (exclude only HR and ADMIN)
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

                    // Apply date-based eligibility logic to ALL employees and managers
                    // Example: If someone joined in December 2024, they are eligible in December 2025
                    eligibleUserIds = allEmployees
                        .Where(e =>
                        {
                            var joiningMonth = e.JoiningDate.Month;
                            // If joined on or before April, first appraisal in April
                            // If joined after April, first appraisal in their joining month
                            var firstAppraisalMonth = joiningMonth <= 4 ? 4 : joiningMonth;

                            // After 1 year of service, everyone moves to April cycle
                            var eligibleMonth = (e.JoiningDate.AddYears(1) < today) ? 4 : firstAppraisalMonth;

                            // Check if eligible this month matches the target month (45 days from now)
                            return eligibleMonth == targetMonth;
                        })
                        .Select(e => e.UserId)
                        .ToHashSet();
                }

                var responses = new List<object>();
                var skippedUsers = new List<object>();
                var deadlineDays = request.DeadlineInDays > 0 ? request.DeadlineInDays : 7;

                foreach (var userId in request.UserIds)
                {
                    var userAuth = await _context.Userauthentications.FirstOrDefaultAsync(u => u.UserId == userId);
                    if (userAuth == null)
                    {
                        skippedUsers.Add(new { UserId = userId, Reason = "User not found" });
                        continue;
                    }

                    var userDetails = await _context.Employeedetailsmasters
                        .Include(d => d.Role)
                        .FirstOrDefaultAsync(d => d.EmployeeId == userAuth.EmployeeId);

                    var userRoleCode = userDetails?.Role?.RoleCode ?? string.Empty;

                    // ✅ CRITICAL: HR users can NEVER receive forms
                    if (string.Equals(userRoleCode, "HR", StringComparison.OrdinalIgnoreCase))
                    {
                        skippedUsers.Add(new { UserId = userId, Reason = "HR cannot receive appraisal forms" });
                        continue;
                    }

                    // ✅ Form-specific validations
                    if (form.Type == "Self")
                    {
                        // Exclude Admin for Self forms
                        if (string.Equals(userRoleCode, "ADMIN", StringComparison.OrdinalIgnoreCase))
                        {
                            skippedUsers.Add(new { UserId = userId, Reason = "Admin cannot receive Self forms" });
                            continue;
                        }

                        // Check date-based eligibility for BOTH employees and managers
                        if (!eligibleUserIds.Contains(userId))
                        {
                            skippedUsers.Add(new { UserId = userId, Reason = "Not eligible based on joining date" });
                            continue;
                        }
                    }
                    else if (form.Type == "Manager")
                    {
                        // Manager forms: Only role validation, no date validation
                        if (!string.Equals(userRoleCode, "MGR", StringComparison.OrdinalIgnoreCase) &&
                            !string.Equals(userRoleCode, "MANAGER", StringComparison.OrdinalIgnoreCase))
                        {
                            skippedUsers.Add(new { UserId = userId, Reason = "Only managers can receive Manager forms" });
                            continue;
                        }
                    }

                    // ✅ Prevent assigning to self
                    if (userId == request.AssignedBy)
                    {
                        skippedUsers.Add(new { UserId = userId, Reason = "Cannot assign to self" });
                        continue;
                    }

                    // ✅ Check if form already assigned (one-time assignment enforcement)
                    var alreadyAssigned = await _context.Assignments
                        .AnyAsync(a => a.FormId == request.FormId && a.EmployeeId == userId && a.Action == "Send");

                    if (alreadyAssigned)
                    {
                        skippedUsers.Add(new { UserId = userId, Reason = "Form already assigned to this user" });
                        continue;
                    }

                    // ✅ Create new assignment with deadline
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

                    // ✅ Create progress tracker
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
                        UserId = userId,
                        Deadline = assignment.Deadline.HasValue
                            ? assignment.Deadline.Value.ToString("yyyy-MM-dd")
                            : string.Empty
                    });
                }

                var message = responses.Count > 0
                    ? $"Assignments created successfully for {responses.Count} user(s)."
                    : "No assignments created. All selected users were skipped.";

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
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("upcoming-eligible")]
        public async Task<IActionResult> GetUpcomingEligibleEmployees()
        {
            try
            {
                var today = DateTime.UtcNow.Date;
                var reminderDays = 45;
                var reminderDate = today.AddDays(reminderDays);
                var targetMonth = reminderDate.Month;
                var currentYear = today.Year;

                // Get all active employees and managers (exclude only HR and ADMIN)
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
                        ua.UserId,
                        EmployeeId = emp.EmployeeId,
                        JoiningDate = emp.JoiningDate,
                        FirstName = up != null ? up.FirstName : null,
                        LastName = up != null ? up.LastName : null,
                        RoleCode = r != null ? r.RoleCode : null
                    }
                ).ToListAsync();

                // Apply date-based eligibility logic to ALL employees and managers
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
                    .OrderBy(x => x.FirstName)
                    .ToList();

                return Ok(new
                {
                    success = true,
                    data = eligibleEmployees,
                    metadata = new
                    {
                        currentDate = today.ToString("yyyy-MM-dd"),
                        reminderDate = reminderDate.ToString("yyyy-MM-dd"),
                        targetMonth = new DateTime(currentYear, targetMonth, 1).ToString("MMMM yyyy"),
                        totalEligible = eligibleEmployees.Count
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
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

        /// <summary>
        /// Get all appraisal details with L1 and L2 reviews
        /// </summary>
        /// <summary>

        /// Get all appraisal details with L1 and L2 reviews - ONLY FOR INITIATED FORMS

        /// </summary>

        [HttpGet("all-details")]
        public async Task<IActionResult> GetAllDetails()
        {
            try
            {
                // Load reference data
                var profiles = await _context.Userprofiles.AsNoTracking().ToListAsync();
                var userAuths = await _context.Userauthentications.AsNoTracking().ToListAsync();
                var projects = await _context.Projects.AsNoTracking().ToListAsync();
                var projectEmployees = await _context.Projectemployees.AsNoTracking().ToListAsync();

                // All self assessments and reviews (if any)
                var selfAssessments = await _context.Selfassessments
                    .Include(sa => sa.Assessmentdetails)
                    .ThenInclude(ad => ad.Competency)
                    .AsNoTracking()
                    .ToListAsync();

                var reviews = await _context.Assessmentreviews.AsNoTracking().ToListAsync();

                // Assignments that have been sent (initiated)
                var assignments = await _context.Assignments
                    .Where(a => a.Action == "Send")
                    .Include(a => a.Form)
                        .ThenInclude(f => f.Competencies)
                    .Include(a => a.EmployeeDraftProfile)
                    .AsNoTracking()
                    .ToListAsync();

                var results = new List<object>();

                foreach (var assignment in assignments)
                {
                    // Resolve profile
                    var profile = profiles.FirstOrDefault(p => p.EmployeeId == assignment.EmployeeDraftProfile?.EmployeeId);
                    if (profile == null)
                        continue;

                    // Determine project for this employee (first matching project)
                    var pe = projectEmployees.FirstOrDefault(x => x.EmployeeId == profile.EmployeeId);
                    var project = pe != null ? projects.FirstOrDefault(p => p.ProjectId == pe.ProjectId) : null;

                    // Find latest self-assessment for this employee & form, if any
                    var selfAssessment = selfAssessments
                        .Where(sa => sa.EmployeeId == assignment.EmployeeId && sa.FormId == assignment.FormId)
                        .OrderByDescending(sa => sa.SubmittedAt)
                        .FirstOrDefault();

                    // Determine L1/L2 approvers from project
                    var l1Auth = project?.L1approverEmployeeId.HasValue == true
                        ? userAuths.FirstOrDefault(ua => ua.EmployeeId == project.L1approverEmployeeId)
                        : null;

                    var l2Auth = project?.L2approverEmployeeId.HasValue == true
                        ? userAuths.FirstOrDefault(ua => ua.EmployeeId == project.L2approverEmployeeId)
                        : null;

                    bool hasL1 = l1Auth != null;
                    bool hasL2 = l2Auth != null;

                    // Build competencies list: if selfAssessment exists use its details; otherwise use form competencies as placeholders
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

                            competencies.Add(new
                            {
                                CompetencyName = detail.Competency?.Name ?? "Unknown",
                                EmployeeRating = detail.EmployeeRating,
                                EmployeeComments = detail.EmployeeComments,
                                L1ReviewerName = hasL1 ? $"{profiles.FirstOrDefault(p => p.EmployeeId == project.L1approverEmployeeId)?.FirstName} {profiles.FirstOrDefault(p => p.EmployeeId == project.L1approverEmployeeId)?.LastName}" : "No L1",
                                L1Rating = l1Review?.Rating,
                                L1Comments = l1Review?.Comments,
                                L1ReviewStatus = l1Review?.ReviewStatus,
                                L2ReviewerName = hasL2 ? $"{profiles.FirstOrDefault(p => p.EmployeeId == project.L2approverEmployeeId)?.FirstName} {profiles.FirstOrDefault(p => p.EmployeeId == project.L2approverEmployeeId)?.LastName}" : "No L2",
                                L2Rating = l2Review?.Rating,
                                L2Comments = l2Review?.Comments,
                                L2ReviewStatus = l2Review?.ReviewStatus,
                                Status = status
                            });
                        }
                    }
                    else
                    {
                        // Use form competencies as placeholders
                        var formComps = assignment.Form?.Competencies ?? new List<Competency>();
                        foreach (var fc in formComps)
                        {
                            competencies.Add(new
                            {
                                CompetencyName = fc.Name ?? "Unknown",
                                EmployeeRating = (int?)null,
                                EmployeeComments = string.Empty,
                                L1ReviewerName = hasL1 ? $"{(profiles.FirstOrDefault(p => p.EmployeeId == project?.L1approverEmployeeId)?.FirstName ?? "")} {(profiles.FirstOrDefault(p => p.EmployeeId == project?.L1approverEmployeeId)?.LastName ?? "")}".Trim() : "No L1",
                                L1Rating = (int?)null,
                                L1Comments = string.Empty,
                                L1ReviewStatus = string.Empty,
                                L2ReviewerName = hasL2 ? $"{(profiles.FirstOrDefault(p => p.EmployeeId == project?.L2approverEmployeeId)?.FirstName ?? "")} {(profiles.FirstOrDefault(p => p.EmployeeId == project?.L2approverEmployeeId)?.LastName ?? "")}".Trim() : "No L2",
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

        /// <summary>
        /// Get department head submitted ratings (only showing approved assessments)
        /// </summary>
    

        /// <summary>
        /// Get upcoming eligible employees for Self forms (excludes HR and Admin)
        /// </summary>


        /// <summary>

        /// HR gets all pending manager nominations across all opportunities

        /// GET: /api/AppraisalProcess/hr/manager-nominations

        /// </summary>


        /// <summary>
        /// Get appraisals by form ID
        /// </summary>
        [HttpGet("form/{formId}")]
        public async Task<IActionResult> GetAppraisalsByFormId(int formId)
        {
            try
            {
                // Simplest query: no includes, no selects, just raw entities
                var assignments = await _context.Assignments
                    .Where(a => a.FormId == formId)
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    message = "Operation successful",
                    count = assignments.Count,
                    data = assignments
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


        /// <summary>
        /// Get draft assignments with form and employee names
        /// </summary>
        [HttpGet("drafts")]
        public async Task<IActionResult> GetDraftAssignments()
        {
            var draftAssignments = await _context.Assignments
                .Where(a => a.Action == "Save as Draft")
                .Include(a => a.Form)
                .Include(a => a.EmployeeDraftProfile)
                .Select(a => new
                {
                    a.AssignmentId,
                    a.FormId,
                    FormName = a.Form.Name,
                    a.EmployeeId,
                    EmployeeName = a.EmployeeDraftProfile.FirstName + " " + a.EmployeeDraftProfile.LastName,
                    a.Action,
                    a.AssignedAt
                })
                .ToListAsync();

            return Ok(new { success = true, data = draftAssignments });
        }

        /// <summary>
        /// Get all assignments for a specific employee with completion status
        /// </summary>
        [HttpGet("employee/{userId}")]
        public async Task<IActionResult> GetAssignmentsByUserId(int userId)
        {
            try
            {
                var assignments = await _context.Assignments
                    .Where(a => a.EmployeeId == userId && a.Action == "Send")
                    .Include(a => a.Form)
                    .ThenInclude(f => f.Competencies)
                    .Include(a => a.EmployeeDraftProfile)
                    .OrderByDescending(a => a.AssignedAt)
                    .ToListAsync();

                var result = new List<object>();

                foreach (var assignment in assignments)
                {
                    var isCompleted = await _context.Selfassessments
                        .AnyAsync(sa =>
                            sa.FormId == assignment.FormId &&
                            sa.EmployeeId == userId &&
                            sa.Status == "Submitted");

                    result.Add(new
                    {
                        assignment.AssignmentId,
                        assignment.FormId,
                        FormName = assignment.Form.Name,
                        FormType = assignment.Form.Type,
                        assignment.EmployeeId,
                        EmployeeName = assignment.EmployeeDraftProfile.FirstName + " " + assignment.EmployeeDraftProfile.LastName,
                        assignment.AssignedAt,
                        Deadline = assignment.Deadline.HasValue ? assignment.Deadline.Value.ToString("yyyy-MM-dd") : null,
                        Competencies = assignment.Form.Competencies.Select(c => new
                        {
                            c.CompetencyId,
                            c.Name,
                            c.Description
                        }).ToList(),
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
                return StatusCode(500, new
                {
                    success = false,
                    message = $"Error: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Get all assignments for HR view (includes both submitted and pending)
        /// </summary>
        [HttpGet("all")]
        public async Task<IActionResult> GetAllAssignments()
        {
            try
            {
                var assignments = await _context.Assignments
                    .Where(a => a.Action == "Send")
                    .Include(a => a.Form)
                    .Include(a => a.EmployeeDraftProfile)
                    .OrderByDescending(a => a.AssignedAt)
                    .ToListAsync();

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
                        FormName = assignment.Form.Name,
                        FormType = assignment.Form.Type,
                        assignment.EmployeeId,
                        EmployeeName = assignment.EmployeeDraftProfile.FirstName + " " + assignment.EmployeeDraftProfile.LastName,
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

        /// <summary>
        /// Update a saved draft or sent assignment
        /// </summary>
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
        /// <summary>
        /// Get all active opportunities
        /// GET: /api/AppraisalProcess/opportunities
        /// </summary>
        // [HttpGet("opportunities")]
        // public async Task<IActionResult> GetAllOpportunities()
        // {
        //     try
        //     {
        //         _logger.LogInformation("[OPPORTUNITIES] Fetching all active opportunities");

        //         var opportunities = await _context.Set<Internalopportunity>()
        //             .Include(o => o.Department)
        //             .Where(o => o.Status == "Active")
        //             .Select(o => new
        //             {
        //                 o.OpportunityId,
        //                 o.OpportunityName,
        //                 DepartmentName = o.Department.DepartmentName,
        //                 o.Description,
        //                 o.Requirements,
        //                 o.EligibilityCriteria,
        //                 o.Deadline,
        //                 o.Status
        //             })
        //             .OrderBy(o => o.OpportunityName)
        //             .ToListAsync();

        //         _logger.LogInformation($"[OPPORTUNITIES] Found {opportunities.Count} active opportunities");

        //         return Ok(new
        //         {
        //             success = true,
        //             data = opportunities,
        //             count = opportunities.Count
        //         });
        //     }
        //     catch (Exception ex)
        //     {
        //         _logger.LogError($"[OPPORTUNITIES] Error: {ex.Message}");
        //         return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
        //     }
        // }

        /// <summary>
        /// Submit nomination for employee
        /// POST: /api/AppraisalProcess/nominate
        /// </summary>
        // [HttpPost("nominate")]
        // public async Task<IActionResult> NominateEmployee([FromBody] NominationRequest request)
        // {
        //     try
        //     {
        //         _logger.LogInformation($"[NOMINATION] ========== START NOMINATION ==========");
        //         _logger.LogInformation($"[NOMINATION] Nominee={request.NomineeEmployeeId}, Nominator={request.NominatorEmployeeId}, Opp={request.OpportunityId}");

        //         if (!ModelState.IsValid)
        //         {
        //             var errors = ModelState.Values.SelectMany(v => v.Errors);
        //             _logger.LogError($"[NOMINATION] Model validation failed");
        //             return BadRequest(new { success = false, message = "Invalid request data", errors = errors });
        //         }

        //         if (string.IsNullOrWhiteSpace(request.Justification))
        //         {
        //             _logger.LogError("[NOMINATION] Justification is empty");
        //             return BadRequest(new { success = false, message = "❌ Justification is required." });
        //         }

        //         if (request.Justification.Trim().Length < 10)
        //         {
        //             _logger.LogError($"[NOMINATION] Justification too short: {request.Justification.Trim().Length} chars");
        //             return BadRequest(new { success = false, message = "❌ Justification must be at least 10 characters." });
        //         }

        //         _logger.LogInformation($"[NOMINATION] Justification OK: {request.Justification.Trim().Length} chars");

        //         if (!request.OpportunityId.HasValue || request.OpportunityId <= 0)
        //         {
        //             _logger.LogError($"[NOMINATION] Invalid OpportunityId: {request.OpportunityId}");
        //             return BadRequest(new { success = false, message = "❌ Opportunity ID is required." });
        //         }

        //         var opportunity = await _context.Set<Internalopportunity>()
        //             .FirstOrDefaultAsync(o => o.OpportunityId == request.OpportunityId && o.Status == "Active");

        //         if (opportunity == null)
        //         {
        //             _logger.LogError($"[NOMINATION] Opportunity not found: {request.OpportunityId}");
        //             return BadRequest(new { success = false, message = "❌ Opportunity not found." });
        //         }

        //         _logger.LogInformation($"[NOMINATION] Opportunity found: {opportunity.OpportunityName}");

        //         var nominee = await _context.Employees
        //             .FirstOrDefaultAsync(e => e.EmployeeId == request.NomineeEmployeeId);

        //         if (nominee == null)
        //         {
        //             _logger.LogError($"[NOMINATION] Nominee not found: {request.NomineeEmployeeId}");
        //             return BadRequest(new { success = false, message = $"❌ Employee ID {request.NomineeEmployeeId} not found." });
        //         }

        //         _logger.LogInformation($"[NOMINATION] Nominee found: {nominee.EmployeeCompanyId}");

        //         var nominator = await _context.Employees
        //             .FirstOrDefaultAsync(e => e.EmployeeId == request.NominatorEmployeeId);

        //         if (nominator == null)
        //         {
        //             _logger.LogError($"[NOMINATION] Nominator not found: {request.NominatorEmployeeId}");
        //             return BadRequest(new { success = false, message = "❌ Manager not found." });
        //         }

        //         _logger.LogInformation($"[NOMINATION] Nominator found: {nominator.EmployeeCompanyId}");

        //         var nominatorDetails = await _context.Employeedetailsmasters
        //             .Include(d => d.Role)
        //             .FirstOrDefaultAsync(d => d.EmployeeId == request.NominatorEmployeeId);

        //         if (nominatorDetails == null)
        //         {
        //             _logger.LogError($"[NOMINATION] Nominator details not found");
        //             return BadRequest(new { success = false, message = "❌ Manager details not found." });
        //         }

        //         if (nominatorDetails.Role == null)
        //         {
        //             _logger.LogError($"[NOMINATION] Nominator role not found");
        //             return BadRequest(new { success = false, message = "❌ Manager role not found." });
        //         }

        //         if (nominatorDetails.Role.RoleCode != "MGR" && nominatorDetails.Role.RoleCode != "MANAGER")
        //         {
        //             _logger.LogError($"[NOMINATION] Not a manager: {nominatorDetails.Role.RoleCode}");
        //             return BadRequest(new { success = false, message = "❌ Only managers can nominate." });
        //         }

        //         _logger.LogInformation($"[NOMINATION] Nominator verified as manager");

        //         var recentNomination = await _context.Nominations
        //             .Where(n => n.NomineeUserId == request.NomineeEmployeeId
        //                     && n.NominatedByUserId == request.NominatorEmployeeId
        //                     && n.SubmittedAt >= DateTime.UtcNow.AddDays(-30))
        //             .FirstOrDefaultAsync();

        //         if (recentNomination != null)
        //         {
        //             _logger.LogError($"[NOMINATION] Duplicate nomination within 30 days");
        //             return BadRequest(new { success = false, message = "❌ Employee already nominated within 30 days." });
        //         }

        //         _logger.LogInformation($"[NOMINATION] No recent duplicates found");

        //         _logger.LogInformation($"[NOMINATION] Creating nomination...");

        //         var nomination = new Relevantz.EEPZ.Common.Entities.Nomination
        //         {
        //             OpportunityId = request.OpportunityId.Value,
        //             NomineeUserId = request.NomineeEmployeeId,
        //             NominatedByUserId = request.NominatorEmployeeId,
        //             Justification = request.Justification?.Trim(),
        //             NominationType = "ManagerNomination",
        //             Status = "Pending",
        //             SubmittedAt = DateTime.UtcNow
        //         };

        //         _context.Nominations.Add(nomination);
        //         await _context.SaveChangesAsync();

        //         _logger.LogInformation($"[NOMINATION] Created: NominationId={nomination.NominationId}");

        //         var saved = await _context.Nominations
        //             .FirstOrDefaultAsync(n => n.NominationId == nomination.NominationId);

        //         if (saved == null)
        //         {
        //             _logger.LogError($"[NOMINATION] Verification failed!");
        //             return StatusCode(500, new { success = false, message = "❌ Failed to save nomination." });
        //         }

        //         _logger.LogInformation($"[NOMINATION] ✅ SUCCESS");

        //         return Ok(new
        //         {
        //             success = true,
        //             message = "✅ Nomination submitted successfully!",
        //             nominationId = nomination.NominationId,
        //             data = new
        //             {
        //                 nominationId = nomination.NominationId,
        //                 nomineeEmployeeId = nomination.NomineeUserId,
        //                 nominatorEmployeeId = nomination.NominatedByUserId,
        //                 nomineeCompanyId = nominee.EmployeeCompanyId,
        //                 nominatorCompanyId = nominator.EmployeeCompanyId,
        //                 opportunityId = nomination.OpportunityId,
        //                 opportunityName = opportunity.OpportunityName,
        //                 nominationType = nomination.NominationType,
        //                 status = nomination.Status,
        //                 submittedAt = nomination.SubmittedAt.ToString("yyyy-MM-dd HH:mm:ss")
        //             }
        //         });
        //     }
        //     catch (DbUpdateException dbEx)
        //     {
        //         _logger.LogError($"[NOMINATION] DB Error: {dbEx.InnerException?.Message}");
        //         return StatusCode(500, new { success = false, message = $"❌ Database error: {dbEx.InnerException?.Message}" });
        //     }
        //     catch (Exception ex)
        //     {
        //         _logger.LogError($"[NOMINATION] Error: {ex.Message}\n{ex.StackTrace}");
        //         return StatusCode(500, new { success = false, message = $"❌ Error: {ex.Message}" });
        //     }
        // }
        /// <summary>
        /// Get manager's project teams
        /// GET: /api/AppraisalProcess/manager/{managerId}/project-team
        /// </summary>
        /// 
        [HttpGet("manager/{managerId}/project-team")]
        public async Task<IActionResult> GetManagerProjectTeam(int managerId)
        {
            try
            {
                _logger.LogInformation($"[TEAM] Fetching for manager: {managerId}");

                var projects = await _context.Projects
                    .Where(p => p.L1approverEmployeeId == managerId || p.L2approverEmployeeId == managerId)
                    .ToListAsync();

                if (!projects.Any())
                {
                    return Ok(new { success = true, data = new List<object>(), message = "No projects found." });
                }

                var projectIds = projects.Select(p => p.ProjectId).ToList();
                var projectEmployees = await _context.Projectemployees
                    .Where(pe => projectIds.Contains(pe.ProjectId))
                    .ToListAsync();

                if (!projectEmployees.Any())
                {
                    return Ok(new
                    {
                        success = true,
                        data = projects.Select(p => new
                        {
                            ProjectId = p.ProjectId,
                            ProjectName = p.ProjectName,
                            TeamMembers = new List<object>()
                        }).ToList()
                    });
                }

                var employeeIds = projectEmployees.Select(pe => pe.EmployeeId).Distinct().ToList();

                var employeeDetailsMap = await _context.Employeedetailsmasters
                    .Include(edm => edm.Employee)
                    .Where(edm => employeeIds.Contains(edm.EmployeeId))
                    .ToDictionaryAsync(edm => edm.EmployeeId, edm => edm);

                var allRoles = await _context.Roles.ToDictionaryAsync(r => r.RoleId, r => r);
                var allDepartments = await _context.Departments.ToDictionaryAsync(d => d.DepartmentId, d => d);
                var profiles = await _context.Userprofiles
                    .Where(up => employeeIds.Contains(up.EmployeeId))
                    .ToDictionaryAsync(up => up.EmployeeId, up => up);
                var recognitionRewards = await _context.Recognitionrewards
                    .OrderByDescending(r => r.RewardDate)
                    .ToListAsync();

                var result = projects.Select(p => new
                {
                    ProjectId = p.ProjectId,
                    ProjectName = p.ProjectName,
                    TeamMembers = projectEmployees
                        .Where(pe => pe.ProjectId == p.ProjectId)
                        .Select(pe =>
                        {
                            if (!employeeDetailsMap.ContainsKey(pe.EmployeeId))
                                return null;

                            var edm = employeeDetailsMap[pe.EmployeeId];
                            var profile = profiles.ContainsKey(edm.EmployeeId) ? profiles[edm.EmployeeId] : null;
                            var role = allRoles.ContainsKey(edm.RoleId) ? allRoles[edm.RoleId].RoleName : "Unknown";
                            var department = allDepartments.ContainsKey(edm.DepartmentId) ? allDepartments[edm.DepartmentId].DepartmentName : "Unknown";

                            var latestReward = recognitionRewards
                                .Where(r => r.EmployeeId == pe.EmployeeId)
                                .OrderByDescending(r => r.RewardDate)
                                .FirstOrDefault();

                            return new
                            {
                                employeeId = pe.EmployeeId,
                                userId = pe.EmployeeId,
                                firstName = profile?.FirstName ?? "Unknown",
                                lastName = profile?.LastName ?? "Unknown",
                                designation = $"{role} - {department}",
                                recognition = latestReward?.Reason ?? "No nomination yet"
                            };
                        })
                        .Where(x => x != null)
                        .OrderBy(x => x.firstName)
                        .ToList()
                }).ToList();

                _logger.LogInformation($"[TEAM] Retrieved {result.Count} projects");
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[TEAM] Error: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        // /// <summary>
        // /// Get opportunities nominated for specific employee by manager in last 30 days
        // /// GET: /api/AppraisalProcess/manager/{managerId}/employee/{employeeId}/nominated-opportunities
        // /// </summary>
        // [HttpGet("manager/{managerId}/employee/{employeeId}/nominated-opportunities")]
        // public async Task<IActionResult> GetNominatedOpportunitiesByEmployee(int managerId, int employeeId)
        // {
        //     try
        //     {
        //         _logger.LogInformation($"[NOMINATED_OPPS] Fetching for manager {managerId}, employee {employeeId}");

        //         var nominatedOppIds = await _context.Nominations
        //             .Where(n => n.NominatedByUserId == managerId
        //                 && n.NomineeUserId == employeeId
        //                 && n.SubmittedAt >= DateTime.UtcNow.AddDays(-30))
        //             .Select(n => n.OpportunityId)
        //             .Distinct()
        //             .ToListAsync();

        //         _logger.LogInformation($"[NOMINATED_OPPS] Found {nominatedOppIds.Count} opportunities");

        //         return Ok(new
        //         {
        //             success = true,
        //             nominatedOpportunityIds = nominatedOppIds,
        //             message = $"{nominatedOppIds.Count} opportunities already nominated"
        //         });
        //     }
        //     catch (Exception ex)
        //     {
        //         _logger.LogError($"[NOMINATED_OPPS] Error: {ex.Message}");
        //         return StatusCode(500, new { success = false, message = $"Error: {ex.Message}" });
        //     }
        // }


        /// <summary>
        /// Get user role by userId
        /// </summary>
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



        /// <summary>
        /// Get appraisal by assignment ID
        /// </summary>
        [HttpGet("{assignmentId}")]
        public async Task<IActionResult> GetAppraisalById(int assignmentId)
        {
            var result = await _appraisalService.GetAppraisalByIdAsync(assignmentId);
            if (result.Success)
                return Ok(result);
            return NotFound(result);
        }

        

    }
}


    /// <summary>
    /// Nomination request model
    /// </summary>
    public class NominationRequest
    {
        [System.ComponentModel.DataAnnotations.Required]
        public int NomineeEmployeeId { get; set; }

    [System.ComponentModel.DataAnnotations.Required]


    public int NominatorEmployeeId { get; set; }

        [System.ComponentModel.DataAnnotations.Required]
        public int? OpportunityId { get; set; }

        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.StringLength(65535, MinimumLength = 10)]
        public string? Justification { get; set; }

        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    }





    

