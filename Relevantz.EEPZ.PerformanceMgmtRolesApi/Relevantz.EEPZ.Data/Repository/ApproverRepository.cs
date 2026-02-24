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
using Relevantz.EEPZ.Common.Constants;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class ApproverRepository : IApproverRepository
    {
        private readonly EEPZDbContext _ctx;
        private const int DefaultPageSize = 25;
private const string DateFormat = "yyyy-MM-dd HH:mm:ss";

        public ApproverRepository(EEPZDbContext ctx)
        {
            _ctx = ctx;
        }
/// <summary> 
/// /// Retrieves submitted forms for an approver (L1). 
/// /// Filters out fully decided assessments and those already reviewed. 
/// /// Supports pagination. 
/// /// </summary>
public async Task<IEnumerable<ApproverAssignmentRowDto>> GetApproverSubmittedFormsAsync(
    int approverUserId, int page, int pageSize)
{
    var (offset, size) = NormalizePaging(page, pageSize);

    var l1EmployeeId = await GetL1EmployeeIdAsync(approverUserId);
    if (l1EmployeeId == 0) return Enumerable.Empty<ApproverAssignmentRowDto>();

    var scopeAssessmentIds = await GetScopeAssessmentIdsAsync(l1EmployeeId, AssessmentConstants.STATUS_SUBMITTED);
    if (!scopeAssessmentIds.Any()) return Enumerable.Empty<ApproverAssignmentRowDto>();

    await TouchLatestL1ReviewIdsAsync();

    var assessmentsWithL1Details = await GetAssessmentsWithL1DetailsAsync();

    var latestL2Reviews = await GetLatestReviewsByRoleAsync(AssessmentConstants.REVIEWER_ROLE_REVIEWER);

    var fullyDecidedAssessmentIds = await GetFullyDecidedAssessmentIdsAsync(latestL2Reviews);

    var visibleAssessmentIds = scopeAssessmentIds
        .Where(id => !fullyDecidedAssessmentIds.Contains(id) && !assessmentsWithL1Details.Contains(id))
        .ToList();

    if (!visibleAssessmentIds.Any()) return Enumerable.Empty<ApproverAssignmentRowDto>();

    return await GetApproverAssignmentRowsAsync(visibleAssessmentIds, offset, size, overrideStatus: null);
}

/// <summary> 
/// Retrieves forms requiring rework for an approver (L1). 
/// Includes assessments rejected by reviewers (L2). 
/// Supports pagination
/// </summary>

        public async Task<IEnumerable<ApproverAssignmentRowDto>> GetApproverReworkFormsAsync(
            int approverUserId, int page, int pageSize)
        {
            var (offset, size) = NormalizePaging(page, pageSize);

            var l1EmployeeId = await GetL1EmployeeIdAsync(approverUserId);
            if (l1EmployeeId == 0) return Enumerable.Empty<ApproverAssignmentRowDto>();

            var scopeAssessmentIds = await GetScopeAssessmentIdsAsync(l1EmployeeId, requiredStatus: null);
            if (!scopeAssessmentIds.Any()) return Enumerable.Empty<ApproverAssignmentRowDto>();

            var fullyL1CompleteAssessments = await GetFullyL1CompleteAssessmentIdsAsync(scopeAssessmentIds);
            if (!fullyL1CompleteAssessments.Any()) return Enumerable.Empty<ApproverAssignmentRowDto>();

            var latestReviewIds = await GetLatestReviewIdsByRoleAsync(AssessmentConstants.REVIEWER_ROLE_REVIEWER);
            var latestL2Reviews = await GetReviewsByIdsAsync(latestReviewIds);

            var rejectedDetailIds = latestL2Reviews
                .Where(ar => ar.ReviewStatus == AssessmentConstants.REVIEW_STATUS_REJECTED)
                .Select(ar => ar.DetailId)
                .ToList();

            if (!rejectedDetailIds.Any()) return Enumerable.Empty<ApproverAssignmentRowDto>();

            var assessmentIdsWithRejectedDetails = await GetAssessmentIdsByDetailIdsAsync(rejectedDetailIds);

            var reworkAssessmentIds = fullyL1CompleteAssessments
                .Where(id => assessmentIdsWithRejectedDetails.Contains(id))
                .ToList();

            if (!reworkAssessmentIds.Any()) return Enumerable.Empty<ApproverAssignmentRowDto>();

            var paginatedIds = await GetPaginatedAssessmentIdsBySubmittedAtAsync(reworkAssessmentIds, offset, size);
            if (!paginatedIds.Any()) return Enumerable.Empty<ApproverAssignmentRowDto>();

            return await GetApproverAssignmentRowsAsync(paginatedIds, offset: 0, pageSize: int.MaxValue, overrideStatus: AssessmentConstants.STATUS_REJECTED);
        }


private static (int Offset, int PageSize) NormalizePaging(int page, int pageSize)
{
    if (page < 1) page = 1;
    if (pageSize < 1) pageSize = DefaultPageSize;
    return ((page - 1) * pageSize, pageSize);
}

private Task<int> GetL1EmployeeIdAsync(int approverUserId)
{
    return _ctx.Userauthentications
        .Where(ua => ua.UserId == approverUserId)
        .Select(ua => ua.Employee.EmployeeId)
        .FirstOrDefaultAsync();
}

/// <summary> 
/// Retrieves assessment IDs within scope for an L1 approver. 
/// Optionally filters by required status. 
/// </summary>
        private async Task<List<int>> GetScopeAssessmentIdsAsync(int l1EmployeeId, string? requiredStatus)
        {
            var query = _ctx.Selfassessments.AsQueryable();

            if (!string.IsNullOrWhiteSpace(requiredStatus))
                query = query.Where(sa => sa.Status == requiredStatus);

            return await query
                .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
                .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
                .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
                .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary),
                      x => x.edm.EmployeeId,
                      pe => pe.EmployeeId,
                      (x, pe) => new { x.sa, pe })
                .Join(_ctx.Projects.Where(p => p.L1approverEmployeeId == l1EmployeeId),
                      x => x.pe.ProjectId,
                      p => p.ProjectId,
                      (x, p) => x.sa.AssessmentId)
                .Distinct()
                .ToListAsync();
        }


