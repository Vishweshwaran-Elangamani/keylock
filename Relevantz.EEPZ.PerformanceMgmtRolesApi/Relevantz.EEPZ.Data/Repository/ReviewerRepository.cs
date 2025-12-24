using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;
 
namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class ReviewerRepository : IReviewerRepository
    {
        private readonly EEPZDbContext _ctx;
 
        public ReviewerRepository(EEPZDbContext ctx)
        {
            _ctx = ctx;
        }
 
        public async Task<IEnumerable<ApproverAssignmentRowDto>> GetReviewerSubmittedFormsAsync(int reviewerUserId, int page, int pageSize)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 25;
            var offset = (page - 1) * pageSize;
 
            var l2EmployeeId = await _ctx.Userauthentications
                .Where(ua => ua.UserId == reviewerUserId)
                .Select(ua => ua.Employee.EmployeeId)
                .FirstOrDefaultAsync();
 
            if (l2EmployeeId == 0)
                return Enumerable.Empty<ApproverAssignmentRowDto>();
 
            var scopeAssessmentIds = await _ctx.Selfassessments
                .Where(sa => sa.Status == "Submitted")
                .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
                .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
                .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
                .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary == true), x => x.edm.EmployeeId, pe => pe.EmployeeId, (x, pe) => new { x.sa, pe })
                .Join(_ctx.Projects.Where(p => p.L2approverEmployeeId == l2EmployeeId), x => x.pe.ProjectId, p => p.ProjectId, (x, p) => x.sa.AssessmentId)
                .Distinct()
                .ToListAsync();
 
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
 
            var visibleAssessmentIds = scopeAssessmentIds
                .Where(id => !fullyDecidedAssessmentIds.Contains(id))
                .ToList();
 
            var query = await _ctx.Selfassessments
    .Where(sa => visibleAssessmentIds.Contains(sa.AssessmentId))
    .Join(_ctx.Assessmentforms, sa => sa.FormId, f => f.FormId, (sa, f) => new { sa, f })
    .Join(_ctx.Userauthentications, x => x.sa.EmployeeId, ua => ua.UserId, (x, ua) => new { x.sa, x.f, ua })
    .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, x.f, x.ua, e })
    .GroupJoin(_ctx.Userprofiles, x => x.e.EmployeeId, up => up.EmployeeId, (x, upList) => new { x.sa, x.f, x.ua, x.e, upList })
    .SelectMany(x => x.upList.DefaultIfEmpty(), (x, up) => new { x.sa, x.f, x.ua, x.e, up })
    .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, x.f, x.ua, x.e, x.up, edm })
    .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary == true), x => x.edm.EmployeeId, pe => pe.EmployeeId, (x, pe) => new { x.sa, x.f, x.ua, x.e, x.up, pe })
    .Join(_ctx.Projects, x => x.pe.ProjectId, p => p.ProjectId, (x, p) => new { x.sa, x.f, x.ua, x.e, x.up, p })
    .OrderByDescending(x => x.sa.SubmittedAt)
    .Skip(offset)
    .Take(pageSize)
    .GroupBy(x => x.sa.AssessmentId)
    .ToListAsync();   // materialize here
 
