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

    internal static class FormattingConstants
    {
        public const string DateTimeFormat = "yyyy-MM-dd HH:mm:ss";
        public const string DefaultRejectionNote = "Reviewer Rejected";
    }

    internal enum ReviewerRole
    {
        Reviewer,
        Approver
    }

    internal enum SelfAssessmentStatus
    {
        Submitted
    }

    internal enum ReviewStatus
    {
        Pending,
        Approved,
        Rejected
    }

    public class ReviewerRepository : IReviewerRepository
    {
        private readonly EEPZDbContext _ctx;

        public ReviewerRepository(EEPZDbContext ctx)
        {
            _ctx = ctx;
        }

        public async Task<IEnumerable<ApproverAssignmentRowDto>> GetReviewerSubmittedFormsAsync(int reviewerUserId, int page, int pageSize)
        {
            NormalizePaging(ref page, ref pageSize, out var offset);

            var l2EmployeeId = await GetL2EmployeeIdAsync(reviewerUserId);
            if (l2EmployeeId == 0) return Enumerable.Empty<ApproverAssignmentRowDto>();

            var scopeAssessmentIds = await GetScopeAssessmentIdsForReviewerAsync(l2EmployeeId);
            if (!scopeAssessmentIds.Any()) return Enumerable.Empty<ApproverAssignmentRowDto>();


            var latestL2Decisions = await GetLatestDecisionDetailIdsByReviewerAsync();
            var fullyDecidedAssessmentIds = await GetFullyDecidedAssessmentIdsAsync(scopeAssessmentIds, latestL2Decisions);
            var visibleAssessmentIds = scopeAssessmentIds.Except(fullyDecidedAssessmentIds).ToList();
            if (!visibleAssessmentIds.Any()) return Enumerable.Empty<ApproverAssignmentRowDto>();

            var pagedAssessmentIds = await GetPaginatedAssessmentIdsAsync(visibleAssessmentIds, offset, pageSize);
            if (!pagedAssessmentIds.Any()) return Enumerable.Empty<ApproverAssignmentRowDto>();

            return await BuildApproverAssignmentsAsync(pagedAssessmentIds);
        }

        public async Task<IEnumerable<ApproverAssignmentRowDto>> GetReviewerSubmittedRatingsAsync(int reviewerUserId, int page, int pageSize)
        {
            NormalizePaging(ref page, ref pageSize, out var offset);

            var l2EmployeeId = await GetL2EmployeeIdAsync(reviewerUserId);
            if (l2EmployeeId == 0) return Enumerable.Empty<ApproverAssignmentRowDto>();

            var scopeAssessmentIds = await GetScopeAssessmentIdsForReviewerAsync(l2EmployeeId);
            if (!scopeAssessmentIds.Any()) return Enumerable.Empty<ApproverAssignmentRowDto>();


            var assessmentsWithL2Decision = await _ctx.Assessmentreviews
                .Where(ar => ar.ReviewerRole == nameof(ReviewerRole.Reviewer)
                             && (ar.ReviewStatus == nameof(ReviewStatus.Approved)
                                 || ar.ReviewStatus == nameof(ReviewStatus.Rejected)))
                .Join(_ctx.Assessmentdetails,
                    ar => ar.DetailId,
                    ad => ad.DetailId,
                    (ar, ad) => ad.AssessmentId)
                .Distinct()
                .ToListAsync();

            var finalAssessmentIds = scopeAssessmentIds.Intersect(assessmentsWithL2Decision).ToList();
            if (!finalAssessmentIds.Any()) return Enumerable.Empty<ApproverAssignmentRowDto>();

            var pagedAssessmentIds = await GetPaginatedAssessmentIdsAsync(finalAssessmentIds, offset, pageSize);
            if (!pagedAssessmentIds.Any()) return Enumerable.Empty<ApproverAssignmentRowDto>();

            return await BuildApproverAssignmentsAsync(pagedAssessmentIds);
        }

        public async Task<IEnumerable<ReviewerAssessmentViewDto>> GetReviewerAssessmentsWithDetailsAsync(int reviewerUserId, int page, int pageSize)
        {
            NormalizePaging(ref page, ref pageSize, out var offset);

            var l2EmployeeId = await GetL2EmployeeIdAsync(reviewerUserId);
            if (l2EmployeeId == 0) return Enumerable.Empty<ReviewerAssessmentViewDto>();

            var scopeAssessmentIds = await GetScopeAssessmentIdsForReviewerAsync(l2EmployeeId);
            if (!scopeAssessmentIds.Any()) return Enumerable.Empty<ReviewerAssessmentViewDto>();


            var l1CompleteAssessmentIds = await GetAssessmentsWhereL1IsCompleteAsync(scopeAssessmentIds);
            if (!l1CompleteAssessmentIds.Any()) return Enumerable.Empty<ReviewerAssessmentViewDto>();


            var assessmentsWithL2Decision = await _ctx.Assessmentreviews
                .Where(ar => ar.ReviewerRole == nameof(ReviewerRole.Reviewer)
                             && (ar.ReviewStatus == nameof(ReviewStatus.Approved)
                                 || ar.ReviewStatus == nameof(ReviewStatus.Rejected)))
                .Join(_ctx.Assessmentdetails, ar => ar.DetailId, ad => ad.DetailId, (ar, ad) => ad.AssessmentId)
                .Distinct()
                .ToListAsync();

            var visibleAssessmentIds = l1CompleteAssessmentIds.Except(assessmentsWithL2Decision).ToList();
            if (!visibleAssessmentIds.Any()) return Enumerable.Empty<ReviewerAssessmentViewDto>();

            var pagedAssessmentIds = await GetPaginatedAssessmentIdsAsync(visibleAssessmentIds, offset, pageSize);
            if (!pagedAssessmentIds.Any()) return Enumerable.Empty<ReviewerAssessmentViewDto>();

            var result = new List<ReviewerAssessmentViewDto>();
            foreach (var assessmentId in pagedAssessmentIds)
            {
                var dto = await GetAssessmentForReviewerAsync(reviewerUserId, assessmentId);
                if (dto != null) result.Add(dto);
            }

            return result;
        }

        public async Task<ReviewerAssessmentViewDto?> GetAssessmentForReviewerAsync(int reviewerUserId, int assessmentId)
        {
            var l2EmployeeId = await GetL2EmployeeIdAsync(reviewerUserId);
            if (l2EmployeeId == 0) return null;

            var isInScope = await IsReviewerInScopeForAssessmentAsync(l2EmployeeId, assessmentId);
            if (!isInScope) return null;

            return await BuildReviewerAssessmentViewDtoAsync(assessmentId);
        }

        public async Task<int> SaveReviewerReviewAsync(int reviewerUserId, SubmitReviewDto dto)
        {
            if (dto == null || dto.Items == null || dto.Items.Count == 0) return 0;

            var l2EmployeeId = await GetL2EmployeeIdAsync(reviewerUserId);
            if (l2EmployeeId == 0) return 0;

            var inScope = await IsReviewerInScopeForAssessmentAsync(l2EmployeeId, dto.AssessmentId);
            if (!inScope) return 0;

            var ids = dto.Items.Select(x => x.DetailId).Distinct().ToArray();
            var validCount = await _ctx.Assessmentdetails
                .CountAsync(ad => ad.AssessmentId == dto.AssessmentId && ids.Contains(ad.DetailId));
            if (validCount != ids.Length) return 0;

            using var tx = await _ctx.Database.BeginTransactionAsync();

            var saved = 0;
            foreach (var it in dto.Items)
            {
                var review = new Assessmentreview
                {
                    DetailId = it.DetailId,
                    ReviewerId = reviewerUserId,
                    ReviewerRole = nameof(ReviewerRole.Reviewer),
                    Rating = it.Rating,
                    Comments = it.Comments,
                    ReviewedAt = DateTime.Now,
                    ReviewStatus = nameof(ReviewStatus.Pending)
                };

                _ctx.Assessmentreviews.Add(review);
                saved++;
            }

            await _ctx.SaveChangesAsync();
            await tx.CommitAsync();

            return saved;
        }

        public async Task<bool> SetReviewerDecisionAsync(int reviewerUserId, int assessmentId, string decision, string? reviewerComment)
        {
            var decisionNormalized = (decision ?? string.Empty).Trim();
            var approved = string.Equals(decisionNormalized, nameof(ReviewStatus.Approved), StringComparison.OrdinalIgnoreCase);
            var rejected = string.Equals(decisionNormalized, nameof(ReviewStatus.Rejected), StringComparison.OrdinalIgnoreCase);

            if (!approved && !rejected) return false;

            var l2EmployeeId = await GetL2EmployeeIdAsync(reviewerUserId);
            if (l2EmployeeId == 0) return false;

            var inScope = await IsReviewerInScopeForAssessmentAsync(l2EmployeeId, assessmentId);
            if (!inScope) return false;

            using var tx = await _ctx.Database.BeginTransactionAsync();

            var detailIds = await _ctx.Assessmentdetails
                .Where(ad => ad.AssessmentId == assessmentId)
                .Select(ad => ad.DetailId)
                .ToListAsync();

            if (!detailIds.Any()) return false;

            var finalDecision = approved ? nameof(ReviewStatus.Approved) : nameof(ReviewStatus.Rejected);


            var reviewsToUpdate = await _ctx.Assessmentreviews
                .Where(ar => ar.ReviewerRole == nameof(ReviewerRole.Reviewer)
                             && ar.ReviewerId == reviewerUserId
                             && detailIds.Contains(ar.DetailId)
                             && ar.Rating != 0)
                .ToListAsync();

            var now = DateTime.Now;
            foreach (var review in reviewsToUpdate)
            {
                review.ReviewStatus = finalDecision;
                review.ReviewedAt = now;
                _ctx.Assessmentreviews.Update(review);
            }

            await _ctx.SaveChangesAsync();

            if (rejected)
            {

                var note = reviewerComment ?? FormattingConstants.DefaultRejectionNote;
                var firstDetailId = detailIds.First();

                var existingNote = await _ctx.Assessmentreviews.FirstOrDefaultAsync(ar =>
                    ar.DetailId == firstDetailId
                    && ar.ReviewerId == reviewerUserId
                    && ar.ReviewerRole == nameof(ReviewerRole.Reviewer)
                    && ar.Rating == 0);

                if (existingNote != null)
                {
                    existingNote.Comments = note;
                    existingNote.ReviewStatus = finalDecision;
                    existingNote.ReviewedAt = now;
                    _ctx.Assessmentreviews.Update(existingNote);
                }
                else
                {
                    var noteEntry = new Assessmentreview
                    {
                        DetailId = firstDetailId,
                        ReviewerId = reviewerUserId,
                        ReviewerRole = nameof(ReviewerRole.Reviewer),
                        Rating = 0,
                        Comments = note,
                        ReviewedAt = now,
                        ReviewStatus = finalDecision
                    };
                    _ctx.Assessmentreviews.Add(noteEntry);
                }
            }
            else
            {

                var notesToDelete = await _ctx.Assessmentreviews
                    .Where(ar => ar.ReviewerRole == nameof(ReviewerRole.Reviewer)
                                 && ar.ReviewerId == reviewerUserId
                                 && detailIds.Contains(ar.DetailId)
                                 && ar.Rating == 0)
                    .ToListAsync();
                _ctx.Assessmentreviews.RemoveRange(notesToDelete);
            }

            await _ctx.SaveChangesAsync();


            var assessment = await _ctx.Selfassessments.FirstOrDefaultAsync(a => a.AssessmentId == assessmentId);
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

            await tx.CommitAsync();
            return true;
        }

        public async Task SubmitReviewerReviewsAsync(int reviewerUserId, int assessmentId, List<ReviewItemDto> items)
        {
            using var tx = await _ctx.Database.BeginTransactionAsync();

            var now = DateTime.Now;

            foreach (var item in items)
            {
                var existingReview = await _ctx.Assessmentreviews.FirstOrDefaultAsync(ar =>
                    ar.DetailId == item.DetailId
                    && ar.ReviewerId == reviewerUserId
                    && ar.ReviewerRole == nameof(ReviewerRole.Reviewer)
                    && ar.Rating != 0);

                if (existingReview != null)
                {
                    existingReview.Rating = item.Rating;
                    existingReview.Comments = item.Comments;
                    existingReview.ReviewedAt = now;
                    existingReview.ReviewStatus = null;
                    _ctx.Assessmentreviews.Update(existingReview);
                }
                else
                {
                    var newReview = new Assessmentreview
                    {
                        DetailId = item.DetailId,
                        ReviewerId = reviewerUserId,
                        ReviewerRole = nameof(ReviewerRole.Reviewer),
                        Rating = item.Rating,
                        Comments = item.Comments,
                        ReviewedAt = now,
                        ReviewStatus = null
                    };
                    _ctx.Assessmentreviews.Add(newReview);
                }
            }

            await _ctx.SaveChangesAsync();
            await tx.CommitAsync();
        }

        public async Task<ReviewerDecisionDto?> GetLatestReviewerDecisionAsync(int assessmentId)
        {

            var decision = await _ctx.Assessmentreviews
                .Where(ar => ar.ReviewerRole == nameof(ReviewerRole.Reviewer) && ar.Rating == 0)
                .Join(_ctx.Assessmentdetails,
                    ar => ar.DetailId,
                    ad => ad.DetailId,
                    (ar, ad) => new { ar, ad })
                .Where(x => x.ad.AssessmentId == assessmentId)
                .OrderByDescending(x => x.ar.ReviewedAt)
                .Select(x => x.ar)
                .FirstOrDefaultAsync();

            if (decision == null) return null;

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

        public async Task<Selfassessmentattachment?> GetAttachmentByIdAsync(int attachmentId)
        {
            return await _ctx.Selfassessmentattachments
                .FirstOrDefaultAsync(a => a.AttachmentId == attachmentId);
        }





        private static void NormalizePaging(ref int page, ref int pageSize, out int offset)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 25;
            offset = (page - 1) * pageSize;
        }

        private async Task<int> GetL2EmployeeIdAsync(int reviewerUserId)
        {
            return await _ctx.Userauthentications
                .Where(ua => ua.UserId == reviewerUserId)
                .Select(ua => ua.Employee.EmployeeId)
                .FirstOrDefaultAsync();
        }

        private async Task<List<int>> GetScopeAssessmentIdsForReviewerAsync(int l2EmployeeId)
        {
            var submitted = nameof(SelfAssessmentStatus.Submitted);

            return await _ctx.Selfassessments
                .Where(sa => sa.Status == submitted)
                .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
                .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
                .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
                .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary == true), x => x.edm.EmployeeId, pe => pe.EmployeeId, (x, pe) => new { x.sa, pe })
                .Join(_ctx.Projects.Where(p => p.L2approverEmployeeId == l2EmployeeId), x => x.pe.ProjectId, p => p.ProjectId, (x, p) => x.sa.AssessmentId)
                .Distinct()
                .ToListAsync();
        }

        private async Task<List<int>> GetLatestDecisionDetailIdsByReviewerAsync()
        {
            var reviewer = nameof(ReviewerRole.Reviewer);
            var approved = nameof(ReviewStatus.Approved);
            var rejected = nameof(ReviewStatus.Rejected);

            var latest = await _ctx.Assessmentreviews
                .Where(ar => ar.ReviewerRole == reviewer && ar.DetailId != 0)
                .GroupBy(ar => ar.DetailId)
                .Select(g => g.OrderByDescending(ar => ar.ReviewId).First())
                .ToListAsync();

            return latest
                .Where(ar => ar.ReviewStatus == approved || ar.ReviewStatus == rejected)
                .Select(ar => ar.DetailId)
                .ToList();
        }

        private async Task<List<int>> GetFullyDecidedAssessmentIdsAsync(IEnumerable<int> scopeAssessmentIds, List<int> decidedDetailIds)
        {
            var fullyDecided = new List<int>();

            foreach (var assessmentId in scopeAssessmentIds)
            {
                var totalDetails = await _ctx.Assessmentdetails.CountAsync(ad => ad.AssessmentId == assessmentId);
                if (totalDetails == 0) continue;

                var decidedCount = await _ctx.Assessmentdetails
                    .CountAsync(ad => ad.AssessmentId == assessmentId && decidedDetailIds.Contains(ad.DetailId));

                if (totalDetails == decidedCount)
                    fullyDecided.Add(assessmentId);
            }

            return fullyDecided;
        }

        private async Task<List<int>> GetPaginatedAssessmentIdsAsync(IEnumerable<int> baseIds, int offset, int pageSize)
        {
            return await _ctx.Selfassessments
                .Where(sa => baseIds.Contains(sa.AssessmentId))
                .OrderByDescending(sa => sa.SubmittedAt)
                .Skip(offset)
                .Take(pageSize)
                .Select(sa => sa.AssessmentId)
                .ToListAsync();
        }

        private async Task<IEnumerable<ApproverAssignmentRowDto>> BuildApproverAssignmentsAsync(IEnumerable<int> assessmentIds)
        {
            var submitted = nameof(SelfAssessmentStatus.Submitted);

            var rows = await _ctx.Selfassessments
                .Where(sa => assessmentIds.Contains(sa.AssessmentId) && sa.Status == submitted)
                .Join(_ctx.Assessmentforms, sa => sa.FormId, f => f.FormId, (sa, f) => new { sa, f })
                .Join(_ctx.Userauthentications, x => x.sa.EmployeeId, ua => ua.UserId, (x, ua) => new { x.sa, x.f, ua })
                .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, x.f, x.ua, e })
                .GroupJoin(_ctx.Userprofiles, x => x.e.EmployeeId, up => up.EmployeeId, (x, upList) => new { x.sa, x.f, x.ua, x.e, upList })
                .SelectMany(x => x.upList.DefaultIfEmpty(), (x, up) => new { x.sa, x.f, x.ua, x.e, up })
                .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, x.f, x.ua, x.e, x.up, edm })
                .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary == true), x => x.edm.EmployeeId, pe => pe.EmployeeId, (x, pe) => new { x.sa, x.f, x.ua, x.e, x.up, pe })
                .Join(_ctx.Projects, x => x.pe.ProjectId, p => p.ProjectId, (x, p) => new { x.sa, x.f, x.ua, x.e, x.up, p })
                .ToListAsync();

            var grouped = rows.GroupBy(x => x.sa.AssessmentId)
                .Select(g => new ApproverAssignmentRowDto
                {
                    AssessmentId = g.Key,
                    EmployeeName = g.First().up != null
                        ? $"{g.First().up.FirstName} {g.First().up.LastName}".Trim()
                        : (string.IsNullOrWhiteSpace(g.First().ua.Email)
                            ? g.First().e.EmployeeCompanyId
                            : g.First().ua.Email),
                    FormName = g.First().f.Name ?? string.Empty,
                    SubmittedAt = (g.First().sa.SubmittedAt != null
                        ? g.First().sa.SubmittedAt.Value.ToString(FormattingConstants.DateTimeFormat)
                        : DateTime.Now.ToString(FormattingConstants.DateTimeFormat)),
                    Status = g.First().sa.Status,
                    Project = string.Join(", ", g.Select(x => x.p.ProjectName).Distinct().OrderBy(x => x))
                })
                .OrderByDescending(r => r.SubmittedAt)
                .ToList();

            return grouped;
        }

        private async Task<List<int>> GetAssessmentsWhereL1IsCompleteAsync(IEnumerable<int> scopeAssessmentIds)
        {
            var approver = nameof(ReviewerRole.Approver);
            var approved = nameof(ReviewStatus.Approved);


            var perDetail = await _ctx.Assessmentdetails
                .Where(ad => scopeAssessmentIds.Contains(ad.AssessmentId))
                .GroupJoin(
                    _ctx.Assessmentreviews.Where(ar =>
                        ar.ReviewerRole == approver && ar.Rating != 0 && ar.ReviewStatus == approved),
                    ad => ad.DetailId,
                    ar => ar.DetailId,
                    (ad, reviews) => new { ad.AssessmentId, HasApprovedL1 = reviews.Any() })
                .GroupBy(x => x.AssessmentId)
                .Where(g => g.Any() && g.All(x => x.HasApprovedL1))
                .Select(g => g.Key)
                .ToListAsync();

            return perDetail;
        }

        private async Task<bool> IsReviewerInScopeForAssessmentAsync(int l2EmployeeId, int assessmentId)
        {
            var submitted = nameof(SelfAssessmentStatus.Submitted);

            var scoped = await _ctx.Selfassessments
                .Where(sa => sa.AssessmentId == assessmentId && sa.Status == submitted)
                .Join(_ctx.Userauthentications, sa => sa.EmployeeId, ua => ua.UserId, (sa, ua) => new { sa, ua })
                .Join(_ctx.Employees, x => x.ua.EmployeeId, e => e.EmployeeId, (x, e) => new { x.sa, e })
                .Join(_ctx.Employeedetailsmasters, x => x.e.EmployeeId, edm => edm.EmployeeId, (x, edm) => new { x.sa, edm })
                .Join(_ctx.Projectemployees.Where(pe => pe.IsPrimary == true), x => x.edm.EmployeeId, pe => pe.EmployeeId, (x, pe) => new { x.sa, pe })
                .Join(_ctx.Projects.Where(p => p.L2approverEmployeeId == l2EmployeeId), x => x.pe.ProjectId, p => p.ProjectId, (x, p) => x.sa)
                .AnyAsync();

            return scoped;
        }

        private async Task<ReviewerAssessmentViewDto?> BuildReviewerAssessmentViewDtoAsync(int assessmentId)
        {
            var assessment = await _ctx.Selfassessments
                .Where(sa => sa.AssessmentId == assessmentId)
                .Select(sa => new { sa.AssessmentId, sa.EmployeeId, sa.FormId, sa.SubmittedAt })
                .FirstOrDefaultAsync();

            if (assessment == null) return null;

            var employee = await _ctx.Employees.FirstOrDefaultAsync(e => e.EmployeeId == assessment.EmployeeId);
            if (employee == null) return null;

            var userAuth = await _ctx.Userauthentications.FirstOrDefaultAsync(ua => ua.EmployeeId == employee.EmployeeId);
            var userProfile = await _ctx.Userprofiles.FirstOrDefaultAsync(up => up.EmployeeId == employee.EmployeeId);
            var form = await _ctx.Assessmentforms.FirstOrDefaultAsync(f => f.FormId == assessment.FormId);

            var employeeDetails = await _ctx.Employeedetailsmasters.FirstOrDefaultAsync(edm => edm.EmployeeId == employee.EmployeeId);
            if (employeeDetails == null) return null;

            var projects = await _ctx.Projectemployees
                .Where(pe => pe.EmployeeId == employeeDetails.EmployeeId && pe.IsPrimary == true)
                .Join(_ctx.Projects, pe => pe.ProjectId, p => p.ProjectId, (pe, p) => p)
                .Select(p => p.ProjectName)
                .ToListAsync();

            var employeeName = userProfile != null
                ? $"{userProfile.FirstName} {userProfile.LastName}".Trim()
                : (string.IsNullOrWhiteSpace(userAuth?.Email) ? employee.EmployeeCompanyId : userAuth.Email);


            var latestL1 = await _ctx.Assessmentreviews
                .Where(ar => ar.ReviewerRole == nameof(ReviewerRole.Approver))
                .GroupBy(ar => ar.DetailId)
                .Select(g => g.OrderByDescending(ar => ar.ReviewId).First())
                .ToListAsync();

            var latestL2 = await _ctx.Assessmentreviews
                .Where(ar => ar.ReviewerRole == nameof(ReviewerRole.Reviewer) && ar.Rating != 0)
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
                latestL1.FirstOrDefault(r => r.DetailId == x.ad.DetailId)?.Rating,
                latestL1.FirstOrDefault(r => r.DetailId == x.ad.DetailId)?.Comments,
                latestL2.FirstOrDefault(r => r.DetailId == x.ad.DetailId)?.Rating,
                latestL2.FirstOrDefault(r => r.DetailId == x.ad.DetailId)?.Comments
            )).ToList();

            var attachments = await GetAssessmentAttachmentsAsync(assessmentId);

            return new ReviewerAssessmentViewDto(
                assessment.AssessmentId,
                employeeName,
                form?.Name ?? string.Empty,
                assessment.SubmittedAt ?? DateTime.Now,
                string.Join(", ", projects.OrderBy(x => x)),
                items,
                attachments
            );
        }
    }
}