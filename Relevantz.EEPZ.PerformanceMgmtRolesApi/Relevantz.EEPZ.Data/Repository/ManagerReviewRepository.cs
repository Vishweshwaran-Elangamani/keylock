using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Data.Repository.Implementations;

/// <summary>
/// Manager Review Repository with explicit DELETE-INSERT pattern for L1 reviews
/// Converted from hardcoded SQL to LINQ for better type safety and maintainability
/// When L1 (Approver) resubmits after L2 rejection, existing review rows are deleted and replaced
/// This ensures only the latest L1 ratings are stored, preventing duplicate rows
/// L2 Reviewer can see submitted forms immediately, regardless of L1 review status
/// </summary>
public partial class ManagerReviewRepository : IManagerReviewRepository
{
    private readonly EEPZDbContext _ctx;
    
    public ManagerReviewRepository(EEPZDbContext ctx) => _ctx = ctx;

    /// <summary>
    /// Get submitted forms for L1 Approver (pagination supported)
    /// Returns assessments that:
    /// - Are in scope for the approver (based on project L1 approver assignment)
    /// - Have been submitted by the employee
    /// - Do NOT have any L1 reviews yet
    /// - Do NOT have all details decided at L2
    /// </summary>
    public async Task<IEnumerable<ApproverAssignmentRowDto>> GetApproverSubmittedFormsAsync(
        int approverUserId, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 25;
        var offset = (page - 1) * pageSize;

        // Get the L1 approver's employee ID
        var l1EmployeeId = await _ctx.Userauthentications
            .Where(ua => ua.UserId == approverUserId)
            .Select(ua => ua.Employee.EmployeeId)
            .FirstOrDefaultAsync();

        if (l1EmployeeId == 0) return Enumerable.Empty<ApproverAssignmentRowDto>();

        // Get assessments in scope for this L1 approver
        var scopeAssessmentIds = await _ctx.Selfassessments
            .Where(sa => sa.Status == "Submitted")
            .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
            .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
            .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
            .Join(_ctx.Projectemployees
                .Where(pe => pe.IsPrimary), 
                x => x.edm.EmployeeId, 
                pe => pe.EmployeeId, 
                (x, pe) => new { x.sa, pe })
            .Join(_ctx.Projects
                .Where(p => p.L1approverEmployeeId == l1EmployeeId), 
                x => x.pe.ProjectId, 
                p => p.ProjectId, 
                (x, p) => x.sa.AssessmentId)
            .Distinct()
            .ToListAsync();

        // Get latest L1 reviews per detail
        var latestL1ReviewIds = await _ctx.Assessmentreviews
            .Where(ar => ar.ReviewerRole == "Approver" && ar.DetailId != null)
            .GroupBy(ar => ar.DetailId)
            .Select(g => g.Max(ar => ar.ReviewId))
            .ToListAsync();

        // Get assessments that have L1 reviews
        var hasL1AssessmentIds = await _ctx.Assessmentreviews
            .Where(ar => ar.ReviewerRole == "Approver" && ar.DetailId != null)
            .Select(ar => ar.DetailId)
            .ToListAsync();

        var assessmentsWithL1Details = await _ctx.Assessmentdetails
            .Where(ad => hasL1AssessmentIds.Contains(ad.DetailId))
            .Select(ad => ad.AssessmentId)
            .Distinct()
            .ToListAsync();

        // Get latest L2 reviews per detail
        var latestL2Reviews = await _ctx.Assessmentreviews
            .Where(ar => ar.ReviewerRole == "Reviewer" && ar.DetailId != null)
            .GroupBy(ar => ar.DetailId)
            .Select(g => g.OrderByDescending(ar => ar.ReviewId).First())
            .ToListAsync();

        // Get assessments with all details decided at L2
        var decidedAssessmentIds = latestL2Reviews
            .Where(ar => ar.ReviewStatus == "Approved" || ar.ReviewStatus == "Rejected")
            .Select(ar => ar.DetailId)
            .ToList();

        var decidedDetails = await _ctx.Assessmentdetails
            .Where(ad => decidedAssessmentIds.Contains(ad.DetailId))
            .GroupBy(ad => ad.AssessmentId)
            .Select(g => new { AssessmentId = g.Key, Count = g.Count() })
            .ToListAsync();

        var fullyDecidedAssessmentIds = new List<int>();
        foreach (var decided in decidedDetails)
        {
            var totalDetailsForAssessment = await _ctx.Assessmentdetails
                .CountAsync(ad => ad.AssessmentId == decided.AssessmentId);
            if (decided.Count == totalDetailsForAssessment)
                fullyDecidedAssessmentIds.Add(decided.AssessmentId);
        }

        // Get visible assessments (not decided, no L1 reviews)
        var visibleAssessmentIds = scopeAssessmentIds
            .Where(id => !fullyDecidedAssessmentIds.Contains(id) && !assessmentsWithL1Details.Contains(id))
            .ToList();

        // Get the data with pagination
        var result = await _ctx.Selfassessments
            .Where(sa => visibleAssessmentIds.Contains(sa.AssessmentId))
            .Join(_ctx.Assessmentforms, sa => sa.FormId, f => f.FormId, (sa, f) => new { sa, f })
            .Join(_ctx.Userauthentications, x => x.sa.EmployeeId, ua => ua.UserId, (x, ua) => new { x.sa, x.f, ua })
            .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, x.f, x.ua, e })
            .GroupJoin(_ctx.Userprofiles, x => x.e.EmployeeId, up => up.EmployeeId, 
                (x, up) => new { x.sa, x.f, x.ua, x.e, up = up.FirstOrDefault() })
            .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, 
                (x, edm) => new { x.sa, x.f, x.ua, x.e, x.up, edm })
            .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary), 
                x => x.edm.EmployeeId, pe => pe.EmployeeId, 
                (x, pe) => new { x.sa, x.f, x.ua, x.e, x.up, pe })
            .Join(_ctx.Projects, x => x.pe.ProjectId, p => p.ProjectId, 
                (x, p) => new { x.sa, x.f, x.ua, x.e, x.up, p })
            .OrderByDescending(x => x.sa.SubmittedAt)
            .Skip(offset)
            .Take(pageSize)
            .GroupBy(x => x.sa.AssessmentId)
            .Select(g => new ApproverAssignmentRowDto
            {
                AssessmentId = g.Key,
                EmployeeName = g.First().up != null 
                    ? string.Concat(g.First().up.FirstName, " ", g.First().up.LastName).Trim()
                    : (string.IsNullOrWhiteSpace(g.First().ua.Email) ? g.First().e.EmployeeCompanyId : g.First().ua.Email),
                FormName = g.First().f.Name ?? string.Empty,
                SubmittedAt = (g.First().sa.SubmittedAt ?? DateTime.Now).ToString("yyyy-MM-dd HH:mm:ss"),
                Status = g.First().sa.Status,
                Project = string.Join(", ", g.Select(x => x.p.ProjectName).Distinct().OrderBy(x => x))
            })
            .ToListAsync();

        return result;
    }

    /// <summary>
    /// Get submitted forms for L2 Reviewer (pagination supported)
    /// Returns assessments that:
    /// - Are in scope for the reviewer (based on project L2 approver assignment)
    /// - Have been submitted by the employee
    /// - Do NOT have all details decided at L2
    /// </summary>
    public async Task<IEnumerable<ApproverAssignmentRowDto>> GetReviewerSubmittedFormsAsync(
        int reviewerUserId, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 25;
        var offset = (page - 1) * pageSize;

        // Get the L2 reviewer's employee ID
        var l2EmployeeId = await _ctx.Userauthentications
            .Where(ua => ua.UserId == reviewerUserId)
            .Select(ua => ua.Employee.EmployeeId)
            .FirstOrDefaultAsync();

        if (l2EmployeeId == 0) return Enumerable.Empty<ApproverAssignmentRowDto>();

        // Get assessments in scope for this L2 reviewer
        var scopeAssessmentIds = await _ctx.Selfassessments
            .Where(sa => sa.Status == "Submitted")
            .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
            .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
            .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
            .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary), 
                x => x.edm.EmployeeId, pe => pe.EmployeeId, 
                (x, pe) => new { x.sa, pe })
            .Join(_ctx.Projects.Where(p => p.L2approverEmployeeId == l2EmployeeId), 
                x => x.pe.ProjectId, p => p.ProjectId, 
                (x, p) => x.sa.AssessmentId)
            .Distinct()
            .ToListAsync();

        // Get latest L2 reviews per detail with decided status
        var latestL2Reviews = await _ctx.Assessmentreviews
            .Where(ar => ar.ReviewerRole == "Reviewer" && ar.DetailId != null)
            .GroupBy(ar => ar.DetailId)
            .Select(g => g.OrderByDescending(ar => ar.ReviewId).First())
            .ToListAsync();

        var decidedDetailIds = latestL2Reviews
            .Where(ar => ar.ReviewStatus == "Approved" || ar.ReviewStatus == "Rejected")
            .Select(ar => ar.DetailId)
            .ToList();

        // Find assessments with all details decided
        var fullyDecidedAssessmentIds = await _ctx.Assessmentdetails
            .Where(ad => decidedDetailIds.Contains(ad.DetailId))
            .GroupBy(ad => ad.AssessmentId)
            .Where(g => g.Count() == _ctx.Assessmentdetails.Count(ad => ad.AssessmentId == g.Key))
            .Select(g => g.Key)
            .ToListAsync();

        // Get visible assessments (not fully decided)
        var visibleAssessmentIds = scopeAssessmentIds
            .Where(id => !fullyDecidedAssessmentIds.Contains(id))
            .ToList();

        // Get the data with pagination
        var result = await _ctx.Selfassessments
            .Where(sa => visibleAssessmentIds.Contains(sa.AssessmentId))
            .Join(_ctx.Assessmentforms, sa => sa.FormId, f => f.FormId, (sa, f) => new { sa, f })
            .Join(_ctx.Userauthentications, x => x.sa.EmployeeId, ua => ua.UserId, (x, ua) => new { x.sa, x.f, ua })
            .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, x.f, x.ua, e })
            .GroupJoin(_ctx.Userprofiles, x => x.e.EmployeeId, up => up.EmployeeId, 
                (x, up) => new { x.sa, x.f, x.ua, x.e, up = up.FirstOrDefault() })
            .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, 
                (x, edm) => new { x.sa, x.f, x.ua, x.e, x.up, edm })
            .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary), 
                x => x.edm.EmployeeId, pe => pe.EmployeeId, 
                (x, pe) => new { x.sa, x.f, x.ua, x.e, x.up, pe })
            .Join(_ctx.Projects, x => x.pe.ProjectId, p => p.ProjectId, 
                (x, p) => new { x.sa, x.f, x.ua, x.e, x.up, p })
            .OrderByDescending(x => x.sa.SubmittedAt)
            .Skip(offset)
            .Take(pageSize)
            .GroupBy(x => x.sa.AssessmentId)
            .Select(g => new ApproverAssignmentRowDto
            {
                AssessmentId = g.Key,
                EmployeeName = g.First().up != null 
                    ? string.Concat(g.First().up.FirstName, " ", g.First().up.LastName).Trim()
                    : (string.IsNullOrWhiteSpace(g.First().ua.Email) ? g.First().e.EmployeeCompanyId : g.First().ua.Email),
                FormName = g.First().f.Name ?? string.Empty,
                SubmittedAt = (g.First().sa.SubmittedAt ?? DateTime.Now).ToString("yyyy-MM-dd HH:mm:ss"),
                Status = g.First().sa.Status,
                Project = string.Join(", ", g.Select(x => x.p.ProjectName).Distinct().OrderBy(x => x))
            })
            .ToListAsync();

        return result;
    }

    /// <summary>
    /// Save L1 (Approver) review with DELETE-INSERT pattern
    /// When L1 resubmits, existing reviews are deleted first, then new ones are inserted
    /// This prevents duplicate rows and maintains only the latest L1 ratings
    /// </summary>
    public async Task<int> SaveApproverReviewAsync(int approverUserId, SubmitReviewDto dto)
    {
        if (dto is null || dto.Items is null || dto.Items.Count == 0)
            return 0;

        // Get the L1 approver's employee ID
        var l1EmployeeId = await _ctx.Userauthentications
            .Where(ua => ua.UserId == approverUserId)
            .Select(ua => ua.Employee.EmployeeId)
            .FirstOrDefaultAsync();

        if (l1EmployeeId == 0) return 0;

        // Verify assessment is in scope
        var isInScope = await _ctx.Selfassessments
            .Where(sa => sa.AssessmentId == dto.AssessmentId && sa.Status == "Submitted")
            .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
            .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
            .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
            .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary), 
                x => x.edm.EmployeeId, pe => pe.EmployeeId, 
                (x, pe) => new { x.sa, pe })
            .Join(_ctx.Projects.Where(p => p.L1approverEmployeeId == l1EmployeeId), 
                x => x.pe.ProjectId, p => p.ProjectId, 
                (x, p) => x.sa)
            .AnyAsync();

        if (!isInScope) return 0;

        // Validate all detail IDs belong to this assessment
        var postedIds = dto.Items.Select(i => i.DetailId).Distinct().ToArray();
        var validCount = await _ctx.Assessmentdetails
            .CountAsync(ad => ad.AssessmentId == dto.AssessmentId && postedIds.Contains(ad.DetailId));

        if (validCount != postedIds.Length) return 0;

        using var tx = await _ctx.Database.BeginTransactionAsync();

        try
        {
            // Delete old L1 reviews for these details
            var oldReviews = await _ctx.Assessmentreviews
                .Where(ar => ar.ReviewerId == approverUserId 
                    && ar.ReviewerRole == "Approver" 
                    && postedIds.Contains(ar.DetailId)
                    && ar.Rating > 0)
                .ToListAsync();

            _ctx.Assessmentreviews.RemoveRange(oldReviews);
            await _ctx.SaveChangesAsync();

            // Insert new L1 reviews
            var affected = 0;
            foreach (var item in dto.Items)
            {
                var newReview = new Assessmentreview
                {
                    DetailId = item.DetailId,
                    ReviewerId = approverUserId,
                    ReviewerRole = "Approver",
                    Rating = item.Rating,
                    Comments = item.Comments,
                    ReviewedAt = DateTime.Now,
                    ReviewStatus = "Approved"
                };

                _ctx.Assessmentreviews.Add(newReview);
                affected++;
            }

            await _ctx.SaveChangesAsync();

            // Reset L2 reviews to Pending if they were previously rejected
            var rejectedL2Reviews = await _ctx.Assessmentreviews
                .Where(ar => ar.ReviewerRole == "Reviewer" 
                    && ar.ReviewStatus == "Rejected"
                    && postedIds.Contains(ar.DetailId))
                .ToListAsync();

            foreach (var review in rejectedL2Reviews)
            {
                review.ReviewStatus = "Pending";
            }

            await _ctx.SaveChangesAsync();
            await tx.CommitAsync();

            return affected;
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// Get detailed assessment view for L2 Reviewer
    /// </summary>
   /// <summary>
/// Get detailed assessment view for L2 Reviewer
/// </summary>
public async Task<ReviewerAssessmentViewDto?> GetAssessmentForReviewerAsync(
    int reviewerUserId, int assessmentId)
{
    // Get the L2 reviewer's employee ID
    var l2EmployeeId = await _ctx.Userauthentications
        .Where(ua => ua.UserId == reviewerUserId)
        .Select(ua => ua.Employee.EmployeeId)
        .FirstOrDefaultAsync();

    if (l2EmployeeId == 0) return null;

    // Verify assessment is in scope
    var isInScope = await _ctx.Selfassessments
        .Where(sa => sa.AssessmentId == assessmentId && sa.Status == "Submitted")
        .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
        .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
        .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
        .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary), 
            x => x.edm.EmployeeId, pe => pe.EmployeeId, 
            (x, pe) => new { x.sa, pe })
        .Join(_ctx.Projects.Where(p => p.L2approverEmployeeId == l2EmployeeId), 
            x => x.pe.ProjectId, p => p.ProjectId, 
            (x, p) => x.sa)
        .FirstOrDefaultAsync();

    if (isInScope == null) return null;

    // Get header information - FIX: Project to anonymous type to avoid navigation property access
    var assessment = await _ctx.Selfassessments
        .Where(sa => sa.AssessmentId == assessmentId)
        .Select(sa => new 
        {
            sa.AssessmentId,
            sa.EmployeeId,
            sa.FormId,
            sa.SubmittedAt
        })
        .FirstOrDefaultAsync();

    if (assessment == null) return null;

    // Use EmployeeId directly from assessment (not navigation property)
    var employee = await _ctx.Employees
        .FirstOrDefaultAsync(e => e.EmployeeId == assessment.EmployeeId);

    if (employee == null) return null;

    var userAuth = await _ctx.Userauthentications
        .FirstOrDefaultAsync(ua => ua.EmployeeId == employee.EmployeeId);

    var userProfile = await _ctx.Userprofiles
        .FirstOrDefaultAsync(up => up.EmployeeId == employee.EmployeeId);

    var form = await _ctx.Assessmentforms
        .FirstOrDefaultAsync(f => f.FormId == assessment.FormId);

    var employeeDetails = await _ctx.Employeedetailsmasters
        .FirstOrDefaultAsync(edm => edm.EmployeeId == employee.EmployeeId);

    if (employeeDetails == null) return null;

    var projects = await _ctx.Projectemployees
        .Where(pe => pe.EmployeeId == employeeDetails.EmployeeId && pe.IsPrimary)
        .Join(_ctx.Projects, pe => pe.ProjectId, p => p.ProjectId, (pe, p) => p)
        .Select(p => p.ProjectName)
        .ToListAsync();

    var employeeName = userProfile != null 
        ? string.Concat(userProfile.FirstName, " ", userProfile.LastName).Trim()
        : (string.IsNullOrWhiteSpace(userAuth?.Email) ? employee.EmployeeCompanyId : userAuth.Email);

    // Get latest L1 and L2 reviews
    var latestL1Reviews = await _ctx.Assessmentreviews
        .Where(ar => ar.ReviewerRole == "Approver" && ar.Rating > 0)
        .GroupBy(ar => ar.DetailId)
        .Select(g => g.OrderByDescending(ar => ar.ReviewId).First())
        .ToListAsync();

    var latestL2Reviews = await _ctx.Assessmentreviews
        .Where(ar => ar.ReviewerRole == "Reviewer" && ar.Rating > 0)
        .GroupBy(ar => ar.DetailId)
        .Select(g => g.OrderByDescending(ar => ar.ReviewId).First())
        .ToListAsync();

    // Get competency details
    var details = await _ctx.Assessmentdetails
        .Where(ad => ad.AssessmentId == assessmentId)
        .Join(_ctx.Competencies, ad => ad.CompetencyId, c => c.CompetencyId, 
            (ad, c) => new { ad, c })
        .OrderBy(x => x.c.DisplayOrder ?? int.MaxValue)
        .ThenBy(x => x.c.Name)
        .ToListAsync();

    var items = details.Select(x => new CompetencyReviewRowDto(
        DetailId: x.ad.DetailId,
        CompetencyName: x.c.Name ?? string.Empty,
        EmployeeRating: x.ad.EmployeeRating,
        EmployeeComments: x.ad.EmployeeComments,
        ApproverRating: latestL1Reviews.FirstOrDefault(r => r.DetailId == x.ad.DetailId)?.Rating,
        ApproverComments: latestL1Reviews.FirstOrDefault(r => r.DetailId == x.ad.DetailId)?.Comments,
        ReviewerRating: latestL2Reviews.FirstOrDefault(r => r.DetailId == x.ad.DetailId)?.Rating,
        ReviewerComments: latestL2Reviews.FirstOrDefault(r => r.DetailId == x.ad.DetailId)?.Comments
    )).ToList();

    var attachments = await GetAssessmentAttachmentsAsync(assessmentId);

    return new ReviewerAssessmentViewDto(
        AssessmentId: assessmentId,
        EmployeeName: employeeName,
        FormName: form?.Name ?? string.Empty,
        SubmittedAt: assessment.SubmittedAt ?? DateTime.Now,
        Project: string.Join(", ", projects.OrderBy(x => x)),
        Items: items,
        Attachments: attachments
    );
}

    /// <summary>
    /// Get detailed assessment view for L1 Approver
    /// </summary>
   /// <summary>
