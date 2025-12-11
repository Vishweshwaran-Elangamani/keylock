using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.Entities;

namespace PerformanceManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AssessmentDetailsController : ControllerBase
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<AssessmentDetailsController> _logger;

        public AssessmentDetailsController(EEPZDbContext context, ILogger<AssessmentDetailsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("all")]
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

                var attachments = await _context.Selfassessmentattachments
                    .AsNoTracking()
                    .ToListAsync();

                var results = new List<object>();

                foreach (var assignment in assignments)
                {
                    var userAuth = userAuths.FirstOrDefault(ua => ua.UserId == assignment.EmployeeId);
                    if (userAuth == null) continue;

                    var profile = profiles.FirstOrDefault(p => p.EmployeeId == userAuth.EmployeeId);
                    if (profile == null) continue;

                    var pe = projectEmployees
                        .Where(x => x.EmployeeId == profile.EmployeeId && x.IsPrimary == true)
                        .FirstOrDefault();

                    var project = pe != null ? projects.FirstOrDefault(pj => pj.ProjectId == pe.ProjectId) : null;

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
                            if (detail.EmployeeRating == null && string.IsNullOrEmpty(detail.EmployeeComments))
                            {
                                status = "Pending";
                            }
                            else if (!hasL1 && !hasL2)
                            {
                                status = "Pending Review";
                            }
                            else if ((hasL1 && l1Review == null) || (hasL2 && l2Review == null))
                            {
                                status = "Pending Assessment";
                            }
                            else
                            {
                                status = "Completed";
                            }

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
                                ? $"{profiles.FirstOrDefault(p => p.EmployeeId == project.L1approverEmployeeId)?.FirstName ?? ""} {profiles.FirstOrDefault(p => p.EmployeeId == project.L1approverEmployeeId)?.LastName ?? ""}".Trim()
                                : "No L1";

                            string l2ReviewerName = hasL2 && project?.L2approverEmployeeId.HasValue == true
                                ? $"{profiles.FirstOrDefault(p => p.EmployeeId == project.L2approverEmployeeId)?.FirstName ?? ""} {profiles.FirstOrDefault(p => p.EmployeeId == project.L2approverEmployeeId)?.LastName ?? ""}".Trim()
                                : "No L2";

                            competencies.Add(new
                            {
                                CompetencyName = fc.Name ?? "Unknown",
                                EmployeeRating = (int?)null,
                                EmployeeComments = (string)null,
                                L1ReviewerName = l1ReviewerName,
                                L1Rating = (int?)null,
                                L1Comments = (string)null,
                                L1ReviewStatus = (string)null,
                                L2ReviewerName = l2ReviewerName,
                                L2Rating = (int?)null,
                                L2Comments = (string)null,
                                L2ReviewStatus = (string)null,
                                Status = "Not Started"
                            });
                        }
                    }

                    var assessmentAttachments = selfAssessment != null
                        ? attachments.Where(att => att.AssessmentId == selfAssessment.AssessmentId)
                            .Select(att => new
                            {
                                att.AttachmentId,
                                att.FileName,
                                att.FilePath,
                                att.UploadedAt
                            }).ToList()
                        : new List<object>();

                    string employeeName = $"{profile.FirstName ?? ""} {profile.LastName ?? ""}".Trim();
                    if (string.IsNullOrEmpty(employeeName))
                        employeeName = $"Employee {userAuth.EmployeeId}";

                    results.Add(new
                    {
                        AssignmentId = assignment.AssignmentId,
                        FormId = assignment.FormId,
                        FormName = assignment.Form?.Name ?? "Unknown",
                        EmployeeId = userAuth.EmployeeId,
                        EmployeeName = employeeName,
                        ProjectName = project?.ProjectName ?? "No Project",
                        AssignedAt = assignment.AssignedAt,
                        Deadline = assignment.Deadline?.ToString("yyyy-MM-dd"),
                        Competencies = competencies,
                        Attachments = assessmentAttachments
                    });
                }

                return Ok(new { success = true, data = results });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in GetAllDetails: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("hr/attachments/{attachmentId}/download")]
        public async Task<IActionResult> DownloadHrAttachment(int attachmentId)
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
                _logger.LogError($"Error downloading HR attachment: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