/// <summary> 
/// Retrieves latest reviews by role (approver/reviewer). 
/// </summary>
        private async Task TouchLatestL1ReviewIdsAsync()
        {
            _ = await _ctx.Assessmentreviews
                .Where(ar => ar.ReviewerRole == AssessmentConstants.REVIEWER_ROLE_APPROVER && ar.DetailId != null)
                .GroupBy(ar => ar.DetailId)
                .Select(g => g.Max(ar => ar.ReviewId))
                .ToListAsync();
        }

private async Task<List<int>> GetAssessmentsWithL1DetailsAsync()
{
    var hasL1DetailIds = await _ctx.Assessmentreviews
        .Where(ar => ar.ReviewerRole == AssessmentConstants.REVIEWER_ROLE_APPROVER && ar.DetailId != null)
        .Select(ar => ar.DetailId)
        .ToListAsync();

    if (!hasL1DetailIds.Any())
        return new List<int>();

    return await _ctx.Assessmentdetails
        .Where(ad => hasL1DetailIds.Contains(ad.DetailId))
        .Select(ad => ad.AssessmentId)
        .Distinct()
        .ToListAsync();
}

private Task<List<Assessmentreview>> GetLatestReviewsByRoleAsync(string reviewerRole)
{
    return _ctx.Assessmentreviews
        .Where(ar => ar.ReviewerRole == reviewerRole && ar.DetailId != null)
        .GroupBy(ar => ar.DetailId)
        .Select(g => g.OrderByDescending(ar => ar.ReviewId).First())
        .ToListAsync();
}