/// Get detailed assessment view for L1 Approver
/// </summary>
public async Task<ReviewerAssessmentViewDto?> GetAssessmentForApproverAsync(
    int approverUserId, int assessmentId)
{
    // Get the L1 approver's employee ID
    var l1EmployeeId = await _ctx.Userauthentications
        .Where(ua => ua.UserId == approverUserId)
        .Select(ua => ua.Employee.EmployeeId)
        .FirstOrDefaultAsync();

    if (l1EmployeeId == 0) return null;

    // Verify assessment is in scope
    var isInScope = await _ctx.Selfassessments
        .Where(sa => sa.AssessmentId == assessmentId && sa.Status == "Submitted")
        .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
        .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
        .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
        .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary), 
            x => x.edm.EmployeeId, pe => pe.EmployeeId, 
            (x, pe) => new { x.sa, pe })
        .Join(_ctx.Projects.Where(p => p.L1approverEmployeeId == l1EmployeeId), 
            x => x.pe.ProjectId, p => p.ProjectId, 
            (x, p) => x.sa)
        .FirstOrDefaultAsync();

    if (isInScope == null) return null;

    // Get header information - FIX: Get EmployeeId directly from assessment
    var assessment = await _ctx.Selfassessments
        .Where(sa => sa.AssessmentId == assessmentId)
        .Select(sa => new 
        {
            sa.AssessmentId,
            sa.EmployeeId,
            sa.FormId,
            sa.SubmittedAt
        })
        .FirstOrDefaultAsync();

    if (assessment == null) return null;

    // Use the EmployeeId from the assessment object directly
    var employee = await _ctx.Employees
        .FirstOrDefaultAsync(e => e.EmployeeId == assessment.EmployeeId);

    if (employee == null) return null;

    var userAuth = await _ctx.Userauthentications
        .FirstOrDefaultAsync(ua => ua.EmployeeId == employee.EmployeeId);

    var userProfile = await _ctx.Userprofiles
        .FirstOrDefaultAsync(up => up.EmployeeId == employee.EmployeeId);

    var form = await _ctx.Assessmentforms
        .FirstOrDefaultAsync(f => f.FormId == assessment.FormId);

    var employeeDetails = await _ctx.Employeedetailsmasters
        .FirstOrDefaultAsync(edm => edm.EmployeeId == employee.EmployeeId);

    if (employeeDetails == null) return null;

    var projects = await _ctx.Projectemployees
        .Where(pe => pe.EmployeeId == employeeDetails.EmployeeId && pe.IsPrimary)
        .Join(_ctx.Projects, pe => pe.ProjectId, p => p.ProjectId, (pe, p) => p)
        .Select(p => p.ProjectName)
        .ToListAsync();

    var employeeName = userProfile != null 
        ? string.Concat(userProfile.FirstName, " ", userProfile.LastName).Trim()
        : (string.IsNullOrWhiteSpace(userAuth?.Email) ? employee.EmployeeCompanyId : userAuth.Email);

    // Get latest L1 and L2 reviews
    var latestL1Reviews = await _ctx.Assessmentreviews
        .Where(ar => ar.ReviewerRole == "Approver")
        .GroupBy(ar => ar.DetailId)
        .Select(g => g.OrderByDescending(ar => ar.ReviewId).First())
        .ToListAsync();

    var latestL2Reviews = await _ctx.Assessmentreviews
        .Where(ar => ar.ReviewerRole == "Reviewer" && ar.Rating >= 0)
        .GroupBy(ar => ar.DetailId)
        .Select(g => g.OrderByDescending(ar => ar.ReviewId).First())
        .ToListAsync();

    // Get competency details
    var details = await _ctx.Assessmentdetails
        .Where(ad => ad.AssessmentId == assessmentId)
        .Join(_ctx.Competencies, ad => ad.CompetencyId, c => c.CompetencyId, 
            (ad, c) => new { ad, c })
        .OrderBy(x => x.c.DisplayOrder ?? int.MaxValue)
        .ThenBy(x => x.c.Name)
        .ToListAsync();

    var items = details.Select(x => new CompetencyReviewRowDto(
        DetailId: x.ad.DetailId,
        CompetencyName: x.c.Name ?? string.Empty,
        EmployeeRating: x.ad.EmployeeRating,
        EmployeeComments: x.ad.EmployeeComments,
        ApproverRating: latestL1Reviews.FirstOrDefault(r => r.DetailId == x.ad.DetailId)?.Rating,
        ApproverComments: latestL1Reviews.FirstOrDefault(r => r.DetailId == x.ad.DetailId)?.Comments,
        ReviewerRating: latestL2Reviews.FirstOrDefault(r => r.DetailId == x.ad.DetailId)?.Rating,
        ReviewerComments: latestL2Reviews.FirstOrDefault(r => r.DetailId == x.ad.DetailId)?.Comments
    )).ToList();

    var attachments = await GetAssessmentAttachmentsAsync(assessmentId);

    return new ReviewerAssessmentViewDto(
        AssessmentId: assessmentId,
        EmployeeName: employeeName,
        FormName: form?.Name ?? string.Empty,
        SubmittedAt: assessment.SubmittedAt ?? DateTime.Now,
        Project: string.Join(", ", projects.OrderBy(x => x)),
        Items: items,
        Attachments: attachments
    );
}

    /// <summary>
    /// Get L1 submitted ratings with pagination
    /// </summary>
    public async Task<IEnumerable<ApproverAssignmentRowDto>> GetSubmittedL1RatingsAsync(
        int approverUserId, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 25;
        var offset = (page - 1) * pageSize;

        // Get the L1 approver's employee ID
        var l1EmployeeId = await _ctx.Userauthentications
            .Where(ua => ua.UserId == approverUserId)
            .Select(ua => ua.Employee.EmployeeId)
            .FirstOrDefaultAsync();

        if (l1EmployeeId == 0) return Enumerable.Empty<ApproverAssignmentRowDto>();

        // Get assessments in scope with L1 reviews
        var assessmentIds = await _ctx.Selfassessments
            .Where(sa => sa.Status == "Submitted")
            .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
            .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
            .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
            .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary), 
                x => x.edm.EmployeeId, pe => pe.EmployeeId, 
                (x, pe) => new { x.sa, pe })
            .Join(_ctx.Projects.Where(p => p.L1approverEmployeeId == l1EmployeeId), 
                x => x.pe.ProjectId, p => p.ProjectId, 
                (x, p) => x.sa.AssessmentId)
            .Distinct()
            .ToListAsync();

        // Get assessments with L1 reviews (rating > 0)
        var l1DoneAssessments = await _ctx.Assessmentreviews
            .Where(ar => ar.ReviewerRole == "Approver" && ar.Rating > 0)
            .Select(ar => ar.DetailId)
            .ToListAsync();

        var assessmentsWithL1 = await _ctx.Assessmentdetails
            .Where(ad => l1DoneAssessments.Contains(ad.DetailId))
            .Select(ad => ad.AssessmentId)
            .Distinct()
            .ToListAsync();

        var finalAssessmentIds = assessmentIds
            .Where(id => assessmentsWithL1.Contains(id))
            .ToList();

        // Get data with pagination
        var result = await _ctx.Selfassessments
            .Where(sa => finalAssessmentIds.Contains(sa.AssessmentId))
            .Join(_ctx.Assessmentforms, sa => sa.FormId, f => f.FormId, (sa, f) => new { sa, f })
            .Join(_ctx.Userauthentications, x => x.sa.EmployeeId, ua => ua.UserId, (x, ua) => new { x.sa, x.f, ua })
            .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, x.f, x.ua, e })
            .GroupJoin(_ctx.Userprofiles, x => x.e.EmployeeId, up => up.EmployeeId, 
                (x, up) => new { x.sa, x.f, x.ua, x.e, up = up.FirstOrDefault() })
            .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, 
                (x, edm) => new { x.sa, x.f, x.ua, x.e, x.up, edm })
            .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary), 
                x => x.edm.EmployeeId, pe => pe.EmployeeId, 
                (x, pe) => new { x.sa, x.f, x.ua, x.e, x.up, pe })
            .Join(_ctx.Projects, x => x.pe.ProjectId, p => p.ProjectId, 
                (x, p) => new { x.sa, x.f, x.ua, x.e, x.up, p })
            .OrderByDescending(x => x.sa.SubmittedAt)
            .Skip(offset)
            .Take(pageSize)
            .GroupBy(x => x.sa.AssessmentId)
            .Select(g => new ApproverAssignmentRowDto
            {
                AssessmentId = g.Key,
                EmployeeName = g.First().up != null 
                    ? string.Concat(g.First().up.FirstName, " ", g.First().up.LastName).Trim()
                    : (string.IsNullOrWhiteSpace(g.First().ua.Email) ? g.First().e.EmployeeCompanyId : g.First().ua.Email),
                FormName = g.First().f.Name ?? string.Empty,
                SubmittedAt = (g.First().sa.SubmittedAt ?? DateTime.Now).ToString("yyyy-MM-dd HH:mm:ss"),
                Status = g.First().sa.Status,
                Project = string.Join(", ", g.Select(x => x.p.ProjectName).Distinct().OrderBy(x => x))
            })
            .ToListAsync();

        return result;
    }

    /// <summary>
    /// Get L2 submitted ratings with pagination
    /// </summary>
    public async Task<IEnumerable<ApproverAssignmentRowDto>> GetReviewerSubmittedRatingsAsync(
        int reviewerUserId, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 25;
        var offset = (page - 1) * pageSize;

        // Get the L2 reviewer's employee ID
        var l2EmployeeId = await _ctx.Userauthentications
            .Where(ua => ua.UserId == reviewerUserId)
            .Select(ua => ua.Employee.EmployeeId)
            .FirstOrDefaultAsync();

        if (l2EmployeeId == 0) return Enumerable.Empty<ApproverAssignmentRowDto>();

        // Get assessments in scope
        var scopeAssessments = await _ctx.Selfassessments
            .Where(sa => sa.Status == "Submitted")
            .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
            .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
            .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
            .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary), 
                x => x.edm.EmployeeId, pe => pe.EmployeeId, 
                (x, pe) => new { x.sa, pe })
            .Join(_ctx.Projects.Where(p => p.L2approverEmployeeId == l2EmployeeId), 
                x => x.pe.ProjectId, p => p.ProjectId, 
                (x, p) => x.sa.AssessmentId)
            .Distinct()
            .ToListAsync();

        // Get assessments with L2 decisions (Approved or Rejected)
        var latestL2Reviews = await _ctx.Assessmentreviews
            .Where(ar => ar.ReviewerRole == "Reviewer" && 
                (ar.ReviewStatus == "Approved" || ar.ReviewStatus == "Rejected"))
            .GroupBy(ar => ar.DetailId)
            .Select(g => g.OrderByDescending(ar => ar.ReviewId).First())
            .ToListAsync();

        var submittedDetailIds = latestL2Reviews.Select(ar => ar.DetailId).ToList();
        var submittedAssessments = await _ctx.Assessmentdetails
            .Where(ad => submittedDetailIds.Contains(ad.DetailId))
            .Select(ad => ad.AssessmentId)
            .Distinct()
            .ToListAsync();

        var finalAssessmentIds = scopeAssessments
            .Where(id => submittedAssessments.Contains(id))
            .ToList();

        // Get data with pagination
        var result = await _ctx.Selfassessments
            .Where(sa => finalAssessmentIds.Contains(sa.AssessmentId))
            .Join(_ctx.Assessmentforms, sa => sa.FormId, f => f.FormId, (sa, f) => new { sa, f })
            .Join(_ctx.Userauthentications, x => x.sa.EmployeeId, ua => ua.UserId, (x, ua) => new { x.sa, x.f, ua })
            .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, x.f, x.ua, e })
            .GroupJoin(_ctx.Userprofiles, x => x.e.EmployeeId, up => up.EmployeeId, 
                (x, up) => new { x.sa, x.f, x.ua, x.e, up = up.FirstOrDefault() })
            .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, 
                (x, edm) => new { x.sa, x.f, x.ua, x.e, x.up, edm })
            .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary), 
                x => x.edm.EmployeeId, pe => pe.EmployeeId, 
                (x, pe) => new { x.sa, x.f, x.ua, x.e, x.up, pe })
            .Join(_ctx.Projects, x => x.pe.ProjectId, p => p.ProjectId, 
                (x, p) => new { x.sa, x.f, x.ua, x.e, x.up, p })
            .OrderByDescending(x => x.sa.SubmittedAt)
            .Skip(offset)
            .Take(pageSize)
            .GroupBy(x => x.sa.AssessmentId)
            .Select(g => new ApproverAssignmentRowDto
            {
                AssessmentId = g.Key,
                EmployeeName = g.First().up != null 
                    ? string.Concat(g.First().up.FirstName, " ", g.First().up.LastName).Trim()
                    : (string.IsNullOrWhiteSpace(g.First().ua.Email) ? g.First().e.EmployeeCompanyId : g.First().ua.Email),
                FormName = g.First().f.Name ?? string.Empty,
                SubmittedAt = (g.First().sa.SubmittedAt ?? DateTime.Now).ToString("yyyy-MM-dd HH:mm:ss"),
                Status = g.First().sa.Status,
                Project = string.Join(", ", g.Select(x => x.p.ProjectName).Distinct().OrderBy(x => x))
            })
            .ToListAsync();

        return result;
    }

    /// <summary>
    /// Save L2 (Reviewer) review
    /// </summary>
    public async Task<int> SaveReviewerReviewAsync(int reviewerUserId, SubmitReviewDto dto)
    {
        if (dto is null || dto.Items is null || dto.Items.Count == 0) return 0;

        // Get the L2 reviewer's employee ID
        var l2EmployeeId = await _ctx.Userauthentications
            .Where(ua => ua.UserId == reviewerUserId)
            .Select(ua => ua.Employee.EmployeeId)
            .FirstOrDefaultAsync();

        if (l2EmployeeId == 0) return 0;

        // Verify assessment is in scope
        var inScope = await _ctx.Selfassessments
            .Where(sa => sa.AssessmentId == dto.AssessmentId && sa.Status == "Submitted")
            .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
            .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
            .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
            .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary), 
                x => x.edm.EmployeeId, pe => pe.EmployeeId, 
                (x, pe) => new { x.sa, pe })
            .Join(_ctx.Projects.Where(p => p.L2approverEmployeeId == l2EmployeeId), 
                x => x.pe.ProjectId, p => p.ProjectId, 
                (x, p) => x.sa)
            .AnyAsync();

        if (!inScope) return 0;

        // Validate all detail IDs belong to this assessment
        var ids = dto.Items.Select(x => x.DetailId).Distinct().ToArray();
        var valid = await _ctx.Assessmentdetails
            .CountAsync(ad => ad.AssessmentId == dto.AssessmentId && ids.Contains(ad.DetailId));

        if (valid != ids.Length) return 0;

        using var tx = await _ctx.Database.BeginTransactionAsync();

        try
        {
            var saved = 0;
            foreach (var it in dto.Items)
            {
                var newReview = new Assessmentreview
                {
                    DetailId = it.DetailId,
                    ReviewerId = reviewerUserId,
                    ReviewerRole = "Reviewer",
                    Rating = it.Rating,
                    Comments = it.Comments,
                    ReviewedAt = DateTime.Now,
                    ReviewStatus = "Pending"
                };

                _ctx.Assessmentreviews.Add(newReview);
                saved++;
            }

            await _ctx.SaveChangesAsync();
            await tx.CommitAsync();
            return saved;
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// Submit L1 (Approver) reviews
    /// </summary>
    public async Task SubmitApproverReviewsAsync(
        int approverId,
        int assessmentId,
        List<ReviewItemDto> items)
    {
        foreach (var item in items)
        {
            var entry = new Assessmentreview
            {
                DetailId = item.DetailId,
                ReviewerId = approverId,
                ReviewerRole = "Approver",
                Rating = item.Rating,
                Comments = item.Comments,
                ReviewedAt = DateTime.Now,
                ReviewStatus = "Pending"
            };

            _ctx.Assessmentreviews.Add(entry);
        }

        await _ctx.SaveChangesAsync();
    }

    /// <summary>
    /// Submit L2 (Reviewer) reviews
    /// </summary>
    public async Task SubmitReviewerReviewsAsync(
        int reviewerUserId,
        int assessmentId,
        List<ReviewItemDto> items)
    {
        using var tx = await _ctx.Database.BeginTransactionAsync();

        try
        {
            foreach (var item in items)
            {
                // Check if review already exists
                var existingReview = await _ctx.Assessmentreviews
                    .FirstOrDefaultAsync(ar => ar.DetailId == item.DetailId 
                        && ar.ReviewerId == reviewerUserId 
                        && ar.ReviewerRole == "Reviewer" 
                        && ar.Rating > 0);

                if (existingReview != null)
                {
                    // Update existing
                    existingReview.Rating = item.Rating;
                    existingReview.Comments = item.Comments;
                    existingReview.ReviewedAt = DateTime.Now;
                    existingReview.ReviewStatus = null;
                    _ctx.Assessmentreviews.Update(existingReview);
                }
                else
                {
                    // Insert new
                    var newReview = new Assessmentreview
                    {
                        DetailId = item.DetailId,
                        ReviewerId = reviewerUserId,
                        ReviewerRole = "Reviewer",
                        Rating = item.Rating,
                        Comments = item.Comments,
                        ReviewedAt = DateTime.Now,
                        ReviewStatus = null
                    };
                    _ctx.Assessmentreviews.Add(newReview);
                }
            }

            await _ctx.SaveChangesAsync();
            await tx.CommitAsync();
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// Set L2 (Reviewer) decision (Approved/Rejected)
    /// </summary>
    public async Task<bool> SetReviewerDecisionAsync(
        int reviewerUserId,
        int assessmentId,
        string decision,
        string? reviewerComment)
    {
        decision = (decision ?? "").Trim();
        var approved = string.Equals(decision, "Approved", StringComparison.OrdinalIgnoreCase);
        var rejected = string.Equals(decision, "Rejected", StringComparison.OrdinalIgnoreCase);

        if (!approved && !rejected) return false;

        // Get the L2 reviewer's employee ID
        var l2EmployeeId = await _ctx.Userauthentications
            .Where(ua => ua.UserId == reviewerUserId)
            .Select(ua => ua.Employee.EmployeeId)
            .FirstOrDefaultAsync();

        if (l2EmployeeId == 0) return false;

        // Verify assessment is in scope
        var inScope = await _ctx.Selfassessments
            .Where(sa => sa.AssessmentId == assessmentId && sa.Status == "Submitted")
            .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
            .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
            .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
            .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary), 
                x => x.edm.EmployeeId, pe => pe.EmployeeId, 
                (x, pe) => new { x.sa, pe })
            .Join(_ctx.Projects.Where(p => p.L2approverEmployeeId == l2EmployeeId), 
                x => x.pe.ProjectId, p => p.ProjectId, 
                (x, p) => x.sa)
            .AnyAsync();

        if (!inScope) return false;

        using var tx = await _ctx.Database.BeginTransactionAsync();

        try
        {
            var detailIds = await _ctx.Assessmentdetails
                .Where(ad => ad.AssessmentId == assessmentId)
                .Select(ad => ad.DetailId)
                .ToListAsync();

            if (detailIds.Count == 0)
            {
                await tx.RollbackAsync();
                return false;
            }

            var finalDecision = approved ? "Approved" : "Rejected";

            // Update all L2 ratings with decision
            var reviewsToUpdate = await _ctx.Assessmentreviews
                .Where(ar => ar.ReviewerRole == "Reviewer" 
                    && ar.ReviewerId == reviewerUserId 
                    && detailIds.Contains(ar.DetailId) 
                    && ar.Rating > 0)
                .ToListAsync();

            foreach (var review in reviewsToUpdate)
            {
                review.ReviewStatus = finalDecision;
                review.ReviewedAt = DateTime.Now;
                _ctx.Assessmentreviews.Update(review);
            }

            await _ctx.SaveChangesAsync();

            if (rejected)
            {
                var note = reviewerComment ?? "Reviewer Rejected";
                var firstDetailId = detailIds.First();

                // Check if rejection note already exists
                var existingNote = await _ctx.Assessmentreviews
                    .FirstOrDefaultAsync(ar => ar.DetailId == firstDetailId 
                        && ar.ReviewerId == reviewerUserId 
                        && ar.ReviewerRole == "Reviewer" 
                        && ar.Rating == -1);

                if (existingNote != null)
                {
                    existingNote.Comments = note;
                    existingNote.ReviewStatus = finalDecision;
                    existingNote.ReviewedAt = DateTime.Now;
                    _ctx.Assessmentreviews.Update(existingNote);
                }
                else
                {
                    var noteEntry = new Assessmentreview
                    {
                        DetailId = firstDetailId,
                        ReviewerId = reviewerUserId,
                        ReviewerRole = "Reviewer",
                        Rating = -1,
                        Comments = note,
                        ReviewedAt = DateTime.Now,
                        ReviewStatus = finalDecision
                    };
                    _ctx.Assessmentreviews.Add(noteEntry);
                }
            }
            else
            {
                // Delete rejection notes if approving
                var notesToDelete = await _ctx.Assessmentreviews
                    .Where(ar => ar.ReviewerRole == "Reviewer" 
                        && ar.ReviewerId == reviewerUserId 
                        && detailIds.Contains(ar.DetailId) 
                        && ar.Rating == -1)
                    .ToListAsync();

                _ctx.Assessmentreviews.RemoveRange(notesToDelete);
            }

            await _ctx.SaveChangesAsync();
            await tx.CommitAsync();

            // Update progress tracker
            try
            {
                var assessment = await _ctx.Selfassessments
                    .FirstOrDefaultAsync(a => a.AssessmentId == assessmentId);

                if (assessment != null)
                {
                    var tracker = await _ctx.Formprogresstrackers
                        .Include(t => t.Assignment)
                        .FirstOrDefaultAsync(t => t.Assignment.EmployeeId == assessment.EmployeeId
                                               && t.Assignment.FormId == assessment.FormId);

                    if (tracker != null)
                    {
                        tracker.ManagerCompleted = true;
                        tracker.LastUpdated = DateTime.UtcNow;
                        await _ctx.SaveChangesAsync();
                    }
                }
            }
            catch
            {
                // Silently fail - main decision was committed
            }

            return true;
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// Set L1 (Approver) decision (Approved/Rejected)
    /// </summary>
    public async Task<bool> SetApproverDecisionAsync(
        int approverUserId,
        int assessmentId,
        string decision,
        string? approverComment)
    {
        decision = (decision ?? "").Trim();
        var approved = string.Equals(decision, "Approved", StringComparison.OrdinalIgnoreCase);
        var rejected = string.Equals(decision, "Rejected", StringComparison.OrdinalIgnoreCase);

        if (!approved && !rejected) return false;

        // Get the L1 approver's employee ID
        var l1EmployeeId = await _ctx.Userauthentications
            .Where(ua => ua.UserId == approverUserId)
            .Select(ua => ua.Employee.EmployeeId)
            .FirstOrDefaultAsync();

        if (l1EmployeeId == 0) return false;

        // Verify assessment is in scope
        var inScope = await _ctx.Selfassessments
            .Where(sa => sa.AssessmentId == assessmentId && sa.Status == "Submitted")
            .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
            .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
            .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
            .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary), 
                x => x.edm.EmployeeId, pe => pe.EmployeeId, 
                (x, pe) => new { x.sa, pe })
            .Join(_ctx.Projects.Where(p => p.L1approverEmployeeId == l1EmployeeId), 
                x => x.pe.ProjectId, p => p.ProjectId, 
                (x, p) => x.sa)
            .AnyAsync();

        if (!inScope) return false;

        using var tx = await _ctx.Database.BeginTransactionAsync();

        try
        {
            var detailIds = await _ctx.Assessmentdetails
                .Where(ad => ad.AssessmentId == assessmentId)
                .Select(ad => ad.DetailId)
                .ToListAsync();

            if (detailIds.Count == 0)
            {
                await tx.RollbackAsync();
                return false;
            }

            var finalDecision = approved ? "Approved" : "Rejected";

            // Update all L1 ratings with decision
            var reviewsToUpdate = await _ctx.Assessmentreviews
                .Where(ar => ar.ReviewerRole == "Approver" 
                    && ar.ReviewerId == approverUserId 
                    && detailIds.Contains(ar.DetailId) 
                    && ar.Rating > 0)
                .ToListAsync();

            foreach (var review in reviewsToUpdate)
            {
                review.ReviewStatus = finalDecision;
                review.ReviewedAt = DateTime.Now;
                _ctx.Assessmentreviews.Update(review);
            }

            await _ctx.SaveChangesAsync();

            if (rejected)
            {
                var note = approverComment ?? "Approver Rejected";
                var firstDetailId = detailIds.First();

                // Check if rejection note already exists
                var existingNote = await _ctx.Assessmentreviews
                    .FirstOrDefaultAsync(ar => ar.DetailId == firstDetailId 
                        && ar.ReviewerId == approverUserId 
                        && ar.ReviewerRole == "Approver" 
                        && ar.Rating == 0);

                if (existingNote != null)
                {
                    existingNote.Comments = note;
                    existingNote.ReviewStatus = finalDecision;
                    existingNote.ReviewedAt = DateTime.Now;
                    _ctx.Assessmentreviews.Update(existingNote);
                }
                else
                {
                    var noteEntry = new Assessmentreview
                    {
                        DetailId = firstDetailId,
                        ReviewerId = approverUserId,
                        ReviewerRole = "Approver",
                        Rating = 0,
                        Comments = note,
                        ReviewedAt = DateTime.Now,
                        ReviewStatus = finalDecision
                    };
                    _ctx.Assessmentreviews.Add(noteEntry);
                }
            }
            else
            {
                // Delete rejection notes if approving
                var notesToDelete = await _ctx.Assessmentreviews
                    .Where(ar => ar.ReviewerRole == "Approver" 
                        && ar.ReviewerId == approverUserId 
                        && detailIds.Contains(ar.DetailId) 
                        && ar.Rating == 0)
                    .ToListAsync();

                _ctx.Assessmentreviews.RemoveRange(notesToDelete);
            }

            await _ctx.SaveChangesAsync();
            await tx.CommitAsync();
            return true;
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// Get rework forms for L1 Approver (rejected forms)
    /// </summary>
    public async Task<IEnumerable<ApproverAssignmentRowDto>> GetApproverReworkFormsAsync(
        int approverUserId, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 25;
        var offset = (page - 1) * pageSize;

        // Get the L1 approver's employee ID
        var l1EmployeeId = await _ctx.Userauthentications
            .Where(ua => ua.UserId == approverUserId)
            .Select(ua => ua.Employee.EmployeeId)
            .FirstOrDefaultAsync();

        if (l1EmployeeId == 0) return Enumerable.Empty<ApproverAssignmentRowDto>();

        // Get assessments in scope for this L1 approver
        var scopeAssessmentIds = await _ctx.Selfassessments
            .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
            .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
            .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
            .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary), 
                x => x.edm.EmployeeId, pe => pe.EmployeeId, 
                (x, pe) => new { x.sa, pe })
            .Join(_ctx.Projects.Where(p => p.L1approverEmployeeId == l1EmployeeId), 
                x => x.pe.ProjectId, p => p.ProjectId, 
                (x, p) => x.sa.AssessmentId)
            .Distinct()
            .ToListAsync();

        // Get latest L2 reviews with Rejected status
        var latestL2Reviews = await _ctx.Assessmentreviews
            .Where(ar => ar.ReviewerRole == "Reviewer" && ar.DetailId != null)
            .GroupBy(ar => ar.DetailId)
            .Select(g => g.OrderByDescending(ar => ar.ReviewId).First())
            .ToListAsync();

        var rejectedDetailIds = latestL2Reviews
            .Where(ar => ar.ReviewStatus == "Rejected")
            .Select(ar => ar.DetailId)
            .ToList();

        var reworkAssessmentIds = await _ctx.Assessmentdetails
            .Where(ad => rejectedDetailIds.Contains(ad.DetailId))
            .Select(ad => ad.AssessmentId)
            .Distinct()
            .ToListAsync();

        var finalAssessmentIds = scopeAssessmentIds
            .Where(id => reworkAssessmentIds.Contains(id))
            .ToList();

        // Get data with pagination
        var result = await _ctx.Selfassessments
            .Where(sa => finalAssessmentIds.Contains(sa.AssessmentId))
            .Join(_ctx.Assessmentforms, sa => sa.FormId, f => f.FormId, (sa, f) => new { sa, f })
            .Join(_ctx.Userauthentications, x => x.sa.EmployeeId, ua => ua.UserId, (x, ua) => new { x.sa, x.f, ua })
            .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, x.f, x.ua, e })
            .GroupJoin(_ctx.Userprofiles, x => x.e.EmployeeId, up => up.EmployeeId, 
                (x, up) => new { x.sa, x.f, x.ua, x.e, up = up.FirstOrDefault() })
            .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, 
                (x, edm) => new { x.sa, x.f, x.ua, x.e, x.up, edm })
            .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary), 
                x => x.edm.EmployeeId, pe => pe.EmployeeId, 
                (x, pe) => new { x.sa, x.f, x.ua, x.e, x.up, pe })
            .Join(_ctx.Projects, x => x.pe.ProjectId, p => p.ProjectId, 
                (x, p) => new { x.sa, x.f, x.ua, x.e, x.up, p })
            .OrderByDescending(x => x.sa.SubmittedAt)
            .Skip(offset)
            .Take(pageSize)
            .GroupBy(x => x.sa.AssessmentId)
            .Select(g => new ApproverAssignmentRowDto
            {
                AssessmentId = g.Key,
                EmployeeName = g.First().up != null 
                    ? string.Concat(g.First().up.FirstName, " ", g.First().up.LastName).Trim()
                    : (string.IsNullOrWhiteSpace(g.First().ua.Email) ? g.First().e.EmployeeCompanyId : g.First().ua.Email),
                FormName = g.First().f.Name ?? string.Empty,
                SubmittedAt = (g.First().sa.SubmittedAt ?? DateTime.Now).ToString("yyyy-MM-dd HH:mm:ss"),
                Status = g.First().sa.Status,
                Project = string.Join(", ", g.Select(x => x.p.ProjectName).Distinct().OrderBy(x => x))
            })
            .ToListAsync();

        return result;
    }

    /// <summary>
    /// Get detailed assessments for L1 Approver with pagination
    /// </summary>
    /// <summary>
