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
    public class ApproverRepository : IApproverRepository
    {
        private readonly EEPZDbContext _ctx;

        public ApproverRepository(EEPZDbContext ctx)
        {
            _ctx = ctx;
        }

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

            if (l1EmployeeId == 0)
                return Enumerable.Empty<ApproverAssignmentRowDto>();


            var scopeAssessmentIds = await _ctx.Selfassessments
                .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
                .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
                .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
                .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary == true), x => x.edm.EmployeeId, pe => pe.EmployeeId, (x, pe) => new { x.sa, pe })
                .Join(_ctx.Projects.Where(p => p.L1approverEmployeeId == l1EmployeeId), x => x.pe.ProjectId, p => p.ProjectId, (x, p) => x.sa.AssessmentId)
                .Distinct()
                .ToListAsync();

            if (!scopeAssessmentIds.Any())
                return Enumerable.Empty<ApproverAssignmentRowDto>();


            var fullyL1CompleteAssessments = new List<int>();
            foreach (var assessmentId in scopeAssessmentIds)
            {
                var totalDetails = await _ctx.Assessmentdetails
                    .CountAsync(ad => ad.AssessmentId == assessmentId);

                var l1RatedDetails = await _ctx.Assessmentreviews
                    .Where(ar => ar.ReviewerRole == "Approver" && ar.Rating > 0)
                    .Join(_ctx.Assessmentdetails, ar => ar.DetailId, ad => ad.DetailId, (ar, ad) => ad)
                    .CountAsync(ad => ad.AssessmentId == assessmentId);

                if (totalDetails > 0 && totalDetails == l1RatedDetails)
                    fullyL1CompleteAssessments.Add(assessmentId);
            }

            if (!fullyL1CompleteAssessments.Any())
                return Enumerable.Empty<ApproverAssignmentRowDto>();


            var latestReviewIds = await _ctx.Assessmentreviews
                .Where(ar => ar.ReviewerRole == "Reviewer" && ar.DetailId != null)
                .GroupBy(ar => ar.DetailId)
                .Select(g => g.OrderByDescending(ar => ar.ReviewId).Select(ar => ar.ReviewId).First())
                .ToListAsync();


            var latestL2Reviews = await _ctx.Assessmentreviews
                .Where(ar => latestReviewIds.Contains(ar.ReviewId))
                .ToListAsync();


            var rejectedDetailIds = latestL2Reviews
                .Where(ar => ar.ReviewStatus == "Rejected")
                .Select(ar => ar.DetailId)
                .ToList();

            if (!rejectedDetailIds.Any())
                return Enumerable.Empty<ApproverAssignmentRowDto>();

            var assessmentIdsWithRejectedDetails = await _ctx.Assessmentdetails
                .Where(ad => rejectedDetailIds.Contains(ad.DetailId))
                .Select(ad => ad.AssessmentId)
                .Distinct()
                .ToListAsync();


            var reworkAssessmentIds = fullyL1CompleteAssessments
                .Where(id => assessmentIdsWithRejectedDetails.Contains(id))
                .ToList();

            if (!reworkAssessmentIds.Any())
                return Enumerable.Empty<ApproverAssignmentRowDto>();


            var paginatedIds = await _ctx.Selfassessments
                .Where(sa => reworkAssessmentIds.Contains(sa.AssessmentId))
                .OrderByDescending(sa => sa.SubmittedAt)
                .Skip(offset)
                .Take(pageSize)
                .Select(sa => sa.AssessmentId)
                .ToListAsync();

            var query = await _ctx.Selfassessments
                .Where(sa => paginatedIds.Contains(sa.AssessmentId))
                .Join(_ctx.Assessmentforms, sa => sa.FormId, f => f.FormId, (sa, f) => new { sa, f })
                .Join(_ctx.Userauthentications, x => x.sa.EmployeeId, ua => ua.UserId, (x, ua) => new { x.sa, x.f, ua })
                .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, x.f, x.ua, e })
                .GroupJoin(_ctx.Userprofiles, x => x.e.EmployeeId, up => up.EmployeeId, (x, upList) => new { x.sa, x.f, x.ua, x.e, upList })
                .SelectMany(x => x.upList.DefaultIfEmpty(), (x, up) => new { x.sa, x.f, x.ua, x.e, up })
                .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, x.f, x.ua, x.e, x.up, edm })
                .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary == true), x => x.edm.EmployeeId, pe => pe.EmployeeId, (x, pe) => new { x.sa, x.f, x.ua, x.e, x.up, pe })
                .Join(_ctx.Projects, x => x.pe.ProjectId, p => p.ProjectId, (x, p) => new { x.sa, x.f, x.ua, x.e, x.up, p })
                .GroupBy(x => x.sa.AssessmentId)
                .ToListAsync();

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
                Status = "Rejected",
                Project = string.Join(", ", g.Select(x => x.p.ProjectName).Distinct().OrderBy(x => x))
            }).ToList();

            return result;
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

            if (l1EmployeeId == 0)
                return Enumerable.Empty<ApproverAssignmentRowDto>();


            var scopeAssessmentIds = await _ctx.Selfassessments
                .Where(sa => sa.Status == "Submitted")
                .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
                .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
                .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
                .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary == true), x => x.edm.EmployeeId, pe => pe.EmployeeId, (x, pe) => new { x.sa, pe })
                .Join(_ctx.Projects.Where(p => p.L1approverEmployeeId == l1EmployeeId), x => x.pe.ProjectId, p => p.ProjectId, (x, p) => x.sa.AssessmentId)
                .Distinct()
                .ToListAsync();

            if (!scopeAssessmentIds.Any())
                return Enumerable.Empty<ApproverAssignmentRowDto>();


            var fullyL1CompleteAssessments = new List<int>();
            foreach (var assessmentId in scopeAssessmentIds)
            {
                var totalDetails = await _ctx.Assessmentdetails
                    .CountAsync(ad => ad.AssessmentId == assessmentId);

                var l1RatedDetails = await _ctx.Assessmentreviews
                    .Where(ar => ar.ReviewerRole == "Approver" && ar.Rating > 0)
                    .Join(_ctx.Assessmentdetails, ar => ar.DetailId, ad => ad.DetailId, (ar, ad) => ad)
                    .CountAsync(ad => ad.AssessmentId == assessmentId);

                if (totalDetails > 0 && totalDetails == l1RatedDetails)
                    fullyL1CompleteAssessments.Add(assessmentId);
            }

            if (!fullyL1CompleteAssessments.Any())
                return Enumerable.Empty<ApproverAssignmentRowDto>();


            var latestL2Reviews = await _ctx.Assessmentreviews
                .Where(ar => ar.ReviewerRole == "Reviewer" && ar.DetailId != null)
                .GroupBy(ar => ar.DetailId)
                .Select(g => g.OrderByDescending(ar => ar.ReviewId).First())
                .ToListAsync();

            var rejectedDetailIds = latestL2Reviews
                .Where(ar => ar.ReviewStatus == "Rejected")
                .Select(ar => ar.DetailId)
                .ToList();

            var rejectedAssessmentIds = await _ctx.Assessmentdetails
                .Where(ad => rejectedDetailIds.Contains(ad.DetailId))
                .Select(ad => ad.AssessmentId)
                .Distinct()
                .ToListAsync();


            var finalAssessmentIds = fullyL1CompleteAssessments
                .Where(id => !rejectedAssessmentIds.Contains(id))
                .ToList();

            if (!finalAssessmentIds.Any())
                return Enumerable.Empty<ApproverAssignmentRowDto>();


            var paginatedIds = finalAssessmentIds
                .OrderByDescending(id => _ctx.Selfassessments
                    .Where(sa => sa.AssessmentId == id)
                    .Select(sa => sa.SubmittedAt)
                    .FirstOrDefault())
                .Skip(offset)
                .Take(pageSize)
                .ToList();

            var query = await _ctx.Selfassessments
                .Where(sa => paginatedIds.Contains(sa.AssessmentId))
                .Join(_ctx.Assessmentforms, sa => sa.FormId, f => f.FormId, (sa, f) => new { sa, f })
                .Join(_ctx.Userauthentications, x => x.sa.EmployeeId, ua => ua.UserId, (x, ua) => new { x.sa, x.f, ua })
                .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, x.f, x.ua, e })
                .GroupJoin(_ctx.Userprofiles, x => x.e.EmployeeId, up => up.EmployeeId, (x, upList) => new { x.sa, x.f, x.ua, x.e, upList })
                .SelectMany(x => x.upList.DefaultIfEmpty(), (x, up) => new { x.sa, x.f, x.ua, x.e, up })
                .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, x.f, x.ua, x.e, x.up, edm })
                .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary == true), x => x.edm.EmployeeId, pe => pe.EmployeeId, (x, pe) => new { x.sa, x.f, x.ua, x.e, x.up, pe })
                .Join(_ctx.Projects, x => x.pe.ProjectId, p => p.ProjectId, (x, p) => new { x.sa, x.f, x.ua, x.e, x.up, p })
                .GroupBy(x => x.sa.AssessmentId)
                .ToListAsync();

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




        public async Task<IEnumerable<ReviewerAssessmentViewDto>> GetApproverAssessmentsWithDetailsAsync(int approverUserId, int page, int pageSize)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 25;
            var offset = (page - 1) * pageSize;

            var l1EmployeeId = await _ctx.Userauthentications
                .Where(ua => ua.UserId == approverUserId)
                .Select(ua => ua.Employee.EmployeeId)
                .FirstOrDefaultAsync();

            if (l1EmployeeId == 0)
                return Enumerable.Empty<ReviewerAssessmentViewDto>();

            var scopeAssessmentIds = await _ctx.Selfassessments
                .Where(sa => sa.Status == "Submitted")
                .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
                .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
                .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
                .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary == true), x => x.edm.EmployeeId, pe => pe.EmployeeId, (x, pe) => new { x.sa, pe })
                .Join(_ctx.Projects.Where(p => p.L1approverEmployeeId == l1EmployeeId), x => x.pe.ProjectId, p => p.ProjectId, (x, p) => x.sa.AssessmentId)
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
                var dto = await GetAssessmentForApproverAsync(approverUserId, assessmentId);
                if (dto != null)
                    result.Add(dto);
            }

            return result;
        }

        public async Task<ReviewerAssessmentViewDto?> GetAssessmentForApproverAsync(int approverUserId, int assessmentId)
        {
            var l1EmployeeId = await _ctx.Userauthentications
                .Where(ua => ua.UserId == approverUserId)
                .Select(ua => ua.Employee.EmployeeId)
                .FirstOrDefaultAsync();

            if (l1EmployeeId == 0)
                return null;

            var isInScope = await _ctx.Selfassessments
                .Where(sa => sa.AssessmentId == assessmentId && sa.Status == "Submitted")
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
                .Where(sa => sa.AssessmentId == dto.AssessmentId && sa.Status == "Submitted")
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
                    .Where(ar => ar.ReviewerId == approverUserId && ar.ReviewerRole == "Approver" && postedIds.Contains(ar.DetailId) && ar.Rating != 0)
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
                    .Where(ar => ar.ReviewerRole == "Reviewer" && ar.ReviewStatus == "Rejected" && postedIds.Contains(ar.DetailId))
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

        public async Task<bool> SetApproverDecisionAsync(int approverUserId, int assessmentId, string decision, string? approverComment)
        {
            decision = (decision ?? string.Empty).Trim();
            var approved = string.Equals(decision, "Approved", StringComparison.OrdinalIgnoreCase);
            var rejected = string.Equals(decision, "Rejected", StringComparison.OrdinalIgnoreCase);

            if (!approved && !rejected)
                return false;

            var l1EmployeeId = await _ctx.Userauthentications
                .Where(ua => ua.UserId == approverUserId)
                .Select(ua => ua.Employee.EmployeeId)
                .FirstOrDefaultAsync();

            if (l1EmployeeId == 0)
                return false;

            var inScope = await _ctx.Selfassessments
                .Where(sa => sa.AssessmentId == assessmentId && sa.Status == "Submitted")
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

                var finalDecision = approved ? "Approved" : "Rejected";

                var reviewsToUpdate = await _ctx.Assessmentreviews
                    .Where(ar => ar.ReviewerRole == "Approver" && ar.ReviewerId == approverUserId && detailIds.Contains(ar.DetailId) && ar.Rating != 0)
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
                        .FirstOrDefaultAsync(ar => ar.DetailId == firstDetailId && ar.ReviewerId == approverUserId && ar.ReviewerRole == "Approver" && ar.Rating == 0);

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
                        .Where(ar => ar.ReviewerRole == "Approver" && ar.ReviewerId == approverUserId && detailIds.Contains(ar.DetailId) && ar.Rating == 0)
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
        .Where(ar => ar.ReviewerRole == "Reviewer"
                  && _ctx.Assessmentdetails.Any(ad => ad.DetailId == ar.DetailId && ad.AssessmentId == assessmentId))
        .OrderByDescending(ar => ar.ReviewedAt)
        .FirstOrDefaultAsync();

    if (decision == null)
        return null;

    return new ReviewerDecisionDto(
        assessmentId,
        decision.ReviewStatus ?? "",  // Returns "Approved", "Rejected", or empty
        decision.Comments ?? "",
        decision.ReviewedAt ?? DateTime.Now
    );
}

    }
}