var result = query.Select(g => new ApproverAssignmentRowDto
{
    AssessmentId = g.Key,
    EmployeeName = g.First().up != null
        ? $"{g.First().up.FirstName} {g.First().up.LastName}".Trim()
        : (string.IsNullOrWhiteSpace(g.First().ua.Email)
            ? g.First().e.EmployeeCompanyId
            : g.First().ua.Email),
    FormName = g.First().f.Name ?? string.Empty,
    SubmittedAt = (g.First().sa.SubmittedAt != null
        ? g.First().sa.SubmittedAt.Value.ToString("yyyy-MM-dd HH:mm:ss")
        : DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")),
    Status = g.First().sa.Status,
    Project = string.Join(", ", g.Select(x => x.p.ProjectName).Distinct().OrderBy(x => x))
}).ToList();
 
return result;
 
        }
 
        public async Task<IEnumerable<ApproverAssignmentRowDto>> GetReviewerSubmittedRatingsAsync(int reviewerUserId, int page, int pageSize)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 25;
            var offset = (page - 1) * pageSize;
 
            var l2EmployeeId = await _ctx.Userauthentications
                .Where(ua => ua.UserId == reviewerUserId)
                .Select(ua => ua.Employee.EmployeeId)
                .FirstOrDefaultAsync();
 
            if (l2EmployeeId == 0)
                return Enumerable.Empty<ApproverAssignmentRowDto>();
 
            var scopeAssessments = await _ctx.Selfassessments
                .Where(sa => sa.Status == "Submitted")
                .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
                .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
                .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
                .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary == true), x => x.edm.EmployeeId, pe => pe.EmployeeId, (x, pe) => new { x.sa, pe })
                .Join(_ctx.Projects.Where(p => p.L2approverEmployeeId == l2EmployeeId), x => x.pe.ProjectId, p => p.ProjectId, (x, p) => x.sa.AssessmentId)
                .Distinct()
                .ToListAsync();
 
            var latestL2Reviews = await _ctx.Assessmentreviews
                .Where(ar => ar.ReviewerRole == "Reviewer" && (ar.ReviewStatus == "Approved" || ar.ReviewStatus == "Rejected"))
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
 
            var query = await _ctx.Selfassessments
    .Where(sa => finalAssessmentIds.Contains(sa.AssessmentId))
    .Join(_ctx.Assessmentforms, sa => sa.FormId, f => f.FormId, (sa, f) => new { sa, f })
    .Join(_ctx.Userauthentications, x => x.sa.EmployeeId, ua => ua.UserId, (x, ua) => new { x.sa, x.f, ua })
    .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, x.f, x.ua, e })
    .GroupJoin(_ctx.Userprofiles, x => x.e.EmployeeId, up => up.EmployeeId, (x, upList) => new { x.sa, x.f, x.ua, x.e, upList })
    .SelectMany(x => x.upList.DefaultIfEmpty(), (x, up) => new { x.sa, x.f, x.ua, x.e, up })
    .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, x.f, x.ua, x.e, x.up, edm })
    .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary == true), x => x.edm.EmployeeId, pe => pe.EmployeeId, (x, pe) => new { x.sa, x.f, x.ua, x.e, x.up, pe })
    .Join(_ctx.Projects, x => x.pe.ProjectId, p => p.ProjectId, (x, p) => new { x.sa, x.f, x.ua, x.e, x.up, p })
    .OrderByDescending(x => x.sa.SubmittedAt)
    .Skip(offset)
    .Take(pageSize)
    .GroupBy(x => x.sa.AssessmentId)
    .ToListAsync();   // materialize here
 
var result = query.Select(g => new ApproverAssignmentRowDto
{
    AssessmentId = g.Key,
    EmployeeName = g.First().up != null
        ? $"{g.First().up.FirstName} {g.First().up.LastName}".Trim()
        : (string.IsNullOrWhiteSpace(g.First().ua.Email)
            ? g.First().e.EmployeeCompanyId
            : g.First().ua.Email),
    FormName = g.First().f.Name ?? string.Empty,
    SubmittedAt = g.First().sa.SubmittedAt != null
        ? g.First().sa.SubmittedAt.Value.ToString("yyyy-MM-dd HH:mm:ss")
        : DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
    Status = g.First().sa.Status,
    Project = string.Join(", ", g.Select(x => x.p.ProjectName).Distinct().OrderBy(x => x))
}).ToList();
 
