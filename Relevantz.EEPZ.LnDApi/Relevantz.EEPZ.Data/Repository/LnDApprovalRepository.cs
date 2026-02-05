using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repositories.Interface;
using Serilog;
using System.Text.Json;


namespace Relevantz.EEPZ.Data.Repositories.Implementations
{
    public class LnDApprovalRepository : ILnDApprovalRepository
    {
        #region Dependencies

        private readonly EEPZDbContext _context;

        public LnDApprovalRepository(EEPZDbContext context)
        {
            _context = context;
        }

        #endregion

        #region Approval Retrieval

        /// <summary>
        /// Gets a single approval by ID with all related entities
        /// </summary>
        public async Task<Lndapproval?> GetApprovalById(int approvalId)
        {
            Log.Debug("GetApprovalByIdAsync called. ApprovalId={ApprovalId}", approvalId);

            var approval = await _context
                .Lndapprovals.Include(a => a.RequesterEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Include(a => a.ApproverEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Include(a => a.Skill)
                .Include(a => a.Attachment)
                .Include(a => a.Assignment)
                    .ThenInclude(a => a.MenteeEmployee)
                        .ThenInclude(e => e.Userprofile)
                .FirstOrDefaultAsync(a => a.ApprovalId == approvalId);

            if (approval == null)
            {
                Log.Warning(
                    "GetApprovalByIdAsync: Approval not found. ApprovalId={ApprovalId}",
                    approvalId
                );
            }

            return approval;
        }

        /// <summary>
        /// Gets pending SME registration approval
        /// </summary>
        public async Task<Lndapproval?> GetPendingSmeRegistration(int employeeId, int skillId)
        {
            return await _context.Lndapprovals.FirstOrDefaultAsync(a =>
                a.RequesterEmployeeId == employeeId
                && a.SkillId == skillId
                && a.ApprovalType == LnDConstants.APPROVAL_TYPE.SME_REGISTRATION
                && a.Status == LnDConstants.APPROVAL_STATUS.PENDING
            );
        }

        /// <summary>
        /// Gets pending assignment approval
        /// </summary>
        public async Task<Lndapproval?> GetPendingAssignmentApproval(
            int assignmentId,
            string approvalType
        )
        {
            return await _context.Lndapprovals.FirstOrDefaultAsync(a =>
                a.AssignmentId == assignmentId
                && a.ApprovalType == approvalType
                && a.Status == LnDConstants.APPROVAL_STATUS.PENDING
            );
        }

        /// <summary>
        /// Gets approvals assigned to employee APPROVER
        /// </summary>
        public async Task<(List<ApprovalResponseModel> Items, int TotalCount)> GetMyApprovals(
            int employeeId,
            MyApprovalsRequestModel request
        )
        {
            Log.Information("GetMyApprovalsAsync called. EmployeeId={EmployeeId}", employeeId);

            var query = _context
                .Lndapprovals.Include(a => a.RequesterEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Include(a => a.ApproverEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Include(a => a.Skill)
                .Include(a => a.Attachment)
                .Where(a => a.ApproverEmployeeId == employeeId);

            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                var s = request.SearchTerm.ToLower();
                query = query.Where(a =>
                    a.ApprovalType.ToLower().Contains(s)
                    || (
                        a.RequesterEmployee.Userprofile.FirstName
                        + " "
                        + a.RequesterEmployee.Userprofile.LastName
                    )
                        .ToLower()
                        .Contains(s)
                );
            }

            if (!string.IsNullOrEmpty(request.ApprovalType))
                query = query.Where(a => a.ApprovalType == request.ApprovalType);

            if (!string.IsNullOrEmpty(request.Status))
                query = query.Where(a => a.Status == request.Status);

            query = query.OrderByDescending(a => a.RequestedOn);

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(a => new ApprovalResponseModel
                {
                    ApprovalId = a.ApprovalId,
                    ApprovalType = a.ApprovalType,
                    AssignmentId = a.AssignmentId,
                    SkillId = a.SkillId,
                    SkillName = a.Skill != null ? a.Skill.SkillName : null,
                    RequesterEmployeeId = a.RequesterEmployeeId,
                    RequesterName =
                        a.RequesterEmployee.Userprofile.FirstName
                        + " "
                        + a.RequesterEmployee.Userprofile.LastName,
                    ApproverEmployeeId = a.ApproverEmployeeId,
                    ApproverName =
                        a.ApproverEmployee != null
                            ? a.ApproverEmployee.Userprofile.FirstName
                                + " "
                                + a.ApproverEmployee.Userprofile.LastName
                            : null,
                    Status = a.Status,
                    Notes = a.Notes,
                    RequestedOn = a.RequestedOn,
                    UpdatedOn = a.UpdatedOn,
                    AttachmentPath = a.Attachment != null ? a.Attachment.FilePath : null,
                })
                .ToListAsync();

            return (items, totalCount);
        }

        /// <summary>
        /// Gets approval history (REQUESTER / APPROVER / ALL)
        /// </summary>
        public async Task<(List<ApprovalResponseModel> Items, int TotalCount)> GetApprovalHistory(
            int employeeId,
            ApprovalHistoryRequestModel request
        )
        {
            Log.Information("GetApprovalHistoryAsync called. EmployeeId={EmployeeId}", employeeId);

            var query = _context
                .Lndapprovals.Include(a => a.RequesterEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Include(a => a.ApproverEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Include(a => a.Skill)
                .Include(a => a.Attachment)
                .AsQueryable();

            if (
                !string.IsNullOrEmpty(request.Role)
                && request.Role.ToLower() != LnDConstants.ROLE_FILTERS.ALL
            )
            {
                query =
                    request.Role.ToLower() == LnDConstants.ROLE_FILTERS.REQUESTER
                        ? query.Where(a => a.RequesterEmployeeId == employeeId)
                        : query.Where(a => a.ApproverEmployeeId == employeeId);
            }
            else
            {
                query = query.Where(a =>
                    a.RequesterEmployeeId == employeeId || a.ApproverEmployeeId == employeeId
                );
            }

            if (!string.IsNullOrEmpty(request.ApprovalType))
                query = query.Where(a => a.ApprovalType == request.ApprovalType);

            if (!string.IsNullOrEmpty(request.Status))
                query = query.Where(a => a.Status == request.Status);

            if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                var s = request.SearchTerm.ToLower();
                query = query.Where(a =>
                    a.ApprovalType.ToLower().Contains(s) || a.Status.ToLower().Contains(s)
                );
            }

            query = query.OrderByDescending(a => a.UpdatedOn ?? a.RequestedOn);

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(a => new ApprovalResponseModel
                {
                    ApprovalId = a.ApprovalId,
                    ApprovalType = a.ApprovalType,
                    AssignmentId = a.AssignmentId,
                    SkillId = a.SkillId,
                    SkillName = a.Skill != null ? a.Skill.SkillName : null,
                    RequesterEmployeeId = a.RequesterEmployeeId,
                    RequesterName =
                        a.RequesterEmployee.Userprofile.FirstName
                        + " "
                        + a.RequesterEmployee.Userprofile.LastName,
                    ApproverEmployeeId = a.ApproverEmployeeId,
                    ApproverName =
                        a.ApproverEmployee != null
                            ? a.ApproverEmployee.Userprofile.FirstName
                                + " "
                                + a.ApproverEmployee.Userprofile.LastName
                            : null,
                    Status = a.Status,
                    Notes = a.Notes,
                    RequestedOn = a.RequestedOn,
                    UpdatedOn = a.UpdatedOn,
                    AttachmentPath = a.Attachment != null ? a.Attachment.FilePath : null,
                })
                .ToListAsync();

            return (items, totalCount);
        }

        #endregion

        #region Approval Modifications

        public async Task<Lndapproval> AddApproval(Lndapproval approval)
        {
            _context.Lndapprovals.Add(approval);
            return approval;
        }

        public async Task UpdateApproval(Lndapproval approval)
        {
            _context.Lndapprovals.Update(approval);
        }

        #endregion

        #region Attachment Operations

        public async Task<Lndattachment> AddAttachment(Lndattachment attachment)
        {
            _context.Lndattachments.Add(attachment);
            return attachment;
        }

        public async Task<Lndattachment?> GetAttachmentById(int attachmentId)
        {
            return await _context.Lndattachments.FirstOrDefaultAsync(a =>
                a.AttachmentId == attachmentId
            );
        }

        #endregion


        public async Task<Lndapproval?> GetPendingReopenRequestByAssignment(int assignmentId)
        {
            Log.Debug("GetPendingReopenRequestByAssignment called. AssignmentId={AssignmentId}", assignmentId);

            return await _context.Lndapprovals
                .FirstOrDefaultAsync(a =>
                    a.AssignmentId == assignmentId &&
                    a.ApprovalType == LnDConstants.APPROVAL_TYPE.ASSIGNMENT_REOPEN &&
                    a.Status == LnDConstants.APPROVAL_STATUS.PENDING);
        }

        public async Task<(List<ReopenRequestResponseModel> Items, int TotalCount)> GetMyReopenRequests(
            int employeeId,
            MyApprovalsRequestModel request)
        {
            Log.Information("GetMyReopenRequests called. EmployeeId={EmployeeId}", employeeId);

            var query = _context.Lndapprovals
                .Include(a => a.Assignment)
                    .ThenInclude(a => a.MenteeEmployee)
                        .ThenInclude(e => e.Userprofile)
                .Include(a => a.Assignment)
                    .ThenInclude(a => a.Skill)
                .Include(a => a.Assignment)
                    .ThenInclude(a => a.Sme)
                        .ThenInclude(s => s.Employee)
                            .ThenInclude(e => e.Userprofile)
                .Where(a =>
                    a.RequesterEmployeeId == employeeId &&
                    a.ApprovalType == LnDConstants.APPROVAL_TYPE.ASSIGNMENT_REOPEN);

            // Status filter
            if (!string.IsNullOrEmpty(request.Status) && request.Status.ToLower() != "all")
            {
                query = query.Where(a => a.Status == request.Status);
            }

            // Search filter
            if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                var searchLower = request.SearchTerm.ToLower();
                query = query.Where(a =>
                    a.Assignment.Skill.SkillName.ToLower().Contains(searchLower) ||
                    a.Assignment.MenteeEmployee.Userprofile.FirstName.ToLower().Contains(searchLower) ||
                    a.Assignment.MenteeEmployee.Userprofile.LastName.ToLower().Contains(searchLower) ||
                    (a.Notes != null && a.Notes.ToLower().Contains(searchLower))
                );
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(a => a.RequestedOn)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var today = DateTime.Now.Date;

            var result = items.Select(a => new ReopenRequestResponseModel
            {
                ApprovalId = a.ApprovalId,
                AssignmentId = a.AssignmentId.Value,
                MenteeName = a.Assignment.MenteeEmployee.Userprofile.FirstName + " " +
                            a.Assignment.MenteeEmployee.Userprofile.LastName,
                SkillName = a.Assignment.Skill.SkillName,
                SmeName = a.Assignment.Sme.Employee.Userprofile.FirstName + " " +
                         a.Assignment.Sme.Employee.Userprofile.LastName,
                OriginalDeadline = a.Assignment.Deadline,
                NewDeadline = ExtractNewDeadlineFromNotes(a.Notes),
                RequestNotes = ExtractRequestNotesFromNotes(a.Notes),
                Status = a.Status,
                RequestedOn = a.RequestedOn,
                ManagerNotes = ExtractManagerNotesFromNotes(a.Notes),
                ProcessedOn = a.UpdatedOn,
                IsOverdue = a.Assignment.Deadline.HasValue &&
                            a.Assignment.Deadline.Value.Date < today &&
                            a.Assignment.Status == LnDConstants.ASSIGNMENT_STATUS.IN_PROGRESS,
                DaysOverdue = a.Assignment.Deadline.HasValue && a.Assignment.Deadline.Value.Date < today
                    ? (int)(today - a.Assignment.Deadline.Value.Date).TotalDays
                    : null
            }).ToList();

            return (result, totalCount);
        }

        public async Task<(List<ReopenRequestResponseModel> Items, int TotalCount)> GetTeamReopenRequests(
            int managerId,
            MyApprovalsRequestModel request)
        {
            Log.Information("GetTeamReopenRequests called. ManagerId={ManagerId}", managerId);

            var query = _context.Lndapprovals
                .Include(a => a.Assignment)
                    .ThenInclude(a => a.MenteeEmployee)
                        .ThenInclude(e => e.Userprofile)
                .Include(a => a.Assignment)
                    .ThenInclude(a => a.Skill)
                .Include(a => a.Assignment)
                    .ThenInclude(a => a.Sme)
                        .ThenInclude(s => s.Employee)
                            .ThenInclude(e => e.Userprofile)
                .Where(a =>
                    a.ApproverEmployeeId == managerId &&
                    a.ApprovalType == LnDConstants.APPROVAL_TYPE.ASSIGNMENT_REOPEN);

            // Status filter
            if (!string.IsNullOrEmpty(request.Status) && request.Status.ToLower() != "all")
            {
                query = query.Where(a => a.Status == request.Status);
            }

            // Search filter
            if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                var searchLower = request.SearchTerm.ToLower();
                query = query.Where(a =>
                    a.Assignment.Skill.SkillName.ToLower().Contains(searchLower) ||
                    a.Assignment.MenteeEmployee.Userprofile.FirstName.ToLower().Contains(searchLower) ||
                    a.Assignment.MenteeEmployee.Userprofile.LastName.ToLower().Contains(searchLower) ||
                    (a.Notes != null && a.Notes.ToLower().Contains(searchLower))
                );
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(a => a.RequestedOn)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var today = DateTime.Now.Date;

            var result = items.Select(a => new ReopenRequestResponseModel
            {
                ApprovalId = a.ApprovalId,
                AssignmentId = a.AssignmentId.Value,
                MenteeName = a.Assignment.MenteeEmployee.Userprofile.FirstName + " " +
                            a.Assignment.MenteeEmployee.Userprofile.LastName,
                SkillName = a.Assignment.Skill.SkillName,
                SmeName = a.Assignment.Sme.Employee.Userprofile.FirstName + " " +
                         a.Assignment.Sme.Employee.Userprofile.LastName,
                OriginalDeadline = a.Assignment.Deadline,
                NewDeadline = ExtractNewDeadlineFromNotes(a.Notes),
                RequestNotes = ExtractRequestNotesFromNotes(a.Notes),
                Status = a.Status,
                RequestedOn = a.RequestedOn,
                ManagerNotes = ExtractManagerNotesFromNotes(a.Notes),
                ProcessedOn = a.UpdatedOn,
                IsOverdue = a.Assignment.Deadline.HasValue &&
                            a.Assignment.Deadline.Value.Date < today &&
                            a.Assignment.Status == LnDConstants.ASSIGNMENT_STATUS.IN_PROGRESS,
                DaysOverdue = a.Assignment.Deadline.HasValue && a.Assignment.Deadline.Value.Date < today
                    ? (int)(today - a.Assignment.Deadline.Value.Date).TotalDays
                    : null
            }).ToList();

            return (result, totalCount);
        }

        // Helper methods to parse JSON from Notes field
        private static DateTime? ExtractNewDeadlineFromNotes(string notes)
        {
            if (string.IsNullOrEmpty(notes)) return null;

            var data = JsonSerializer.Deserialize<Dictionary<string, object>>(notes);
            if (data != null && data.ContainsKey("NewDeadline") && data["NewDeadline"] != null)
            {
                var element = (JsonElement)data["NewDeadline"];
                if (element.ValueKind != JsonValueKind.Null)
                {
                    return element.GetDateTime();
                }
            }

            return null;
        }

        private static string ExtractRequestNotesFromNotes(string notes)
        {
            if (string.IsNullOrEmpty(notes)) return string.Empty;

            var data = JsonSerializer.Deserialize<Dictionary<string, object>>(notes);
            if (data != null && data.ContainsKey("RequestNotes") && data["RequestNotes"] != null)
            {
                return data["RequestNotes"]?.ToString() ?? string.Empty;
            }

            return string.Empty;
        }

        private static string? ExtractManagerNotesFromNotes(string notes)
        {
            if (string.IsNullOrEmpty(notes)) return null;

            var data = JsonSerializer.Deserialize<Dictionary<string, object>>(notes);
            if (data != null && data.ContainsKey("ManagerNotes") && data["ManagerNotes"] != null)
            {
                return data["ManagerNotes"]?.ToString();
            }

            return null;
        }


    }
}