private async Task<List<int>> GetFullyDecidedAssessmentIdsAsync(List<Assessmentreview> latestL2Reviews)
{
    var decidedDetailIds = latestL2Reviews
        .Where(ar => ar.ReviewStatus == AssessmentConstants.REVIEW_STATUS_APPROVED
                  || ar.ReviewStatus == AssessmentConstants.REVIEW_STATUS_REJECTED)
        .Select(ar => ar.DetailId)
        .ToList();

    if (!decidedDetailIds.Any())
        return new List<int>();

    var decidedDetails = await _ctx.Assessmentdetails
        .Where(ad => decidedDetailIds.Contains(ad.DetailId))
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

    return fullyDecidedAssessmentIds;
}

private async Task<List<int>> GetFullyL1CompleteAssessmentIdsAsync(List<int> scopeAssessmentIds)
{
    var fullyL1Complete = new List<int>();

    foreach (var assessmentId in scopeAssessmentIds)
    {
        var totalDetails = await _ctx.Assessmentdetails
            .CountAsync(ad => ad.AssessmentId == assessmentId);

        var l1RatedDetails = await _ctx.Assessmentreviews
            .Where(ar => ar.ReviewerRole == AssessmentConstants.REVIEWER_ROLE_APPROVER && ar.Rating > 0)
            .Join(_ctx.Assessmentdetails, ar => ar.DetailId, ad => ad.DetailId, (ar, ad) => ad)
            .CountAsync(ad => ad.AssessmentId == assessmentId);

        if (totalDetails > 0 && totalDetails == l1RatedDetails)
            fullyL1Complete.Add(assessmentId);
    }

    return fullyL1Complete;
}

private Task<List<int>> GetLatestReviewIdsByRoleAsync(string reviewerRole)
{
    return _ctx.Assessmentreviews
        .Where(ar => ar.ReviewerRole == reviewerRole && ar.DetailId != null)
        .GroupBy(ar => ar.DetailId)
        .Select(g => g.OrderByDescending(ar => ar.ReviewId).Select(ar => ar.ReviewId).First())
        .ToListAsync();
}

private Task<List<Assessmentreview>> GetReviewsByIdsAsync(List<int> reviewIds)
{
    if (reviewIds == null || reviewIds.Count == 0)
        return Task.FromResult(new List<Assessmentreview>());

    return _ctx.Assessmentreviews
        .Where(ar => reviewIds.Contains(ar.ReviewId))
        .ToListAsync();
}

private Task<List<int>> GetAssessmentIdsByDetailIdsAsync(IEnumerable<int> detailIds)
{
    if (detailIds == null) return Task.FromResult(new List<int>());

    var ids = detailIds.Distinct().ToList();
    if (ids.Count == 0) return Task.FromResult(new List<int>());

    return _ctx.Assessmentdetails
        .Where(ad => ids.Contains(ad.DetailId))
        .Select(ad => ad.AssessmentId)
        .Distinct()
        .ToListAsync();
}

private Task<List<int>> GetAssessmentIdsByDetailIdsAsync(IEnumerable<int?> detailIds)
{
    if (detailIds == null) return Task.FromResult(new List<int>());

    var ids = detailIds
        .Where(d => d.HasValue)
        .Select(d => d.Value);

    return GetAssessmentIdsByDetailIdsAsync(ids);
}
private Task<List<int>> GetPaginatedAssessmentIdsBySubmittedAtAsync(List<int> assessmentIds, int offset, int pageSize)
{
    return _ctx.Selfassessments
        .Where(sa => assessmentIds.Contains(sa.AssessmentId))
        .OrderByDescending(sa => sa.SubmittedAt)
        .Skip(offset)
        .Take(pageSize)
        .Select(sa => sa.AssessmentId)
        .ToListAsync();
}

