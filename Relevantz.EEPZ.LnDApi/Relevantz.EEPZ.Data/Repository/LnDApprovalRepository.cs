using Microsoft.EntityFrameworkCore;
using Relevantz.EEPZ.Common.Constants;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Data.DBContexts;
using Relevantz.EEPZ.Data.Repositories.Interface;

namespace Relevantz.EEPZ.Data.Repositories.Implementations
{
    public class LnDApprovalRepository : ILnDApprovalRepository
    {
        private readonly EEPZDbContext _context;

        public LnDApprovalRepository(EEPZDbContext context)
        {
            _context = context;
        }

        public async Task<Lndapproval?> GetApprovalByIdAsync(int approvalId)
        {
            return await _context
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
        }

        public async Task<Lndapproval?> GetPendingSmeRegistrationAsync(int employeeId, int skillId)
        {
            return await _context.Lndapprovals.FirstOrDefaultAsync(a =>
                a.RequesterEmployeeId == employeeId
                && a.SkillId == skillId
                && a.ApprovalType == LnDConstants.APPROVAL_TYPE.SME_REGISTRATION
                && a.Status == LnDConstants.APPROVAL_STATUS.PENDING
            );
        }

        public async Task<Lndapproval> AddApprovalAsync(Lndapproval approval)
        {
            _context.Lndapprovals.Add(approval);
            return approval;
        }

        public async Task UpdateApprovalAsync(Lndapproval approval)
        {
            _context.Lndapprovals.Update(approval);
        }

