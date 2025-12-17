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


public partial class ManagerReviewRepository : IManagerReviewRepository
{
    private readonly EEPZDbContext _ctx;
    
    public ManagerReviewRepository(EEPZDbContext ctx) => _ctx = ctx;

    public async Task<IEnumerable<ApproverAssignmentRowDto>> GetApproverSubmittedFormsAsync(
        int approverUserId, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 25;
        var offset = (page - 1) * pageSize;

        
        var l1EmployeeId = await _ctx.Userauthentications
            .Where(ua => ua.UserId == approverUserId)
            .Select(ua => ua.Employee.EmployeeId)
            .FirstOrDefaultAsync();

        if (l1EmployeeId == 0) return Enumerable.Empty<ApproverAssignmentRowDto>();

        
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

        
        var latestL1ReviewIds = await _ctx.Assessmentreviews
            .Where(ar => ar.ReviewerRole == "Approver" && ar.DetailId != null)
            .GroupBy(ar => ar.DetailId)
            .Select(g => g.Max(ar => ar.ReviewId))
            .ToListAsync();

        
        var hasL1AssessmentIds = await _ctx.Assessmentreviews
            .Where(ar => ar.ReviewerRole == "Approver" && ar.DetailId != null)
            .Select(ar => ar.DetailId)
            .ToListAsync();

        var assessmentsWithL1Details = await _ctx.Assessmentdetails
            .Where(ad => hasL1AssessmentIds.Contains(ad.DetailId))
            .Select(ad => ad.AssessmentId)
            .Distinct()
            .ToListAsync();

        
        var latestL2Reviews = await _ctx.Assessmentreviews
            .Where(ar => ar.ReviewerRole == "Reviewer" && ar.DetailId != null)
            .GroupBy(ar => ar.DetailId)
            .Select(g => g.OrderByDescending(ar => ar.ReviewId).First())
            .ToListAsync();

        
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

        
        var visibleAssessmentIds = scopeAssessmentIds
            .Where(id => !fullyDecidedAssessmentIds.Contains(id) && !assessmentsWithL1Details.Contains(id))
            .ToList();

        
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


    
    public async Task<IEnumerable<ApproverAssignmentRowDto>> GetReviewerSubmittedFormsAsync(
        int reviewerUserId, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 25;
        var offset = (page - 1) * pageSize;

        
        var l2EmployeeId = await _ctx.Userauthentications
            .Where(ua => ua.UserId == reviewerUserId)
            .Select(ua => ua.Employee.EmployeeId)
            .FirstOrDefaultAsync();

        if (l2EmployeeId == 0) return Enumerable.Empty<ApproverAssignmentRowDto>();

        
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

        
        var latestL2Reviews = await _ctx.Assessmentreviews
            .Where(ar => ar.ReviewerRole == "Reviewer" && ar.DetailId != null)
            .GroupBy(ar => ar.DetailId)
            .Select(g => g.OrderByDescending(ar => ar.ReviewId).First())
            .ToListAsync();

        var decidedDetailIds = latestL2Reviews
            .Where(ar => ar.ReviewStatus == "Approved" || ar.ReviewStatus == "Rejected")
            .Select(ar => ar.DetailId)
            .ToList();

        
        var fullyDecidedAssessmentIds = await _ctx.Assessmentdetails
            .Where(ad => decidedDetailIds.Contains(ad.DetailId))
            .GroupBy(ad => ad.AssessmentId)
            .Where(g => g.Count() == _ctx.Assessmentdetails.Count(ad => ad.AssessmentId == g.Key))
            .Select(g => g.Key)
            .ToListAsync();

        
        var visibleAssessmentIds = scopeAssessmentIds
            .Where(id => !fullyDecidedAssessmentIds.Contains(id))
            .ToList();

        
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

    
    
    
    
    
    public async Task<int> SaveApproverReviewAsync(int approverUserId, SubmitReviewDto dto)
    {
        if (dto is null || dto.Items is null || dto.Items.Count == 0)
            return 0;

        
        var l1EmployeeId = await _ctx.Userauthentications
            .Where(ua => ua.UserId == approverUserId)
            .Select(ua => ua.Employee.EmployeeId)
            .FirstOrDefaultAsync();

        if (l1EmployeeId == 0) return 0;

        
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

        
        var postedIds = dto.Items.Select(i => i.DetailId).Distinct().ToArray();
        var validCount = await _ctx.Assessmentdetails
            .CountAsync(ad => ad.AssessmentId == dto.AssessmentId && postedIds.Contains(ad.DetailId));

        if (validCount != postedIds.Length) return 0;

        using var tx = await _ctx.Database.BeginTransactionAsync();

        try
        {
            
            var oldReviews = await _ctx.Assessmentreviews
                .Where(ar => ar.ReviewerId == approverUserId 
                    && ar.ReviewerRole == "Approver" 
                    && postedIds.Contains(ar.DetailId)
                    && ar.Rating > 0)
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

    
    
    
   


public async Task<ReviewerAssessmentViewDto?> GetAssessmentForReviewerAsync(
    int reviewerUserId, int assessmentId)
{
    
    var l2EmployeeId = await _ctx.Userauthentications
        .Where(ua => ua.UserId == reviewerUserId)
        .Select(ua => ua.Employee.EmployeeId)
        .FirstOrDefaultAsync();

    if (l2EmployeeId == 0) return null;

    
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



public async Task<ReviewerAssessmentViewDto?> GetAssessmentForApproverAsync(
    int approverUserId, int assessmentId)
{
    
    var l1EmployeeId = await _ctx.Userauthentications
        .Where(ua => ua.UserId == approverUserId)
        .Select(ua => ua.Employee.EmployeeId)
        .FirstOrDefaultAsync();

    if (l1EmployeeId == 0) return null;

    
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

    
    
    
    public async Task<IEnumerable<ApproverAssignmentRowDto>> GetSubmittedL1RatingsAsync(
        int approverUserId, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 25;
        var offset = (page - 1) * pageSize;

        
        var l1EmployeeId = await _ctx.Userauthentications
            .Where(ua => ua.UserId == approverUserId)
            .Select(ua => ua.Employee.EmployeeId)
            .FirstOrDefaultAsync();

        if (l1EmployeeId == 0) return Enumerable.Empty<ApproverAssignmentRowDto>();

        
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

    
    
    
    public async Task<IEnumerable<ApproverAssignmentRowDto>> GetReviewerSubmittedRatingsAsync(
        int reviewerUserId, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 25;
        var offset = (page - 1) * pageSize;

        
        var l2EmployeeId = await _ctx.Userauthentications
            .Where(ua => ua.UserId == reviewerUserId)
            .Select(ua => ua.Employee.EmployeeId)
            .FirstOrDefaultAsync();

        if (l2EmployeeId == 0) return Enumerable.Empty<ApproverAssignmentRowDto>();

        
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

    
    
    
    public async Task<int> SaveReviewerReviewAsync(int reviewerUserId, SubmitReviewDto dto)
    {
        if (dto is null || dto.Items is null || dto.Items.Count == 0) return 0;

        
        var l2EmployeeId = await _ctx.Userauthentications
            .Where(ua => ua.UserId == reviewerUserId)
            .Select(ua => ua.Employee.EmployeeId)
            .FirstOrDefaultAsync();

        if (l2EmployeeId == 0) return 0;

        
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
                
                var existingReview = await _ctx.Assessmentreviews
                    .FirstOrDefaultAsync(ar => ar.DetailId == item.DetailId 
                        && ar.ReviewerId == reviewerUserId 
                        && ar.ReviewerRole == "Reviewer" 
                        && ar.Rating > 0);

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

        
        var l2EmployeeId = await _ctx.Userauthentications
            .Where(ua => ua.UserId == reviewerUserId)
            .Select(ua => ua.Employee.EmployeeId)
            .FirstOrDefaultAsync();

        if (l2EmployeeId == 0) return false;

        
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

        
        var l1EmployeeId = await _ctx.Userauthentications
            .Where(ua => ua.UserId == approverUserId)
            .Select(ua => ua.Employee.EmployeeId)
            .FirstOrDefaultAsync();

        if (l1EmployeeId == 0) return false;

        
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

    
    
    
    public async Task<IEnumerable<ApproverAssignmentRowDto>> GetApproverReworkFormsAsync(
        int approverUserId, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 25;
        var offset = (page - 1) * pageSize;

        
        var l1EmployeeId = await _ctx.Userauthentications
            .Where(ua => ua.UserId == approverUserId)
            .Select(ua => ua.Employee.EmployeeId)
            .FirstOrDefaultAsync();

        if (l1EmployeeId == 0) return Enumerable.Empty<ApproverAssignmentRowDto>();

        
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

    
    
    
    


public async Task<IEnumerable<ReviewerAssessmentViewDto>> GetApproverAssessmentsWithDetailsAsync(
    int approverUserId, int page, int pageSize)
{
    if (page < 1) page = 1;
    if (pageSize < 1) pageSize = 25;
    var offset = (page - 1) * pageSize;

    
    var l1EmployeeId = await _ctx.Userauthentications
        .Where(ua => ua.UserId == approverUserId)
        .Select(ua => ua.Employee.EmployeeId)
        .FirstOrDefaultAsync();

    if (l1EmployeeId == 0) return Enumerable.Empty<ReviewerAssessmentViewDto>();

    
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

    
    var hasL1AssessmentIds = await _ctx.Assessmentreviews
        .Where(ar => ar.ReviewerRole == "Approver" && ar.DetailId != null)
        .Select(ar => ar.DetailId)
        .ToListAsync();

    var assessmentsWithL1 = await _ctx.Assessmentdetails
        .Where(ad => hasL1AssessmentIds.Contains(ad.DetailId))
        .Select(ad => ad.AssessmentId)
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
        .Where(id => !fullyDecidedAssessmentIds.Contains(id) && !assessmentsWithL1.Contains(id))
        .ToList();

    
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

public async Task<IEnumerable<ReviewerAssessmentViewDto>> GetReviewerAssessmentsWithDetailsAsync(
    int reviewerUserId, int page, int pageSize)
{
    if (page < 1) page = 1;
    if (pageSize < 1) pageSize = 25;
    var offset = (page - 1) * pageSize;

    
    var l2EmployeeId = await _ctx.Userauthentications
        .Where(ua => ua.UserId == reviewerUserId)
        .Select(ua => ua.Employee.EmployeeId)
        .FirstOrDefaultAsync();

    if (l2EmployeeId == 0) return Enumerable.Empty<ReviewerAssessmentViewDto>();

    
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

    
    var visibleAssessmentIds = l1ApprovedAssessmentIds
        .Where(id => !fullyDecidedAssessmentIds.Contains(id))
        .ToList();

    
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

        
        var latestL1ReviewsList = latestL1Reviews.ToList();
        var latestL2ReviewsList = latestL2Reviews.ToList();

        
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