/// <summary> 
/// Retrieves assignment rows for given assessment IDs. 
/// Includes employee info, form name, project, and status. 
/// </summary>
        private Task<List<ApproverAssignmentRowDto>> GetApproverAssignmentRowsAsync(
            List<int> assessmentIds, int offset, int pageSize, string? overrideStatus)
        {
            return _ctx.Selfassessments
                .Where(sa => assessmentIds.Contains(sa.AssessmentId))
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
                    SubmittedAt = (g.First().sa.SubmittedAt ?? DateTime.Now).ToString(DateFormat),
                    Status = overrideStatus ?? g.First().sa.Status,
                    Project = string.Join(", ", g.Select(x => x.p.ProjectName).Distinct().OrderBy(x => x))
                })
                .ToListAsync();
        }

        private static bool TryParseDecision(string decision, out string finalDecision)
        {
            decision = (decision ?? string.Empty).Trim();

            if (string.Equals(decision, AssessmentConstants.REVIEW_STATUS_APPROVED, StringComparison.OrdinalIgnoreCase))
            {
                finalDecision = AssessmentConstants.REVIEW_STATUS_APPROVED;
                return true;
            }

            if (string.Equals(decision, AssessmentConstants.REVIEW_STATUS_REJECTED, StringComparison.OrdinalIgnoreCase))
            {
                finalDecision = AssessmentConstants.REVIEW_STATUS_REJECTED;
                return true;
            }

            finalDecision = string.Empty;
            return false;
        }
private async Task<List<int>> GetRejectedAssessmentIdsFromLatestL2Async()
{
    var latestL2Reviews = await GetLatestReviewsByRoleAsync(AssessmentConstants.REVIEWER_ROLE_REVIEWER);

    var rejectedDetailIds = latestL2Reviews
        .Where(ar => ar.ReviewStatus == AssessmentConstants.REVIEW_STATUS_REJECTED)
        .Select(ar => ar.DetailId)
        .ToList();

    return await GetAssessmentIdsByDetailIdsAsync(rejectedDetailIds);
}