/// Get detailed assessments for L1 Approver with pagination
/// </summary>
public async Task<IEnumerable<ReviewerAssessmentViewDto>> GetApproverAssessmentsWithDetailsAsync(
    int approverUserId, int page, int pageSize)
{
    if (page < 1) page = 1;
    if (pageSize < 1) pageSize = 25;
    var offset = (page - 1) * pageSize;

    // Get the L1 approver's employee ID
    var l1EmployeeId = await _ctx.Userauthentications
        .Where(ua => ua.UserId == approverUserId)
        .Select(ua => ua.Employee.EmployeeId)
        .FirstOrDefaultAsync();

    if (l1EmployeeId == 0) return Enumerable.Empty<ReviewerAssessmentViewDto>();

    // Get assessments in scope
    var scopeAssessmentIds = await _ctx.Selfassessments
        .Where(sa => sa.Status == "Submitted")
        .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
        .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
        .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
        .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary), 
            x => x.edm.EmployeeId, pe => pe.EmployeeId, 
            (x, pe) => new { x.sa, pe })
        .Join(_ctx.Projects.Where(p => p.L1approverEmployeeId == l1EmployeeId), 
            x => x.pe.ProjectId, p => p.ProjectId, 
            (x, p) => x.sa.AssessmentId)
        .Distinct()
        .ToListAsync();

    // Get assessments with L1 reviews
    var hasL1AssessmentIds = await _ctx.Assessmentreviews
        .Where(ar => ar.ReviewerRole == "Approver" && ar.DetailId != null)
        .Select(ar => ar.DetailId)
        .ToListAsync();

    var assessmentsWithL1 = await _ctx.Assessmentdetails
        .Where(ad => hasL1AssessmentIds.Contains(ad.DetailId))
        .Select(ad => ad.AssessmentId)
        .Distinct()
        .ToListAsync();

    // Get assessments with all details decided at L2
    var latestL2Reviews = await _ctx.Assessmentreviews
        .Where(ar => ar.ReviewerRole == "Reviewer" && ar.DetailId != null)
        .GroupBy(ar => ar.DetailId)
        .Select(g => g.OrderByDescending(ar => ar.ReviewId).First())
        .ToListAsync();

    var decidedDetailIds = latestL2Reviews
        .Where(ar => ar.ReviewStatus == "Approved" || ar.ReviewStatus == "Rejected")
        .Select(ar => ar.DetailId)
        .ToList();

    var fullyDecidedAssessmentIds = new List<int>();
    foreach (var assessmentId in scopeAssessmentIds)
    {
        var totalDetails = await _ctx.Assessmentdetails
            .CountAsync(ad => ad.AssessmentId == assessmentId);
        var decidedCount = await _ctx.Assessmentdetails
            .CountAsync(ad => ad.AssessmentId == assessmentId && decidedDetailIds.Contains(ad.DetailId));
        if (totalDetails == decidedCount && totalDetails > 0)
            fullyDecidedAssessmentIds.Add(assessmentId);
    }

    // Get visible assessments
    var visibleAssessmentIds = scopeAssessmentIds
        .Where(id => !fullyDecidedAssessmentIds.Contains(id) && !assessmentsWithL1.Contains(id))
        .ToList();

    // Get assessments with pagination
    var paginatedAssessmentIds = await _ctx.Selfassessments
        .Where(sa => visibleAssessmentIds.Contains(sa.AssessmentId))
        .OrderByDescending(sa => sa.SubmittedAt)
        .Skip(offset)
        .Take(pageSize)
        .Select(sa => sa.AssessmentId)
        .ToListAsync();

    // Get all details for these assessments
    var result = new List<ReviewerAssessmentViewDto>();

    foreach (var assessmentId in paginatedAssessmentIds)
    {
        // FIX: Project to anonymous type to avoid navigation property access
        var assessment = await _ctx.Selfassessments
            .Where(sa => sa.AssessmentId == assessmentId)
            .Select(sa => new 
            {
                sa.AssessmentId,
                sa.EmployeeId,
                sa.FormId,
                sa.SubmittedAt
            })
            .FirstOrDefaultAsync();

        if (assessment == null) continue;

        // Use EmployeeId directly from assessment
        var employee = await _ctx.Employees
            .FirstOrDefaultAsync(e => e.EmployeeId == assessment.EmployeeId);

        if (employee == null) continue;

        var userAuth = await _ctx.Userauthentications
            .FirstOrDefaultAsync(ua => ua.EmployeeId == employee.EmployeeId);

        var userProfile = await _ctx.Userprofiles
            .FirstOrDefaultAsync(up => up.EmployeeId == employee.EmployeeId);

        var form = await _ctx.Assessmentforms
            .FirstOrDefaultAsync(f => f.FormId == assessment.FormId);

        var employeeDetails = await _ctx.Employeedetailsmasters
            .FirstOrDefaultAsync(edm => edm.EmployeeId == employee.EmployeeId);

        if (employeeDetails == null) continue;

        var projects = await _ctx.Projectemployees
            .Where(pe => pe.EmployeeId == employeeDetails.EmployeeId && pe.IsPrimary)
            .Join(_ctx.Projects, pe => pe.ProjectId, p => p.ProjectId, (pe, p) => p)
            .Select(p => p.ProjectName)
            .ToListAsync();

        var employeeName = userProfile != null 
            ? string.Concat(userProfile.FirstName, " ", userProfile.LastName).Trim()
            : (string.IsNullOrWhiteSpace(userAuth?.Email) ? employee.EmployeeCompanyId : userAuth.Email);

        // Get latest reviews
        var latestL1Reviews = await _ctx.Assessmentreviews
            .Where(ar => ar.ReviewerRole == "Approver")
            .GroupBy(ar => ar.DetailId)
            .Select(g => g.OrderByDescending(ar => ar.ReviewId).First())
            .ToListAsync();

        var latestL2ReviewsList = await _ctx.Assessmentreviews
            .Where(ar => ar.ReviewerRole == "Reviewer")
            .GroupBy(ar => ar.DetailId)
            .Select(g => g.OrderByDescending(ar => ar.ReviewId).First())
            .ToListAsync();

        // Get competencies
        var details = await _ctx.Assessmentdetails
            .Where(ad => ad.AssessmentId == assessmentId)
            .Join(_ctx.Competencies, ad => ad.CompetencyId, c => c.CompetencyId, 
                (ad, c) => new { ad, c })
            .OrderBy(x => x.c.DisplayOrder ?? int.MaxValue)
            .ThenBy(x => x.c.Name)
            .ToListAsync();

        var items = details.Select(x => new CompetencyReviewRowDto(
            DetailId: x.ad.DetailId,
            CompetencyName: x.c.Name ?? string.Empty,
            EmployeeRating: x.ad.EmployeeRating,
            EmployeeComments: x.ad.EmployeeComments,
            ApproverRating: latestL1Reviews.FirstOrDefault(r => r.DetailId == x.ad.DetailId)?.Rating,
            ApproverComments: latestL1Reviews.FirstOrDefault(r => r.DetailId == x.ad.DetailId)?.Comments,
            ReviewerRating: latestL2ReviewsList.FirstOrDefault(r => r.DetailId == x.ad.DetailId)?.Rating,
            ReviewerComments: latestL2ReviewsList.FirstOrDefault(r => r.DetailId == x.ad.DetailId)?.Comments
        )).ToList();

        result.Add(new ReviewerAssessmentViewDto(
            AssessmentId: assessmentId,
            EmployeeName: employeeName,
            FormName: form?.Name ?? string.Empty,
            SubmittedAt: assessment.SubmittedAt ?? DateTime.Now,
            Project: string.Join(", ", projects.OrderBy(x => x)),
            Items: items,
            Attachments: null
        ));
    }

    return result;
}


    /// <summary>
    /// Get detailed assessments for L2 Reviewer with pagination
    /// Only returns assessments where ALL L1 details have been approved
    /// </summary>
    /// <summary>
