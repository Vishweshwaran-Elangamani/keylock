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
        /// Gets a single approval by ID with all related entities including employees, skill, attachment, and assignment.
        /// Returns null if approval is not found.
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
                Log.Warning("GetApprovalByIdAsync: Approval not found. ApprovalId={ApprovalId}", approvalId);
            }
            else
            {
                Log.Debug("GetApprovalByIdAsync succeeded. ApprovalId={ApprovalId}, ApprovalType={ApprovalType}, Status={Status}",
                    approvalId, approval.ApprovalType, approval.Status);
            }

            return approval;
        }

        /// <summary>
        /// Checks if a pending SME registration approval exists for the given employee and skill.
        /// Returns null if no pending approval is found.
        /// </summary>
        public async Task<Lndapproval?> GetPendingSmeRegistration(int employeeId, int skillId)
        {
            Log.Debug("GetPendingSmeRegistrationAsync called. EmployeeId={EmployeeId}, SkillId={SkillId}",
                employeeId, skillId);

            var approval = await _context.Lndapprovals.FirstOrDefaultAsync(a =>
                a.RequesterEmployeeId == employeeId
                && a.SkillId == skillId
                && a.ApprovalType == LnDConstants.APPROVAL_TYPE.SME_REGISTRATION
                && a.Status == LnDConstants.APPROVAL_STATUS.PENDING
            );

            if (approval != null)
            {
                Log.Debug("GetPendingSmeRegistrationAsync: Found pending approval. ApprovalId={ApprovalId}",
                    approval.ApprovalId);
            }

            return approval;
        }

        /// <summary>
        /// Gets pending approval for an assignment by assignment ID and approval type.
        /// Returns null if no pending approval exists.
        /// </summary>
        public async Task<Lndapproval?> GetPendingAssignmentApproval(
            int assignmentId,
            string approvalType
        )
        {
            Log.Debug("GetPendingAssignmentApprovalAsync called. AssignmentId={AssignmentId}, ApprovalType={ApprovalType}",
                assignmentId, approvalType);

            var approval = await _context.Lndapprovals.FirstOrDefaultAsync(a =>
                a.AssignmentId == assignmentId
                && a.ApprovalType == approvalType
                && a.Status == LnDConstants.APPROVAL_STATUS.PENDING
            );

            if (approval != null)
            {
                Log.Debug("GetPendingAssignmentApprovalAsync: Found pending approval. ApprovalId={ApprovalId}",
                    approval.ApprovalId);
            }

            return approval;
        }

        /// <summary>
        /// Gets paginated approvals assigned to an employee as approver with filtering, sorting, and search.
        /// Returns list of approvals and total count for pagination.
        /// </summary>
        public async Task<(List<Lndapproval> Items, int TotalCount)> GetMyApprovals(
            int employeeId,
            MyApprovalsRequestModel request
        )
        {
            Log.Information(
                "GetMyApprovalsAsync called. EmployeeId={EmployeeId}, ApprovalType={ApprovalType}, Status={Status}, Page={PageNumber}, PageSize={PageSize}, SearchTerm={SearchTerm}",
                employeeId, request.ApprovalType ?? "all", request.Status ?? "all", request.PageNumber, request.PageSize, request.SearchTerm ?? "none"
            );

            var query = _context
                .Lndapprovals.Include(a => a.RequesterEmployee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.ApproverEmployee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.Skill)
                .Include(a => a.Attachment)
                .Where(a => a.ApproverEmployeeId == employeeId);

            // Search filter
            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                var searchLower = request.SearchTerm.ToLower().Trim();
                query = query.Where(a =>
                    a.ApprovalType.ToLower().Contains(searchLower)
                    || (
                        a.RequesterEmployee.Userprofile.FirstName
                        + " "
                        + a.RequesterEmployee.Userprofile.LastName
                    )
                        .ToLower()
                        .Contains(searchLower)
                    || (
                        a.ApproverEmployee != null
                        && (
                            a.ApproverEmployee.Userprofile.FirstName
                            + " "
                            + a.ApproverEmployee.Userprofile.LastName
                        )
                            .ToLower()
                            .Contains(searchLower)
                    )
                    || (a.Skill != null && a.Skill.SkillName.ToLower().Contains(searchLower))
                );
            }

            if (!string.IsNullOrEmpty(request.ApprovalType))
            {
                query = query.Where(a => a.ApprovalType == request.ApprovalType);
            }

            if (!string.IsNullOrEmpty(request.Status))
            {
                query = query.Where(a => a.Status == request.Status);
            }

            if (!string.IsNullOrWhiteSpace(request.SortField))
            {
                var isAscending = request.SortOrder?.ToLower() != LnDConstants.SORT_ORDER.DESC;

                query = request.SortField.ToLower() switch
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
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            Log.Information(
                "GetMyApprovalsAsync completed. EmployeeId={EmployeeId}, ReturnedItems={ItemCount}, TotalCount={TotalCount}",
                employeeId, items.Count, totalCount
            );

            return (items, totalCount);
        }

        /// <summary>
        /// Gets complete approval history for an employee as requester or approver with filtering and pagination.
        /// Supports role-based filtering (requester/approver/all) and full-text search.
        /// </summary>
        public async Task<(List<Lndapproval> Items, int TotalCount)> GetApprovalHistory(
            int employeeId,
            ApprovalHistoryRequestModel request
        )
        {
            Log.Information(
                "GetApprovalHistoryAsync called. EmployeeId={EmployeeId}, Role={Role}, ApprovalType={ApprovalType}, Status={Status}, Page={PageNumber}",
                employeeId, request.Role ?? "all", request.ApprovalType ?? "all", request.Status ?? "all", request.PageNumber
            );

            var query = _context
                .Lndapprovals.Include(a => a.RequesterEmployee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.ApproverEmployee)
                .ThenInclude(e => e.Userprofile)
                .Include(a => a.Skill)
                .Include(a => a.Attachment)
                .AsQueryable();

            if (!string.IsNullOrEmpty(request.Role) && request.Role.ToLower() != LnDConstants.ROLE_FILTERS.ALL)
            {
                if (request.Role.ToLower() == LnDConstants.ROLE_FILTERS.REQUESTER)
                {
                    query = query.Where(a => a.RequesterEmployeeId == employeeId);
                }
                else if (request.Role.ToLower() == LnDConstants.ROLE_FILTERS.APPROVER)
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

            if (!string.IsNullOrEmpty(request.ApprovalType))
            {
                query = query.Where(a => a.ApprovalType == request.ApprovalType);
            }

            if (!string.IsNullOrEmpty(request.Status))
            {
                query = query.Where(a => a.Status == request.Status);
            }

            if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                var lowerSearchTerm = request.SearchTerm.ToLower();
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

            query = ApplyApprovalSorting(query, request.SortField, request.SortOrder);

            var items = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            Log.Information(
                "GetApprovalHistoryAsync completed. EmployeeId={EmployeeId}, ReturnedItems={ItemCount}, TotalCount={TotalCount}",
                employeeId, items.Count, totalCount
            );

            return (items, totalCount);
        }

        #endregion

        #region Approval Modifications

        /// <summary>
        /// Adds a new approval to the database context.
        /// Requires SaveChanges to be called separately to persist.
        /// </summary>
        public async Task<Lndapproval> AddApproval(Lndapproval approval)
        {
            Log.Information(
                "AddApprovalAsync called. ApprovalType={ApprovalType}, RequesterEmployeeId={RequesterEmployeeId}, ApproverEmployeeId={ApproverEmployeeId}",
                approval.ApprovalType, approval.RequesterEmployeeId, approval.ApproverEmployeeId
            );

            _context.Lndapprovals.Add(approval);

            Log.Debug("AddApprovalAsync: Approval added to context. Pending SaveChanges");

            return approval;
        }

        /// <summary>
        /// Updates an existing approval in the database context.
        /// Requires SaveChanges to be called separately to persist.
        /// </summary>
        public async Task UpdateApproval(Lndapproval approval)
        {
            Log.Information(
                "UpdateApprovalAsync called. ApprovalId={ApprovalId}, Status={Status}",
                approval.ApprovalId, approval.Status
            );

            _context.Lndapprovals.Update(approval);

            Log.Debug("UpdateApprovalAsync: Approval updated in context. Pending SaveChanges");
        }

        #endregion

        #region Attachment Operations

        /// <summary>
        /// Adds a new attachment to the database context.
        /// Requires SaveChanges to be called separately to persist.
        /// </summary>
        public async Task<Lndattachment> AddAttachment(Lndattachment attachment)
        {
            Log.Information(
                "AddAttachmentAsync called. FileName={FileName}, AttachmentType={AttachmentType}, FileSize={FileSize}",
                attachment.FileName, attachment.AttachmentType, attachment.FileSize
            );

            _context.Lndattachments.Add(attachment);

            Log.Debug("AddAttachmentAsync: Attachment added to context. Pending SaveChanges");

            return attachment;
        }

        /// <summary>
        /// Gets an attachment by ID.
        /// Returns null if attachment is not found.
        /// </summary>
        public async Task<Lndattachment?> GetAttachmentById(int attachmentId)
        {
            Log.Debug("GetAttachmentByIdAsync called. AttachmentId={AttachmentId}", attachmentId);

            var attachment = await _context.Lndattachments.FirstOrDefaultAsync(a =>
                a.AttachmentId == attachmentId
            );

            if (attachment == null)
            {
                Log.Warning("GetAttachmentByIdAsync: Attachment not found. AttachmentId={AttachmentId}", attachmentId);
            }

            return attachment;
        }

        #endregion

        #region Private Helpers

        /// <summary>
        /// Applies sorting logic to approval queries based on sort field and order.
        /// Defaults to descending order by UpdatedOn/RequestedOn if no field is specified.
        /// </summary>
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

        #endregion
    }
}
