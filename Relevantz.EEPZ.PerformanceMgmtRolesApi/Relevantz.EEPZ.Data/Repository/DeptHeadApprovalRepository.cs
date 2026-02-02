using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Relevantz.EEPZ.Common.DTOs.Response;
using Relevantz.EEPZ.Common.Constants;

namespace Relevantz.EEPZ.Data.Repository.Implementations
{
    public class DeptHeadApprovalsRepository : IDeptHeadApprovalsRepository
    {
        private readonly EEPZDbContext _context;
        private readonly ILogger<DeptHeadApprovalsRepository> _logger;

        public DeptHeadApprovalsRepository(EEPZDbContext context, ILogger<DeptHeadApprovalsRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Selfassessment> GetAssessmentByIdAsync(int assessmentId)
        {
            return await _context.Selfassessments.FirstOrDefaultAsync(sa => sa.AssessmentId == assessmentId);
        }

        public async Task<Departmentheadapproval> GetExistingApprovalAsync(int assessmentId, int employeeId)
        {
            return await _context.Departmentheadapprovals
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.AssessmentId == assessmentId && a.EmployeeId == employeeId);
        }

        public async Task<int> CreateApprovalAsync(Departmentheadapproval approval)
        {
            _context.Departmentheadapprovals.Add(approval);
            await _context.SaveChangesAsync();
            return approval.ApprovalId;
        }

       

public async Task<PagedResult<Userprofile>> GetUserProfilesPagedAsync(int page, int pageSize)
{
    page = page <= 0 ? 1 : page;
    pageSize = pageSize <= 0 ? 25 : pageSize;

    var query = _context.Userprofiles.AsNoTracking();

    var total = await query.CountAsync();

    var items = await query
        .OrderBy(x => x.EmployeeId) 
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

    return new PagedResult<Userprofile>
    {
        Items = items,
        TotalRecords = total,
        Page = page,
        PageSize = pageSize
    };
}

        public async Task<List<Userprofile>> GetUserProfilesByEmployeeIdsAsync(List<int> employeeIds)
        {
            if (employeeIds == null || employeeIds.Count == 0)
                return new List<Userprofile>();

            return await _context.Userprofiles
                .AsNoTracking()
                .Where(up => employeeIds.Contains(up.EmployeeId))
                .ToListAsync();
        }