/// Get detailed assessments for L2 Reviewer with pagination
/// Only returns assessments where ALL L1 details have been approved
/// </summary>
public async Task<IEnumerable<ReviewerAssessmentViewDto>> GetReviewerAssessmentsWithDetailsAsync(
    int reviewerUserId, int page, int pageSize)
{
    if (page < 1) page = 1;
    if (pageSize < 1) pageSize = 25;
    var offset = (page - 1) * pageSize;

    // Get the L2 reviewer's employee ID
    var l2EmployeeId = await _ctx.Userauthentications
        .Where(ua => ua.UserId == reviewerUserId)
        .Select(ua => ua.Employee.EmployeeId)
        .FirstOrDefaultAsync();

    if (l2EmployeeId == 0) return Enumerable.Empty<ReviewerAssessmentViewDto>();

    // Get assessments in scope
    var scopeAssessmentIds = await _ctx.Selfassessments
        .Where(sa => sa.Status == "Submitted")
        .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
        .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
        .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
        .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary), 
            x => x.edm.EmployeeId, pe => pe.EmployeeId, 
            (x, pe) => new { x.sa, pe })
        .Join(_ctx.Projects.Where(p => p.L2approverEmployeeId == l2EmployeeId), 
            x => x.pe.ProjectId, p => p.ProjectId, 
            (x, p) => x.sa.AssessmentId)
        .Distinct()
        .ToListAsync();

    // Get assessments with ALL L1 details approved
    var latestL1Reviews = await _ctx.Assessmentreviews
        .Where(ar => ar.ReviewerRole == "Approver")
        .GroupBy(ar => ar.DetailId)
        .Select(g => g.OrderByDescending(ar => ar.ReviewId).First())
        .ToListAsync();

    var l1ApprovedDetailIds = latestL1Reviews
        .Where(ar => ar.ReviewStatus == "Approved")
        .Select(ar => ar.DetailId)
        .ToList();

    var l1ApprovedAssessmentIds = new List<int>();
    foreach (var assessmentId in scopeAssessmentIds)
    {
        var totalDetails = await _ctx.Assessmentdetails
            .CountAsync(ad => ad.AssessmentId == assessmentId);
        var approvedCount = await _ctx.Assessmentdetails
            .CountAsync(ad => ad.AssessmentId == assessmentId && l1ApprovedDetailIds.Contains(ad.DetailId));
        if (totalDetails == approvedCount && totalDetails > 0)
            l1ApprovedAssessmentIds.Add(assessmentId);
    }

    // Get assessments with all details decided at L2
    var latestL2Reviews = await _ctx.Assessmentreviews
        .Where(ar => ar.ReviewerRole == "Reviewer")
        .GroupBy(ar => ar.DetailId)
        .Select(g => g.OrderByDescending(ar => ar.ReviewId).First())
        .ToListAsync();

    var l2DecidedDetailIds = latestL2Reviews
        .Where(ar => ar.ReviewStatus == "Approved" || ar.ReviewStatus == "Rejected")
        .Select(ar => ar.DetailId)
        .ToList();

    var fullyDecidedAssessmentIds = new List<int>();
    foreach (var assessmentId in l1ApprovedAssessmentIds)
    {
        var totalDetails = await _ctx.Assessmentdetails
            .CountAsync(ad => ad.AssessmentId == assessmentId);
        var decidedCount = await _ctx.Assessmentdetails
            .CountAsync(ad => ad.AssessmentId == assessmentId && l2DecidedDetailIds.Contains(ad.DetailId));
        if (totalDetails == decidedCount && totalDetails > 0)
            fullyDecidedAssessmentIds.Add(assessmentId);
    }

    // Get visible assessments
    var visibleAssessmentIds = l1ApprovedAssessmentIds
        .Where(id => !fullyDecidedAssessmentIds.Contains(id))
        .ToList();

    // Get assessments with pagination
    var paginatedAssessmentIds = await _ctx.Selfassessments
        .Where(sa => visibleAssessmentIds.Contains(sa.AssessmentId))
        .OrderByDescending(sa => sa.SubmittedAt)
        .Skip(offset)
        .Take(pageSize)
        .Select(sa => sa.AssessmentId)
        .ToListAsync();

    // Get all details for these assessments
    var result = new List<ReviewerAssessmentViewDto>();

    foreach (var assessmentId in paginatedAssessmentIds)
    {
        // FIX: Project to anonymous type to avoid navigation property access
        var assessment = await _ctx.Selfassessments
            .Where(sa => sa.AssessmentId == assessmentId)
            .Select(sa => new 
            {
                sa.AssessmentId,
                sa.EmployeeId,
                sa.FormId,
                sa.SubmittedAt
            })
            .FirstOrDefaultAsync();

        if (assessment == null) continue;

        // Use EmployeeId directly from assessment (not navigation property)
        var employee = await _ctx.Employees
            .FirstOrDefaultAsync(e => e.EmployeeId == assessment.EmployeeId);

        if (employee == null) continue;

        var userAuth = await _ctx.Userauthentications
            .FirstOrDefaultAsync(ua => ua.EmployeeId == employee.EmployeeId);

        var userProfile = await _ctx.Userprofiles
            .FirstOrDefaultAsync(up => up.EmployeeId == employee.EmployeeId);

        var form = await _ctx.Assessmentforms
            .FirstOrDefaultAsync(f => f.FormId == assessment.FormId);

        var employeeDetails = await _ctx.Employeedetailsmasters
            .FirstOrDefaultAsync(edm => edm.EmployeeId == employee.EmployeeId);

        if (employeeDetails == null) continue;

        var projects = await _ctx.Projectemployees
            .Where(pe => pe.EmployeeId == employeeDetails.EmployeeId && pe.IsPrimary)
            .Join(_ctx.Projects, pe => pe.ProjectId, p => p.ProjectId, (pe, p) => p)
            .Select(p => p.ProjectName)
            .ToListAsync();

        var employeeName = userProfile != null 
            ? string.Concat(userProfile.FirstName, " ", userProfile.LastName).Trim()
            : (string.IsNullOrWhiteSpace(userAuth?.Email) ? employee.EmployeeCompanyId : userAuth.Email);

        // Get latest reviews
        var latestL1ReviewsList = latestL1Reviews.ToList();
        var latestL2ReviewsList = latestL2Reviews.ToList();

        // Get competencies
        var details = await _ctx.Assessmentdetails
            .Where(ad => ad.AssessmentId == assessmentId)
            .Join(_ctx.Competencies, ad => ad.CompetencyId, c => c.CompetencyId, 
                (ad, c) => new { ad, c })
            .OrderBy(x => x.c.DisplayOrder ?? int.MaxValue)
            .ThenBy(x => x.c.Name)
            .ToListAsync();

        var items = details.Select(x => new CompetencyReviewRowDto(
            DetailId: x.ad.DetailId,
            CompetencyName: x.c.Name ?? string.Empty,
            EmployeeRating: x.ad.EmployeeRating,
            EmployeeComments: x.ad.EmployeeComments,
            ApproverRating: latestL1ReviewsList.FirstOrDefault(r => r.DetailId == x.ad.DetailId)?.Rating,
            ApproverComments: latestL1ReviewsList.FirstOrDefault(r => r.DetailId == x.ad.DetailId)?.Comments,
            ReviewerRating: latestL2ReviewsList.FirstOrDefault(r => r.DetailId == x.ad.DetailId)?.Rating,
            ReviewerComments: latestL2ReviewsList.FirstOrDefault(r => r.DetailId == x.ad.DetailId)?.Comments
        )).ToList();

        result.Add(new ReviewerAssessmentViewDto(
            AssessmentId: assessmentId,
            EmployeeName: employeeName,
            FormName: form?.Name ?? string.Empty,
            SubmittedAt: assessment.SubmittedAt ?? DateTime.Now,
            Project: string.Join(", ", projects.OrderBy(x => x)),
            Items: items,
            Attachments: null
        ));
    }

    return result;
}


    /// <summary>
    /// Get the latest L2 decision for an assessment
    /// </summary>
    public async Task<ReviewerDecisionDto?> GetLatestReviewerDecisionAsync(int assessmentId)
    {
        var decision = await _ctx.Assessmentreviews
            .Where(ar => ar.ReviewerRole == "Reviewer" && (ar.Rating == null || ar.Rating == -1))
            .Join(_ctx.Assessmentdetails, ar => ar.DetailId, ad => ad.DetailId, 
                (ar, ad) => new { ar, ad })
            .Where(x => x.ad.AssessmentId == assessmentId)
            .OrderByDescending(x => x.ar.ReviewId)
            .FirstOrDefaultAsync();

        if (decision == null) return null;

        return new ReviewerDecisionDto(
            AssessmentId: assessmentId,
            Decision: decision.ar.ReviewStatus,
            Note: decision.ar.Comments,
            DecidedAt: decision.ar.ReviewedAt
        );
    }

    /// <summary>
    /// Get attachments for an assessment
    /// </summary>
    public async Task<List<AttachmentInfoDto>> GetAssessmentAttachmentsAsync(int assessmentId)
    {
        var attachments = await _ctx.Selfassessmentattachments
            .Where(saa => saa.AssessmentId == assessmentId)
            .OrderBy(saa => saa.DisplayOrder ?? int.MaxValue)
            .ThenBy(saa => saa.UploadedAt)
            .Select(saa => new AttachmentInfoDto(
                saa.AttachmentId,
                saa.FileName,
                saa.FilePath,
                saa.FileType,
                saa.FileSize,
                saa.AttachmentNote,
                saa.DisplayOrder,
                saa.UploadedAt
            ))
            .ToListAsync();

        return attachments;
    }
}