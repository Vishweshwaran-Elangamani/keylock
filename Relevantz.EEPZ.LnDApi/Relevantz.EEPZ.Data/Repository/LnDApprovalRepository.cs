using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repositories.Interface;
using Serilog;

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
                .Lndapprovals
                .Include(a => a.RequesterEmployee).ThenInclude(e => e.Userprofile)
                .Include(a => a.ApproverEmployee).ThenInclude(e => e.Userprofile)
                .Include(a => a.Skill)
                .Include(a => a.Attachment)
                .Include(a => a.Assignment)
                    .ThenInclude(a => a.MenteeEmployee)
                        .ThenInclude(e => e.Userprofile)
                .FirstOrDefaultAsync(a => a.ApprovalId == approvalId);

            if (approval == null)
            {
                Log.Warning("GetApprovalByIdAsync: Approval not found. ApprovalId={ApprovalId}", approvalId);
            }

            return approval;
        }

        /// <summary>
        /// Gets pending SME registration approval
        /// </summary>
        public async Task<Lndapproval?> GetPendingSmeRegistration(int employeeId, int skillId)
        {
            return await _context.Lndapprovals.FirstOrDefaultAsync(a =>
                a.RequesterEmployeeId == employeeId &&
                a.SkillId == skillId &&
                a.ApprovalType == LnDConstants.APPROVAL_TYPE.SME_REGISTRATION &&
                a.Status == LnDConstants.APPROVAL_STATUS.PENDING
            );
        }

        /// <summary>
        /// Gets pending assignment approval
        /// </summary>
        public async Task<Lndapproval?> GetPendingAssignmentApproval(int assignmentId, string approvalType)
        {
            return await _context.Lndapprovals.FirstOrDefaultAsync(a =>
                a.AssignmentId == assignmentId &&
                a.ApprovalType == approvalType &&
                a.Status == LnDConstants.APPROVAL_STATUS.PENDING
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
                .Lndapprovals
                .Include(a => a.RequesterEmployee).ThenInclude(e => e.Userprofile)
                .Include(a => a.ApproverEmployee).ThenInclude(e => e.Userprofile)
                .Include(a => a.Skill)
                .Include(a => a.Attachment)
                .Where(a => a.ApproverEmployeeId == employeeId);

            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                var s = request.SearchTerm.ToLower();
                query = query.Where(a =>
                    a.ApprovalType.ToLower().Contains(s) ||
                    (a.RequesterEmployee.Userprofile.FirstName + " " +
                     a.RequesterEmployee.Userprofile.LastName).ToLower().Contains(s)
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
                        a.RequesterEmployee.Userprofile.FirstName + " " +
                        a.RequesterEmployee.Userprofile.LastName,
                    ApproverEmployeeId = a.ApproverEmployeeId,
                    ApproverName = a.ApproverEmployee != null
                        ? a.ApproverEmployee.Userprofile.FirstName + " " +
                          a.ApproverEmployee.Userprofile.LastName
                        : null,
                    Status = a.Status,
                    Notes = a.Notes,
                    RequestedOn = a.RequestedOn,
                    UpdatedOn = a.UpdatedOn,
                    AttachmentPath = a.Attachment != null ? a.Attachment.FilePath : null
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
                .Lndapprovals
                .Include(a => a.RequesterEmployee).ThenInclude(e => e.Userprofile)
                .Include(a => a.ApproverEmployee).ThenInclude(e => e.Userprofile)
                .Include(a => a.Skill)
                .Include(a => a.Attachment)
                .AsQueryable();

            if (!string.IsNullOrEmpty(request.Role) &&
                request.Role.ToLower() != LnDConstants.ROLE_FILTERS.ALL)
            {
                query = request.Role.ToLower() == LnDConstants.ROLE_FILTERS.REQUESTER
                    ? query.Where(a => a.RequesterEmployeeId == employeeId)
                    : query.Where(a => a.ApproverEmployeeId == employeeId);
            }
            else
            {
                query = query.Where(a =>
                    a.RequesterEmployeeId == employeeId ||
                    a.ApproverEmployeeId == employeeId);
            }

            if (!string.IsNullOrEmpty(request.ApprovalType))
                query = query.Where(a => a.ApprovalType == request.ApprovalType);

            if (!string.IsNullOrEmpty(request.Status))
                query = query.Where(a => a.Status == request.Status);

            if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                var s = request.SearchTerm.ToLower();
                query = query.Where(a =>
                    a.ApprovalType.ToLower().Contains(s) ||
                    a.Status.ToLower().Contains(s)
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
                        a.RequesterEmployee.Userprofile.FirstName + " " +
                        a.RequesterEmployee.Userprofile.LastName,
                    ApproverEmployeeId = a.ApproverEmployeeId,
                    ApproverName = a.ApproverEmployee != null
                        ? a.ApproverEmployee.Userprofile.FirstName + " " +
                          a.ApproverEmployee.Userprofile.LastName
                        : null,
                    Status = a.Status,
                    Notes = a.Notes,
                    RequestedOn = a.RequestedOn,
                    UpdatedOn = a.UpdatedOn,
                    AttachmentPath = a.Attachment != null ? a.Attachment.FilePath : null
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
            return await _context.Lndattachments.FirstOrDefaultAsync(a => a.AttachmentId == attachmentId);
        }

        #endregion
    }
}