        public async Task<PagedResult<Userauthentication>> GetUserAuthenticationsPagedAsync(int page, int pageSize)
        {
            page = page <= 0 ? 1 : page;
            pageSize = pageSize <= 0 ? 25 : pageSize;

            var query = _context.Userauthentications.AsNoTracking();

            var total = await query.CountAsync();

            var items = await query
                .OrderBy(x => x.EmployeeId) 
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<Userauthentication>
            {
                Items = items,
                TotalRecords = total,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<List<Userauthentication>> GetUserAuthenticationsByEmployeeIdsAsync(List<int> employeeIds)
        {
            if (employeeIds == null || employeeIds.Count == 0)
                return new List<Userauthentication>();

            return await _context.Userauthentications
                .AsNoTracking()
                .Where(ua => employeeIds.Contains(ua.EmployeeId))
                .ToListAsync();
        }

        public async Task<List<Userprofile>> GetAllUserProfilesAsync()
        {
            return await _context.Userprofiles.AsNoTracking().ToListAsync();
        }

        public async Task<List<Userauthentication>> GetAllUserAuthenticationsAsync()
        {
            return await _context.Userauthentications.AsNoTracking().ToListAsync();
        }

        public async Task<List<Project>> GetAllProjectsAsync()
        {
            return await _context.Projects.AsNoTracking().ToListAsync();
        }

        public async Task<List<Projectemployee>> GetAllProjectEmployeesAsync()
        {
            return await _context.Projectemployees.AsNoTracking().ToListAsync();
        }

        public async Task<int> GetDepartmentIdByEmployeeIdAsync(int employeeId)
        {
            return await _context.Employeedetailsmasters
                .Where(edm => edm.EmployeeId == employeeId)
                .Select(edm => edm.DepartmentId)
                .FirstOrDefaultAsync();
        }

        public async Task<List<int>> GetEmployeeIdsByDepartmentAsync(int departmentId)
        {
            return await _context.Employeedetailsmasters
                .Where(edm => edm.DepartmentId == departmentId)
                .Select(edm => edm.EmployeeId)
                .ToListAsync();
        }

        public async Task<List<Selfassessment>> GetSubmittedSelfAssessmentsAsync()
        {
            return await _context.Selfassessments
                .Include(sa => sa.Assessmentdetails)
                .ThenInclude(ad => ad.Competency)
                .Where(sa => sa.Status == AssessmentStatuses.Submitted)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<List<Assessmentreview>> GetAllAssessmentReviewsAsync()
        {
            return await _context.Assessmentreviews.AsNoTracking().ToListAsync();
        }

        public async Task<List<Goal>> GetGoalsByEmployeeIdsAsync(List<int> employeeIds)
        {
            var allGoalAssignments = await _context.GoalAssignments
                .Where(ga => ga.AssignedTo.HasValue && employeeIds.Contains(ga.AssignedTo.Value))
                .ToListAsync();

            var allGoalIds = allGoalAssignments.Select(ga => ga.GoalId).Distinct().ToList();

            return allGoalIds.Any()
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
        }

        public async Task<Departmentheadapproval> GetDeptHeadApprovalAsync(int employeeId, int projectId, int assessmentId)
        {
            return await _context.Departmentheadapprovals
                .AsNoTracking()
                .FirstOrDefaultAsync(a =>
                    a.EmployeeId == employeeId &&
                    a.ProjectId == projectId &&
                    a.AssessmentId == assessmentId &&
                    a.Status == ApprovalStatuses.Approved);
        }

        public async Task<List<int>> GetGoalIdsByEmployeeIdAsync(int employeeId)
        {
            return await _context.GoalAssignments
                .Where(ga => ga.AssignedTo.HasValue && ga.AssignedTo.Value == employeeId)
                .Select(ga => ga.GoalId)
                .Distinct()
                .ToListAsync();
        }

        public async Task<Employeedetailsmaster> GetEmployeeDetailsByEmployeeIdAsync(int employeeId)
        {
            return await _context.Employeedetailsmasters
                .Where(edm => edm.EmployeeId == employeeId)
                .FirstOrDefaultAsync();
        }

        public async Task<(List<Departmentheadapproval> approvals, int totalRecords)> GetApprovedEmployeesAsync(int page, int pageSize, int? deptHeadEmployeeId)
        {
            IQueryable<Departmentheadapproval> approvalQuery = _context.Departmentheadapprovals
                .Where(a => a.Status == ApprovalStatuses.Approved || a.Status == null);

            if (deptHeadEmployeeId.HasValue)
            {
                var deptHeadDeptId = await GetDepartmentIdByEmployeeIdAsync(deptHeadEmployeeId.Value);

                if (deptHeadDeptId > 0)
                {
                    _logger.LogInformation($"Filtering approved employees by Department ID: {deptHeadDeptId}");

                    var departmentEmployeeIds = await GetEmployeeIdsByDepartmentAsync(deptHeadDeptId);
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

            return (approvals, totalRecords);
        }

        public async Task<Projectemployee> GetProjectEmployeeByEmployeeIdAsync(int employeeId)
        {
            return await _context.Projectemployees
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.EmployeeId == employeeId);
        }

        public async Task<Employeedetailsmaster> GetEmployeeDetailsByMasterIdAsync(int masterId)
        {
            return await _context.Employeedetailsmasters
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.EmployeeMasterId == masterId);
        }

        public async Task<Userprofile> GetUserProfileByEmployeeIdAsync(int employeeId)
        {
            return await _context.Userprofiles
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.EmployeeId == employeeId);
        }

        public async Task<Project> GetProjectByIdAsync(int projectId)
        {
            return await _context.Projects
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.ProjectId == projectId);
        }

        public async Task<List<Departmentheadapproval>> GetPendingApprovalsForEmployeeAsync(int employeeId, int userId)
{
    return await _context.Departmentheadapprovals
        .Where(a => (a.EmployeeId == employeeId || a.EmployeeId == userId) &&
                    (a.Status == ApprovalStatuses.Approved || a.Status == null) &&
                    a.AcknowledgedByEmployee == false)
        .OrderByDescending(a => a.ApprovedAt)
        .ToListAsync();
}

        public async Task<Selfassessment> GetAssessmentWithDetailsAsync(int assessmentId)
        {
            return await _context.Selfassessments
                .Include(sa => sa.Assessmentdetails)
                .ThenInclude(ad => ad.Competency)
                .FirstOrDefaultAsync(sa => sa.AssessmentId == assessmentId);
        }

        public async Task<List<Assessmentreview>> GetReviewsByDetailIdsAsync(List<int> detailIds)
        {
            return await _context.Assessmentreviews
                .Where(r => detailIds.Contains(r.DetailId))
                .ToListAsync();
        }

        public async Task<Userauthentication> GetUserAuthByEmployeeIdAsync(int employeeId)
        {
            return await _context.Userauthentications.FirstOrDefaultAsync(ua => ua.EmployeeId == employeeId);
        }

        public async Task<Departmentheadapproval> GetApprovalForAcknowledgmentAsync(int approvalId, int employeeId, int userId)
        {
            return await _context.Departmentheadapprovals
                .FirstOrDefaultAsync(a => a.ApprovalId == approvalId &&
                                        (a.EmployeeId == employeeId || a.EmployeeId == userId));
        }

        public async Task<DateTime?> AcknowledgeApprovalAsync(Departmentheadapproval approval, string comments)
        {
            approval.AcknowledgedByEmployee = true;
            approval.AcknowledgedAt = DateTime.UtcNow;
            approval.EmployeeComments = comments;

            await _context.SaveChangesAsync();
            return approval.AcknowledgedAt;
        }

        public async Task<List<object>> GetAcknowledgedCommentsByManagerAsync(int managerId)
        {
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

            return acknowledgments.Cast<object>().ToList();
        }

        public async Task<List<object>> GetAssessmentAttachmentsAsync(int assessmentId)
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

            return attachments.Cast<object>().ToList();
        }

        public async Task<Selfassessmentattachment> GetAttachmentByIdAsync(int attachmentId)
        {
            return await _context.Selfassessmentattachments.FirstOrDefaultAsync(a => a.AttachmentId == attachmentId);
        }

        public async Task<Userauthentication> GetUserAuthByUserIdAsync(int userId)
        {
            return await _context.Userauthentications.FirstOrDefaultAsync(u => u.UserId == userId);
        }
        public async Task<Departmentheadapproval> GetApprovalByIdAsync(int approvalId)
{
    return await _context.Departmentheadapprovals
        .AsNoTracking()
        .FirstOrDefaultAsync(a => a.ApprovalId == approvalId);
}

    }
}