return result;
 
        }
 
        public async Task<IEnumerable<ReviewerAssessmentViewDto>> GetReviewerAssessmentsWithDetailsAsync(int reviewerUserId, int page, int pageSize)
{
    if (page < 1) page = 1;
    if (pageSize < 1) pageSize = 25;
    var offset = (page - 1) * pageSize;
 
    var l2EmployeeId = await _ctx.Userauthentications
        .Where(ua => ua.UserId == reviewerUserId)
        .Select(ua => ua.Employee.EmployeeId)
        .FirstOrDefaultAsync();
 
    if (l2EmployeeId == 0)
        return Enumerable.Empty<ReviewerAssessmentViewDto>();
 
    // 1) Assessments in this L2’s project scope with status Submitted
    var scopeAssessmentIds = await _ctx.Selfassessments
        .Where(sa => sa.Status == "Submitted")
        .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
        .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
        .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
        .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary == true), x => x.edm.EmployeeId, pe => pe.EmployeeId, (x, pe) => new { x.sa, pe })
        .Join(_ctx.Projects.Where(p => p.L2approverEmployeeId == l2EmployeeId), x => x.pe.ProjectId, p => p.ProjectId, (x, p) => x.sa.AssessmentId)
        .Distinct()
        .ToListAsync();
 
    if (!scopeAssessmentIds.Any())
        return Enumerable.Empty<ReviewerAssessmentViewDto>();
 
    // 2) From those, keep ONLY assessments where ALL details have an APPROVED L1 review:
    //    ReviewerRole = "Approver", Rating > 0, ReviewStatus = "Approved"
    var l1CompleteAssessmentIds = await _ctx.Assessmentdetails
        .Where(ad => scopeAssessmentIds.Contains(ad.AssessmentId))
        .GroupJoin(
            _ctx.Assessmentreviews.Where(ar =>
                ar.ReviewerRole == "Approver" &&
                ar.Rating > 0 &&
                ar.ReviewStatus == "Approved"),
            ad => ad.DetailId,
            ar => ar.DetailId,
            (ad, reviews) => new { ad.AssessmentId, HasApprovedL1 = reviews.Any() }
        )
        .GroupBy(x => x.AssessmentId)
        .Where(g => g.All(x => x.HasApprovedL1) && g.Any())
        .Select(g => g.Key)
        .ToListAsync();
 
    if (!l1CompleteAssessmentIds.Any())
        return Enumerable.Empty<ReviewerAssessmentViewDto>();
 
    // 3) (Optional) still exclude assessments fully decided by L2
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
    foreach (var assessmentId in l1CompleteAssessmentIds)
    {
        var totalDetails = await _ctx.Assessmentdetails
            .CountAsync(ad => ad.AssessmentId == assessmentId);
        var decidedCount = await _ctx.Assessmentdetails
            .CountAsync(ad => ad.AssessmentId == assessmentId && decidedDetailIds.Contains(ad.DetailId));
        if (totalDetails == decidedCount && totalDetails > 0)
            fullyDecidedAssessmentIds.Add(assessmentId);
    }
 
    // 4) Final visible list for L2:
    //    - in scope
    //    - L1 fully approved
    //    - NOT fully decided by L2
    var visibleAssessmentIds = l1CompleteAssessmentIds
        .Where(id => !fullyDecidedAssessmentIds.Contains(id))
        .ToList();
 
    if (!visibleAssessmentIds.Any())
        return Enumerable.Empty<ReviewerAssessmentViewDto>();
 
    var paginatedAssessmentIds = await _ctx.Selfassessments
        .Where(sa => visibleAssessmentIds.Contains(sa.AssessmentId))
        .OrderByDescending(sa => sa.SubmittedAt)
        .Skip(offset)
        .Take(pageSize)
        .Select(sa => sa.AssessmentId)
        .ToListAsync();
 
    var result = new List<ReviewerAssessmentViewDto>();
 
    foreach (var assessmentId in paginatedAssessmentIds)
    {
        var dto = await GetAssessmentForReviewerAsync(reviewerUserId, assessmentId);
        if (dto != null)
            result.Add(dto);
    }
 
    return result;
}
 
 
        public async Task<ReviewerAssessmentViewDto?> GetAssessmentForReviewerAsync(int reviewerUserId, int assessmentId)
        {
            var l2EmployeeId = await _ctx.Userauthentications
                .Where(ua => ua.UserId == reviewerUserId)
                .Select(ua => ua.Employee.EmployeeId)
                .FirstOrDefaultAsync();
 
            if (l2EmployeeId == 0)
                return null;
 
            var isInScope = await _ctx.Selfassessments
                .Where(sa => sa.AssessmentId == assessmentId && sa.Status == "Submitted")
                .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
                .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
                .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
                .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary == true), x => x.edm.EmployeeId, pe => pe.EmployeeId, (x, pe) => new { x.sa, pe })
                .Join(_ctx.Projects.Where(p => p.L2approverEmployeeId == l2EmployeeId), x => x.pe.ProjectId, p => p.ProjectId, (x, p) => x.sa)
                .FirstOrDefaultAsync();
 
            if (isInScope == null)
                return null;
 
            var assessment = await _ctx.Selfassessments
                .Where(sa => sa.AssessmentId == assessmentId)
                .Select(sa => new { sa.AssessmentId, sa.EmployeeId, sa.FormId, sa.SubmittedAt })
                .FirstOrDefaultAsync();
 
            if (assessment == null)
                return null;
 
            var employee = await _ctx.Employees
                .FirstOrDefaultAsync(e => e.EmployeeId == assessment.EmployeeId);
 
            if (employee == null)
                return null;
 
            var userAuth = await _ctx.Userauthentications
                .FirstOrDefaultAsync(ua => ua.EmployeeId == employee.EmployeeId);
 
            var userProfile = await _ctx.Userprofiles
                .FirstOrDefaultAsync(up => up.EmployeeId == employee.EmployeeId);
 
            var form = await _ctx.Assessmentforms
                .FirstOrDefaultAsync(f => f.FormId == assessment.FormId);
 
            var employeeDetails = await _ctx.Employeedetailsmasters
                .FirstOrDefaultAsync(edm => edm.EmployeeId == employee.EmployeeId);
 
            if (employeeDetails == null)
                return null;
 
            var projects = await _ctx.Projectemployees
                .Where(pe => pe.EmployeeId == employeeDetails.EmployeeId && pe.IsPrimary == true)
                .Join(_ctx.Projects, pe => pe.ProjectId, p => p.ProjectId, (pe, p) => p)
                .Select(p => p.ProjectName)
                .ToListAsync();
 
            var employeeName = userProfile != null ? $"{userProfile.FirstName} {userProfile.LastName}".Trim() : (string.IsNullOrWhiteSpace(userAuth?.Email) ? employee.EmployeeCompanyId : userAuth.Email);
 
            var latestL1Reviews = await _ctx.Assessmentreviews
                .Where(ar => ar.ReviewerRole == "Approver")
                .GroupBy(ar => ar.DetailId)
                .Select(g => g.OrderByDescending(ar => ar.ReviewId).First())
                .ToListAsync();
 
            var latestL2Reviews = await _ctx.Assessmentreviews
                .Where(ar => ar.ReviewerRole == "Reviewer" && ar.Rating != 0)
                .GroupBy(ar => ar.DetailId)
                .Select(g => g.OrderByDescending(ar => ar.ReviewId).First())
                .ToListAsync();
 
            var details = await _ctx.Assessmentdetails
                .Where(ad => ad.AssessmentId == assessmentId)
                .Join(_ctx.Competencies, ad => ad.CompetencyId, c => c.CompetencyId, (ad, c) => new { ad, c })
                .OrderBy(x => x.c.DisplayOrder ?? int.MaxValue)
                .ThenBy(x => x.c.Name)
                .ToListAsync();
 
            var items = details.Select(x => new CompetencyReviewRowDto(
                x.ad.DetailId,
                x.c.Name ?? string.Empty,
                x.ad.EmployeeRating,
                x.ad.EmployeeComments,
                latestL1Reviews.FirstOrDefault(r => r.DetailId == x.ad.DetailId)?.Rating,
                latestL1Reviews.FirstOrDefault(r => r.DetailId == x.ad.DetailId)?.Comments,
                latestL2Reviews.FirstOrDefault(r => r.DetailId == x.ad.DetailId)?.Rating,
                latestL2Reviews.FirstOrDefault(r => r.DetailId == x.ad.DetailId)?.Comments
            )).ToList();
 
            var attachments = await GetAssessmentAttachmentsAsync(assessmentId);
 
            return new ReviewerAssessmentViewDto(
                assessmentId,
                employeeName,
                form?.Name ?? string.Empty,
                assessment.SubmittedAt ?? DateTime.Now,
                string.Join(", ", projects.OrderBy(x => x)),
                items,
                attachments
            );
        }
 
        public async Task<int> SaveReviewerReviewAsync(int reviewerUserId, SubmitReviewDto dto)
        {
            if (dto == null || dto.Items == null || dto.Items.Count == 0)
                return 0;
 
            var l2EmployeeId = await _ctx.Userauthentications
                .Where(ua => ua.UserId == reviewerUserId)
                .Select(ua => ua.Employee.EmployeeId)
                .FirstOrDefaultAsync();
 
            if (l2EmployeeId == 0)
                return 0;
 
            var inScope = await _ctx.Selfassessments
                .Where(sa => sa.AssessmentId == dto.AssessmentId && sa.Status == "Submitted")
                .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
                .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
                .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
                .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary == true), x => x.edm.EmployeeId, pe => pe.EmployeeId, (x, pe) => new { x.sa, pe })
                .Join(_ctx.Projects.Where(p => p.L2approverEmployeeId == l2EmployeeId), x => x.pe.ProjectId, p => p.ProjectId, (x, p) => x.sa)
                .AnyAsync();
 
            if (!inScope)
                return 0;
 
            var ids = dto.Items.Select(x => x.DetailId).Distinct().ToArray();
            var valid = await _ctx.Assessmentdetails
                .CountAsync(ad => ad.AssessmentId == dto.AssessmentId && ids.Contains(ad.DetailId));
 
            if (valid != ids.Length)
                return 0;
 
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
 
        public async Task<bool> SetReviewerDecisionAsync(int reviewerUserId, int assessmentId, string decision, string? reviewerComment)
        {
            decision = (decision ?? string.Empty).Trim();
            var approved = string.Equals(decision, "Approved", StringComparison.OrdinalIgnoreCase);
            var rejected = string.Equals(decision, "Rejected", StringComparison.OrdinalIgnoreCase);
 
            if (!approved && !rejected)
                return false;
 
            var l2EmployeeId = await _ctx.Userauthentications
                .Where(ua => ua.UserId == reviewerUserId)
                .Select(ua => ua.Employee.EmployeeId)
                .FirstOrDefaultAsync();
 
            if (l2EmployeeId == 0)
                return false;
 
            var inScope = await _ctx.Selfassessments
                .Where(sa => sa.AssessmentId == assessmentId && sa.Status == "Submitted")
                .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
                .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
                .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
                .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary == true), x => x.edm.EmployeeId, pe => pe.EmployeeId, (x, pe) => new { x.sa, pe })
                .Join(_ctx.Projects.Where(p => p.L2approverEmployeeId == l2EmployeeId), x => x.pe.ProjectId, p => p.ProjectId, (x, p) => x.sa)
                .AnyAsync();
 
            if (!inScope)
                return false;
 
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
 
                var reviewsToUpdate = await _ctx.Assessmentreviews
                    .Where(ar => ar.ReviewerRole == "Reviewer" && ar.ReviewerId == reviewerUserId && detailIds.Contains(ar.DetailId) && ar.Rating != 0)
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
                    var existingNote = await _ctx.Assessmentreviews
                        .FirstOrDefaultAsync(ar => ar.DetailId == firstDetailId && ar.ReviewerId == reviewerUserId && ar.ReviewerRole == "Reviewer" && ar.Rating == 0);
 
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
                    var notesToDelete = await _ctx.Assessmentreviews
                        .Where(ar => ar.ReviewerRole == "Reviewer" && ar.ReviewerId == reviewerUserId && detailIds.Contains(ar.DetailId) && ar.Rating == 0)
                        .ToListAsync();
 
                    _ctx.Assessmentreviews.RemoveRange(notesToDelete);
                }
 
                await _ctx.SaveChangesAsync();
                await tx.CommitAsync();
 
                try
                {
                    var assessment = await _ctx.Selfassessments
                        .FirstOrDefaultAsync(a => a.AssessmentId == assessmentId);
 
                    if (assessment != null)
                    {
                        var tracker = await _ctx.Formprogresstrackers
                            .Include(t => t.Assignment)
                            .FirstOrDefaultAsync(t => t.Assignment.EmployeeId == assessment.EmployeeId && t.Assignment.FormId == assessment.FormId);
 
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
                    // Log silently
                }
 
                return true;
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }
 
        public async Task SubmitReviewerReviewsAsync(int reviewerUserId, int assessmentId, List<ReviewItemDto> items)
        {
            using var tx = await _ctx.Database.BeginTransactionAsync();
            try
            {
                foreach (var item in items)
                {
                    var existingReview = await _ctx.Assessmentreviews
                        .FirstOrDefaultAsync(ar => ar.DetailId == item.DetailId && ar.ReviewerId == reviewerUserId && ar.ReviewerRole == "Reviewer" && ar.Rating != 0);
 
                    if (existingReview != null)
                    {
                        existingReview.Rating = item.Rating;
                        existingReview.Comments = item.Comments;
                        existingReview.ReviewedAt = DateTime.Now;
                        existingReview.ReviewStatus = null;
                        _ctx.Assessmentreviews.Update(existingReview);
                    }
                    else
                    {
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
 
       
 
        public async Task<ReviewerDecisionDto?> GetLatestReviewerDecisionAsync(int assessmentId)
        {
            var decision = await _ctx.Assessmentreviews
                .Where(ar => ar.ReviewerRole == "Reviewer" && ar.Rating == 0)
                .OrderByDescending(ar => ar.ReviewedAt)
                .FirstOrDefaultAsync();
 
            if (decision == null)
                return null;
 
            return new ReviewerDecisionDto(
                assessmentId,
                decision.ReviewStatus,
                decision.Comments,
                decision.ReviewedAt
            );
        }
        public async Task<List<AttachmentInfoDto>> GetAssessmentAttachmentsAsync(int assessmentId)
{
    var attachments = await _ctx.Selfassessmentattachments
        .Where(a => a.AssessmentId == assessmentId)
        .OrderBy(a => a.DisplayOrder)
        .ThenBy(a => a.UploadedAt)
        .ToListAsync();
 
    return attachments.Select(a => new AttachmentInfoDto(
        a.AttachmentId,
        a.FileName,
        a.FilePath,
        a.FileType,
        a.FileSize,
        a.AttachmentNote,
        a.DisplayOrder,
        a.UploadedAt
    )).ToList();
}
 
/// <summary>
/// Get single attachment by ID for download
/// </summary>
public async Task<Selfassessmentattachment?> GetAttachmentByIdAsync(int attachmentId)
{
    return await _ctx.Selfassessmentattachments
        .FirstOrDefaultAsync(a => a.AttachmentId == attachmentId);
}
 
 
     
 
    }
}
 