/// <summary> 
/// Retrieves submitted ratings by an approver (L1). 
/// Excludes rejected assessments. 
/// Supports pagination. 
/// </summary>
        public async Task<IEnumerable<ApproverAssignmentRowDto>> GetSubmittedL1RatingsAsync(int approverUserId, int page, int pageSize)
        {
            var (offset, size) = NormalizePaging(page, pageSize);

            var l1EmployeeId = await GetL1EmployeeIdAsync(approverUserId);
            if (l1EmployeeId == 0)
                return Enumerable.Empty<ApproverAssignmentRowDto>();

            var scopeAssessmentIds = await GetScopeAssessmentIdsAsync(l1EmployeeId, AssessmentConstants.STATUS_SUBMITTED);
            if (!scopeAssessmentIds.Any())
                return Enumerable.Empty<ApproverAssignmentRowDto>();

            var fullyL1CompleteAssessmentIds = await GetFullyL1CompleteAssessmentIdsAsync(scopeAssessmentIds);
            if (!fullyL1CompleteAssessmentIds.Any())
                return Enumerable.Empty<ApproverAssignmentRowDto>();

            var latestL2Reviews = await GetLatestReviewsByRoleAsync(AssessmentConstants.REVIEWER_ROLE_REVIEWER);

            var rejectedDetailIds = latestL2Reviews
                .Where(ar => ar.ReviewStatus == AssessmentConstants.REVIEW_STATUS_REJECTED)
                .Select(ar => ar.DetailId)
                .ToList();

            var rejectedAssessmentIds = await GetAssessmentIdsByDetailIdsAsync(rejectedDetailIds);

            var finalAssessmentIds = fullyL1CompleteAssessmentIds
                .Where(id => !rejectedAssessmentIds.Contains(id))
                .ToList();

            if (!finalAssessmentIds.Any())
                return Enumerable.Empty<ApproverAssignmentRowDto>();

            var paginatedIds = await GetPaginatedAssessmentIdsBySubmittedAtAsync(finalAssessmentIds, offset, size);
            if (!paginatedIds.Any())
                return Enumerable.Empty<ApproverAssignmentRowDto>();

            return await GetApproverAssignmentRowsAsync(paginatedIds, offset: 0, pageSize: int.MaxValue, overrideStatus: null);
        }
        /// <summary> 
        /// Retrieves assessments with detailed information for an approver (L1). 
        /// Includes competency ratings, comments, and attachments. 
        /// Supports pagination. /// </summary>
        public async Task<IEnumerable<ReviewerAssessmentViewDto>> GetApproverAssessmentsWithDetailsAsync(
    int approverUserId, int page, int pageSize)
        {
            var (offset, size) = NormalizePaging(page, pageSize);

            var l1EmployeeId = await GetL1EmployeeIdAsync(approverUserId);
            if (l1EmployeeId == 0)
                return Enumerable.Empty<ReviewerAssessmentViewDto>();

            var scopeAssessmentIds = await GetScopeAssessmentIdsAsync(l1EmployeeId, AssessmentConstants.STATUS_SUBMITTED);
            if (!scopeAssessmentIds.Any())
                return Enumerable.Empty<ReviewerAssessmentViewDto>();

            var assessmentsWithL1 = await GetAssessmentsWithL1DetailsAsync();

            var latestL2Reviews = await GetLatestReviewsByRoleAsync(AssessmentConstants.REVIEWER_ROLE_REVIEWER);
            var fullyDecidedAssessmentIds = await GetFullyDecidedAssessmentIdsAsync(latestL2Reviews);

            var visibleAssessmentIds = scopeAssessmentIds
                .Where(id => !fullyDecidedAssessmentIds.Contains(id) && !assessmentsWithL1.Contains(id))
                .ToList();

            if (!visibleAssessmentIds.Any())
                return Enumerable.Empty<ReviewerAssessmentViewDto>();

            var paginatedAssessmentIds = await GetPaginatedAssessmentIdsBySubmittedAtAsync(visibleAssessmentIds, offset, size);
            if (!paginatedAssessmentIds.Any())
                return Enumerable.Empty<ReviewerAssessmentViewDto>();

            var result = new List<ReviewerAssessmentViewDto>();
            foreach (var assessmentId in paginatedAssessmentIds)
            {
                var dto = await GetAssessmentForApproverAsync(approverUserId, assessmentId);
                if (dto != null)
                    result.Add(dto);
            }

            return result;
        }

        /// <summary> /// Retrieves a specific assessment for an approver (L1). 
        /// Includes employee details, form info, projects, reviews, and attachments. 
        /// </summary>
        public async Task<ReviewerAssessmentViewDto?> GetAssessmentForApproverAsync(int approverUserId, int assessmentId)
        {
            var l1EmployeeId = await _ctx.Userauthentications
                .Where(ua => ua.UserId == approverUserId)
                .Select(ua => ua.Employee.EmployeeId)
                .FirstOrDefaultAsync();

            if (l1EmployeeId == 0)
                return null;

            var isInScope = await _ctx.Selfassessments
                .Where(sa => sa.AssessmentId == assessmentId && sa.Status == AssessmentConstants.STATUS_SUBMITTED)
                .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
                .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
                .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
                .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary == true), x => x.edm.EmployeeId, pe => pe.EmployeeId, (x, pe) => new { x.sa, pe })
                .Join(_ctx.Projects.Where(p => p.L1approverEmployeeId == l1EmployeeId), x => x.pe.ProjectId, p => p.ProjectId, (x, p) => x.sa)
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

            var employeeName = userProfile != null
                ? $"{userProfile.FirstName} {userProfile.LastName}".Trim()
                : (string.IsNullOrWhiteSpace(userAuth?.Email) ? employee.EmployeeCompanyId : userAuth.Email);

            var latestL1Reviews = await _ctx.Assessmentreviews
                .Where(ar => ar.ReviewerRole == AssessmentConstants.REVIEWER_ROLE_APPROVER)
                .GroupBy(ar => ar.DetailId)
                .Select(g => g.OrderByDescending(ar => ar.ReviewId).First())
                .ToListAsync();

            var latestL2Reviews = await _ctx.Assessmentreviews
                .Where(ar => ar.ReviewerRole == AssessmentConstants.REVIEWER_ROLE_REVIEWER && ar.Rating != 0)
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

        /// <summary> 
        /// Saves approver reviews for a given assessment. 
        /// Removes old reviews and inserts new ones. 
        /// Updates rejected L2 reviews to pending if necessary. 
        /// </summary>
        public async Task<int> SaveApproverReviewAsync(int approverUserId, SubmitReviewDto dto)
        {
            if (dto == null || dto.Items == null || dto.Items.Count == 0)
                return 0;

            var l1EmployeeId = await _ctx.Userauthentications
                .Where(ua => ua.UserId == approverUserId)
                .Select(ua => ua.Employee.EmployeeId)
                .FirstOrDefaultAsync();

            if (l1EmployeeId == 0)
                return 0;

            var isInScope = await _ctx.Selfassessments
                .Where(sa => sa.AssessmentId == dto.AssessmentId && sa.Status == AssessmentConstants.STATUS_SUBMITTED)
                .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
                .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
                .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
                .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary == true), x => x.edm.EmployeeId, pe => pe.EmployeeId, (x, pe) => new { x.sa, pe })
                .Join(_ctx.Projects.Where(p => p.L1approverEmployeeId == l1EmployeeId), x => x.pe.ProjectId, p => p.ProjectId, (x, p) => x.sa)
                .AnyAsync();

            if (!isInScope)
                return 0;

            var postedIds = dto.Items.Select(i => i.DetailId).Distinct().ToArray();
            var validCount = await _ctx.Assessmentdetails
                .CountAsync(ad => ad.AssessmentId == dto.AssessmentId && postedIds.Contains(ad.DetailId));

            if (validCount != postedIds.Length)
                return 0;

            using var tx = await _ctx.Database.BeginTransactionAsync();
            try
            {
                var oldReviews = await _ctx.Assessmentreviews
                    .Where(ar => ar.ReviewerId == approverUserId
                              && ar.ReviewerRole == AssessmentConstants.REVIEWER_ROLE_APPROVER
                              && postedIds.Contains(ar.DetailId)
                              && ar.Rating != 0)
                    .ToListAsync();

                _ctx.Assessmentreviews.RemoveRange(oldReviews);
                await _ctx.SaveChangesAsync();

                var affected = 0;
                foreach (var item in dto.Items)
                {
                    var newReview = new Assessmentreview
                    {
                        DetailId = item.DetailId,
                        ReviewerId = approverUserId,
                        ReviewerRole = AssessmentConstants.REVIEWER_ROLE_APPROVER,
                        Rating = item.Rating,
                        Comments = item.Comments,
                        ReviewedAt = DateTime.Now,
                        ReviewStatus = AssessmentConstants.REVIEW_STATUS_APPROVED
                    };
                    _ctx.Assessmentreviews.Add(newReview);
                    affected++;
                }

                await _ctx.SaveChangesAsync();

                var rejectedL2Reviews = await _ctx.Assessmentreviews
                    .Where(ar => ar.ReviewerRole == AssessmentConstants.REVIEWER_ROLE_REVIEWER
                              && ar.ReviewStatus == AssessmentConstants.REVIEW_STATUS_REJECTED
                              && postedIds.Contains(ar.DetailId))
                    .ToListAsync();

                foreach (var review in rejectedL2Reviews)
                {
                    review.ReviewStatus = AssessmentConstants.REVIEW_STATUS_PENDING;
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

/// <summary> /// Sets the final decision (approve/reject) for an assessment by an approver (L1). 
/// Updates review statuses and records approver comments. 
/// </summary>
        public async Task<bool> SetApproverDecisionAsync(int approverUserId, int assessmentId, string decision, string? approverComment)
        {
            decision = (decision ?? string.Empty).Trim();

            var approved = string.Equals(decision, AssessmentConstants.REVIEW_STATUS_APPROVED, StringComparison.OrdinalIgnoreCase);
            var rejected = string.Equals(decision, AssessmentConstants.REVIEW_STATUS_REJECTED, StringComparison.OrdinalIgnoreCase);

            if (!approved && !rejected)
                return false;

            var l1EmployeeId = await _ctx.Userauthentications
                .Where(ua => ua.UserId == approverUserId)
                .Select(ua => ua.Employee.EmployeeId)
                .FirstOrDefaultAsync();

            if (l1EmployeeId == 0)
                return false;

            var inScope = await _ctx.Selfassessments
                .Where(sa => sa.AssessmentId == assessmentId && sa.Status == AssessmentConstants.STATUS_SUBMITTED)
                .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
                .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
                .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
                .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary == true), x => x.edm.EmployeeId, pe => pe.EmployeeId, (x, pe) => new { x.sa, pe })
                .Join(_ctx.Projects.Where(p => p.L1approverEmployeeId == l1EmployeeId), x => x.pe.ProjectId, p => p.ProjectId, (x, p) => x.sa)
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

                var finalDecision = approved
                    ? AssessmentConstants.REVIEW_STATUS_APPROVED
                    : AssessmentConstants.REVIEW_STATUS_REJECTED;

                var reviewsToUpdate = await _ctx.Assessmentreviews
                    .Where(ar => ar.ReviewerRole == AssessmentConstants.REVIEWER_ROLE_APPROVER
                              && ar.ReviewerId == approverUserId
                              && detailIds.Contains(ar.DetailId)
                              && ar.Rating != 0)
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

                    var existingNote = await _ctx.Assessmentreviews
                        .FirstOrDefaultAsync(ar => ar.DetailId == firstDetailId
                                                && ar.ReviewerId == approverUserId
                                                && ar.ReviewerRole == AssessmentConstants.REVIEWER_ROLE_APPROVER
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
                            ReviewerRole = AssessmentConstants.REVIEWER_ROLE_APPROVER,
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
                        .Where(ar => ar.ReviewerRole == AssessmentConstants.REVIEWER_ROLE_APPROVER
                                  && ar.ReviewerId == approverUserId
                                  && detailIds.Contains(ar.DetailId)
                                  && ar.Rating == 0)
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
                }

                return true;
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }

        public async Task SubmitApproverReviewsAsync(int approverId, int assessmentId, List<ReviewItemDto> items)
        {
            foreach (var item in items)
            {
                var entry = new Assessmentreview
                {
                    DetailId = item.DetailId,
                    ReviewerId = approverId,
                    ReviewerRole = AssessmentConstants.REVIEWER_ROLE_APPROVER,
                    Rating = item.Rating,
                    Comments = item.Comments,
                    ReviewedAt = DateTime.Now,
                    ReviewStatus = AssessmentConstants.REVIEW_STATUS_PENDING
                };
                _ctx.Assessmentreviews.Add(entry);
            }

            await _ctx.SaveChangesAsync();
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

        public async Task<Selfassessmentattachment?> GetAttachmentByIdAsync(int attachmentId)
        {
            return await _ctx.Selfassessmentattachments
                .FirstOrDefaultAsync(a => a.AttachmentId == attachmentId);
        }

        public async Task<ReviewerDecisionDto?> GetLatestReviewerDecisionAsync(int assessmentId)
        {
            var decision = await _ctx.Assessmentreviews
                .Where(ar => ar.ReviewerRole == AssessmentConstants.REVIEWER_ROLE_REVIEWER
                          && _ctx.Assessmentdetails.Any(ad => ad.DetailId == ar.DetailId && ad.AssessmentId == assessmentId))
                .OrderByDescending(ar => ar.ReviewedAt)
                .FirstOrDefaultAsync();

            if (decision == null)
                return null;

            return new ReviewerDecisionDto(
                assessmentId,
                decision.ReviewStatus ?? "",
                decision.Comments ?? "",
                decision.ReviewedAt ?? DateTime.Now
            );
        }
    }
}