        public async Task<(List<Lndapproval> Items, int TotalCount)> GetMyApprovalsAsync(
            int employeeId,
            string? approvalType,
            string? status,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize,
            string? searchTerm
        )
        {
            var query = _context
                .Lndapprovals
                .Include(a => a.RequesterEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Include(a => a.ApproverEmployee)
                    .ThenInclude(e => e.Userprofile)
                .Include(a => a.Skill)
                .Include(a => a.Attachment)
                .Where(a => a.ApproverEmployeeId == employeeId);

            // Search filter
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var searchLower = searchTerm.ToLower().Trim();
                query = query.Where(a =>
                    a.ApprovalType.ToLower().Contains(searchLower) ||
                    (a.RequesterEmployee.Userprofile.FirstName + " " + a.RequesterEmployee.Userprofile.LastName).ToLower().Contains(searchLower) ||
                    (a.ApproverEmployee != null && (a.ApproverEmployee.Userprofile.FirstName + " " + a.ApproverEmployee.Userprofile.LastName).ToLower().Contains(searchLower)) ||
                    (a.Skill != null && a.Skill.SkillName.ToLower().Contains(searchLower))
                );
            }

            if (!string.IsNullOrEmpty(approvalType))
            {
                query = query.Where(a => a.ApprovalType == approvalType);
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(a => a.Status == status);
            }

            if (!string.IsNullOrWhiteSpace(sortField))
            {
                var isAscending = sortOrder?.ToLower() != LnDConstants.SORT_ORDER.DESC;

                query = sortField.ToLower() switch
                {
                    LnDConstants.SORT_FIELDS.APPROVAL_TYPE => isAscending
                        ? query.OrderBy(a => a.ApprovalType)
                        : query.OrderByDescending(a => a.ApprovalType),

                    LnDConstants.SORT_FIELDS.REQUESTER_NAME => isAscending
                        ? query
                            .OrderBy(a => a.RequesterEmployee.Userprofile.FirstName)
                            .ThenBy(a => a.RequesterEmployee.Userprofile.LastName)
                        : query
                            .OrderByDescending(a => a.RequesterEmployee.Userprofile.FirstName)
                            .ThenByDescending(a => a.RequesterEmployee.Userprofile.LastName),

                    LnDConstants.SORT_FIELDS.APPROVER_NAME => isAscending
                        ? query
                            .OrderBy(a => a.ApproverEmployee.Userprofile.FirstName)
                            .ThenBy(a => a.ApproverEmployee.Userprofile.LastName)
                        : query
                            .OrderByDescending(a => a.ApproverEmployee.Userprofile.FirstName)
                            .ThenByDescending(a => a.ApproverEmployee.Userprofile.LastName),

                    LnDConstants.SORT_FIELDS.REQUESTED_ON => isAscending
                        ? query.OrderBy(a => a.RequestedOn)
                        : query.OrderByDescending(a => a.RequestedOn),

                    LnDConstants.SORT_FIELDS.STATUS => isAscending
                        ? query.OrderBy(a => a.Status)
                        : query.OrderByDescending(a => a.Status),

                    _ => query.OrderByDescending(a => a.RequestedOn),
                };
            }
            else
            {
                query = query.OrderByDescending(a => a.RequestedOn);
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }



        public async Task<(List<Lndapproval> Items, int TotalCount)> GetApprovalHistoryAsync(
            int employeeId,
            string? approvalType,
            string? status,
            string? role,
            string? searchTerm,
            string? sortField,
            string? sortOrder,
            int pageNumber,
            int pageSize
        )
        {
            var query = _context
                .Lndapprovals.Include(a => a.RequesterEmployee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.ApproverEmployee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.Skill)
                .Include(a => a.Attachment)
                .AsQueryable();

            if (!string.IsNullOrEmpty(role) && role.ToLower() != LnDConstants.ROLE_FILTERS.ALL)
            {
                if (role.ToLower() == LnDConstants.ROLE_FILTERS.REQUESTER)
                {
                    query = query.Where(a => a.RequesterEmployeeId == employeeId);
                }
                else if (role.ToLower() == LnDConstants.ROLE_FILTERS.APPROVER)
                {
                    query = query.Where(a => a.ApproverEmployeeId == employeeId);
                }
            }
            else
            {
                query = query.Where(a =>
                    a.RequesterEmployeeId == employeeId || a.ApproverEmployeeId == employeeId
                );
            }

            if (!string.IsNullOrEmpty(approvalType))
            {
                query = query.Where(a => a.ApprovalType == approvalType);
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(a => a.Status == status);
            }

            if (!string.IsNullOrEmpty(searchTerm))
            {
                var lowerSearchTerm = searchTerm.ToLower();
                query = query.Where(a =>
                    (
                        a.RequesterEmployee.Userprofile.FirstName
                        + " "
                        + a.RequesterEmployee.Userprofile.LastName
                    )
                        .ToLower()
                        .Contains(lowerSearchTerm)
                    || (
                        a.ApproverEmployee != null
                        && (
                            a.ApproverEmployee.Userprofile.FirstName
                            + " "
                            + a.ApproverEmployee.Userprofile.LastName
                        )
                            .ToLower()
                            .Contains(lowerSearchTerm)
                    )
                    || (a.Skill != null && a.Skill.SkillName.ToLower().Contains(lowerSearchTerm))
                    || (a.Notes != null && a.Notes.ToLower().Contains(lowerSearchTerm))
                    || a.ApprovalType.ToLower().Contains(lowerSearchTerm)
                    || a.Status.ToLower().Contains(lowerSearchTerm)
                );
            }

            var totalCount = await query.CountAsync();

            query = ApplyApprovalSorting(query, sortField, sortOrder);

            var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

            return (items, totalCount);
        }
        private IQueryable<Lndapproval> ApplyApprovalSorting(
           IQueryable<Lndapproval> query,
           string? sortField,
           string? sortOrder
       )
        {
            var isAscending = string.IsNullOrEmpty(sortOrder) || sortOrder.ToLower() == "asc";

            return sortField?.ToLower() switch
            {
                LnDConstants.SORT_FIELDS.APPROVAL_TYPE => isAscending
                    ? query.OrderBy(a => a.ApprovalType)
                    : query.OrderByDescending(a => a.ApprovalType),
                LnDConstants.SORT_FIELDS.SKILL_NAME => isAscending
                    ? query.OrderBy(a => a.Skill != null ? a.Skill.SkillName : "")
                    : query.OrderByDescending(a => a.Skill != null ? a.Skill.SkillName : ""),
                LnDConstants.SORT_FIELDS.REQUESTER_NAME => isAscending
                    ? query
                        .OrderBy(a => a.RequesterEmployee.Userprofile.FirstName)
                        .ThenBy(a => a.RequesterEmployee.Userprofile.LastName)
                    : query
                        .OrderByDescending(a => a.RequesterEmployee.Userprofile.FirstName)
                        .ThenByDescending(a => a.RequesterEmployee.Userprofile.LastName),
                LnDConstants.SORT_FIELDS.APPROVER_NAME => isAscending
                    ? query
                        .OrderBy(a =>
                            a.ApproverEmployee != null
                                ? a.ApproverEmployee.Userprofile.FirstName
                                : ""
                        )
                        .ThenBy(a =>
                            a.ApproverEmployee != null
                                ? a.ApproverEmployee.Userprofile.LastName
                                : ""
                        )
                    : query
                        .OrderByDescending(a =>
                            a.ApproverEmployee != null
                                ? a.ApproverEmployee.Userprofile.FirstName
                                : ""
                        )
                        .ThenByDescending(a =>
                            a.ApproverEmployee != null
                                ? a.ApproverEmployee.Userprofile.LastName
                                : ""
                        ),
                LnDConstants.SORT_FIELDS.STATUS => isAscending
                    ? query.OrderBy(a => a.Status)
                    : query.OrderByDescending(a => a.Status),
                LnDConstants.SORT_FIELDS.REQUESTED_ON => isAscending
                    ? query.OrderBy(a => a.RequestedOn)
                    : query.OrderByDescending(a => a.RequestedOn),
                _ => query.OrderByDescending(a => a.UpdatedOn ?? a.RequestedOn),
            };
        }

        public async Task<Lndapproval?> GetPendingAssignmentApprovalAsync(
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

        public async Task<Lndattachment> AddAttachmentAsync(Lndattachment attachment)
        {
            _context.Lndattachments.Add(attachment);
            return attachment;
        }

        public async Task<Lndattachment?> GetAttachmentByIdAsync(int attachmentId)
        {
            return await _context.Lndattachments.FirstOrDefaultAsync(a =>
                a.AttachmentId == attachmentId
            );
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}
